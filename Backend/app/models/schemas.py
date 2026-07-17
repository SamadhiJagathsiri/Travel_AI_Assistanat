from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str


class SourceReference(BaseModel):
    document: str
    chunk: int | None = None
    page: str | None = None


class ChatPayload(BaseModel):
    answer: str
    provider: str
    model: str
    sources: list[SourceReference] = Field(default_factory=list)


class ChatResponse(BaseModel):
    response: ChatPayload


class UploadResponse(BaseModel):
    filename: str
    original_filename: str
    message: str


class UploadedDocumentsResponse(BaseModel):
    documents: list[str] = Field(default_factory=list)
