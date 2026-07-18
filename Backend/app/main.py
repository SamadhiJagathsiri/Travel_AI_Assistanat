from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from app.routes.chat import router as chat_router
from app.routes.upload import router as upload_router


from app.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-powered Travel Assistant"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://travel-ai-assistanat-yprt.vercel.app",
        "https://travel-ai-assistanat-five.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)git add .
git commit -m "Fix CORS for Vercel"
git push


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
    # Preload embedding model so it doesn't block the first chat request
    from app.services.embedding_service import embedding_service
    try:
        embedding_service._get_model()
    except Exception as e:
        logging.warning(f"Failed to pre-load embedding model: {e}")