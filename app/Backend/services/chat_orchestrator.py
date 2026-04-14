"""
ChatOrchestrator — orchestre le flux de chat SoulEcho en un seul stream SSE.
Coordonne : vérification tokens, conversation, mémoire contextuelle, prompt dynamique, IA, persistance.
"""
import json
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.token_balances import Token_balances
from schemas.aihub import ChatMessage, GenTxtRequest
from services.aihub import AIHubService
from services.context_memory import ContextMemory
from services.conversations import ConversationsService
from services.messages import MessagesService
from services.profile_service import ProfileService
from services.prompt_builder import PromptBuilder

logger = logging.getLogger(__name__)

DEFAULT_AI_MODEL = "deepseek-v3.2"
ESTIMATED_COST_PER_REQUEST = 100  # tokens estimés minimum requis


class ChatOrchestrator:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._conversations_svc = ConversationsService(db)
        self._messages_svc = MessagesService(db)
        self._profile_svc = ProfileService(db)
        self._context_memory = ContextMemory(db)
        self._prompt_builder = PromptBuilder()

    async def _get_token_balance(self, user_id: str) -> Optional[Token_balances]:
        result = await self.db.execute(
            select(Token_balances).where(Token_balances.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def stream(
        self,
        user_id: str,
        message: str,
        conversation_id: Optional[int] = None,
        model: str = DEFAULT_AI_MODEL,
    ) -> AsyncGenerator[dict, None]:
        """
        Génère un stream SSE orchestré.
        Yields: {"type": "chunk"|"done"|"error", "content": str, "conversation_id": int}
        """
        # 1. Vérifier le solde tokens (HTTP 402 si insuffisant)
        balance = await self._get_token_balance(user_id)
        if balance is None or balance.balance < ESTIMATED_COST_PER_REQUEST:
            raise HTTPException(
                status_code=402,
                detail="Insufficient token balance. Please purchase more tokens."
            )

        # 2. Créer ou vérifier la conversation
        if conversation_id is None:
            conv = await self._conversations_svc.create(
                {"title": message[:50], "created_at": datetime.now(timezone.utc)},
                user_id=user_id,
            )
            conversation_id = conv.id
        else:
            conv = await self._conversations_svc.get_by_id(conversation_id, user_id=user_id)
            if conv is None:
                raise HTTPException(
                    status_code=403,
                    detail="Conversation not found or access denied."
                )

        # 3. Sauvegarder le message utilisateur
        await self._messages_svc.create(
            {
                "conversation_id": conversation_id,
                "role": "user",
                "content": message,
                "created_at": datetime.now(timezone.utc),
            },
            user_id=user_id,
        )

        # 4. Construire le prompt système selon le profil
        profile = await self._profile_svc.get_or_create(user_id)
        system_prompt = self._prompt_builder.build(profile)

        # 5. Récupérer le contexte (historique + prompt système)
        context_messages = await self._context_memory.get_context(
            conversation_id=conversation_id,
            system_prompt=system_prompt,
            current_message=message,
        )

        # 6. Construire la requête IA
        ai_messages = [ChatMessage(role=m["role"], content=m["content"]) for m in context_messages]
        request = GenTxtRequest(messages=ai_messages, model=model, stream=True)

        # 7. Streamer la réponse IA
        ai_service = AIHubService()
        full_response = ""
        tokens_deducted = False

        try:
            async for chunk in ai_service.gentxt_stream(request):
                full_response += chunk
                yield {"type": "chunk", "content": chunk, "conversation_id": conversation_id}

            # 8. Sauvegarder la réponse complète de l'IA
            tokens_used = len(full_response) // 4 + len(message) // 4  # estimation
            await self._messages_svc.create(
                {
                    "conversation_id": conversation_id,
                    "role": "assistant",
                    "content": full_response,
                    "tokens_used": tokens_used,
                    "created_at": datetime.now(timezone.utc),
                },
                user_id=user_id,
            )

            # 9. Déduire les tokens
            balance.balance = max(0, balance.balance - tokens_used)
            if balance.total_used is None:
                balance.total_used = 0
            balance.total_used += tokens_used
            balance.updated_at = datetime.now(timezone.utc)
            await self.db.commit()
            tokens_deducted = True

            # Journalisation RGPD (sans contenu des messages)
            logger.info(
                f"[CHAT] user_id={user_id} conversation_id={conversation_id} "
                f"model={model} tokens_used={tokens_used}"
            )

            yield {"type": "done", "content": "", "conversation_id": conversation_id}

        except Exception as e:
            logger.error(f"[CHAT] Stream error for user_id={user_id}: {e}")

            # Rollback de la déduction si elle a eu lieu
            if tokens_deducted:
                try:
                    balance.balance += tokens_used
                    balance.total_used = max(0, (balance.total_used or 0) - tokens_used)
                    await self.db.commit()
                    logger.info(f"[CHAT] Token deduction rolled back for user_id={user_id}")
                except Exception as rollback_err:
                    logger.error(f"[CHAT] Rollback failed: {rollback_err}")

            yield {"type": "error", "content": str(e), "conversation_id": conversation_id}
