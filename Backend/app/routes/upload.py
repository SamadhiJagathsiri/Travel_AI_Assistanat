from pathlib import Path
from uuid import uuid4
import shutil

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models.schemas import UploadResponse, UploadedDocumentsResponse
from app.services.rag_service import rag_service

router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)

UPLOAD_DIR = Path("knowledge/uploaded")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    original_name = Path(file.filename).name
    destination_name = f"{uuid4().hex}{Path(original_name).suffix}"
    destination = UPLOAD_DIR / destination_name

    with destination.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    rag_service.process_document(destination)

    return UploadResponse(
        filename=destination_name,
        original_filename=original_name,
        message="PDF uploaded successfully."
    )


@router.get("/documents", response_model=UploadedDocumentsResponse)
async def get_uploaded_documents():
    docs = rag_service.list_uploaded_sources()
    return UploadedDocumentsResponse(documents=docs)
