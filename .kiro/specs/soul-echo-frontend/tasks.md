# Plan d'implémentation : SoulEcho Frontend

## Vue d'ensemble

Implémentation de la SPA React 18 / TypeScript SoulEcho dans `app/Frontend/src/`. La stack est déjà installée dans `node_modules`. Les tâches suivent l'ordre de dépendance : configuration → types → couche API → hooks → composants → pages → tests.

## Tâches

- [x] 1. Configuration du projet (Vite + Tailwind + TypeScript + Vitest)
  - Créer `app/Frontend/package.json` avec les scripts `dev`, `build`, `preview`, `test` (vitest --run) et les dépendances `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `fast-check`
  - Créer `app/Frontend/vite.config.ts` avec le plugin React, l'alias `@/` → `src/`, et la config Vitest (`environment: 'jsdom'`, `globals: true`, `setupFiles`)
  - Créer `app/Frontend/tsconfig.json` avec `strict: true`, `paths: { "@/*": ["./src/*"] }`, `jsx: react-jsx`
  - Créer `app/Frontend/tailwind.config.ts` avec les couleurs SoulEcho (`navy`, `violet`, `cream`), les polices (`Inter`, `Playfair Display`) et les animations (`cursor-blink`, `fade-in`)
  - Créer `app/Frontend/postcss.config.js` avec `tailwindcss` et `autoprefixer`
  - Créer `app/Frontend/src/test/setup.ts` avec `@testing-library/jest-dom`
  - _Requirements: 7.1, 7.3, 7.4_

- [ ] 2. Types TypeScript et variables CSS
  - [x] 2.1 Créer `src/types/api.ts` avec toutes les interfaces : `UserResponse`, `TokenExchangeResponse`, `ChatRequest`, `ChatEvent`, `ChatMessage`, `PersonalityType`, `CommunicationPreference`, `UserProfileResponse`, `UserProfileUpdate`, `EmotionalCheckinCreate`, `EmotionalCheckinResponse`, `EmotionalStats`, `TokenBalance`, `TokenPackage`, `Conversation`
    - _Requirements: 2.3, 3.1, 4.2, 5.1_
  - [x] 2.2 Créer `src/index.css` avec les variables CSS SoulEcho (`--color-navy`, `--color-violet`, `--color-cream`, `--color-navy-light`, `--color-violet-light`, `--color-muted`) et les directives Tailwind (`@tailwind base/components/utilities`)
    - _Requirements: 6.4_

- [ ] 3. Couche API et authentification
  - [x] 3.1 Créer `src/lib/auth.ts` avec les helpers `getToken()`, `setToken(token)`, `removeToken()` utilisant `localStorage`
    - _Requirements: 1.2, 1.8, 7.8_
  - [x] 3.2 Créer `src/lib/api.ts` avec l'instance Axios (`baseURL` depuis `VITE_API_BASE_URL`), l'intercepteur request (injection JWT), et l'intercepteur response (401 → `removeToken()` + redirect `/auth`, 5xx → toast erreur)
    - _Requirements: 1.9, 1.10, 7.1, 7.2_
  - [ ]* 3.3 Écrire les tests unitaires pour `lib/api.ts` et `lib/auth.ts`
    - Tester la configuration `baseURL` depuis `VITE_API_BASE_URL`
    - Tester l'injection du header `Authorization`
    - Tester la suppression du token sur 401
    - _Requirements: 7.1_

- [ ] 4. Hooks d'authentification et routing
  - [x] 4.1 Créer `src/hooks/useAuth.ts` avec `AuthContext`, `AuthProvider` et le hook `useAuth()` exposant `user`, `isAuthenticated`, `login()`, `register()`, `logout()`
    - `login` : POST `/api/v1/auth/login` → `setToken()` → navigate `/chat`
    - `register` : POST `/api/v1/auth/register` → `setToken()` → navigate `/chat`
    - `logout` : `removeToken()` → navigate `/auth`
    - _Requirements: 1.2, 1.3, 1.8_
  - [x] 4.2 Créer `src/App.tsx` avec `createBrowserRouter` et les routes : `/auth` → `AuthPage`, `/` → `ProtectedLayout` (children : `/chat`, `/profile`, `/dashboard`, `/tokens`, `*` → redirect `/chat`), `*` → redirect `/`
    - Créer `src/main.tsx` avec `QueryClientProvider` (staleTime defaults), `AuthProvider`, `RouterProvider`, `Toaster`
    - _Requirements: 6.1, 6.6_
  - [x] 4.3 Créer `src/components/layout/ProtectedLayout.tsx` : vérifie `isAuthenticated`, redirige vers `/auth` si non authentifié, redirige vers `/chat` si authentifié accède à `/auth`, rend `<AppShell>` avec `<Outlet>`
    - _Requirements: 1.6, 1.7_
  - [ ]* 4.4 Écrire les tests unitaires pour `ProtectedLayout` et `useAuth`
    - Tester la redirection vers `/auth` sans JWT
    - Tester l'accès autorisé avec JWT valide
    - Tester la redirection de `/auth` vers `/chat` si déjà authentifié
    - Tester le comportement logout
    - _Requirements: 1.6, 1.7, 1.8_
  - [ ]* 4.5 Écrire le test de propriété P4 — Auth_Guard redirige les routes protégées
    - **Propriété 4 : Pour toute route protégée accédée sans JWT, `ProtectedLayout` redirige vers `/auth`**
    - **Valide : Requirements 1.7**
    - Stratégie : `fc.constantFrom('/chat', '/profile', '/dashboard', '/tokens')`
    - `// Feature: soul-echo-frontend, Property 4: Auth_Guard redirects protected routes`

