# Tri Planner — Guide Claude Code

Application de planification triathlon : compétitions, plans d'entraînement, wellness, IA, Strava.

## Démarrage rapide

```powershell
# Backend (port 3001) — terminal 1
cd server && npm run dev

# Frontend (port 5173) — terminal 2
cd client && npm run dev
```

URL : http://localhost:5173  
Compte démo : `demo@triathlon-planner.fr` / `demo1234`

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS 4, TanStack Query, React Router 7 |
| Backend | Express 5, TypeScript, tsx (dev), Prisma 7, SQLite (better-sqlite3) |
| Auth | JWT (access 15min + refresh 7j via cookies httpOnly) |
| IA | Anthropic Claude (`claude-opus-4-8`) via `@anthropic-ai/sdk` |
| Intégrations | Strava OAuth 2.0 + API v3 |

## Architecture

```
TEST_Claude/
├── CLAUDE.md                    ← ce fichier
├── client/                      ← React app (Vite)
│   └── src/
│       ├── api/                 ← clients axios + types TS
│       ├── components/          ← composants réutilisables (ui/, competitions/, etc.)
│       ├── context/             ← AuthContext
│       ├── pages/               ← une page = une route
│       └── utils/               ← constants, formatDate, etc.
└── server/                      ← Express API
    ├── prisma/
    │   ├── schema.prisma        ← source de vérité du schéma BDD
    │   ├── seed.ts              ← templates de plans
    │   └── seed-demo.ts         ← compte démo avec données
    └── src/
        ├── config/              ← env.ts (variables), database.ts (Prisma client)
        ├── middleware/          ← auth.ts, validate.ts, errorHandler.ts
        └── modules/             ← un dossier par domaine métier
            ├── ai/              ← génération plans Claude API
            ├── auth/            ← register, login, refresh, logout
            ├── competitions/    ← CRUD compétitions
            ├── training-plans/  ← CRUD plans
            ├── training-sessions/ ← CRUD séances
            ├── calendar/        ← vue calendrier
            ├── statistics/      ← stats + ATL/CTL/TSB
            ├── wellness/        ← check-ins + alertes
            ├── strava/          ← OAuth + sync activités + compétitions
            ├── records/         ← records personnels
            ├── achievements/    ← badges
            ├── export/          ← JSON/CSV export + import
            └── admin/           ← admin panel
```

## Pattern module backend

Chaque module suit exactement ce pattern :
```
modules/mon-module/
├── mon-module.routes.ts    ← Router Express + middleware auth
├── mon-module.controller.ts ← handlers HTTP (req/res), pas de logique métier
├── mon-module.service.ts   ← logique métier + requêtes Prisma
└── mon-module.schema.ts    ← schémas Zod pour validation input
```

Enregistrer dans `src/app.ts` :
```typescript
import monModuleRoutes from './modules/mon-module/mon-module.routes.js'
app.use('/api/v1/mon-module', monModuleRoutes)
```

## Pattern page frontend

Chaque page dans `client/src/pages/` suit :
```typescript
// 1. useQuery pour les données
const { data, isLoading } = useQuery({
  queryKey: ['ma-resource'],
  queryFn: () => maApi.list().then(r => r.data),
})

// 2. Skeleton pendant le chargement
if (isLoading) return <SkeletonDashboard />

// 3. EmptyState si vide
if (!data?.length) return <EmptyState variant="..." />

// 4. Composants Card avec dark mode
return <Card animate><CardHeader>...</CardHeader><CardContent>...</CardContent></Card>
```

## Base de données

```powershell
# ✅ Modifier le schéma
npx prisma db push          # dans server/ — applique sans détruire

# ❌ NE JAMAIS utiliser
npx prisma migrate dev      # détruit les données !

# Utilitaires
npm run db:studio           # Prisma Studio (GUI)
npm run db:seed:demo        # recrée le compte démo
npm run db:check            # vérifie l'état
```

**Règle absolue** : toujours utiliser `db push`, jamais `migrate dev`.

## Variables d'environnement (server/.env)

```env
DATABASE_URL="file:./dev.db"
ACCESS_TOKEN_SECRET="dev-access-secret-change-in-production"
REFRESH_TOKEN_SECRET="dev-refresh-secret-change-in-production"
PORT=3001
NODE_ENV=development

# IA Claude (optionnel — console.anthropic.com)
ANTHROPIC_API_KEY=sk-ant-...

# Strava (optionnel — strava.com/settings/api)
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
STRAVA_REDIRECT_URI=http://localhost:3001/api/v1/strava/callback
```

