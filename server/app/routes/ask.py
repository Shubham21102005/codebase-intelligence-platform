# backend/app/routes/ask.py
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.config import qdrant, vo, supabase
from app.services.ingestion import neo4j_driver
import google.generativeai as genai
import os
import json
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

    # 1. Vector search (reduced from 15 to 10 for faster results)
    query_emb = vo.embed([payload.question], model="voyage-code-2").embeddings[0]
    results = qdrant.query_points(collection_name=collection, query=query_emb, limit=10)

    context_chunks = "\n\n".join([f"[File: {point.payload['file_path']}]\n{point.payload['content']}" for point in results.points])

    # 2. Graph expansion (with limit to prevent expensive traversals)
    files = list({point.payload['file_path'] for point in results.points})
    with neo4j_driver.session() as session:
        graph_result = session.run("""
            MATCH (f:File)-[*0..2]-(related)
            WHERE f.path IN $files AND f.repo_id = $repo_id
            RETURN f.path AS path, labels(related) AS labels, related.name AS name
            LIMIT 50
        """, files=files, repo_id=payload.repo_id)

        graph_context = "\n".join([f"{r['path']} → {r['labels']} {r['name'] or ''}" for r in graph_result])

    # 3. Gemini 2.0 Flash with streaming
    model = genai.GenerativeModel(
        'gemini-2.0-flash-lite',
        generation_config={
            "temperature": 0.7,
            "top_p": 0.95,
            "max_output_tokens": 2048,
        }
    )

    prompt = f"""You are a code expert. Answer the user's question directly and concisely.

# Code Context

{context_chunks}

# Relationships
{graph_context}

# Question
{payload.question}

# Instructions
- Answer directly - get to the point quickly
- Only mention relevant files and code
- Use `file.ext:line` format for references
- Include code snippets only when necessary
- Skip general explanations unless asked
- Be concise and actionable

Answer:"""

    

    # Streaming generator
    async def generate_stream():
        try:
            sources = [point.payload['file_path'] for point in results.points[:5]]

            # Send sources first
            yield json.dumps({"type": "sources", "data": sources}) + "\n"

            # Stream the answer with timeout handling
            response = model.generate_content(
                prompt,
                stream=True,
                request_options={"timeout": 60}  # 60 second timeout
            )

            for chunk in response:
                if chunk.text:
                    yield json.dumps({"type": "content", "data": chunk.text}) + "\n"

            # Send completion signal
            yield json.dumps({"type": "done"}) + "\n"

        except Exception as e:
            # Send error to client
            yield json.dumps({"type": "error", "data": str(e)}) + "\n"

    return StreamingResponse(generate_stream(), media_type="application/x-ndjson")