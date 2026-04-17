"""
ChatOrchestrator — orchestre le flux de chat SoulEcho.
"""
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator, Optional

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

DEFAULT_AI_MODEL = "llama-3.3-70b-versatile"
ESTIMATED_COST_PER_REQUEST = 10  # seuil minimum pour déclencher une requête

MEMORY_PROMPT = (
    "En te basant sur cette conversation, génère un résumé psychologique concis (max 300 mots) "
    "sur cette personne : ses émotions dominantes, ses préoccupations, ses patterns de pensée, "
    "ce qui semble lui peser, ce qui l'anime. Écris à la 3e personne, de façon factuelle et bienveillante. "
    "Ce résumé sera utilisé pour personnaliser les prochaines conversations. "
    "Réponds UNIQUEMENT avec le résumé, sans introduction ni conclusion."
)


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

    async def _update_ai_memory(self, user_id: str, conversation_id: int, model: str) -> None:
        """Génère et sauvegarde un résumé psychologique après la conversation."""
        try:
            messages = await self._messages_svc.list_by_field(
                "conversation_id", conversation_id, skip=0, limit=50
            )
            if len(messages) < 3:
                return  # Pas assez d'échanges pour un résumé utile

            # Construire le contexte de la conversation
            conv_text = "\n".join(
                f"{'Utilisateur' if m.role == 'user' else 'SoulEcho'}: {m.content}"
                for m in messages
            )

            ai_service = AIHubService()
            request = GenTxtRequest(
                messages=[
                    ChatMessage(role="system", content="Tu es un psychologue bienveillant qui analyse des conversations."),
                    ChatMessage(role="user", content=f"Conversation :\n{conv_text}\n\n{MEMORY_PROMPT}"),
                ],
                model=model,
                stream=False,
            )
            response = await ai_service.gentxt(request)
            new_memory = response.content.strip()

            if new_memory:
                profile = await self._profile_svc.get_or_create(user_id)
                # Enrichir la mémoire existante plutôt que la remplacer
                existing = getattr(profile, 'ai_memory', None) or ""
                if existing:
                    # Garder un historique glissant (max 1500 chars)
                    combined = f"{existing}\n\n---\n\n{new_memory}"
                    if len(combined) > 1500:
                        combined = combined[-1500:]
                    profile.ai_memory = combined
                else:
                    profile.ai_memory = new_memory
                await self.db.commit()
                logger.info(f"[MEMORY] Updated ai_memory for user_id={user_id}")
        except Exception as e:
            logger.warning(f"[MEMORY] Failed to update ai_memory: {e}")

    async def stream(
        self,
        user_id: str,
        message: str,
        conversation_id: Optional[int] = None,
        model: str = DEFAULT_AI_MODEL,
    ) -> AsyncGenerator[dict, None]:

        # 1. Vérifier le solde tokens
        balance = await self._get_token_balance(user_id)
        if balance is None or balance.balance < ESTIMATED_COST_PER_REQUEST:
            yield {
                "type": "error",
                "content": "Solde de tokens insuffisant. Rechargez votre compte pour continuer.",
                "conversation_id": conversation_id,
                "code": 402,
            }
            return

        # 2. Créer ou vérifier la conversation
        is_new_conversation = conversation_id is None
        if is_new_conversation:
            conv = await self._conversations_svc.create(
                {"title": message[:50], "created_at": datetime.now(timezone.utc)},
                user_id=user_id,
            )
            conversation_id = conv.id
        else:
            conv = await self._conversations_svc.get_by_id(conversation_id, user_id=user_id)
            if conv is None:
                yield {"type": "error", "content": "Conversation introuvable.", "conversation_id": conversation_id}
                return

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

        # 4. Construire le prompt avec profil + mémoire IA
        profile = await self._profile_svc.get_or_create(user_id)
        system_prompt = self._prompt_builder.build(profile)

        # 5. Récupérer le contexte conversationnel
        context_messages = await self._context_memory.get_context(
            conversation_id=conversation_id,
            system_prompt=system_prompt,
            current_message=message,
        )

        # 6. Streamer la réponse IA
        ai_messages = [ChatMessage(role=m["role"], content=m["content"]) for m in context_messages]
        request = GenTxtRequest(messages=ai_messages, model=model, stream=True)
        ai_service = AIHubService()
        full_response = ""
        tokens_deducted = False
        tokens_used = 0

        try:
            async for chunk in ai_service.gentxt_stream(request):
                full_response += chunk
                yield {"type": "chunk", "content": chunk, "conversation_id": conversation_id}

            # 7. Sauvegarder la réponse
            tokens_used = len(full_response) // 4 + len(message) // 4
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

            # 8. Déduire les tokens
            balance.balance = max(0, balance.balance - tokens_used)
            balance.total_used = (balance.total_used or 0) + tokens_used
            balance.updated_at = datetime.now(timezone.utc)
            await self.db.commit()
            tokens_deducted = True

            logger.info(f"[CHAT] user={user_id} conv={conversation_id} tokens={tokens_used}")
            yield {"type": "done", "content": "", "conversation_id": conversation_id}

            # 9. Mettre à jour la mémoire IA en arrière-plan (non-bloquant pour le stream)
            await self._update_ai_memory(user_id, conversation_id, model)

        except Exception as e:
            logger.error(f"[CHAT] Stream error user={user_id}: {e}")
            if tokens_deducted:
                try:
                    balance.balance += tokens_used
                    balance.total_used = max(0, (balance.total_used or 0) - tokens_used)
                    await self.db.commit()
                except Exception as re:
                    logger.error(f"[CHAT] Rollback failed: {re}")

            error_str = str(e)
            if "429" in error_str or "rate_limit_exceeded" in error_str or "Rate limit" in error_str:
                user_message = "Je suis là, mais j'ai besoin d'une petite pause. Réessaie dans quelques minutes."
                code = 429
            elif "401" in error_str or "authentication" in error_str.lower():
                user_message = "Un problème technique m'empêche de répondre. L'équipe a été notifiée."
                code = 503
            else:
                user_message = "Quelque chose s'est mal passé de mon côté. Réessaie dans un moment."
                code = 503

            yield {"type": "error", "content": user_message, "conversation_id": conversation_id, "code": code}