Sans `ANTHROPIC_API_KEY`, l'app fonctionne normalement (section IA masquée avec message explicatif).  
Sans Strava, les boutons de connexion sont désactivés.

## Conventions de code

### TypeScript
- **Pas de `any` implicite** — typer ou utiliser `unknown`
- **Imports avec `.js`** côté serveur (ESM) : `import foo from './foo.js'`
- **Pas de `require()`** — tout en ESM (`import`)

### React
- **Dark mode** : toujours ajouter les variantes `dark:` sur les classes Tailwind
  ```
  bg-white dark:bg-slate-800
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-slate-700
  ```
- **Couleurs sport** (depuis `utils/constants.ts`) :
  - swim → cyan-500, bike → green-500, run → orange-500, strength → purple-500
- **Animations** : `animate-fade-in` sur les pages, `animate-scale-in` sur les modales

### API client
Les clients API vivent dans `client/src/api/`. Tous utilisent axios via `./client` (base `/api/v1`).
```typescript
export const monApi = {
  list: () => api.get<MonType[]>('/mon-endpoint'),
  create: (data: CreateInput) => api.post<MonType>('/mon-endpoint', data),
}
```

### Validation serveur
Utiliser Zod + le middleware `validate()` :
```typescript
import { z } from 'zod'
export const createSchema = z.object({ name: z.string().min(1) })
router.post('/', validate(createSchema), controller.create)
```

## Tests

```powershell
# Vérification TypeScript (les deux projets)
cd server; npx tsc --noEmit
cd client; npx tsc --noEmit

# Tests unitaires
cd server; npm test
cd client; npm test

# Tests E2E Playwright
cd client; npm run e2e
```

## Fonctionnalités actuelles

| Feature | État | Notes |
|---------|------|-------|
| Auth JWT | ✅ | register/login/refresh/logout + rate limiting |
| Compétitions CRUD | ✅ | avec checklist équipement |
| Plans d'entraînement | ✅ | génération auto + IA Claude |
| Calendrier | ✅ | FullCalendar avec drag & drop |
| Statistiques | ✅ | ATL/CTL/TSB + corrélation wellness |
| Wellness | ✅ | check-ins + alertes tendance |
| Strava OAuth | ✅ | sync séances + sync compétitions |
| IA Claude — Génération plans | ✅ | avec contexte Strava |
| IA Claude — Analyse résultats | ✅ | POST /ai/analyze-competition |
| IA Claude — Coach Chat | ✅ | streaming SSE, contexte complet |
| Race Day Dashboard | ✅ | countdown, splits cibles, checklist |
| Notifications Push | ✅ | cron 08h00, email rappels |
| Partage Social Plans | ✅ | liens publics, galerie /discover |
| Objectifs de Saison | ✅ | CRUD goals, progression temps réel |
| Records | ✅ | records personnels par sport |
| Achievements | ✅ | système de badges |
| Export | ✅ | JSON + CSV |
| Admin | ✅ | panel administration |
| Dark mode | ✅ | TailwindCSS dark: + localStorage |
| Design System | 🔲 | tokens, composants unifiés, landing page |
| PWA / Mobile | 🔲 | manifest, service worker, offline |
| Déploiement | 🔲 | Docker, CI/CD, hébergement |
| Sécurité renforcée | 🔲 | helmet, rate limiting IA, logs |
| Onboarding | 🔲 | wizard inscription, profil utilisateur |
| Tests E2E | 🔲 | Playwright auth + compétitions + plans |

## Modèle de données clés

```
User → TrainingPlan → TrainingSession
     → Competition  ← PlanCompetition ← TrainingPlan
     → WellnessLog
     → StravaConnection
     → PersonalRecord
     → UserAchievement
```

## IA — Anthropic SDK

```typescript
import Anthropic from '@anthropic-ai/sdk'
const client = new Anthropic({ apiKey })

// Streaming avec adaptive thinking (obligatoire pour claude-opus-4-8)
const stream = client.messages.stream({
  model: 'claude-opus-4-8',
  max_tokens: 16000,
  thinking: { type: 'adaptive' },  // PAS de temperature avec ce modèle
  system: systemPrompt,
  messages: [{ role: 'user', content: userPrompt }],
})
const message = await stream.finalMessage()
const text = message.content.find(b => b.type === 'text')?.text ?? ''
```

