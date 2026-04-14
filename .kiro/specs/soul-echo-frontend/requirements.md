# Document de Requirements — SoulEcho Frontend

## Introduction

Ce document décrit les exigences fonctionnelles du frontend SoulEcho pour la phase V1.

SoulEcho est une application d'écoute active et de gestion du stress assistée par IA, ciblant les actifs européens (25-50 ans). Le frontend est une Single Page Application React/TypeScript construite avec Vite, Tailwind CSS, shadcn/ui et Tanstack Query. Il consomme l'API backend SoulEcho via Axios et gère l'authentification JWT.

L'interface adopte un design sombre et apaisant (deep navy, violet doux, blanc cassé), minimaliste, avec des animations subtiles et un ton hypnotique cohérent avec la promesse de la marque.

Les cinq surfaces à construire sont :
1. Page d'authentification (login / register)
2. Page de chat — interface principale immersive avec streaming SSE
3. Page de profil utilisateur (MBTI/DISC, objectifs, style de communication)
4. Dashboard émotionnel (graphique d'évolution, check-in rapide, statistiques)
5. Page de tokens (solde, achat de packages)

---

## Glossaire

- **App** : l'application frontend SoulEcho dans son ensemble
- **Auth_Module** : le module gérant l'authentification JWT (login, register, logout, refresh)
- **Chat_Page** : la page principale de conversation avec l'IA
- **Chat_Stream** : le mécanisme de réception et d'affichage des événements SSE en temps réel
- **Conversation_Sidebar** : le panneau latéral listant l'historique des conversations
- **Profile_Page** : la page de gestion du profil utilisateur enrichi
- **Dashboard_Page** : la page de suivi émotionnel avec graphiques et check-in rapide
- **Token_Page** : la page de gestion du solde et des achats de tokens
- **API_Client** : la couche Axios configurée avec intercepteurs JWT et gestion d'erreurs
- **Auth_Guard** : le composant protégeant les routes nécessitant une authentification
- **SSE** : Server-Sent Events — protocole de streaming HTTP utilisé pour les réponses IA
- **JWT** : JSON Web Token — mécanisme d'authentification stateless
- **MBTI** : Myers-Briggs Type Indicator — 16 types de personnalité (ex. INTJ, ENFP)
- **DISC** : modèle comportemental à 4 dimensions (D, I, S, C)
- **Check-in** : enregistrement ponctuel d'un score de bien-être émotionnel (1-10)
- **Token** : unité de consommation de l'IA, achetable en packages
- **RGPD** : Règlement Général sur la Protection des Données (UE 2016/679)
- **TanStack_Query** : bibliothèque de gestion d'état serveur (react-query) utilisée pour les appels API
- **React_Hook_Form** : bibliothèque de gestion de formulaires utilisée avec Zod pour la validation

---

## Requirements

### Requirement 1 : Authentification

**User Story :** En tant que visiteur, je veux pouvoir créer un compte et me connecter, afin d'accéder à mon espace personnel SoulEcho de manière sécurisée.

#### Critères d'acceptation

1. THE App SHALL afficher une page d'authentification accessible à l'URL `/auth` contenant un formulaire de connexion et un formulaire d'inscription.
2. WHEN un visiteur soumet le formulaire de connexion avec un email et un mot de passe valides, THE Auth_Module SHALL envoyer une requête POST à `/api/v1/auth/login`, stocker le JWT retourné dans le localStorage, et rediriger l'utilisateur vers `/chat`.
3. WHEN un visiteur soumet le formulaire d'inscription avec des données valides, THE Auth_Module SHALL envoyer une requête POST à `/api/v1/auth/register` et rediriger l'utilisateur vers `/chat` après succès.
4. IF le serveur retourne une erreur d'authentification (HTTP 401 ou 422), THEN THE Auth_Module SHALL afficher un message d'erreur explicite sous le formulaire concerné, sans effacer les champs saisis.
5. THE Auth_Module SHALL valider les champs du formulaire côté client avec Zod avant tout envoi réseau : email au format valide, mot de passe d'au moins 8 caractères.
6. WHEN un utilisateur authentifié tente d'accéder à `/auth`, THE App SHALL le rediriger automatiquement vers `/chat`.
7. WHEN un utilisateur non authentifié tente d'accéder à une route protégée, THE Auth_Guard SHALL le rediriger vers `/auth`.
8. WHEN un utilisateur clique sur "Se déconnecter", THE Auth_Module SHALL supprimer le JWT du localStorage et rediriger vers `/auth`.
9. THE API_Client SHALL inclure automatiquement le JWT dans l'en-tête `Authorization: Bearer {token}` de chaque requête vers les routes protégées.
10. IF le serveur retourne une erreur HTTP 401 sur une requête authentifiée, THEN THE API_Client SHALL supprimer le JWT du localStorage et rediriger l'utilisateur vers `/auth`.

---

### Requirement 2 : Page de chat

**User Story :** En tant qu'utilisateur authentifié, je veux converser avec l'IA SoulEcho dans une interface immersive, afin de bénéficier d'une écoute active et de conseils actionnables en temps réel.

#### Critères d'acceptation

1. THE Chat_Page SHALL afficher une zone de messages centrée et une zone de saisie fixée en bas de l'écran, accessible à l'URL `/chat`.
2. WHEN un utilisateur envoie un message, THE Chat_Page SHALL afficher immédiatement le message utilisateur dans la zone de messages, puis déclencher un appel POST à `/api/v1/chat` avec le `message` et le `conversation_id` courant.
3. THE Chat_Stream SHALL consommer les événements SSE retournés par l'API et afficher les chunks de texte de l'IA progressivement, caractère par caractère ou chunk par chunk, dans la zone de messages.
4. WHILE l'IA génère sa réponse, THE Chat_Page SHALL afficher un indicateur de streaming (curseur clignotant) à la fin du texte en cours de génération.
5. WHILE l'IA génère sa réponse, THE Chat_Page SHALL désactiver la zone de saisie et le bouton d'envoi pour empêcher l'envoi de messages simultanés.
6. WHEN le stream SSE se termine (événement `done`), THE Chat_Page SHALL réactiver la zone de saisie et déplacer le focus sur le champ de saisie.
7. IF le stream SSE retourne un événement d'erreur, THEN THE Chat_Page SHALL afficher un message d'erreur non intrusif et réactiver la zone de saisie.
8. THE Chat_Page SHALL extraire le `conversation_id` retourné par l'API et le conserver en état local pour les messages suivants de la même conversation.
9. THE Chat_Page SHALL faire défiler automatiquement la zone de messages vers le bas à chaque nouveau chunk reçu.
10. THE Chat_Page SHALL afficher un message de bienvenue vide et apaisant lorsqu'aucune conversation n'est active.
11. WHERE la Conversation_Sidebar est activée, THE Chat_Page SHALL afficher un panneau latéral listant les conversations précédentes de l'utilisateur, avec leur date et un aperçu du premier message.
12. WHEN un utilisateur clique sur une conversation dans la Conversation_Sidebar, THE Chat_Page SHALL charger et afficher les messages de cette conversation.

---

### Requirement 3 : Profil utilisateur

**User Story :** En tant qu'utilisateur authentifié, je veux renseigner et modifier mon profil (type de personnalité, objectifs, style de communication), afin que l'IA adapte son approche à ma situation personnelle.

#### Critères d'acceptation

1. THE Profile_Page SHALL afficher un formulaire de profil accessible à l'URL `/profile`, pré-rempli avec les données existantes récupérées via GET `/api/v1/profile`.
2. THE Profile_Page SHALL proposer un sélecteur de type de personnalité permettant de choisir parmi les 16 types MBTI ou les 4 valeurs DISC (D, I, S, C), avec une description courte de chaque type.
3. THE Profile_Page SHALL proposer un sélecteur de style de communication avec trois options : `direct`, `narrative`, `socratic`, avec une description de l'impact sur les réponses de l'IA.
4. THE Profile_Page SHALL proposer un champ texte libre pour le contexte de vie (`life_context`), limité à 500 caractères avec un compteur visible.
5. THE Profile_Page SHALL proposer un champ de saisie d'objectifs (`goals`) permettant d'ajouter jusqu'à 5 objectifs sous forme de tags, avec la possibilité de supprimer chaque tag individuellement.
6. WHEN un utilisateur soumet le formulaire de profil, THE Profile_Page SHALL envoyer une requête PUT à `/api/v1/profile` et afficher une confirmation visuelle de sauvegarde.
7. IF le serveur retourne une erreur de validation (HTTP 422), THEN THE Profile_Page SHALL afficher les messages d'erreur correspondants sous les champs concernés.
8. THE Profile_Page SHALL valider les champs côté client avec Zod avant tout envoi réseau.
9. THE Profile_Page SHALL proposer une section "Données personnelles" avec un bouton d'export RGPD (GET `/api/v1/profile/export`) et un bouton de suppression de compte (DELETE `/api/v1/profile/me`).
10. WHEN un utilisateur clique sur "Supprimer mon compte", THE Profile_Page SHALL afficher une modale de confirmation explicite avant d'envoyer la requête DELETE, puis déconnecter l'utilisateur et le rediriger vers `/auth`.

---

### Requirement 4 : Dashboard émotionnel

**User Story :** En tant qu'utilisateur authentifié, je veux visualiser l'évolution de mon état émotionnel et enregistrer un check-in rapide, afin de prendre conscience de mes progrès et de ma tendance émotionnelle.

#### Critères d'acceptation

1. THE Dashboard_Page SHALL afficher un tableau de bord accessible à l'URL `/dashboard` contenant : un graphique d'évolution, un widget de check-in rapide, et un bloc de statistiques.
2. THE Dashboard_Page SHALL récupérer les données de check-in via GET `/api/v1/emotional-checkin` et les statistiques via GET `/api/v1/emotional-checkin/stats` au chargement de la page.
3. THE Dashboard_Page SHALL afficher un graphique linéaire (Recharts) représentant l'évolution des scores émotionnels dans le temps, avec l'axe X en dates et l'axe Y en scores de 1 à 10.
4. THE Dashboard_Page SHALL afficher les statistiques clés : moyenne sur 7 jours, moyenne sur 30 jours, et la tendance (`improving`, `stable`, `declining`) avec une icône et une couleur distinctives pour chaque état.
5. THE Dashboard_Page SHALL afficher un widget de check-in rapide permettant à l'utilisateur de sélectionner un score de 1 à 10 via un slider ou des boutons numérotés, avec un champ de note optionnel.
6. WHEN un utilisateur soumet un check-in, THE Dashboard_Page SHALL envoyer une requête POST à `/api/v1/emotional-checkin` et mettre à jour le graphique et les statistiques sans rechargement de page.
7. IF aucun check-in n'existe pour l'utilisateur, THEN THE Dashboard_Page SHALL afficher un message d'invitation à enregistrer le premier check-in, sans afficher de graphique vide.
8. THE Dashboard_Page SHALL afficher un indicateur de chargement pendant la récupération des données et un message d'erreur non intrusif en cas d'échec réseau.
9. WHERE la tendance est `improving`, THE Dashboard_Page SHALL afficher la statistique de tendance en vert avec une icône de flèche montante.
10. WHERE la tendance est `declining`, THE Dashboard_Page SHALL afficher la statistique de tendance en rouge avec une icône de flèche descendante.

---

### Requirement 5 : Gestion des tokens

**User Story :** En tant qu'utilisateur authentifié, je veux consulter mon solde de tokens et acheter des packages, afin de continuer à utiliser l'IA SoulEcho selon mes besoins.

#### Critères d'acceptation

1. THE Token_Page SHALL afficher une page de gestion des tokens accessible à l'URL `/tokens`, avec le solde actuel récupéré via GET `/api/v1/token-balances`.
2. THE Token_Page SHALL afficher la liste des packages de tokens disponibles récupérée via GET `/api/v1/token-packages`, avec pour chaque package : le nom, le nombre de tokens, le prix et un bouton d'achat.
3. WHEN un utilisateur clique sur "Acheter" pour un package, THE Token_Page SHALL envoyer une requête POST à `/api/v1/token-packages` et afficher une confirmation visuelle après succès.
4. IF le solde de tokens est inférieur à 10, THEN THE Token_Page SHALL afficher une alerte visuelle invitant l'utilisateur à recharger son solde.
5. THE Token_Page SHALL afficher le solde de tokens dans la barre de navigation principale, visible depuis toutes les pages de l'application.
6. WHEN un achat de tokens est effectué avec succès, THE Token_Page SHALL mettre à jour le solde affiché sans rechargement de page.
7. IF le serveur retourne une erreur lors de l'achat (HTTP 4xx ou 5xx), THEN THE Token_Page SHALL afficher un message d'erreur explicite sans fermer la page.

---

### Requirement 6 : Navigation et layout global

**User Story :** En tant qu'utilisateur authentifié, je veux naviguer fluidement entre les différentes sections de l'application, afin d'accéder rapidement à chaque fonctionnalité.

#### Critères d'acceptation

1. THE App SHALL implémenter un système de routing avec React Router, avec les routes : `/auth`, `/chat`, `/profile`, `/dashboard`, `/tokens`.
2. THE App SHALL afficher une barre de navigation latérale ou supérieure sur toutes les pages protégées, avec des liens vers `/chat`, `/profile`, `/dashboard`, `/tokens`.
3. THE App SHALL afficher le solde de tokens courant dans la navigation, mis à jour en temps réel après chaque échange de chat.
4. THE App SHALL appliquer un thème visuel cohérent sur toutes les pages : palette sombre (deep navy `#0D1B2A`, violet doux `#7C3AED`, blanc cassé `#F5F0EB`), typographie élégante et aérée.
5. THE App SHALL afficher des transitions de page subtiles lors de la navigation entre les routes.
6. IF une route inconnue est accédée, THEN THE App SHALL rediriger vers `/chat` pour les utilisateurs authentifiés ou vers `/auth` pour les visiteurs.
7. THE App SHALL être responsive et fonctionner correctement sur des écrans de largeur minimale 375px (mobile) jusqu'à 1440px (desktop).
8. THE App SHALL afficher un indicateur de chargement global pendant les transitions de navigation et les appels API initiaux.

---

### Requirement 7 : Qualité technique et conformité

**User Story :** En tant que développeur, je veux que le frontend respecte les standards de qualité technique et de conformité RGPD, afin de garantir la maintenabilité et la légalité du produit.

#### Critères d'acceptation

1. THE API_Client SHALL être configuré avec une `baseURL` lue depuis la variable d'environnement `VITE_API_BASE_URL`, sans valeur codée en dur.
2. THE App SHALL gérer les erreurs réseau globalement via un intercepteur Axios, en affichant des notifications toast non intrusives pour les erreurs HTTP 5xx.
3. THE App SHALL utiliser TanStack_Query pour toutes les requêtes GET, avec une stratégie de cache et d'invalidation cohérente (staleTime de 30 secondes minimum pour les données de profil et de tokens).
4. THE App SHALL utiliser React_Hook_Form avec Zod pour tous les formulaires, sans logique de validation manuelle.
5. THE App SHALL afficher un bandeau de consentement RGPD au premier chargement, informant l'utilisateur de l'utilisation de l'IA pour générer les réponses, conformément à l'AI Act.
6. THE App SHALL afficher la mention "Contenu généré par IA" de manière visible dans l'interface de chat, conformément à l'AI Act.
7. IF l'API retourne un en-tête `X-AI-Generated: true`, THEN THE Chat_Page SHALL afficher un indicateur visuel discret signalant que la réponse est générée par une IA.
8. THE App SHALL stocker uniquement le JWT dans le localStorage, sans stocker de données personnelles côté client.
