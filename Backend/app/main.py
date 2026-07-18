from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import fastapi
import starlette
import logging

from app.routes.chat import router as chat_router
from app.routes.upload import router as upload_router
from app.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered Travel Assistant"
)

@app.get("/versions")
async def versions():
    return {
        "fastapi": fastapi.__version__,
        "starlette": starlette.__version__,
    }

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https://travel-ai-assistanat-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "success",
        "message": "Travel AI Assistant Backend is running!"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "version": settings.VERSION
    }

app.include_router(chat_router)
app.include_router(upload_router)

@app.on_event("startup")
def startup_event():
    from app.services.embedding_service import embedding_service
    try:
        embedding_service._get_model()
    except Exception as e:
        logging.warning(f"Failed to pre-load embedding model: {e}")