**Ne pas utiliser** `temperature`, `top_p`, `top_k` avec claude-opus-4-8 (erreur 400).

## Commandes slash disponibles

- `/new-module` — scaffolde un nouveau module backend
- `/new-page` — scaffolde une nouvelle page frontend
- `/db-query` — inspecte la base SQLite via MCP
- `/check-types` — vérifie TypeScript sur les deux projets
- `/seed-demo` — recrée le compte démo

---

## Roadmap produit — Features livrées

| Feature | Statut |
|---------|--------|
| Coach IA Chat | ✅ |
| Race Day Dashboard | ✅ |
| Notifications Push | ✅ |
| Partage Social Plans | ✅ |
| Objectifs de Saison | ✅ |
| Analyse IA résultats compétition | ✅ |

---

## Backlog Déploiement Production

> **Comment utiliser ce backlog avec des agents parallèles :**  
> Chaque bloc `Agent X —` peut être confié à un agent Claude Code indépendant simultanément.  
> Les blocs marqués `⚠️ Prérequis` doivent être complétés avant les autres dans leur groupe.  
> Convention de marquage : `[ ]` à faire · `[x]` fait · `[~]` en cours.

---

### GROUPE 1 — Design System (Agent DESIGN)

> Responsabilité : cohérence visuelle, tokens, composants, accessibilité.  
> Fichiers : `client/src/`, `client/index.css`, nouveaux fichiers dans `client/src/design/`.  
> Indépendant des autres groupes — peut démarrer immédiatement.

- [ ] **D1** — Créer `client/src/design/tokens.ts` : exporter toutes les couleurs, spacing, border-radius, shadows en constantes TypeScript (évite les classes Tailwind hardcodées éparpillées)
- [ ] **D2** — Audit composants UI existants (`Skeleton`, `EmptyState`, `Toast`, `ProgressBar`, `Autocomplete`) : uniformiser les props, ajouter JSDoc minimal, vérifier dark mode complet
- [ ] **D3** — Créer `client/src/components/ui/Badge.tsx` : variantes `sport` (swim/bike/run/strength), `status` (planned/completed/cancelled), `priority` (A/B/C) — remplacer les spans inline éparpillés
- [ ] **D4** — Créer `client/src/components/ui/StatCard.tsx` : card statistique réutilisable (valeur + label + icône + tendance ↑↓) — unifier Dashboard et Statistics
- [ ] **D5** — Responsive audit mobile : tester toutes les pages à 375px (iPhone SE), corriger les débordements horizontaux (principalement les tableaux et les grilles)
- [ ] **D6** — Accessibilité WCAG AA : ajouter `aria-label` sur les boutons icône, `role="alert"` sur les toasts, contraste suffisant sur les badges colorés
- [ ] **D7** — Micro-interactions : hover states sur les cards compétition (légère élévation `hover:shadow-md`), transitions sur les toggles dark mode, feedback tactile sur les boutons d'action primaires
- [ ] **D8** — Page 404 : `client/src/pages/NotFoundPage.tsx` avec illustration SVG triathlon + lien retour dashboard
- [ ] **D9** — Landing page publique `client/src/pages/LandingPage.tsx` : route `/` si non authentifié, sections Hero + Features + CTA inscription. Hero : titre accrocheur, screenshot app, bouton "Commencer gratuitement". Features : 6 cards (IA coach, Strava, Compétitions, Wellness, Stats, Partage). Dark mode natif.
- [ ] **D10** — Favicon et meta tags : `client/index.html` → title "TriPlanner", description, og:image, manifest PWA basique

---

### GROUPE 2 — Infrastructure & Déploiement (Agent DEPLOY)

> Responsabilité : conteneurisation, CI/CD, hosting.  
> Fichiers : racine du projet, nouveaux fichiers Docker/GitHub Actions.  
> ⚠️ Prérequis : décider de l'hébergeur (Railway / Render / VPS) avant D3.

- [ ] **D1** — `Dockerfile` multi-stage pour le backend :
  ```dockerfile
  # Stage build : compile TypeScript
  FROM node:22-alpine AS build
  WORKDIR /app
  COPY server/package*.json ./
  RUN npm ci
  COPY server/ .
  RUN npm run build
  
  # Stage prod : node minimal
  FROM node:22-alpine
  WORKDIR /app
  COPY --from=build /app/dist ./dist
  COPY --from=build /app/node_modules ./node_modules
  COPY server/prisma ./prisma
  CMD ["node", "dist/index.js"]
  ```
