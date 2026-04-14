# Plan d'implémentation : SoulEcho Backend

## Vue d'ensemble

Implémentation des nouveaux composants SoulEcho sur la stack FastAPI/PostgreSQL existante.
Chaque tâche s'appuie sur les services existants (`ConversationsService`, `MessagesService`, `Token_balancesService`, `AIHubService`) sans les réécrire.
Langage : **Python 3.11+**, framework **FastAPI**, tests de propriétés avec **Hypothesis**.

---

## Tâches

- [x] 1. Modèles SQLAlchemy et migration Alembic
  - [x] 1.1 Créer `app/Backend/models/user_profile.py`
    - Définir la classe `UserProfile(Base)` avec les colonnes : `id`, `user_id` (String 255, unique, index), `personality_type` (String 10, nullable), `life_context` (String 500, nullable), `goals` (JSON, nullable), `communication_preference` (String 20, nullable), `language` (String 5, nullable, default "fr"), `created_at` (DateTime timezone, server_default func.now()), `updated_at` (DateTime timezone, onupdate func.now())
    - Utiliser `__table_args__ = {"extend_existing": True}` comme les autres modèles
    - _Requirements: 2.1_

  - [x] 1.2 Créer `app/Backend/models/emotional_score.py`
    - Définir la classe `EmotionalScore(Base)` avec les colonnes : `id`, `user_id` (String 255, nullable=False, index), `score` (Integer, nullable=False), `note` (String 200, nullable), `created_at` (DateTime timezone, server_default func.now(), nullable=False)
    - _Requirements: 5.1_

  - [x] 1.3 Créer la migration Alembic `app/Backend/alembic/versions/xxxx_add_soul_echo_tables.py`
    - Écrire manuellement la migration (sans autogenerate) avec `op.create_table` pour `user_profiles` et `emotional_scores`
    - Inclure `op.create_index` sur `user_profiles.user_id` et `emotional_scores.user_id`
    - Définir `down_revision = '6cc0504e83f4'` pour chaîner après la migration existante
    - Implémenter `upgrade()` et `downgrade()` complets
    - _Requirements: 2.1, 5.1_

- [x] 2. Schémas Pydantic
  - [x] 2.1 Créer `app/Backend/schemas/profile.py`
    - Définir `UserProfileUpdate(BaseModel)` avec tous les champs optionnels et le validator `personality_type` (16 types MBTI + D/I/S/C)
    - Définir `UserProfileResponse(BaseModel)` avec `model_config = ConfigDict(from_attributes=True)`
    - _Requirements: 2.1, 2.4, 2.5_

  - [x] 2.2 Créer `app/Backend/schemas/emotional_checkin.py`
    - Définir `EmotionalCheckinCreate(BaseModel)` avec `score: int = Field(..., ge=1, le=10)` et `note: Optional[str] = Field(None, max_length=200)`
    - Définir `EmotionalCheckinResponse(BaseModel)` et `EmotionalStats(BaseModel)` avec le champ `trend: Literal["improving", "stable", "declining", "insufficient_data"]`
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [x] 2.3 Créer `app/Backend/schemas/chat.py`
    - Définir `ChatRequest(BaseModel)` avec `message: str` et `conversation_id: Optional[int] = None`
    - _Requirements: 1.1_