- [ ] 5. Layout global (AppShell + Sidebar)
  - [x] 5.1 Créer `src/components/layout/Sidebar.tsx` avec les liens de navigation (`/chat`, `/profile`, `/dashboard`, `/tokens`), le solde de tokens (via `useTokens`), et le bouton de déconnexion
    - Appliquer le thème navy/violet, typographie Inter
    - _Requirements: 6.2, 6.3, 5.5_
  - [x] 5.2 Créer `src/components/layout/AppShell.tsx` avec la mise en page sidebar + contenu principal, responsive (mobile 375px → desktop 1440px)
    - _Requirements: 6.4, 6.7_

- [ ] 6. Page d'authentification
  - [x] 6.1 Créer `src/pages/AuthPage.tsx` avec les formulaires `LoginForm` et `RegisterForm` utilisant `react-hook-form` + schémas Zod (`loginSchema`, `registerSchema`), affichage des erreurs serveur sous les champs, onglets ou toggle entre les deux formulaires
    - `loginSchema` : `email` (format valide), `password` (min 8 chars)
    - `registerSchema` : étend `loginSchema` + `name` optionnel
    - _Requirements: 1.1, 1.4, 1.5_
  - [ ]* 6.2 Écrire les tests unitaires pour `AuthPage`
    - Tester le rendu des deux formulaires
    - Tester l'affichage d'erreur sur 401/422 sans effacer les champs
    - _Requirements: 1.1, 1.4_
  - [ ]* 6.3 Écrire le test de propriété P2 — Validation rejette les inputs invalides
    - **Propriété 2 : Pour tout email mal formé ou password < 8 chars, Zod retourne une erreur et aucune requête réseau n'est émise**
    - **Valide : Requirements 1.5**
    - Stratégie : `fc.emailAddress()` invalides, `fc.string({ maxLength: 7 })`
    - `// Feature: soul-echo-frontend, Property 2: Client validation rejects invalid inputs`
  - [ ]* 6.4 Écrire le test de propriété P3 — Erreur d'auth préserve les champs
    - **Propriété 3 : Pour toute réponse HTTP 401 ou 422, les valeurs email et password restent inchangées**
    - **Valide : Requirements 1.4**
    - Stratégie : `fc.constantFrom(401, 422)` status codes
    - `// Feature: soul-echo-frontend, Property 3: Auth error preserves form fields`

- [x] 7. Checkpoint — Vérifier que les tests passent
  - S'assurer que tous les tests des tâches 3 à 6 passent. Demander à l'utilisateur si des questions se posent.