- [ ] **D2** — `client/` build statique : `npm run build` → dossier `dist/` servi par le backend Express (`express.static`) ou un CDN séparé
- [ ] **D3** — `docker-compose.yml` pour dev local avec volumes (hot-reload), et `docker-compose.prod.yml` minimal
- [ ] **D4** — `.github/workflows/ci.yml` : sur push `main` → `npx tsc --noEmit` server + client, puis `npm test` si tests présents
- [ ] **D5** — `.github/workflows/deploy.yml` : sur tag `v*.*.*` → build Docker → push registry → deploy (adapter selon hébergeur choisi)
- [ ] **D6** — Variables d'environnement production : documenter dans `server/.env.example` toutes les vars requises avec valeurs par défaut sécurisées. Ajouter `CORS_ORIGIN`, `COOKIE_SECURE=true`, `NODE_ENV=production`
- [ ] **D7** — Script migration prod : `package.json` → `"start": "npx prisma db push && node dist/index.js"` (db push idempotent, sûr en prod avec SQLite)
- [ ] **D8** — Health check endpoint : `GET /api/v1/health` → `{ status: 'ok', version, uptime, db: 'connected' }` — utilisé par les load balancers

---

### GROUPE 3 — Performance & PWA (Agent PERF)

> Responsabilité : vitesse, offline, installabilité.  
> Fichiers : `client/` uniquement.  
> Indépendant — peut démarrer en parallèle du Groupe 2.

- [ ] **P1** — PWA manifest : `client/public/manifest.json` avec `name`, `short_name`, `icons` (192x192 + 512x512), `theme_color: #7c3aed`, `background_color`, `display: standalone`, `start_url: /`
- [ ] **P2** — Service Worker basique (Vite PWA plugin) : `npm install -D vite-plugin-pwa` → cache des assets statiques, page offline fallback
- [ ] **P3** — Lazy loading des pages : wrapper les imports de pages avec `React.lazy()` + `<Suspense>` dans `App.tsx` — réduit le bundle initial de ~40%
- [ ] **P4** — Optimisation images : compresser les éventuelles images, utiliser `loading="lazy"` sur les images non-critiques (avatars Strava)
- [ ] **P5** — TanStack Query stale time : revoir les `staleTime` par route (dashboard: 30s, statistiques: 5min, compétitions: 1min) pour réduire les requêtes inutiles
- [ ] **P6** — Vite bundle analysis : `npm run build -- --report` → identifier les dépendances lourdes (FullCalendar fait ~400kb), évaluer si tree-shaking suffisant

---

### GROUPE 4 — Sécurité & Monitoring (Agent SECURITY)

> Responsabilité : headers sécurité, rate limiting, error tracking, logs.  
> Fichiers : `server/src/` uniquement.  
> Indépendant — peut démarrer immédiatement.

- [ ] **S1** — Headers de sécurité : installer `helmet` → `npm install helmet` dans `server/`, puis `app.use(helmet())` dans `app.ts`. Vérifier la CSP n'est pas trop restrictive pour les fonts/inline styles Tailwind
- [ ] **S2** — Rate limiting renforcé : étendre le `authLimiter` (déjà en place) à tous les endpoints IA (`/api/v1/ai/*` → 10 req/min par user) pour limiter les coûts Claude
- [ ] **S3** — Logs structurés : installer `pino` → `npm install pino pino-http`, remplacer les `console.log` par `logger.info/error`, format JSON pour prod
- [ ] **S4** — Error tracking : intégrer Sentry (`npm install @sentry/node`) dans `server/src/index.ts` avec `SENTRY_DSN` optionnel dans `.env`. En dev : log console. En prod : Sentry
- [ ] **S5** — Input sanitization : vérifier que toutes les routes `POST/PATCH` passent bien par le middleware `validate()` Zod — auditer `modules/*/` pour les routes sans validation
- [ ] **S6** — Rotation tokens : vérifier que le refresh token est bien invalidé en base lors du logout. Ajouter `RefreshToken` table si pas encore fait (actuellement le token est stateless)

---

### GROUPE 5 — Onboarding & Rétention (Agent PRODUCT)

> Responsabilité : première expérience utilisateur, engagement.  
> Fichiers : `client/src/pages/`, `client/src/components/`.  
> Indépendant — peut démarrer immédiatement.

