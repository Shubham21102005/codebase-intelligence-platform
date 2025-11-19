from pydantic import BaseModel # type: ignore
from typing import Optional


class AnalyzeRequest(BaseModel):
    github_url: str
    branch: Optional[str] = "main"

class AnalyzeResponse(BaseModel):
    repo_id: str
    status: str = "pending"
    message: str = "Repo queued for analysis"