- [ ] 8. Hooks de données (Profile, Dashboard, Tokens)
  - [x] 8.1 Créer `src/hooks/useProfile.ts` avec TanStack Query : `useQuery(['profile'])` → GET `/api/v1/profile` (staleTime 30s), `useMutation` PUT `/api/v1/profile` → invalider `['profile']`, `exportData()` → GET `/api/v1/profile/export`, `deleteAccount()` → DELETE `/api/v1/profile/me` → logout
    - _Requirements: 3.1, 3.6, 3.9, 7.3_
  - [x] 8.2 Créer `src/hooks/useDashboard.ts` avec TanStack Query : `useQuery(['checkins'])` → GET `/api/v1/emotional-checkin` (staleTime 60s), `useQuery(['checkin-stats'])` → GET `/api/v1/emotional-checkin/stats` (staleTime 60s), `useMutation` POST → invalider `['checkins']` + `['checkin-stats']`
    - _Requirements: 4.2, 4.6, 7.3_
  - [x] 8.3 Créer `src/hooks/useTokens.ts` avec TanStack Query : `useQuery(['token-balance'])` → GET `/api/v1/token-balances` (staleTime 30s), `useQuery(['token-packages'])` → GET `/api/v1/token-packages` (staleTime 300s), `useMutation` POST `/api/v1/token-packages` → invalider `['token-balance']`
    - _Requirements: 5.1, 5.2, 5.3, 5.6, 7.3_
  - [ ]* 8.4 Écrire les tests unitaires pour les hooks (staleTime, invalidation)
    - Tester staleTime ≥ 30s pour profil et tokens
    - _Requirements: 7.3_

- [ ] 9. Composants de profil
  - [x] 9.1 Créer `src/components/profile/PersonalitySelector.tsx` : sélecteur avec les 16 types MBTI + 4 types DISC, description courte pour chaque type, intégré avec `react-hook-form`
    - _Requirements: 3.2_
  - [x] 9.2 Créer `src/components/profile/CommunicationStyleSelector.tsx` : 3 options (`direct`, `narrative`, `socratic`) avec description de l'impact IA, intégré avec `react-hook-form`
    - _Requirements: 3.3_
  - [x] 9.3 Créer `src/components/profile/GoalsTagInput.tsx` : saisie de tags avec ajout/suppression, limite de 5 tags, validation Zod bloquant le 6ème tag
    - _Requirements: 3.5_
  - [x] 9.4 Créer `src/components/profile/GdprSection.tsx` : bouton export RGPD, bouton suppression compte avec modale de confirmation (shadcn/ui `AlertDialog`)
    - _Requirements: 3.9, 3.10_
  - [x] 9.5 Créer `src/pages/ProfilePage.tsx` : formulaire complet avec `react-hook-form` + `profileSchema` Zod, pré-remplissage depuis `useProfile`, compteur 500 chars pour `life_context`, toast de confirmation après sauvegarde
    - _Requirements: 3.1, 3.4, 3.6, 3.7, 3.8_
  - [ ]* 9.6 Écrire les tests unitaires pour `ProfilePage`
    - Tester le rendu du sélecteur MBTI/DISC (20 options)
    - Tester la modale de confirmation suppression compte
    - _Requirements: 3.2, 3.10_
  - [ ]* 9.7 Écrire le test de propriété P10 — Formulaire pré-rempli avec les données existantes
    - **Propriété 10 : Pour tout `UserProfileResponse`, les champs du formulaire sont initialisés avec les valeurs correspondantes**
    - **Valide : Requirements 3.1**
    - Stratégie : `fc.record({ personality_type: fc.option(...), life_context: fc.option(fc.string({maxLength:500})), ... })`
    - `// Feature: soul-echo-frontend, Property 10: Profile form pre-filled with existing data`
  - [ ]* 9.8 Écrire le test de propriété P11 — Limite de 5 objectifs respectée
    - **Propriété 11 : Pour toute liste de 5 objectifs, ajouter un 6ème est bloqué par Zod et aucune requête PUT n'est émise**
    - **Valide : Requirements 3.5**
    - Stratégie : `fc.array(fc.string({ minLength: 1 }), { minLength: 5, maxLength: 5 })`
    - `// Feature: soul-echo-frontend, Property 11: Goals limit of 5 enforced`
  - [ ]* 9.9 Écrire le test de propriété P12 — Soumission profil valide → requête PUT émise
    - **Propriété 12 : Pour tout profil valide soumis, une requête PUT vers `/api/v1/profile` est émise avec les données du formulaire**
    - **Valide : Requirements 3.6, 3.8**
    - Stratégie : `fc.record({ personality_type: fc.option(fc.constantFrom(...MBTI_TYPES, ...DISC_TYPES)), ... })`
    - `// Feature: soul-echo-frontend, Property 12: Valid profile submission triggers PUT request`

