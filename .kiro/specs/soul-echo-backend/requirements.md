# Document de Requirements — SoulEcho Backend

## Introduction

Ce document décrit les exigences fonctionnelles du backend SoulEcho pour la phase V1.
SoulEcho est une application d'écoute active et de gestion du stress assistée par IA, ciblant les actifs européens (25-50 ans).

Le backend est construit sur la stack existante : Python / FastAPI, PostgreSQL + SQLAlchemy async, JWT, et l'OpenAI SDK via `services/aihub.py`.

Les cinq composants à construire sont :
1. Un endpoint de chat orchestrateur (`/api/v1/chat`)
2. Un profil utilisateur enrichi (MBTI/DISC, contexte de vie, objectifs)
3. Un système de prompt système dynamique adapté au profil
4. Une mémoire contextuelle (injection des N derniers messages)
5. Un endpoint de suivi émotionnel

---

## Glossaire

- **Chat_Router** : le router FastAPI exposant `/api/v1/chat`
- **Chat_Orchestrator** : le service qui coordonne conversation, IA, messages et tokens en une seule transaction
- **User_Profile** : l'entité enrichie stockant le type de personnalité, le contexte de vie, les objectifs et les préférences de communication d'un utilisateur
- **Profile_Service** : le service gérant les opérations CRUD sur User_Profile
- **Prompt_Builder** : le composant qui construit le prompt système dynamique à partir du User_Profile
- **Context_Memory** : le mécanisme d'injection des N derniers messages d'une conversation dans le contexte IA
- **Emotional_Tracker** : le service calculant et stockant les scores de bien-être émotionnel
- **Emotional_Score** : une valeur entière de 1 à 10 représentant le niveau de bien-être perçu d'un utilisateur à un instant donné
- **Token_Balance** : le solde de tokens d'un utilisateur, géré par le service `token_balances` existant
- **SSE** : Server-Sent Events, protocole de streaming HTTP utilisé pour les réponses IA en temps réel
- **MBTI** : Myers-Briggs Type Indicator — 16 types de personnalité (ex. INTJ, ENFP)
- **DISC** : modèle comportemental à 4 dimensions (Dominance, Influence, Stabilité, Conformité)
- **TCC** : Thérapie Cognitive et Comportementale
- **PNL** : Programmation Neuro-Linguistique
- **RGPD** : Règlement Général sur la Protection des Données (UE 2016/679)

---

## Requirements

### Requirement 1 : Endpoint de chat orchestrateur

**User Story :** En tant qu'utilisateur authentifié, je veux envoyer un message à l'IA et recevoir une réponse empathique en un seul appel API, afin de ne pas avoir à gérer moi-même la création de conversation, la sauvegarde des messages et la déduction de tokens.

#### Critères d'acceptation

1. WHEN un utilisateur authentifié envoie une requête POST à `/api/v1/chat` avec un `message` et un `conversation_id` optionnel, THE Chat_Router SHALL retourner une réponse SSE streaming contenant la réponse de l'IA.
2. WHEN le `conversation_id` est absent de la requête, THE Chat_Orchestrator SHALL créer une nouvelle conversation avant d'appeler l'IA.
3. WHEN le `conversation_id` est présent, THE Chat_Orchestrator SHALL vérifier que la conversation appartient à l'utilisateur authentifié avant de continuer.
4. IF la conversation n'appartient pas à l'utilisateur authentifié, THEN THE Chat_Router SHALL retourner une erreur HTTP 403.
5. THE Chat_Orchestrator SHALL sauvegarder le message utilisateur en base de données avec le rôle `user` avant d'appeler l'IA.
6. THE Chat_Orchestrator SHALL sauvegarder la réponse complète de l'IA en base de données avec le rôle `assistant` après la fin du stream.
7. THE Chat_Orchestrator SHALL déduire du Token_Balance de l'utilisateur le nombre de tokens consommés par l'échange (prompt + completion).
8. IF le Token_Balance de l'utilisateur est insuffisant pour couvrir le coût estimé de la requête, THEN THE Chat_Router SHALL retourner une erreur HTTP 402 avant d'appeler l'IA.
9. THE Chat_Router SHALL retourner dans les headers SSE le `conversation_id` utilisé ou créé, afin que le client puisse le réutiliser.
10. WHEN une erreur survient pendant le stream IA, THE Chat_Orchestrator SHALL annuler la déduction de tokens et retourner un événement SSE d'erreur au client.

