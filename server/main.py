from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.ask import router as ask_router
from app.routes.delete import router as delete_router
from app.routes.analyze import router as analyze_router
import uvicorn
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


app = FastAPI(title="Codebase Intelligence Platform")

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
async def health():
    return {"status": "healthy", "mode": "modular"}

# Register routers
app.include_router(analyze_router, prefix="/api")
app.include_router(ask_router, prefix="/api")
app.include_router(delete_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

