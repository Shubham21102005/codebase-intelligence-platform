# backend/main.py
import os
import re
import asyncio
import tempfile
import git
from uuid import UUID
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
import uvicorn

import voyageai
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, Distance, VectorParams
from neo4j import GraphDatabase
from tree_sitter_languages import get_parser
from tqdm.asyncio import tqdm_asyncio

# Import Pydantic models from models.py
from app.models import AnalyzeRequest, AnalyzeResponse

load_dotenv()

app = FastAPI(title="Codebase Intelligence Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← change to your Vercel URL in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CLOUD CLIENTS (initialized once)
vo = voyageai.Client(api_key=os.getenv("VOYAGE_API_KEY"))

qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY"),
)

neo4j_driver = GraphDatabase.driver(
    os.getenv("NEO4J_URI"),
    auth=(os.getenv("NEO4J_USER", "neo4j"), os.getenv("NEO4J_PASSWORD"))
)

@app.on_event("startup")
async def startup():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise RuntimeError("Missing SUPABASE_SERVICE_ROLE_KEY")
    app.state.supabase: Client = create_client(url, key)
    print("Supabase (service_role), Qdrant Cloud, Neo4j Aura, Voyage AI → all connected ✅")

# ==================== ROUTES ====================
@app.get("/health")
async def health():
    return {"status": "healthy", "cloud": "qdrant+neo4j+aura"}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def start_analysis(payload: AnalyzeRequest):
    repo_id = payload.repo_id

    # Verify repo exists
    result = app.state.supabase.table("repos").select("*").eq("id", str(repo_id)).single().execute()
    if not result.data:
        raise HTTPException(404, "Repo not found")

    # Update status → cloning
    app.state.supabase.table("repos").update({"status": "cloning"}).eq("id", str(repo_id)).execute()

    # Fire and forget real ingestion
    asyncio.create_task(ingest_repo_in_background(repo_id))

    return AnalyzeResponse(repo_id=repo_id, message="Ingestion started (Qdrant Cloud + Neo4j Aura)")

# ==================== REAL CLOUD INGESTION ====================
async def ingest_repo_in_background(repo_id: UUID):
    try:
        repo = app.state.supabase.table("repos").select("*").eq("id", str(repo_id)).single().execute().data

        collection_name = f"{repo_id.hex}"  # clean name

        # Create Qdrant collection
        qdrant.recreate_collection(
            collection_name=collection_name,
            vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
        )

        # Temporary clone — deleted automatically
        with tempfile.TemporaryDirectory() as tmpdir:
            token = os.getenv("GITHUB_TOKEN", "")
            clone_url = f"https://{token}@github.com/{repo['owner']}/{repo['repo']}.git"
            git.Repo.clone_from(clone_url, tmpdir, depth=1, branch=repo.get("branch", "main"))

            files_to_process = []
            for root, _, files in os.walk(tmpdir):
                for f in files:
                    if f.endswith(('.py', '.js', '.ts', '.tsx', '.jsx', '.go', '.java', '.rs', '.md')):
                        files_to_process.append(os.path.join(root, f))

            for file_path in tqdm_asyncio(files_to_process, desc=f"Ingesting {repo['repo']}"):
                rel_path = os.path.relpath(file_path, tmpdir)
                content = open(file_path, 'r', encoding='utf-8', errors='ignore').read()

                # === Voyage Code 2 embedding ===
                chunks = [content[i:i+800] for i in range(0, len(content), 600)]
                if not chunks:
                    continue
                embeddings = vo.embed(chunks, model="voyage-code-2").embeddings

                points = [
                    PointStruct(
                        id=f"{rel_path}#{i}",
                        vector=emb,
                        payload={
                            "content": chunk,
                            "file_path": rel_path,
                            "repo_id": str(repo_id),
                            "type": "chunk"
                        }
                    )
                    for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
                ]

                # Full file point
                full_emb = vo.embed([content[:800]], model="voyage-code-2").embeddings[0]
                points.append(PointStruct(
                    id=f"{rel_path}#FULL",
                    vector=full_emb,
                    payload={"content": content, "file_path": rel_path, "type": "full_file"}
                ))

                qdrant.upsert(collection_name=collection_name, points=points)

                # === Simple Tree-sitter → Neo4j (example for Python/JS) ===
                ext = rel_path.split('.')[-1]
                lang_map = {"py": "python", "js": "javascript", "ts": "typescript", "tsx": "tsx"}
                if ext in lang_map:
                    parser = get_parser(lang_map[ext])
                    tree = parser.parse(content.encode())
                    with neo4j_driver.session() as session:
                        session.run(
                            """
                            MERGE (f:File {path: $path, repo_id: $repo_id})
                            SET f.language = $lang, f.loc = $loc
                            """,
                            path=rel_path, repo_id=str(repo_id), lang=ext, loc=len(content.splitlines())
                        )

        # === SUCCESS ===
        app.state.supabase.table("repos").update({
            "status": "ready",
            "qdrant_collection": collection_name
        }).eq("id", str(repo_id)).execute()

    except Exception as e:
        print(f"Ingestion failed: {e}")
        app.state.supabase.table("repos").update({
            "status": "error",
            "error_message": str(e)[:500]
        }).eq("id", str(repo_id)).execute()

# ==================== RUN ====================
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=True)