---

### Requirement 2 : Profil utilisateur enrichi

**User Story :** En tant qu'utilisateur, je veux renseigner mon type de personnalité, mon contexte de vie et mes objectifs, afin que l'IA adapte son approche à ma situation personnelle.

#### Critères d'acceptation

1. THE Profile_Service SHALL stocker pour chaque utilisateur : `personality_type` (MBTI ou DISC), `life_context` (texte libre, max 500 caractères), `goals` (liste de textes, max 5 éléments), `communication_preference` (valeur parmi : `direct`, `narrative`, `socratic`), et `language` (code ISO 639-1, ex. `fr`, `en`).
2. WHEN un utilisateur authentifié envoie une requête PUT à `/api/v1/profile`, THE Profile_Service SHALL créer ou mettre à jour son User_Profile.
3. WHEN un utilisateur authentifié envoie une requête GET à `/api/v1/profile`, THE Profile_Service SHALL retourner son User_Profile complet.
4. IF un champ `personality_type` est fourni, THEN THE Profile_Service SHALL valider que la valeur correspond à un type MBTI valide (16 types) ou à une valeur DISC valide (`D`, `I`, `S`, `C`).
5. IF un champ `communication_preference` invalide est fourni, THEN THE Profile_Service SHALL retourner une erreur HTTP 422 avec un message descriptif.
6. THE Profile_Service SHALL initialiser un User_Profile vide avec des valeurs par défaut lors de la première connexion d'un utilisateur, sans bloquer l'authentification.
7. WHEN un utilisateur supprime son compte (droit à l'oubli RGPD), THE Profile_Service SHALL supprimer le User_Profile associé dans la même transaction.

---

### Requirement 3 : Système de prompt système dynamique

**User Story :** En tant que product owner, je veux que l'IA adapte automatiquement son ton, son style et ses techniques thérapeutiques selon le profil de l'utilisateur, afin de maximiser l'impact émotionnel et l'efficacité des échanges.

#### Critères d'acceptation

1. THE Prompt_Builder SHALL construire un prompt système en langue française par défaut, ou dans la langue définie dans le User_Profile si elle est disponible.
2. WHEN le `personality_type` est de type MBTI avec une dominante `F` (Feeling), THE Prompt_Builder SHALL inclure des instructions privilégiant la validation émotionnelle et l'empathie narrative.
3. WHEN le `personality_type` est de type MBTI avec une dominante `T` (Thinking), THE Prompt_Builder SHALL inclure des instructions privilégiant la structuration logique et les étapes actionnables.
4. WHEN le `communication_preference` est `narrative`, THE Prompt_Builder SHALL inclure des instructions de style hypnotique et storytelling inspirées des techniques PNL.
5. WHEN le `communication_preference` est `socratic`, THE Prompt_Builder SHALL inclure des instructions pour poser des questions ouvertes guidant la réflexion, inspirées de l'écoute motivationnelle.
6. WHEN le `communication_preference` est `direct`, THE Prompt_Builder SHALL inclure des instructions pour des réponses concises avec des micro-actions concrètes inspirées de la TCC.
7. WHEN des `goals` sont définis dans le User_Profile, THE Prompt_Builder SHALL injecter ces objectifs dans le prompt système pour contextualiser les conseils.
8. WHEN un `life_context` est défini dans le User_Profile, THE Prompt_Builder SHALL injecter ce contexte dans le prompt système.
9. THE Prompt_Builder SHALL toujours inclure dans le prompt système une instruction explicite interdisant à l'IA de se substituer à un professionnel de santé mentale.
10. THE Prompt_Builder SHALL produire un prompt système dont la longueur ne dépasse pas 2000 tokens, afin de préserver la fenêtre de contexte disponible pour la conversation.

---

### Requirement 4 : Mémoire contextuelle

**User Story :** En tant qu'utilisateur, je veux que l'IA se souvienne de ce que j'ai dit dans les échanges précédents de la même conversation, afin de ne pas avoir à me répéter à chaque message.

#### Critères d'acceptation

1. THE Context_Memory SHALL récupérer les N derniers messages d'une conversation depuis la base de données, où N est configurable via une variable d'environnement `CONTEXT_WINDOW_SIZE` avec une valeur par défaut de 20.
2. THE Context_Memory SHALL injecter ces messages dans le contexte IA dans l'ordre chronologique (du plus ancien au plus récent), avec leur rôle (`user` ou `assistant`).
3. THE Context_Memory SHALL placer le prompt système en première position du tableau de messages envoyé à l'IA, avant les messages historiques.
4. WHEN la somme des tokens des messages historiques dépasse `MAX_CONTEXT_TOKENS` (configurable, défaut : 4000), THE Context_Memory SHALL tronquer les messages les plus anciens pour respecter cette limite.
5. THE Context_Memory SHALL toujours conserver au minimum le dernier message utilisateur dans le contexte, même si la limite de tokens est dépassée.
6. WHEN une nouvelle conversation est créée, THE Context_Memory SHALL initialiser le contexte avec uniquement le prompt système et le message courant de l'utilisateur.

---

### Requirement 5 : Suivi émotionnel

**User Story :** En tant qu'utilisateur, je veux pouvoir enregistrer mon niveau de bien-être après un échange et consulter l'évolution de mon état émotionnel dans le temps, afin de prendre conscience de mes progrès.

#### Critères d'acceptation

1. WHEN un utilisateur authentifié envoie une requête POST à `/api/v1/emotional-checkin` avec un `score` (entier de 1 à 10) et un `note` optionnel (texte libre, max 200 caractères), THE Emotional_Tracker SHALL persister cet Emotional_Score en base de données avec un horodatage UTC.
2. IF le `score` fourni est en dehors de l'intervalle [1, 10], THEN THE Emotional_Tracker SHALL retourner une erreur HTTP 422 avec un message descriptif.
3. WHEN un utilisateur authentifié envoie une requête GET à `/api/v1/emotional-checkin` avec des paramètres `from_date` et `to_date` optionnels (format ISO 8601), THE Emotional_Tracker SHALL retourner la liste des Emotional_Scores de l'utilisateur dans la période demandée, triée par ordre chronologique.
4. WHEN un utilisateur authentifié envoie une requête GET à `/api/v1/emotional-checkin/stats`, THE Emotional_Tracker SHALL retourner : la moyenne des scores sur les 7 derniers jours, la moyenne sur les 30 derniers jours, le score minimum et maximum sur les 30 derniers jours, et la tendance (valeur parmi : `improving`, `stable`, `declining`) calculée par comparaison des moyennes 7j vs 30j.
5. THE Emotional_Tracker SHALL calculer la tendance selon la règle suivante : `improving` si la moyenne 7j dépasse la moyenne 30j de plus de 0.5 point, `declining` si elle est inférieure de plus de 0.5 point, `stable` sinon.
6. WHEN un utilisateur supprime son compte (droit à l'oubli RGPD), THE Emotional_Tracker SHALL supprimer tous les Emotional_Scores associés dans la même transaction.
7. THE Emotional_Tracker SHALL limiter les requêtes GET à un maximum de 365 entrées par appel, afin de protéger les performances de la base de données.

---

### Requirement 6 : Conformité RGPD et AI Act

**User Story :** En tant que DPO (Data Protection Officer), je veux que le backend respecte nativement le RGPD et l'AI Act européen, afin de garantir la conformité légale du produit sur le marché européen.

#### Critères d'acceptation

1. THE Chat_Router SHALL inclure dans chaque réponse SSE un en-tête `X-AI-Generated: true` signalant explicitement que le contenu est généré par une IA, conformément à l'AI Act.
2. THE Chat_Orchestrator SHALL journaliser dans les logs applicatifs le `user_id`, le `conversation_id`, le modèle IA utilisé et le nombre de tokens consommés pour chaque échange, sans journaliser le contenu des messages.
3. WHEN un utilisateur authentifié envoie une requête DELETE à `/api/v1/profile/me`, THE Profile_Service SHALL supprimer en cascade : le User_Profile, tous les Emotional_Scores et toutes les Conversations et Messages associés à cet utilisateur, dans une transaction atomique.
4. THE Profile_Service SHALL retourner une confirmation avec un horodatage UTC lors de la suppression réussie des données utilisateur.
5. WHEN un utilisateur authentifié envoie une requête GET à `/api/v1/profile/export`, THE Profile_Service SHALL retourner l'ensemble des données personnelles de l'utilisateur (profil, scores émotionnels, conversations) dans un format JSON structuré, conformément au droit à la portabilité des données RGPD.