- [ ] 10. Composants de dashboard
  - [x] 10.1 Créer `src/components/dashboard/EmotionalChart.tsx` : `LineChart` Recharts avec axe X (dates) et axe Y (scores 1-10), données triées chronologiquement depuis `EmotionalCheckinResponse[]`
    - _Requirements: 4.3_
  - [x] 10.2 Créer `src/components/dashboard/StatsBlock.tsx` : affichage `avg_7d`, `avg_30d`, tendance avec icône et couleur (vert `improving`, rouge `declining`, neutre `stable`/`insufficient_data`)
    - _Requirements: 4.4, 4.9, 4.10_
  - [x] 10.3 Créer `src/components/dashboard/CheckinWidget.tsx` : slider ou boutons 1-10 pour le score, champ note optionnel (max 200 chars), validation `checkinSchema` Zod, soumission via `useDashboard`
    - _Requirements: 4.5, 4.6_
  - [x] 10.4 Créer `src/pages/DashboardPage.tsx` : assemblage des composants, état vide (message d'invitation si aucun check-in), indicateur de chargement, gestion erreur réseau
    - _Requirements: 4.1, 4.7, 4.8_
  - [ ]* 10.5 Écrire les tests unitaires pour `DashboardPage`
    - Tester l'état vide (message d'invitation)
    - Tester le rendu de la page `/dashboard`
    - _Requirements: 4.7_
  - [ ]* 10.6 Écrire le test de propriété P13 — Données du graphique correspondent aux check-ins
    - **Propriété 13 : Pour tout ensemble de `EmotionalCheckinResponse`, les données passées à `EmotionalChart` contiennent exactement les mêmes scores et dates dans l'ordre chronologique**
    - **Valide : Requirements 4.3**
    - Stratégie : `fc.array(fc.record({ score: fc.integer({min:1,max:10}), created_at: fc.date() }))`
    - `// Feature: soul-echo-frontend, Property 13: Chart data matches check-ins`
  - [ ]* 10.7 Écrire le test de propriété P14 — Couleur de tendance correspond à la valeur
    - **Propriété 14 : Pour toute valeur de `trend`, `StatsBlock` affiche la couleur correcte (vert/rouge/neutre)**
    - **Valide : Requirements 4.4, 4.9, 4.10**
    - Stratégie : `fc.constantFrom('improving', 'stable', 'declining', 'insufficient_data')`
    - `// Feature: soul-echo-frontend, Property 14: Trend color matches trend value`
  - [ ]* 10.8 Écrire le test de propriété P15 — Score hors intervalle rejeté côté client
    - **Propriété 15 : Pour tout entier < 1 ou > 10, la validation Zod retourne une erreur et aucune requête POST n'est émise**
    - **Valide : Requirements 4.5**
    - Stratégie : `fc.integer().filter(x => x < 1 || x > 10)`
    - `// Feature: soul-echo-frontend, Property 15: Out-of-range check-in score rejected`

