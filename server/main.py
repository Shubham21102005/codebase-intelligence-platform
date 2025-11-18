from fastapi import FastAPI # type: ignore
from supabase import create_client, Client # type: ignore
from dotenv import load_dotenv # type: ignore
import os
import uvicorn # type: ignore

load_dotenv()

app = FastAPI(title= "Codebase Intelligence Platform",
              description="AI agent that understands your entire GitHub repo"
              )


@app.on_event("startup")
async def startup():
    url: str = os.getenv("SUPABASE_URL") 
    key: str = os.getenv("SUPABASE_KEY") 

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True,           # remove in production
        log_level="info"
    )