- [x] 3. Service PromptBuilder
  - [x] 3.1 Créer `app/Backend/services/prompt_builder.py`
    - Implémenter la classe `PromptBuilder` avec `MAX_PROMPT_TOKENS = 2000`
    - Méthode `build(profile: Optional[UserProfile]) -> str` : construire le prompt en 6 blocs ordonnés (langue, base empathique + disclaimer, personnalité MBTI/DISC, style de communication, objectifs, contexte de vie)
    - Méthode `_estimate_tokens(text: str) -> int` : retourner `len(text) // 4`
    - Tronquer le prompt si l'estimation dépasse `MAX_PROMPT_TOKENS`
    - Le disclaimer santé mentale doit être présent dans tous les cas (profil None ou vide)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 3.2 Écrire le test de propriété P9 : contenu du prompt reflète le profil
    - **Propriété 9 : Pour tout UserProfile avec des champs définis, le prompt doit contenir les instructions correspondantes**
    - **Valide : Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
    - Stratégie Hypothesis : `st.builds(UserProfile, ...)` avec tous les champs optionnels
    - Annoter : `# Feature: soul-echo-backend, Property 9`
    - _Requirements: 3.1–3.8_

  - [ ]* 3.3 Écrire le test de propriété P10 : disclaimer toujours présent
    - **Propriété 10 : Pour tout UserProfile (y compris None ou vide), le prompt contient toujours le disclaimer santé mentale**
    - **Valide : Requirements 3.9**
    - Stratégie Hypothesis : `st.one_of(st.none(), st.builds(UserProfile, ...))`
    - Annoter : `# Feature: soul-echo-backend, Property 10`
    - _Requirements: 3.9_

  - [ ]* 3.4 Écrire le test de propriété P11 : prompt respecte la limite de tokens
    - **Propriété 11 : Pour tout UserProfile avec valeurs maximales, PromptBuilder.build() retourne un prompt dont l'estimation ≤ 2000 tokens**
    - **Valide : Requirements 3.10**
    - Stratégie Hypothesis : `st.builds(UserProfile, ...)` avec `life_context` de 500 chars, `goals` de 5 éléments
    - Annoter : `# Feature: soul-echo-backend, Property 11`
    - _Requirements: 3.10_

- [x] 4. Service ContextMemory
  - [x] 4.1 Créer `app/Backend/services/context_memory.py`
    - Implémenter la classe `ContextMemory` avec `__init__(self, db: AsyncSession)`
    - Méthode `get_context(conversation_id: int, system_prompt: str, current_message: str) -> list[dict]`
    - Lire `CONTEXT_WINDOW_SIZE` depuis `settings` (défaut 20) et `MAX_CONTEXT_TOKENS` (défaut 4000)
    - Récupérer les N derniers messages via `MessagesService.list_by_field("conversation_id", ...)` puis trier chronologiquement
    - Tronquer les messages les plus anciens si la somme des tokens estimés dépasse `MAX_CONTEXT_TOKENS`, en conservant toujours le dernier message utilisateur
    - Retourner `[{"role": "system", "content": system_prompt}, ...messages_historiques..., {"role": "user", "content": current_message}]`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 4.2 Écrire le test de propriété P12 : structure et ordre du contexte
    - **Propriété 12 : Pour toute conversation avec N messages, get_context() retourne une liste où le premier élément est system, les messages suivent en ordre chronologique, et le nombre ≤ CONTEXT_WINDOW_SIZE**
    - **Valide : Requirements 4.1, 4.2, 4.3**
    - Stratégie Hypothesis : `st.lists(st.fixed_dictionaries({"role": st.sampled_from(["user","assistant"]), "content": st.text(min_size=1)}), max_size=50)`
    - Annoter : `# Feature: soul-echo-backend, Property 12`
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 4.3 Écrire le test de propriété P13 : tronquage préserve le dernier message utilisateur
    - **Propriété 13 : Pour toute conversation dont la somme des tokens dépasse MAX_CONTEXT_TOKENS, get_context() inclut toujours le dernier message utilisateur**
    - **Valide : Requirements 4.4, 4.5**
    - Stratégie Hypothesis : `st.lists(...)` avec messages suffisamment longs pour dépasser la limite
    - Annoter : `# Feature: soul-echo-backend, Property 13`
    - _Requirements: 4.4, 4.5_