- [ ] 11. Composants de tokens
  - [x] 11.1 Créer `src/components/tokens/BalanceCard.tsx` : affichage du solde, alerte visuelle si `balance < 10` (badge rouge ou bannière), sinon aucune alerte
    - _Requirements: 5.4_
  - [x] 11.2 Créer `src/components/tokens/PackageCard.tsx` : affichage nom, tokens, prix, bouton "Acheter" actif, toast de confirmation après achat réussi, toast d'erreur sur 4xx/5xx
    - _Requirements: 5.2, 5.3, 5.7_
  - [x] 11.3 Créer `src/pages/TokensPage.tsx` : `BalanceCard` + liste de `PackageCard`, mise à jour du solde après achat sans rechargement
    - _Requirements: 5.1, 5.6_
  - [ ]* 11.4 Écrire le test de propriété P16 — Alerte solde faible si balance < 10
    - **Propriété 16 : Pour tout `balance < 10`, `BalanceCard` affiche une alerte. Pour tout `balance >= 10`, aucune alerte n'est affichée**
    - **Valide : Requirements 5.4**
    - Stratégie : `fc.integer({ min: 0 })` balance
    - `// Feature: soul-echo-frontend, Property 16: Low balance alert shown when balance < 10`
  - [ ]* 11.5 Écrire le test de propriété P17 — Rendu complet de chaque package
    - **Propriété 17 : Pour tout `TokenPackage`, `PackageCard` affiche le nom, le nombre de tokens, le prix et un bouton d'achat actif**
    - **Valide : Requirements 5.2**
    - Stratégie : `fc.record({ name: fc.string({minLength:1}), tokens: fc.integer({min:1}), price: fc.float({min:0}), currency: fc.string({minLength:3,maxLength:3}) })`
    - `// Feature: soul-echo-frontend, Property 17: Package card renders all fields`
  - [ ]* 11.6 Écrire le test de propriété P18 — Solde visible dans la navigation
    - **Propriété 18 : Pour tout `TokenBalance` chargé, la valeur `balance` est affichée dans `Sidebar`**
    - **Valide : Requirements 5.1, 5.5**
    - Stratégie : `fc.integer({ min: 0 })` balance
    - `// Feature: soul-echo-frontend, Property 18: Token balance visible in Sidebar`

- [x] 12. Checkpoint — Vérifier que les tests passent
  - S'assurer que tous les tests des tâches 8 à 11 passent. Demander à l'utilisateur si des questions se posent.

- [ ] 13. Hook de chat et composants de streaming
  - [x] 13.1 Créer `src/hooks/useChat.ts` avec la logique SSE via `fetch` natif + `ReadableStream` : `sendMessage(text)` → POST `/api/v1/chat` → lecture chunks → accumulation `content` → détection `event: done` / `event: error`, gestion `conversationId`, `isStreaming`, `messages`, `resetConversation()`, `loadConversation(id)`
    - Invalider `['token-balance']` et `['conversations']` après `done`
    - _Requirements: 2.2, 2.3, 2.5, 2.6, 2.7, 2.8_
  - [x] 13.2 Créer `src/components/chat/StreamingCursor.tsx` : curseur clignotant animé (animation `cursor-blink` Tailwind), affiché uniquement si `isStreaming=true`
    - _Requirements: 2.4_
  - [x] 13.3 Créer `src/components/chat/MessageBubble.tsx` : bulle de message avec style différencié `user` (violet) / `assistant` (navy-light), `StreamingCursor` intégré si `isStreaming`, mention "Contenu généré par IA" sur les messages assistant
    - _Requirements: 2.3, 7.6, 7.7_
  - [x] 13.4 Créer `src/components/chat/MessageList.tsx` : liste des messages avec auto-scroll vers le bas à chaque nouveau chunk (`useEffect` + `scrollIntoView`), message de bienvenue si liste vide
    - _Requirements: 2.9, 2.10_
  - [x] 13.5 Créer `src/components/chat/ChatInput.tsx` : textarea + bouton envoi, désactivés si `isStreaming=true`, focus automatique après `done`, soumission sur Enter (sans Shift)
    - _Requirements: 2.5, 2.6_
  - [x] 13.6 Créer `src/pages/ChatPage.tsx` : assemblage `MessageList` + `ChatInput`, `ConversationSidebar` (liste des conversations via `useQuery(['conversations'])`), chargement d'une conversation au clic, bandeau RGPD au premier chargement
    - _Requirements: 2.1, 2.11, 2.12, 7.5_
  - [ ]* 13.7 Écrire les tests unitaires pour `ChatPage` et `useChat`
    - Tester l'état vide (message de bienvenue)
    - Tester l'affichage d'erreur SSE et la réactivation de l'input
    - Tester la présence de la mention "Contenu généré par IA"
    - Tester la présence du bandeau RGPD
    - _Requirements: 2.7, 2.10, 7.5, 7.6_
  - [ ]* 13.8 Écrire le test de propriété P5 — Intercepteur JWT injecte le token
    - **Propriété 5 : Pour tout JWT présent et toute requête Axios, le header `Authorization: Bearer {token}` est présent. Sur 401, le token est supprimé**
    - **Valide : Requirements 1.9, 1.10**
    - Stratégie : `fc.string({ minLength: 10 })` tokens JWT
    - `// Feature: soul-echo-frontend, Property 5: JWT interceptor injects token on all requests`
  - [ ]* 13.9 Écrire le test de propriété P6 — Message utilisateur apparaît immédiatement
    - **Propriété 6 : Pour tout texte non vide envoyé via `sendMessage`, le message apparaît dans la liste avec le rôle `user` avant la réponse API**
    - **Valide : Requirements 2.2**
    - Stratégie : `fc.string({ minLength: 1 })` messages
    - `// Feature: soul-echo-frontend, Property 6: User message appears immediately in list`
  - [ ]* 13.10 Écrire le test de propriété P7 — Accumulation correcte des chunks SSE
    - **Propriété 7 : Pour tout stream de N chunks, le contenu final est égal à la concaténation ordonnée de tous les chunks avant `done`**
    - **Valide : Requirements 2.3**
    - Stratégie : `fc.array(fc.string(), { minLength: 1 })`
    - `// Feature: soul-echo-frontend, Property 7: SSE chunks accumulated in order`
  - [ ]* 13.11 Écrire le test de propriété P8 — Input désactivé pendant le streaming
    - **Propriété 8 : Pour tout état `isStreaming=true`, l'input et le bouton sont désactivés. Après `done`, `isStreaming=false` et l'input est réactivé**
    - **Valide : Requirements 2.5, 2.6**
    - Stratégie : `fc.boolean()` isStreaming state
    - `// Feature: soul-echo-frontend, Property 8: Input disabled during streaming`
  - [ ]* 13.12 Écrire le test de propriété P9 — conversation_id conservé après le premier échange
    - **Propriété 9 : Pour tout premier message, le `conversation_id` retourné dans `done` est conservé et réutilisé pour les messages suivants**
    - **Valide : Requirements 2.8**
    - Stratégie : `fc.integer({ min: 1 })` conversation_id
    - `// Feature: soul-echo-frontend, Property 9: conversation_id preserved after first exchange`

