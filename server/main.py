# backend/main.py
import os
import re
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv
import uvicorn
from pydantic import BaseModel
from uuid import UUID
import tempfile
import git
import asyncio
from tqdm.asyncio import tqdm_asyncio
from tree_sitter_languages import get_parser
from voyageai import VoyageClient
from qdrant_client import QdrantClient
from qdrant_client.http.models import PointStruct, Distance, VectorParams
from neo4j import GraphDatabase

load_dotenv()

# ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="Codebase Intelligence Platform",
    description="Heavy-lifting backend: clone → tree-sitter → voyage-code-2 → Neo4j → Gemini",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← change to your Vercel domain in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase with SERVICE_ROLE_KEY (server-side only!)
@app.on_event("startup")
async def startup():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required")
    app.state.supabase: Client = create_client(url, key)
    print("Supabase connected (service_role)")

# ──────────────────────────────────────────────────────────────
# Pydantic models (moved here for single-file simplicity)
class AnalyzeRequest(BaseModel):
    repo_id: UUID            # ← Next.js already created the row
    github_url: str          # optional, just for validation/logging
    branch: str = "main"

class AnalyzeResponse(BaseModel):
    repo_id: UUID
    status: str = "queued"
    message: str = "Analysis started"

# ──────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Codebase Intelligence Backend — ready"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# ──────────────────────────────────────────────────────────────
@app.post("/api/analyze", response_model=AnalyzeResponse)
async def start_analysis(payload: AnalyzeRequest):
    repo_id = payload.repo_id

    # 1. Verify the repo row exists and belongs to the user (optional extra safety)
    result = (
        app.state.supabase.table("repos")
        .select("*")
        .eq("id", str(repo_id))
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Repo not found")

    repo = result.data[0]

    # 2. Update status → processing
    app.state.supabase.table("repos").update({
        "status": "cloning",
        "updated_at": "now()"
    }).eq("id", str(repo_id)).execute()

    # 3. TODO: Trigger real background task here (Celery/RQ)
    # For now just simulate immediate success after 2 seconds
    import asyncio
    asyncio.create_task(fake_long_task(repo_id))

    return AnalyzeResponse(
        repo_id=repo_id,
        message="Cloning and analysis started in background"
    )



# ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,
        log_level="info"
    )