- [ ] **O1** — Flow onboarding post-inscription : après register, rediriger vers `/onboarding` (page wizard 3 étapes) : 1/ Profil athlète (niveau, sports pratiqués) 2/ Première compétition 3/ Connexion Strava (optionnelle). Skip possible à chaque étape. Stocker en `UserProfile` (nouveau modèle Prisma minimal : `level`, `sports`, `onboardingDone`)
- [ ] **O2** — Tooltip "premier usage" : si `competitions.length === 0` → afficher une bulle `Nouveau` sur le bouton "Ajouter une compétition" pendant 7 jours
- [ ] **O3** — Page profil utilisateur : `client/src/pages/ProfilePage.tsx` à `/profile` — avatar Strava si connecté, stats globales (compétitions terminées, km total, records), formulaire édition nom/email
- [ ] **O4** — Système de streak : afficher le streak d'entraînement sur le dashboard (déjà calculé dans statistics) + notification si streak > 7 jours
- [ ] **O5** — Email bienvenue : dans `auth.service.ts` après register réussi, envoyer un email de bienvenue avec le lien de la démo (via nodemailer déjà configuré, console.log si dev)

---

### GROUPE 6 — Tests & Qualité (Agent TEST)

> Responsabilité : couverture tests, E2E, CI green.  
> Fichiers : `server/src/`, `client/src/`, nouveaux fichiers `*.test.ts`.  
> ⚠️ Prérequis : les Groupes 1-5 doivent être stables avant de figer les tests E2E.