- [x] 14. Checkpoint final — Vérifier que tous les tests passent
  - S'assurer que tous les tests passent. Demander à l'utilisateur si des questions se posent.

- [x] 15. Intégration finale et vérification
  - [x] 15.1 Vérifier que `src/main.tsx` assemble correctement `QueryClientProvider`, `AuthProvider`, `RouterProvider` et `Toaster` (sonner)
    - Configurer `QueryClient` avec les `defaultOptions` (staleTime 30s, retry 2)
    - _Requirements: 7.3_
  - [x] 15.2 Vérifier que le bandeau RGPD est affiché au premier chargement (localStorage flag) et que la mention "Contenu généré par IA" est visible dans le chat
    - _Requirements: 7.5, 7.6_
  - [x] 15.3 Vérifier la responsivité sur 375px (mobile) et 1440px (desktop) pour `AppShell` et `ChatPage`
    - _Requirements: 6.7_
  - [ ]* 15.4 Écrire les tests unitaires finaux
    - Tester le rendu de `AuthPage` avec les deux formulaires
    - Tester la configuration `baseURL` depuis `VITE_API_BASE_URL`
    - Tester le staleTime ≥ 30s pour profil et tokens
    - _Requirements: 7.1, 7.3_

- [x] 16. Checkpoint final — Tous les tests passent
  - Lancer `npm run test` dans `app/Frontend`. S'assurer que tous les tests passent. Demander à l'utilisateur si des questions se posent.

## Notes

- Les tâches marquées `*` sont optionnelles et peuvent être sautées pour un MVP plus rapide
- Chaque tâche référence les requirements pour la traçabilité
- Les tests de propriétés utilisent `fast-check` avec `numRuns: 100` minimum
- Les tests unitaires utilisent Vitest + `@testing-library/react`
- Le streaming SSE utilise `fetch` natif (pas `EventSource`) pour supporter les headers `Authorization`
- Toutes les requêtes GET passent par TanStack Query, les mutations par `useMutation`
