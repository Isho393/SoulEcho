"""
ContextMemory — gère la fenêtre de contexte injectée dans l'IA.
Récupère les N derniers messages, trie chronologiquement, tronque si nécessaire.
"""
import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from services.messages import MessagesService

logger = logging.getLogger(__name__)

DEFAULT_CONTEXT_WINDOW_SIZE = 10
DEFAULT_MAX_CONTEXT_TOKENS = 2000  # historique seul — hors system prompt et message courant


def _estimate_tokens(text: str) -> int:
    return len(text) // 4


class ContextMemory:
    def __init__(self, db: AsyncSession):
        self.db = db
        self._messages_service = MessagesService(db)

    async def get_context(
        self,
        conversation_id: int,
        system_prompt: str,
        current_message: str,
        context_window_size: int = DEFAULT_CONTEXT_WINDOW_SIZE,
        max_context_tokens: int = DEFAULT_MAX_CONTEXT_TOKENS,
    ) -> list[dict]:
        """
        Retourne la liste de messages au format OpenAI :
        [{"role": "system", ...}, ...historique chronologique..., {"role": "user", "content": current_message}]
        """
        # Récupérer les N derniers messages de la conversation
        raw_messages = await self._messages_service.list_by_field(
            "conversation_id", conversation_id, skip=0, limit=context_window_size
        )

        # list_by_field retourne en ordre DESC (id.desc()) — on inverse pour ordre chronologique
        history = list(reversed(raw_messages))

        # Construire les dicts OpenAI
        history_dicts = [{"role": m.role, "content": m.content} for m in history]

        # Calculer les tokens fixes (system prompt + message courant)
        fixed_tokens = _estimate_tokens(system_prompt) + _estimate_tokens(current_message)
        available_for_history = max(0, max_context_tokens - fixed_tokens)

        # Tronquer l'historique dans la fenêtre disponible
        history_dicts = self._truncate(history_dicts, available_for_history)

        logger.debug(
            f"[CONTEXT] fixed={fixed_tokens} history={sum(_estimate_tokens(m['content']) for m in history_dicts)} "
            f"total≈{fixed_tokens + sum(_estimate_tokens(m['content']) for m in history_dicts)}"
        )

        return [{"role": "system", "content": system_prompt}] + history_dicts + [
            {"role": "user", "content": current_message}
        ]

    def _truncate(self, messages: list[dict], max_tokens: int) -> list[dict]:
        """
        Tronque les messages les plus anciens pour respecter max_tokens.
        Conserve toujours le dernier message utilisateur.
        """
        if not messages:
            return messages

        total = sum(_estimate_tokens(m["content"]) for m in messages)
        if total <= max_tokens:
            return messages

        # Trouver le dernier message utilisateur à préserver
        last_user_idx = None
        for i in range(len(messages) - 1, -1, -1):
            if messages[i]["role"] == "user":
                last_user_idx = i
                break

        # Supprimer les messages les plus anciens jusqu'à respecter la limite
        result = list(messages)
        i = 0
        while i < len(result) and sum(_estimate_tokens(m["content"]) for m in result) > max_tokens:
            if i == last_user_idx or (last_user_idx is not None and i > last_user_idx):
                break
            result.pop(0)
            if last_user_idx is not None:
                last_user_idx -= 1

        return result
