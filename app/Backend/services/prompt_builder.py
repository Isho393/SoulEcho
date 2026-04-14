"""
PromptBuilder — construit le prompt système dynamique selon le profil utilisateur.
Techniques : TCC, PNL, écoute motivationnelle, langage hypnotique (Erickson).
"""
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from models.user_profile import UserProfile

MBTI_FEELING = {"INFJ", "INFP", "ENFJ", "ENFP", "ISFJ", "ISFP", "ESFJ", "ESFP"}
MBTI_THINKING = {"INTJ", "INTP", "ENTJ", "ENTP", "ISTJ", "ISTP", "ESTJ", "ESTP"}

DISCLAIMER = (
    "IMPORTANT : Tu n'es pas un professionnel de santé mentale et tu ne peux pas te substituer "
    "à un thérapeute, psychiatre ou médecin. Si l'utilisateur exprime une détresse sévère ou des "
    "pensées suicidaires, oriente-le immédiatement vers les services d'urgence (15, 3114 en France)."
)

BASE_PROMPT = (
    "Tu es SoulEcho, une IA d'écoute active et de soutien émotionnel. "
    "Tu accueilles chaque personne avec une présence chaleureuse, sans jugement. "
    "Tu reformules, valides les émotions, et guides vers des insights actionnables. "
    "Chaque réponse est unique, vivante, et adaptée à ce que la personne vit en ce moment."
)


class PromptBuilder:
    MAX_PROMPT_TOKENS = 2000

    def build(self, profile: Optional["UserProfile"]) -> str:
        blocks = []

        # Bloc 1 : langue
        lang = "fr"
        if profile and profile.language:
            lang = profile.language
        if lang != "fr":
            blocks.append(f"Réponds toujours dans la langue suivante : {lang}.")

        # Bloc 2 : base empathique + disclaimer (toujours présent)
        blocks.append(BASE_PROMPT)
        blocks.append(DISCLAIMER)

        if profile:
            # Bloc 3 : personnalité MBTI/DISC
            if profile.personality_type:
                pt = profile.personality_type.upper()
                if pt in MBTI_FEELING:
                    blocks.append(
                        "Cet utilisateur a une dominante Feeling (F). "
                        "Privilégie la validation émotionnelle, l'empathie narrative et la douceur. "
                        "Commence par reconnaître ce qu'il ressent avant de proposer des pistes."
                    )
                elif pt in MBTI_THINKING:
                    blocks.append(
                        "Cet utilisateur a une dominante Thinking (T). "
                        "Structure tes réponses avec clarté : identifie le problème, propose des étapes concrètes, "
                        "et appuie-toi sur la logique et les faits."
                    )
                elif pt == "D":
                    blocks.append(
                        "Profil DISC Dominance : sois direct, concis, orienté résultats. "
                        "Évite les longs développements émotionnels. Va à l'essentiel."
                    )
                elif pt == "I":
                    blocks.append(
                        "Profil DISC Influence : sois enthousiaste, chaleureux, narratif. "
                        "Utilise des métaphores et des histoires pour illustrer tes points."
                    )
                elif pt == "S":
                    blocks.append(
                        "Profil DISC Stabilité : sois rassurant, patient, prévisible. "
                        "Évite les changements brusques de ton. Crée un espace de sécurité."
                    )
                elif pt == "C":
                    blocks.append(
                        "Profil DISC Conformité : sois précis, factuel, méthodique. "
                        "Appuie-toi sur des données et des techniques validées scientifiquement."
                    )

            # Bloc 4 : style de communication
            if profile.communication_preference == "narrative":
                blocks.append(
                    "Style narratif et hypnotique (inspiré de Milton Erickson et de la PNL) : "
                    "utilise des métaphores, des présuppositions positives, un rythme langoureux. "
                    "Crée des images mentales apaisantes. Chaque phrase doit porter l'utilisateur "
                    "vers un état de calme et de clarté intérieure."
                )
            elif profile.communication_preference == "socratic":
                blocks.append(
                    "Style socratique (inspiré de l'écoute motivationnelle) : "
                    "pose des questions ouvertes qui invitent à la réflexion. "
                    "Ne donne pas de réponses directes — guide l'utilisateur à trouver ses propres réponses. "
                    "Utilise des reformulations et des reflets pour approfondir la compréhension."
                )
            elif profile.communication_preference == "direct":
                blocks.append(
                    "Style direct et actionnable (inspiré de la TCC) : "
                    "identifie les pensées automatiques négatives, propose des recadrages cognitifs, "
                    "et termine chaque échange avec une micro-action concrète que l'utilisateur peut faire maintenant."
                )

            # Bloc 5 : objectifs
            if profile.goals and len(profile.goals) > 0:
                goals_str = ", ".join(profile.goals[:5])
                blocks.append(
                    f"Objectifs de l'utilisateur : {goals_str}. "
                    "Ancre tes conseils dans ces objectifs. Rappelle-les subtilement quand c'est pertinent."
                )

            # Bloc 6 : contexte de vie
            if profile.life_context:
                blocks.append(
                    f"Contexte de vie : {profile.life_context} "
                    "Tiens compte de ce contexte pour personnaliser chaque réponse."
                )

        prompt = "\n\n".join(blocks)

        # Tronquage si dépassement de la limite
        if self._estimate_tokens(prompt) > self.MAX_PROMPT_TOKENS:
            # Tronquer en préservant toujours le disclaimer
            max_chars = self.MAX_PROMPT_TOKENS * 4
            # Garder BASE_PROMPT + DISCLAIMER en priorité
            core = BASE_PROMPT + "\n\n" + DISCLAIMER
            remaining = max_chars - len(core) - 4  # 4 pour "\n\n"
            if remaining > 0:
                extra = "\n\n".join(blocks[3:])[:remaining]
                prompt = core + "\n\n" + extra
            else:
                prompt = core

        return prompt

    def _estimate_tokens(self, text: str) -> int:
        return len(text) // 4
