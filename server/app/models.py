# backend/app/models.py
from pydantic import BaseModel
from uuid import UUID
from typing import Optional

# This is what Next.js will send
class AnalyzeRequest(BaseModel):
    repo_id: UUID          
    # github_url and branch are already stored in Supabase row

class AnalyzeResponse(BaseModel):
    repo_id: UUID
    status: str = "queued"
    message: str = "Ingestion started in background"

# For chat
class AskRequest(BaseModel):
    repo_id: UUID
    question: str

class AskResponse(BaseModel):
    answer: str
    sources: list[str] = []   # top file paths used