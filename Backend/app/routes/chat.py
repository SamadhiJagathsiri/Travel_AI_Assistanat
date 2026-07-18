from fastapi import APIRouter
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from app.models.schemas import ChatRequest, ChatResponse

from app.services.chat_service import chat_service

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


@router.post(
    "",
    response_model=ChatResponse
)
async def chat(request: ChatRequest):

    try:
        answer = chat_service.chat(request.message)

        return ChatResponse(
            response=answer
        )

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post(
    "/stream"
)
async def chat_stream(request: ChatRequest):

    try:
        generator = chat_service.chat_stream(request.message)
        return StreamingResponse(generator, media_type="text/event-stream")

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