- [x] 5. Service ProfileService
  - [x] 5.1 Créer `app/Backend/services/profile_service.py`
    - Implémenter la classe `ProfileService` avec `__init__(self, db: AsyncSession)`
    - Méthode `get_or_create(user_id: str) -> UserProfile` : retourner le profil existant ou en créer un avec les valeurs par défaut
    - Méthode `update(user_id: str, data: UserProfileUpdate) -> UserProfile` : upsert avec validation Pydantic déjà effectuée
    - Méthode `delete_user_data(user_id: str) -> dict` : supprimer en cascade atomique (UserProfile, EmotionalScores, Messages, Conversations) dans une seule transaction, retourner `{"deleted_at": datetime_utc}`
    - Méthode `export_user_data(user_id: str) -> dict` : retourner profil + scores émotionnels + conversations + messages dans un dict JSON structuré
    - _Requirements: 2.2, 2.3, 2.6, 2.7, 6.3, 6.4, 6.5_

  - [ ]* 5.2 Écrire le test de propriété P6 : round-trip profil utilisateur
    - **Propriété 6 : Pour tout UserProfile créé/mis à jour avec des valeurs valides, la lecture immédiate retourne exactement les mêmes valeurs**
    - **Valide : Requirements 2.1, 2.2, 2.3**
    - Stratégie Hypothesis : `st.builds(UserProfileUpdate, personality_type=st.sampled_from(VALID_TYPES), ...)`
    - Annoter : `# Feature: soul-echo-backend, Property 6`
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 5.3 Écrire le test de propriété P7 : validation du type de personnalité invalide
    - **Propriété 7 : Pour toute chaîne personality_type qui n'est ni MBTI ni DISC, ProfileService.update() retourne HTTP 422**
    - **Valide : Requirements 2.4, 2.5**
    - Stratégie Hypothesis : `st.text().filter(lambda s: s.upper() not in VALID_MBTI | VALID_DISC)`
    - Annoter : `# Feature: soul-echo-backend, Property 7`
    - _Requirements: 2.4, 2.5_

  - [ ]* 5.4 Écrire le test de propriété P8 : initialisation automatique du profil
    - **Propriété 8 : Pour tout user_id, ProfileService.get_or_create() retourne toujours un UserProfile non null**
    - **Valide : Requirements 2.6**
    - Stratégie Hypothesis : `st.text(min_size=1, max_size=255)`
    - Annoter : `# Feature: soul-echo-backend, Property 8`
    - _Requirements: 2.6_

  - [ ]* 5.5 Écrire le test de propriété P18 : suppression RGPD en cascade sans orphelins
    - **Propriété 18 : Après delete_user_data(), aucun enregistrement portant le user_id ne subsiste dans les 4 tables**
    - **Valide : Requirements 6.3**
    - Stratégie Hypothesis : `st.text(min_size=1)` user_id avec données associées créées en base de test
    - Annoter : `# Feature: soul-echo-backend, Property 18`
    - _Requirements: 6.3_

  - [ ]* 5.6 Écrire le test de propriété P19 : export RGPD isolé par utilisateur
    - **Propriété 19 : Pour tout utilisateur dans un système multi-utilisateurs, export_user_data() retourne uniquement ses propres données**
    - **Valide : Requirements 6.5**
    - Stratégie Hypothesis : `st.lists(st.text(min_size=1), min_size=2, unique=True)` pour les user_ids
    - Annoter : `# Feature: soul-echo-backend, Property 19`
    - _Requirements: 6.5_

- [x] 6. Checkpoint — Vérifier les services purs (sans DB)
  - Vérifier que `PromptBuilder` et `ContextMemory` (logique de tronquage) fonctionnent correctement avec des données mockées.
  - S'assurer que tous les tests passent, poser des questions si nécessaire.

