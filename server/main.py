from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from uuid import UUID
from app.config import supabase
from app.services.ingestion import ingest_repo
from app.models import AnalyzeRequest, AnalyzeResponse
import asyncio

app = FastAPI(title="Codebase Intelligence Platform")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health():
    return {"status": "healthy", "mode": "modular"}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def start_analysis(payload: AnalyzeRequest):
    repo_id = payload.repo_id

    repo = supabase.table("repos").select("id").eq("id", str(repo_id)).execute()
    if not repo.data:
        raise HTTPException(404, "Repo not found")

    supabase.table("repos").update({"status": "cloning"}).eq("id", str(repo_id)).execute()
    asyncio.create_task(ingest_repo(repo_id))

    return AnalyzeResponse(repo_id=repo_id, message="Ingestion started")