- [ ] **T1** — Tests unitaires backend (Vitest) : `statistics.service.test.ts` → tester `getTrainingLoad` avec données fixes, vérifier ATL/CTL/TSB calculés correctement
- [ ] **T2** — Tests unitaires backend : `wellness.service.test.ts` → tester `getTrendAlerts` avec 3 cas (readiness < 50 × 3 jours, < 30 aujourd'hui, normal)
- [ ] **T3** — Tests E2E Playwright (déjà configuré) : scénario `auth.spec.ts` → register → login → logout. Scénario `competition.spec.ts` → créer → voir → supprimer
- [ ] **T4** — Test E2E `training-plan.spec.ts` → créer plan manuel → vérifier séances dans calendrier
- [ ] **T5** — Coverage report : configurer `vitest --coverage` dans `server/package.json`, target 60% sur les services

---

---

### GROUPE 7 — Nouvelles Features UX · Workflow Claude Design

> **Workflow** : chaque feature passe d'abord par **Claude Design** (`claude.ai/design`) pour prototyper l'UI avant de coder.  
> Étapes : `Claude Design → export HTML → review → implémentation agents → /design-sync`.  
> Les agents A (Design), B (Backend), C (Frontend) sont indépendants — lancer en parallèle après validation du prototype.

---

#### [P6] Onboarding Wizard
Spec : `specs/onboarding-wizard.md`  
**Valeur** : réduit le time-to-value d'un nouvel utilisateur (premier plan créé < 3 minutes).

- [ ] **DESIGN** — Ouvrir `claude.ai/design`, décrire : *"Wizard d'onboarding 4 étapes pour une app triathlon. Style card centrée, barre de progression, illustrations SVG minimalistes par étape, gradient bleu. Slide horizontal entre étapes."* → exporter HTML → valider avec l'équipe
- [ ] **BDD** — Ajouter sur `User` dans `schema.prisma` : `onboardingCompleted Boolean @default(false)`, `level String?`, `weeklyHoursAvailable Int?` → `npx prisma db push`
- [ ] **B1** — Endpoint `PATCH /api/v1/auth/onboarding` dans `auth.service.ts` : transaction Prisma créant Competition + TrainingPlan + mettant `onboardingCompleted = true`
- [ ] **C1** — `client/src/pages/OnboardingPage.tsx` : wizard 4 étapes (`StepProfile`, `StepGoal`, `StepAvailability`, `StepConnect`), `useState<number>(0)` pour l'étape courante, `animate-scale-in` entre étapes
- [ ] **C2** — `client/src/components/onboarding/` : 4 composants d'étape, boutons Précédent/Suivant/Passer
- [ ] **INT** — `ProtectedRoute.tsx` : si `!user.onboardingCompleted` → redirect `/onboarding`. Supprimer `O1` du Groupe 5 (remplacé par cette spec plus complète)

---

#### [P7] Rapport de Performance PDF
Spec : `specs/performance-report.md`  
**Valeur** : partage de la progression annuelle, motivation, différenciateur vs concurrents.

- [ ] **DESIGN** — Ouvrir `claude.ai/design`, décrire : *"Rapport PDF 8 pages style rapport annuel sportif. Page couverture avec dégradé, sections statistiques avec graphes SVG, palette triathlon (bleu/cyan/orange/vert), typographie Inter. Référence visuelle : rapport Strava annual."* → exporter HTML
- [ ] **B1** — Installer `puppeteer` dans `server/` : `npm install puppeteer`
- [ ] **B2** — `export.service.ts` : ajouter `generatePerformanceReport(userId, period)` — agrège stats + compétitions + wellness + records, appelle Claude pour les textes narratifs, injecte dans template HTML, génère PDF via puppeteer
- [ ] **B3** — `POST /api/v1/export/performance-report` dans `export.routes.ts` : body `{ period: 'month'|'quarter'|'year'|'12months' }`, répond avec buffer PDF (`Content-Type: application/pdf`)
- [ ] **C1** — `client/src/api/export.api.ts` : ajouter `generateReport(period)` → `api.post('/export/performance-report', {period}, { responseType: 'blob' })`
- [ ] **C2** — Section dans `ExportPage.tsx` ou `StatisticsPage.tsx` : select période + bouton "Générer rapport PDF" + skeleton 10s + `URL.createObjectURL(blob)` pour ouvrir le PDF

---

#### [P8] Planificateur Nutrition Race-Day
Spec : `specs/nutrition-race-day.md`  
**Valeur** : feature unique "race morning" — différenciateur fort, usage le jour J.

- [ ] **DESIGN** — Ouvrir `claude.ai/design`, décrire : *"Timeline verticale de nutrition pour triathlon. Segments colorés par discipline (cyan natation, vert vélo, orange course). Icônes produits alimentaires (eau, gel, barre). Compact, mobile-first. Toggle vue détaillée / synthèse."* → exporter HTML → valider design avec `/design-sync`
- [ ] **C1** — `client/src/utils/nutrition.ts` : fonctions pures de calcul (hydratation, glucides, timeline) — TypeScript strict, testable
- [ ] **C2** — `client/src/components/race-day/NutritionPlanner.tsx` : formulaire (poids, température, intensité, produits) + timeline générée dynamiquement + bouton Copier + bouton Imprimer
- [ ] **INT** — Importer `<NutritionPlanner>` dans `RaceDayPage.tsx` comme section 5 (après la checklist)

---

### Workflow Claude Design — Guide équipe

```
1. DESIGN (PM ou Designer)
   └─ Ouvrir claude.ai/design
   └─ Décrire l'interface en langage naturel
   └─ Itérer sur le prototype (chat + commentaires inline)
   └─ Exporter → HTML autonome

2. REVIEW (équipe)
   └─ Valider le prototype HTML en browser
   └─ Annoter les retours dans Claude Design (commentaires)
   └─ Valider ou itérer

3. IMPLÉMENTATION (agents parallèles)
   └─ Agent DESIGN → traduit le prototype en composants React + classes Tailwind
   └─ Agent BACKEND → implémente les endpoints nécessaires
   └─ Agent DATA → prépare les données seed pour tester

4. SYNC (Claude Code)
   └─ /design-sync → maintient le composant React synchronisé avec le prototype Claude Design
   └─ Tout changement design se propage automatiquement
```

**Règle équipe** : aucune nouvelle page ou composant complexe sans prototype Claude Design validé d'abord.  
**Exception** : corrections de bugs, ajustements mineurs de composants existants.

---

### Ordre de lancement recommandé

```
Semaine 1 — Lancer en parallèle :
  Agent DESIGN    → Groupe 1 (D1 à D8)
  Agent SECURITY  → Groupe 4 (S1 à S6)
  Agent PRODUCT   → Groupe 5 (O2, O3, O4, O5)
  Claude Design   → Prototypes P6 / P7 / P8 (validation avant code)

Semaine 2 — Lancer en parallèle :
  Agent DESIGN    → Groupe 1 (D9 Landing + D10 meta)
  Agent DEPLOY    → Groupe 2 (D1 à D6)
  Agent PERF      → Groupe 3 (P1 à P6)
  Agents P6/P7/P8 → Groupe 7 (après validation prototypes Claude Design)

Semaine 3 — Intégration :
  Agent TEST      → Groupe 6 (quand tout est stable)
  Agent DEPLOY    → Groupe 2 (D7, D8 + déploiement effectif)
```
