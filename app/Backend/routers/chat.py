"""
Router /api/v1/chat — endpoint SSE orchestré SoulEcho.
Conformité AI Act : header X-AI-Generated: true sur toutes les réponses.
"""
import json
import logging

from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from core.database import get_db
from dependencies.auth import get_current_user
from schemas.auth import UserResponse
from schemas.chat import ChatRequest
from services.chat_orchestrator import ChatOrchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


@router.post("")
async def chat(
    request: ChatRequest,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint de chat orchestré — retourne une réponse SSE streaming.
    Headers : X-AI-Generated: true (AI Act), X-Conversation-Id: <id>
    """
    orchestrator = ChatOrchestrator(db)
    conversation_id_holder = {"id": request.conversation_id}

    async def event_generator():
        async for event in orchestrator.stream(
            user_id=str(current_user.id),
            message=request.message,
            conversation_id=request.conversation_id,
        ):
            # Mettre à jour le conversation_id pour le header
            if event.get("conversation_id"):
                conversation_id_holder["id"] = event["conversation_id"]
            yield json.dumps(event)

        yield "[DONE]"

    headers = {
        "X-AI-Generated": "true",
        "X-Conversation-Id": str(conversation_id_holder["id"] or ""),
        "Cache-Control": "no-cache",
    }

    return EventSourceResponse(event_generator(), headers=headers, media_type="text/event-stream")