- [x] 7. Service EmotionalTracker
  - [x] 7.1 Créer `app/Backend/services/emotional_tracker.py`
    - Implémenter la classe `EmotionalTracker` avec `__init__(self, db: AsyncSession)`
    - Méthode `create_checkin(user_id: str, score: int, note: Optional[str]) -> EmotionalScore`
    - Méthode `list_checkins(user_id: str, from_date: Optional[datetime], to_date: Optional[datetime], limit: int = 365) -> list[EmotionalScore]` : filtrer par dates si fournies, trier par `created_at` ASC, limiter à 365
    - Méthode `get_stats(user_id: str) -> EmotionalStats` : calculer avg_7d, avg_30d, min_30d, max_30d, trend selon la règle improving/stable/declining (seuil 0.5), retourner `"insufficient_data"` si aucun score
    - Méthode `delete_all_for_user(user_id: str) -> int`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 7.2 Écrire le test de propriété P14 : round-trip score émotionnel
    - **Propriété 14 : Pour tout score valide créé via create_checkin(), list_checkins() retourne un enregistrement avec le même score, user_id, et created_at non null**
    - **Valide : Requirements 5.1**
    - Stratégie Hypothesis : `st.integers(min_value=1, max_value=10)`
    - Annoter : `# Feature: soul-echo-backend, Property 14`
    - _Requirements: 5.1_

  - [ ]* 7.3 Écrire le test de propriété P15 : score hors intervalle rejeté
    - **Propriété 15 : Pour tout entier score < 1 ou > 10, create_checkin() lève une erreur de validation sans créer d'enregistrement**
    - **Valide : Requirements 5.2**
    - Stratégie Hypothesis : `st.integers().filter(lambda x: x < 1 or x > 10)`
    - Annoter : `# Feature: soul-echo-backend, Property 15`
    - _Requirements: 5.2_

  - [ ]* 7.4 Écrire le test de propriété P16 : filtrage et tri des check-ins
    - **Propriété 16 : Pour tout intervalle [from_date, to_date], list_checkins() retourne uniquement les scores dans l'intervalle, triés chronologiquement, max 365 entrées**
    - **Valide : Requirements 5.3, 5.7**
    - Stratégie Hypothesis : `st.datetimes()` pour les bornes, `st.lists(st.integers(min_value=1, max_value=10), min_size=1)`
    - Annoter : `# Feature: soul-echo-backend, Property 16`
    - _Requirements: 5.3, 5.7_

  - [ ]* 7.5 Écrire le test de propriété P17 : calcul correct des statistiques émotionnelles
    - **Propriété 17 : Pour tout ensemble de scores, get_stats() calcule avg_7d, avg_30d et trend correctement (improving si avg_7d > avg_30d + 0.5, declining si avg_7d < avg_30d - 0.5, stable sinon)**
    - **Valide : Requirements 5.4, 5.5**
    - Stratégie Hypothesis : `st.lists(st.integers(min_value=1, max_value=10), min_size=1)`
    - Annoter : `# Feature: soul-echo-backend, Property 17`
    - _Requirements: 5.4, 5.5_

- [x] 8. Service ChatOrchestrator
  - [x] 8.1 Créer `app/Backend/services/chat_orchestrator.py`
    - Implémenter la classe `ChatOrchestrator` avec `__init__(self, db: AsyncSession)`
    - Méthode `stream(user_id: str, message: str, conversation_id: Optional[int]) -> AsyncGenerator[dict, None]`
    - Flux : vérifier solde tokens (HTTP 402 si insuffisant) → créer ou vérifier conversation (HTTP 403 si étrangère) → sauvegarder message user → appeler `ContextMemory.get_context()` → appeler `PromptBuilder.build()` → streamer via `AIHubService.gentxt_stream()` → sauvegarder réponse assistant → déduire tokens
    - Utiliser le flag `tokens_deducted` pour le rollback en cas d'erreur stream (crédit compensatoire)
    - Journaliser : `user_id`, `conversation_id`, modèle IA, tokens consommés — sans journaliser le contenu des messages (RGPD)
    - Yielder des dicts `{"type": "chunk"|"done"|"error", "content": str, "conversation_id": int}`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 6.2_

  - [ ]* 8.2 Écrire le test de propriété P1 : solde insuffisant bloque le chat
    - **Propriété 1 : Pour tout utilisateur dont le solde < coût estimé, ChatOrchestrator.stream() lève HTTP 402 avant tout appel IA ou écriture en base**
    - **Valide : Requirements 1.8**
    - Stratégie Hypothesis : `st.integers(min_value=0)` solde, `st.integers(min_value=1)` coût estimé supérieur au solde
    - Annoter : `# Feature: soul-echo-backend, Property 1`
    - _Requirements: 1.8_

  - [ ]* 8.3 Écrire le test de propriété P2 : ownership de conversation
    - **Propriété 2 : Pour tout conversation_id qui n'appartient pas à l'utilisateur, stream() lève HTTP 403 sans appeler l'IA**
    - **Valide : Requirements 1.3, 1.4**
    - Stratégie Hypothesis : `st.text(min_size=1)` user_id, `st.integers(min_value=1)` conversation_id d'un autre utilisateur
    - Annoter : `# Feature: soul-echo-backend, Property 2`
    - _Requirements: 1.3, 1.4_

  - [ ]* 8.4 Écrire le test de propriété P3 : persistance des deux messages après stream
    - **Propriété 3 : Pour tout échange complété avec succès, les messages user et assistant sont présents en base avec le bon conversation_id**
    - **Valide : Requirements 1.5, 1.6**
    - Stratégie Hypothesis : `st.text(min_size=1)` message, mock de AIHubService
    - Annoter : `# Feature: soul-echo-backend, Property 3`
    - _Requirements: 1.5, 1.6_

  - [ ]* 8.5 Écrire le test de propriété P4 : déduction de tokens correcte
    - **Propriété 4 : Pour tout échange complété, solde_après = solde_avant - tokens_consommés**
    - **Valide : Requirements 1.7**
    - Stratégie Hypothesis : `st.integers(min_value=1)` tokens consommés, solde initial suffisant
    - Annoter : `# Feature: soul-echo-backend, Property 4`
    - _Requirements: 1.7_

  - [ ]* 8.6 Écrire le test de propriété P5 : annulation de la déduction en cas d'erreur stream
    - **Propriété 5 : Pour tout échange qui échoue pendant le stream, le solde de tokens est identique avant et après**
    - **Valide : Requirements 1.10**
    - Stratégie Hypothesis : `st.integers(min_value=1)` solde initial, mock AIHubService qui lève une exception
    - Annoter : `# Feature: soul-echo-backend, Property 5`
    - _Requirements: 1.10_

