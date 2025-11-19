# backend/app/routes/ask.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import qdrant, vo, supabase
from app.services.ingestion import neo4j_driver
import google.generativeai as genai
import os
router = APIRouter()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

class AskRequest(BaseModel):
    repo_id: str
    question: str

@router.post("/ask")
async def ask_codebase(payload: AskRequest):
    repo = supabase.table("repos").select("qdrant_collection,status").eq("id", payload.repo_id).single().execute().data
    if repo["status"] != "ready":
        raise HTTPException(400, "Repo not ready")

    collection = repo["qdrant_collection"]

    # 1. Vector search
    query_emb = vo.embed([payload.question], model="voyage-code-2").embeddings[0]
    results = qdrant.query_points(collection_name=collection, query=query_emb, limit=15)

    context_chunks = "\n\n".join([f"[File: {point.payload['file_path']}]\n{point.payload['content']}" for point in results.points])

    # 2. Graph expansion
    files = list({point.payload['file_path'] for point in results.points})
    with neo4j_driver.session() as session:
        graph_result = session.run("""
            MATCH (f:File)-[*0..3]-(related)
            WHERE f.path IN $files AND f.repo_id = $repo_id
            RETURN f.path AS path, labels(related) AS labels, related.name AS name
        """, files=files, repo_id=payload.repo_id)

        graph_context = "\n".join([f"{r['path']} → {r['labels']} {r['name'] or ''}" for r in graph_result])

    # 3. Gemini 2.0 Flash
    model = genai.GenerativeModel('gemini-2.0-flash-lite')  # or gemini-1.5-flash
    prompt = f"""
You are an expert developer in this codebase.

Relevant code:
{context_chunks}

Graph relationships:
{graph_context}

Question: {payload.question}

Answer with exact file references and code quotes. Use markdown.
"""

    response = model.generate_content(prompt, stream=False)
    return {"answer": response.text, "sources": [point.payload['file_path'] for point in results.points[:5]]}