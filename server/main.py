from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from uuid import UUID
from app.config import supabase
from app.services.ingestion import ingest_repo
from app.models import AnalyzeRequest, AnalyzeResponse
from app.routes.ask import router as ask_router
import asyncio
import uvicorn
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Store background tasks to prevent garbage collection and retrieve exceptions
background_tasks = set()


def task_done_callback(task: asyncio.Task) -> None:
    """
    Callback to handle completed background tasks and log any exceptions.
    """
    background_tasks.discard(task)
    try:
        # Retrieve the result to check for exceptions
        task.result()
    except Exception as e:
        logger.error(f"Background task failed with exception: {e}", exc_info=True)


app = FastAPI(title="Codebase Intelligence Platform")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/health")
async def health():
    return {"status": "healthy", "mode": "modular"}

@app.post("/api/analyze", response_model=AnalyzeResponse)
async def start_analysis(payload: AnalyzeRequest):
    repo_id = payload.repo_id

    # Debug: Log the repo_id being searched
    print(f"🔍 Searching for repo_id: {repo_id} (type: {type(repo_id)})")
    print(f"🔍 String version: {str(repo_id)}")

    # First, let's see what's in the repos table
    all_repos = supabase.table("repos").select("*").execute()
    print(f"📊 All repos in database: {all_repos.data}")

    repo = supabase.table("repos").select("id").eq("id", str(repo_id)).execute()
    print(f"🔎 Query result: {repo.data}")

    if not repo.data:
        raise HTTPException(404, f"Repo not found. Searched for: {str(repo_id)}")

    supabase.table("repos").update({"status": "cloning"}).eq("id", str(repo_id)).execute()

    # Create background task with proper exception handling
    task = asyncio.create_task(ingest_repo(repo_id))
    background_tasks.add(task)
    task.add_done_callback(task_done_callback)

    return AnalyzeResponse(repo_id=repo_id, message="Ingestion started")

app.include_router(ask_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)