- [x] 9. Routers FastAPI
  - [x] 9.1 Créer `app/Backend/routers/chat.py`
    - Définir `router = APIRouter(prefix="/api/v1/chat", tags=["chat"])`
    - Endpoint `POST /api/v1/chat` : dépendances `get_current_user` + `get_db`, instancier `ChatOrchestrator`, retourner `EventSourceResponse` avec le générateur de `orchestrator.stream()`
    - Ajouter l'en-tête `X-AI-Generated: true` dans les headers de la réponse SSE (conformité AI Act)
    - Inclure le `conversation_id` dans les headers de la réponse SSE
    - _Requirements: 1.1, 1.9, 6.1_

  - [x] 9.2 Créer `app/Backend/routers/profile.py`
    - Définir `router = APIRouter(prefix="/api/v1/profile", tags=["profile"])`
    - `GET /api/v1/profile` → `ProfileService.get_or_create(user_id)`
    - `PUT /api/v1/profile` → `ProfileService.update(user_id, data)`
    - `DELETE /api/v1/profile/me` → `ProfileService.delete_user_data(user_id)` (suppression RGPD en cascade)
    - `GET /api/v1/profile/export` → `ProfileService.export_user_data(user_id)` (portabilité RGPD)
    - _Requirements: 2.2, 2.3, 6.3, 6.4, 6.5_

  - [x] 9.3 Créer `app/Backend/routers/emotional_checkin.py`
    - Définir `router = APIRouter(prefix="/api/v1/emotional-checkin", tags=["emotional-checkin"])`
    - `POST /api/v1/emotional-checkin` → `EmotionalTracker.create_checkin()`
    - `GET /api/v1/emotional-checkin` → `EmotionalTracker.list_checkins()` avec query params `from_date`, `to_date` (ISO 8601)
    - `GET /api/v1/emotional-checkin/stats` → `EmotionalTracker.get_stats()`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_

- [x] 10. Checkpoint final — Intégration et tests complets
  - Vérifier que les 3 nouveaux routers sont bien auto-découverts par `include_routers_from_package` dans `main.py` (aucune modification de `main.py` requise)
  - Vérifier que la migration Alembic s'applique correctement : `alembic upgrade head`
  - S'assurer que tous les tests passent, poser des questions si nécessaire.

---

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être ignorées pour un MVP rapide
- Chaque tâche référence les requirements pour la traçabilité
- Les tests de propriétés utilisent Hypothesis avec `@settings(max_examples=100)` et le commentaire `# Feature: soul-echo-backend, Property N`
- Les tests unitaires et de propriétés sont complémentaires : les unitaires couvrent les cas concrets, les propriétés vérifient la correction générale
- Aucune modification de `main.py`, `alembic/env.py` ou des services existants n'est requise — les nouveaux modèles sont auto-importés par `pkgutil.iter_modules` dans `env.py`, et les nouveaux routers sont auto-découverts par `include_routers_from_package`
