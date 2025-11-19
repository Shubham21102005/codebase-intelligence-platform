# backend/app/routes/analyze.py
from fastapi import APIRouter, HTTPException
from app.config import supabase
from app.services.ingestion import ingest_repo
from app.models import AnalyzeRequest, AnalyzeResponse
import asyncio
import logging

router = APIRouter()
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


@router.post("/analyze", response_model=AnalyzeResponse)
async def start_analysis(payload: AnalyzeRequest):
    repo_id = payload.repo_id

    # Debug: Log the repo_id being searched
    logger.info(f"Searching for repo_id: {repo_id} (type: {type(repo_id)})")
    logger.info(f"String version: {str(repo_id)}")

    # First, let's see what's in the repos table
    all_repos = supabase.table("repos").select("*").execute()
    logger.info(f"All repos in database: {all_repos.data}")

    repo = supabase.table("repos").select("id").eq("id", str(repo_id)).execute()
    logger.info(f"Query result: {repo.data}")

    if not repo.data:
        raise HTTPException(404, f"Repo not found. Searched for: {str(repo_id)}")

    supabase.table("repos").update({"status": "cloning"}).eq("id", str(repo_id)).execute()

    # Create background task with proper exception handling
    task = asyncio.create_task(ingest_repo(repo_id))
    background_tasks.add(task)
    task.add_done_callback(task_done_callback)

    return AnalyzeResponse(repo_id=repo_id, message="Ingestion started")
