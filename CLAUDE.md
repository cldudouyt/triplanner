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

---

## Specs visuelles pixel-perfect — référence maquettes

> Source vérité : `C:\Users\cldud\Downloads\wizard-onboarding-v2-new\exports\` (14 PNG).  
> Ces specs sont **prioritaires** sur toute autre documentation. Toute implémentation doit les respecter exactement.

---

### Sidebar — commune (toutes pages sauf modes Club)

```
Largeur : 230px, fond blanc dark:bg-slate-900, bordure droite border-gray-100 dark:border-slate-800

┌─ LOGO ──────────────────────────────────────────────────────────────┐
│  [M]  Tri Planner           ← font-bold text-sm text-gray-900       │
│       Triathlon Club Nantais ← text-xs text-gray-400                │
│  "M" = w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400        │
│         to-orange-600 text-white font-bold text-sm                  │
└─────────────────────────────────────────────────────────────────────┘

NAV ITEMS (px-3 py-2 rounded-xl, gap-3) :
  Icon pill = w-[30px] h-[30px] rounded-[9px]
  ACTIF   : pill bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md
            label font-medium text-gray-900 dark:text-gray-100
            row bg-orange-50 dark:bg-orange-900/20
  INACTIF : pill bg-gray-100 dark:bg-slate-800 text-gray-400
            label text-gray-500 dark:text-gray-400

  LayoutDashboard  → Tableau de bord
  ClipboardList    → Mon plan
  Calendar         → Calendrier
  Trophy           → Compétitions
  BarChart3        → Statistiques
  Users            → Espace club · IA
  MessageSquare    → Messages  [badge orange si unread > 0]

Badge unread : w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-semibold

┌─ WIDGET COMPÉTITION A ──────────────────────────────────────────────┐
│  Triathlon de Nantes          ← font-semibold text-sm text-gray-900 │
│  Objectif A · dans 24 jours   ← text-xs text-gray-500              │
│  [████████░░] barre orange h-1.5 rounded-full                       │
│  Prépa semaine 6 / 12         ← text-xs text-gray-400               │
│                                                                      │
│  Style : rounded-2xl p-3 mx-3 mb-3                                  │
│  background : linear-gradient(150deg,rgba(249,115,22,.10),          │
│               rgba(249,115,22,.04))                                  │
│  border : 1px solid rgba(249,115,22,.18)                            │
│  Masqué si pas de compétition priority=A à venir                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Sidebar — Espace Coach (`/club/coach`)

```
Remplace complètement la sidebar normale.
PAS de widget compétition en bas.

En-tête sidebar :
  Logo habituel (M pill + Tri Planner + Triathlon Club Nantais)
  Juste en-dessous :
    bg-orange-50 rounded-xl px-3 py-2 mx-2 mb-2
    "● Connecté · Coach" — dot bg-orange-500 animate-dot + label text-sm font-semibold text-orange-700

Items (même pattern que sidebar normale avec pills) :
  LayoutDashboard  → Tableau de bord
  Users            → Mon groupe          [ACTIF sur /club/coach]
  ClipboardList    → Plans & assignations
  Calendar         → Calendrier
  Trophy           → Compétitions
  MessageSquare    → Messages
```

### Sidebar — Aperçu athlète (`/club/athlete`)

```
Remplace complètement la sidebar normale.
PAS de widget compétition en bas.

En-tête sidebar : identique à "Espace Coach" (même "● Connecté · Coach" en orange)

Items :
  LayoutDashboard  → Tableau de bord
  Users            → Mes coéquipiers     [ACTIF sur /club/athlete]
  ClipboardList    → Mon plan
  Calendar         → Calendrier
  Trophy           → Compétitions
  MessageSquare    → Messages
```

### Header de page — pattern commun

```tsx
// Toutes les pages sauf Club (qui a son propre toggle)
// Ordre : Search | Settings | Bell (avec dot orange si notifications) | + Séance
<div className="flex items-start justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{titre}</h1>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{sous-titre}</p>
  </div>
  <div className="flex items-center gap-3">
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input placeholder="Rechercher une séance..." className="pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-500 focus:outline-none w-52" />
    </div>
    {/* Settings icon (⚙) — ouvre /settings */}
    <button className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800">
      <Settings className="w-4 h-4" />
    </button>
    {/* Bell icon avec dot orange si unread notifications */}
    <button className="relative p-2 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800"
            onClick={openNotifications}>
      <Bell className="w-4 h-4" />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-500" />
      )}
    </button>
    <button className="flex items-center gap-2 bg-gradient-to-br from-orange-400 to-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all">
      <Plus className="w-4 h-4" /> Séance
    </button>
  </div>
</div>
```

---

### 1 — Tableau de bord (`/dashboard`)

**Fichier :** `client/src/pages/DashboardPage.tsx`

```
Header :
  h1 = "Bonjour, {prénom} 👋"
  sous-titre = "{jour DD mois} · Semaine {N} / {total} — Prépa {nom compétition A}"
  CTA = "+ Séance"

4 StatCards (grid grid-cols-4 gap-4, mb-6) :
  Chaque card = bg-white rounded-2xl border border-gray-100 p-5

  [1] Fitness (CTL)
      icon-pill : bg-orange-100 dark:bg-orange-900/30, icône Sparkles text-orange-500, taille 34x34 rounded-[10px]
      delta top-right : "↑ {delta}" text-xs font-medium text-emerald-600
      label : "Fitness (CTL)" text-xs font-semibold uppercase tracking-wide text-gray-400
      valeur : "{ctl}" text-[25px] font-extrabold text-gray-900 + " TSS/j" text-sm text-gray-400

  [2] Volume
      icon-pill : bg-cyan-100 dark:bg-cyan-900/30, icône Clock text-cyan-500
      delta : "↑ 1h12" text-emerald-600
      label : "Volume"
      valeur : "9h32" (format h:mm)

  [3] Séances
      icon-pill : bg-teal-100, icône CheckCircle2 text-teal-500
      badge top-right (PAS delta) : pill "cette sem." bg-gray-100 text-gray-500 text-[10px] px-2 py-0.5 rounded-full
      label : "Séances"
      valeur : "5 / 6"

  [4] Forme (TSB)
      icon-pill : bg-rose-100, icône Heart text-rose-400
      badge top-right : pill "frais" bg-emerald-50 text-emerald-600 text-[10px] (affiché si TSB > 5)
      label : "Forme (TSB)"
      valeur : "+12" (avec signe + si positif, couleur rouge si très négatif)

Layout 2 colonnes (grid-cols-3 gap-5) :
  Col 1 (lg:col-span-2) — "Charge d'entraînement"
    Titre + légende inline : "● CTL" orange "● ATL" cyan "● TSB" emerald
    Sous-titre : "42 derniers jours · TSS quotidien"
    Recharts AreaChart, 3 lignes, aire sous CTL en orange/10%
    X-axis : dates | Y-axis : valeurs TSS

  Col 2 (lg:col-span-1) — "Objectifs"
    Header : "Objectifs" + lien "Voir tout →" text-orange-600 text-xs
    Items verticaux :
      Chaque item :
        nom (font-medium text-sm) + pct% (text-sm font-bold text-right)
        barre ProgressBar h-1.5 rounded-full (couleur selon type)
        détail text-xs text-gray-400 ("3,4 / 5 km cette semaine")
    Exemple items dans maquette :
      "Prépa Tri de Nantes Sem. 6/12" — barre orange — "Volume hebdo : 11h cible"
      "Natation — technique 68%" — barre cyan
      "Seuil course 85%" — barre orange
```

---

### 2 — Mon Plan (`/training-plans`)

**Fichier :** `client/src/pages/TrainingPlansPage.tsx`

```
Header :
  h1 = "Mon plan"
  sous-titre = "Semaine {N} / {total} · optimisé par le coach et l'IA"
  CTA = "+ Séance"

BANNER COACH (affiché si coachPlan.status === 'sent') :
  Container : rounded-2xl p-6 mb-6 overflow-hidden relative
  Background : linear-gradient(135deg, #FB923C 0%, #F97316 52%, #EA580C 100%)
  Box-shadow : 0 22px 54px -26px rgba(234,88,12,.6)
  Décoration : div absolue -top-16 -right-8 w-56 h-56 rounded-full bg-white/10

  Ligne 1 (badges) :
    "✦ Optimisé par IA" — pill bg-white/25 text-white text-xs font-semibold px-3 py-1 rounded-full
    "↔ Prépa physique incluse" — même style
    "Reçu il y a 2h" — ml-auto text-xs text-white/60

  Ligne 2 :
    h2 = "Plan du coach · Semaine {N} / {total}" — text-2xl font-bold text-white
    Bouton : "✓ Accepter le plan" — bg-white text-orange-700 font-semibold px-5 py-2.5 rounded-xl

  Ligne 3 (citation coach) :
    Avatar "TM" = w-8 h-8 rounded-full bg-white/30 text-white text-xs font-bold
    Texte = text-sm text-white/90 italic « … »

LISTE SÉANCES (col gauche) :
  Header : "Cette semaine" font-semibold + "8h35 tri · 1h prépa" text-xs text-gray-500 right-aligned
  Chaque ligne :
    ┌──────────────────────────────────────────────────────┐
    │ LUN  ●  Natation           [IA]           1h00       │
    │ MAR  ●  Vélo                              1h55       │
    │ MER  ●  Natation           [IA]           1h00       │
    └──────────────────────────────────────────────────────┘
    "LUN/MAR/..." : text-xs font-bold text-gray-400 uppercase w-8
    "●" : w-2 h-2 rounded-full couleur sport
    Nom sport : text-sm font-medium text-gray-900
    Badge "IA" : text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700
    Durée : text-sm font-mono text-gray-500 ml-auto
    SÉLECTIONNÉ : border-l-[3px] border-orange-500, bg-orange-500/8

DÉTAIL SÉANCE (col droite) :
  En-tête : sport (colored) + badge "Aujourd'hui" orange pill + durée (text-2xl font-mono right)
  Sous-titre : "18 juin · VMA · 6×800" text-xs text-gray-500
  Badge intensité : pill bg-gray-100 text-gray-700 text-xs ("VMA · 95-100%")
  Blocs séance (bg-gray-50 rounded-xl p-4) :
    Titre bloc + durée bloc right + contenu text-xs text-gray-600
    Ex : "Échauffement 15 min" / "Footing souple + 4 lignes droites\nGammes..."
  Bouton : "Marquer comme faite" — bg orange gradient, full width, rounded-xl
```

---

### 3 — Calendrier (`/calendar`)

**Fichier :** `client/src/pages/CalendarPage.tsx`

```
IMPORTANT : FullCalendar SUPPRIMÉ. Grille CSS 7 colonnes custom.

Header :
  h1 = "Calendrier"
  sous-titre = "Planning d'entraînement · prépa Triathlon de Nantes"
  CTA = "+ Séance"

BARRE NAVIGATION SEMAINE :
  bg-white rounded-2xl border border-gray-200 px-5 py-3 mb-4
  [<]  15 – 21 juin 2026  [>]
  ChevronLeft/Right p-2 rounded-xl hover:bg-gray-100
  Date : font-semibold text-gray-900
  Badge semaine : "Semaine 6 / 12" bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium
  Volume : "Volume prévu : 11h10" text-sm font-semibold text-gray-900 (right-aligned)

SECTION "Courses à venir" (entre nav-semaine et grille) :
  Container : bg-white rounded-2xl border border-gray-100 p-4 mb-4
  Header (flex justify-between) :
    Trophy icon w-4 h-4 text-orange-500 + "Courses à venir" text-sm font-semibold text-gray-900
    "Toutes les compétitions →" text-xs text-orange-600 hover:underline → navigate('/competitions')

  Scroll horizontal de cards (flex gap-3 overflow-x-auto pb-1) :
    Chaque card = rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer
      hover:-translate-y-0.5 hover:shadow-md transition-all flex-none

    PRIORITÉ A (rouge) : background linear-gradient(135deg,#EF4444,#DC2626)
    PRIORITÉ B (orange) : background linear-gradient(135deg,#FB923C,#EA580C)
    PRIORITÉ C (slate) : background linear-gradient(135deg,#334155,#1E293B)

    Contenu :
      Badge J- : "J-{N}" bg-white/25 rounded-lg px-2 py-1 text-xs font-bold text-white min-w-[3rem] text-center
      Séparateur vertical : w-px h-8 bg-white/20
      Nom + détail :
        Nom compétition : text-sm font-semibold text-white leading-tight
        Détail : "{date abrégée} · {format} · {ville}" text-[11px] text-white/70

    Cards dans maquette :
      J-12 slate  : "Tri Sprint de Vertou"  · "02 juil · Sprint · Vertou"   [priorité C]
      J-58 orange : "Audencia La Baule"     · "12 sept · Half · La Baule"   [priorité B]
      J-24 rouge  : "Triathlon de Nantes"   · "19 oct · Olympique · Nantes" [priorité A]

GRILLE 7 COLONNES (grid grid-cols-7 gap-3) :
  Chaque colonne :
    En-tête : day abbr (text-xs font-semibold uppercase text-gray-400 tracking-wide)
              date number (text-lg font-bold, ORANGE si aujourd'hui)
    
    Cartes séances :
      rounded-xl p-3 cursor-pointer
      BORDURE GAUCHE 3px (border-l-[3px]) couleur sport :
        Natation  : border-cyan-500  bg-cyan-50  dark:bg-cyan-900/10  texte text-cyan-700
        Vélo      : border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 texte text-emerald-700
        Course    : border-orange-500 bg-orange-50 dark:bg-orange-900/10 texte text-orange-700
        Renfo/Mob : border-slate-300 bg-white dark:bg-slate-800 texte text-slate-500
      
      Contenu carte :
        Sport : text-xs font-semibold (couleur sport) [ligne 1]
        Desc  : text-[11px] text-gray-500 leading-tight [ligne 2 optionnel]
        Coach : text-[10px] text-gray-400 "(Julie B.)" [optionnel]
        Durée : text-xs font-mono font-semibold text-gray-700 [dernière ligne]
      
      HOVER : hover:-translate-y-0.5 hover:shadow-md transition-all
      
    Zone vide (si aucune séance) :
      h-20 rounded-xl border-2 border-dashed border-gray-100
      Plus icon w-4 h-4 text-gray-200 centré
      hover:border-orange-200
```

---

### 4 — Compétitions (`/competitions`)

**Fichier :** `client/src/pages/CompetitionsPage.tsx`

```
Header :
  h1 = "Compétitions"
  sous-titre = "Tes objectifs de saison et résultats"
  CTA = "+ Compétition" (PAS "+ Séance")

SECTION "Objectifs de saison" :
  h2 font-semibold mb-4

  3 cards gradient (grid grid-cols-3 gap-4) :

  OBJECTIF A (rouge) :
    background : linear-gradient(135deg, #EF4444 0%, #DC2626 100%)
    OBJECTIF B (orange) :
    background : linear-gradient(135deg, #FB923C 0%, #EA580C 100%)
    OBJECTIF C (slate) :
    background : linear-gradient(135deg, #334155 0%, #1E293B 100%)
  
  Structure chaque card (rounded-2xl p-5 overflow-hidden relative) :
    Décoration : div absolue -top-8 -right-8 w-32 h-32 rounded-full bg-white/10
    
    Ligne 1 (flex justify-between) :
      "OBJECTIF A/B/C" — text-[10px] font-bold uppercase tracking-widest text-white/60
      Badge J- :
        bg-white/25 rounded-lg px-2 py-1
        "J-{N}" — text-xs font-bold text-white
        date "19 OCT" — text-[10px] text-white/60 mt-0.5
    
    Nom compétition — text-xl font-bold text-white mb-1 (ex: "Triathlon de Nantes")
    Ville — text-sm text-white/70 mb-4 (ex: "Nantes, FR")
    
    Statut + format (flex items-center gap-2 mb-4) :
      Dot : w-2 h-2 rounded-full
        Inscrit → bg-emerald-400
        Planifié → bg-amber-400
        Dossard à venir → bg-gray-400
      Label statut — text-sm text-white
      "·" — text-white/40
      Format — text-sm text-white/70 (Olympique / Half / Sprint)
    
    Distances (grid grid-cols-3 gap-2 pt-3 border-t border-white/20) :
      NAT : dot cyan (#06B6D4) + valeur bold white + label text-[10px] white/50
      VÉLO : dot green (#10B981)
      C.À.P : dot orange (#F97316)

  Card vide (placeholder) :
    rounded-2xl border-2 border-dashed border-gray-200 min-h-[200px]
    flex items-center justify-center
    "+ Objectif A/B/C" text-sm text-gray-400
    clickable → open create modal

SECTION "Toutes les compétitions planifiées" :
  Header (flex justify-between mb-4) :
    h2 font-semibold text-gray-900
    "{N} courses · saison 2026" text-sm text-gray-400

  Table bg-white rounded-2xl border border-gray-100 overflow-hidden
  
  Headers : COURSE | DATE | FORMAT | ÉCHÉANCE | STATUT
    text-[11px] font-semibold uppercase tracking-wider text-gray-400 px-5 py-3

  Rows (toutes les compétitions de la saison, triées par date) :
    COURSE : petit avatar circulaire couleur priorité (w-8 h-8 rounded-full) + nom bold text-sm + sous-ligne date text-xs text-gray-400
    DATE : "{DD MMM YYYY}" text-sm text-gray-600
    FORMAT : "Sprint / Olympique / Half" capitalize text-sm text-gray-600
    ÉCHÉANCE : badge "J-{N}" — couleur selon priorité :
      A → bg-red-100 text-red-700
      B → bg-orange-100 text-orange-700
      C → bg-gray-100 text-gray-600
    STATUT : badge status — "● Inscrit" emerald / "● Planifié" amber / "● Dossard à venir" gray
    hover:bg-orange-50/30 transition-colors cursor-pointer
```

---

### 5 — Statistiques (`/statistics`)

**Fichier :** `client/src/pages/StatisticsPage.tsx`

```
Header :
  h1 = "Statistiques"
  sous-titre = "12 dernières semaines · toutes disciplines"
  CTA = "+ Séance"

4 STAT CARDS (grid grid-cols-4 gap-4 mb-6) :
  Style : bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5
  AUCUNE icône — 3 lignes seulement :
    label   : text-sm text-gray-500 dark:text-gray-400 mb-2
    valeur  : text-[28px] font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-none
    delta   : text-xs text-emerald-600 font-medium mt-2 (avec "↑")
  
  Valeurs dans maquette :
    Volume total / 118 h / ↑ 9% vs cycle préc.
    Distance / 1 240 km / ↑ 12%
    Séances / 68 / ↑ 4
    Dénivelé vélo / 9 850 m / ↑ 1 200 m

LAYOUT (grid grid-cols-3 gap-5) :

  Col 1-2 (lg:col-span-2) — "Volume hebdomadaire" :
    Légende inline : "● Nat." cyan · "● Vélo" emerald · "● C.À.P" orange
    Graphique stacked bar chart (Recharts BarChart) :
      X-axis : S1, S2, S3... (semaines)
      Barres empilées : swim (cyan-500), bike (emerald-500), run (orange-500)
      barSize=20, rounded top sur dernière barre du stack
    Hauteur : h-[220px]

  Col 3 — "Répartition" :
    Chaque sport (space-y-4) :
      Flex justify-between : "● Vélo" text-sm font-medium + "52%" text-sm font-bold
      Barre h-2 rounded-full bg-gray-100 → fill couleur sport à N%
      Détail : "61 h · sorties + home-trainer" text-xs text-gray-400 mt-1
    
    Sports dans maquette (dans cet ordre) :
      Vélo 52% — vert (#059669) — "61 h · sorties + home-trainer"
      Course à pied 30% — orange (#EA580C) — "35 h · 410 km"
      Natation 18% — cyan (#0891B2) — "22 h · 64 km"
```

---

### 6 — Messages (`/messages`)

**Fichier :** `client/src/pages/MessagesPage.tsx`

```
Header :
  h1 = "Messages"
  sous-titre = "Échanges avec ton coach et le club"
  CTA = "+ Séance" (visible mais secondaire)

LAYOUT SPLIT (grid grid-cols-[320px_1fr] gap-5, h-[calc(100vh-14rem)]) :

PANEL GAUCHE — "Messages" :
  bg-white rounded-2xl border border-gray-200
  Header : "Messages" font-semibold px-5 py-4 border-b
  
  Threads (div overflow-y-auto) :
    Chaque thread :
      flex items-start gap-3 px-4 py-3.5 border-b border-gray-50
      hover:bg-gray-50
      SÉLECTIONNÉ : bg-orange-50/60 (léger fond orangé)
      
      Avatar (w-10 h-10 rounded-full flex-none) :
        Initiales du contact (2 lettres)
        Couleur déterministe selon première lettre du nom :
          TM (Thomas Mercier) → orange gradient
          JB (Julie B.) → slate gray
          GR (Groupe) → teal/green
      
      Contenu :
        Ligne 1 : "Thomas Mercier" font-semibold text-sm + "2h" text-[11px] text-gray-400 right
        Ligne 2 : preview message text-xs text-gray-500 truncate
        Badge unread : w-5 h-5 rounded-full bg-orange-500 text-white text-[11px] font-bold
  
  Threads dans maquette :
    1. TM — Thomas Mercier — "2h" — "J'ai ajusté ta semaine, focus natation." [SÉLECTIONNÉ]
    2. JB — Julie B. · prépa — "hier" — "Renfo décalé au mardi, ok pour toi ?"
    3. GR — Groupe Half La Baule — "2j" — "Sofia : sortie longue dimanche ?"

PANEL DROIT — Conversation :
  bg-white rounded-2xl border border-gray-200 flex flex-col

  Header conversation :
    Avatar TM orange + "Thomas Mercier" font-semibold + "Coach · en ligne" text-xs text-emerald-600

  Messages (flex-1 overflow-y-auto px-5 py-4 space-y-3) :
    REÇU (justify-start) :
      Avatar contact w-7 h-7 rounded-full mr-2
      Bulle : bg-white dark:bg-slate-700 border border-gray-100 shadow-sm
              text-gray-900 text-sm px-4 py-2.5
              rounded-[18px] rounded-bl-[4px]
      Timestamp : text-[10px] text-gray-400 mt-1 pl-1
    
    ENVOYÉ (justify-end) :
      Bulle : bg-gradient-to-br from-orange-400 to-orange-600 text-white
              shadow-md shadow-orange-500/20 text-sm px-4 py-2.5
              rounded-[18px] rounded-br-[4px]
      Timestamp : text-[10px] text-gray-400/80 mt-1 pr-1 text-right
    
    Messages dans maquette :
      REÇU 09:12 : "Salut Léa ! Belle semaine dernière, tu progresses bien en natation 💪"
      ENVOYÉ 09:20 : "Merci coach ! Par contre les jambes étaient lourdes sur la VMA."

  Input (flex-none px-4 py-3 border-t) :
    Pill bg-gray-50 dark:bg-slate-700/50 rounded-xl px-4 py-2.5 flex items-center gap-2
    input placeholder "Écrire un message..." text-sm flex-1 bg-transparent focus:outline-none
    Bouton send : w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600
                  Send icon w-3.5 h-3.5 text-white
                  disabled:opacity-40
```

---

### 7 — Espace Coach (`/club/coach`)

**Fichier :** `client/src/pages/ClubCoachPage.tsx`

```
Sidebar : Espace Coach (voir spec sidebar Espace Coach ci-dessus)

Header :
  h1 = "Espace Coach"
  sous-titre = "Triathlon Club Nantais · 12 athlètes · saison 2026"
  TOGGLE top-right (PAS de search/bell/CTA) :
    Container : flex items-center gap-2
    Pill gauche "Espace coach" [ACTIF: bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-medium, icône Users w-4 h-4]
    Pill droite "Aperçu athlète" [INACTIF: bg-gray-100 text-gray-500 rounded-xl px-4 py-2 text-sm] → navigate('/club/athlete')
    Bouton exit → (ArrowRightFromLine icon) bg-gray-100 text-gray-400 p-2 rounded-xl → retour dashboard

3 STAT CARDS (grid grid-cols-3 gap-4 mb-6) :
  bg-white rounded-2xl border border-gray-100 p-5
  1. "Athlètes suivis" / valeur "12" text-3xl font-bold
  2. "Plans actifs" / valeur "9"
  3. "Séances faites · semaine" / valeur "84%" text-3xl font-bold text-emerald-600
     + sous-valeur "71 / 84" text-sm text-gray-400

LAYOUT (grid grid-cols-[1fr_320px] gap-5) :

COL GAUCHE — Roster :
  "Mon groupe" h2 font-semibold + "Trié par charge" text-xs text-gray-400

  Chaque athlète (button full-width, bg-white rounded-2xl border p-4) :
    [Avatar] [Infos] [CTL] [FORME] [Badge statut]
    
    Avatar : w-11 h-11 rounded-xl flex-none (initiales, gradient selon prénom)
    
    Infos :
      Nom : font-semibold text-gray-900
      Sous-texte : "{niveau} · {compétition} · J-{N}"
    
    CTL :
      "CTL" label text-[10px] font-bold uppercase text-gray-400
      valeur text-lg font-bold text-gray-900
    
    FORME :
      "FORME" label text-[10px] font-bold uppercase text-gray-400
      valeur text-lg font-bold
        positif → text-emerald-600
        négatif → text-red-500
    
    Badge statut (pill rounded-full px-3 py-1.5 text-xs font-medium) :
      "● Plan à valider" — bg-orange-100 text-orange-700, dot orange animate-dot
      "● Plan envoyé" — bg-emerald-100 text-emerald-700, dot emerald animate-dot
      "● À assigner" — bg-gray-100 text-gray-500, dot gray
    
    SÉLECTIONNÉ : border-orange-300 shadow-[0_14px_32px_-16px_rgba(234,88,12,.35)]
    HOVER : hover:-translate-y-0.5 hover:shadow-md
  
  Athlètes dans maquette :
    LF Léa Fontaine · Avancé · Triathlon de Nantes · J-24 · CTL 82 · FORME -5 · Plan à valider
    MP Marc Petit · Inter. · Tri Sprint de Vertou · J-12 · CTL 64 · FORME +8 · Plan envoyé
    SA Sofia Adler · Avancé · Half (Baud.) · J-50 · CTL 91 · FORME -2 · Plan envoyé

COL DROITE STICKY — "Assistant Plan IA" :
  Position : sticky top-4
  Style : rounded-2xl border p-5
  background : linear-gradient(165deg, rgba(249,115,22,.09), #FFFFFF 42%)
  border : rgba(249,115,22,.28)

  Header :
    Icon : w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600, Sparkles w-4 h-4 white
    "Assistant Plan IA" text-sm font-semibold
    "Coche les ajustements à appliquer" text-[11px] text-gray-500
  
  Card athlète sélectionné :
    bg-white rounded-xl p-3 border border-gray-100
    avatar + "Léa Fontaine" + "Triathlon de Nantes · forme -5"
  
  Suggestions (space-y-2) :
    Chaque suggestion (div cliquable) :
      Toggle switch : w-9 h-5 rounded-full (actif: bg orange gradient, inactif: bg-gray-200)
        thumb : w-4 h-4 bg-white rounded-full shadow, translate-x-0.5 ou translate-x-4
      Titre : text-xs font-semibold + badge delta (bg-orange-100 text-orange-700 text-[10px])
      Détail : text-[11px] text-gray-500
      ACTIF : bg rgba(249,115,22,.09) border-orange-200
    
    Suggestions dans maquette :
      "Prépa physique synchronisée" — Julie B. · 3 séances · 1h compte
      "Charge" (visible en bas)
  
  Textarea mot du coach :
    rows=3, placeholder "Ajoute un message pour l'athlète…"
    w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 resize-none
  
  Footer boutons :
    "Régénérer" — border button text-xs
    "Valider & envoyer · N ajust." — bg orange gradient text-white flex-1 text-sm
```

---

### 8 — Aperçu athlète (`/club/athlete`)

**Fichier :** `client/src/pages/ClubAthletePage.tsx`

```
Sidebar : Aperçu athlète (voir spec sidebar Aperçu athlète ci-dessus)

Header :
  h1 = "Aperçu — vue athlète"
  sous-titre = "Ce que reçoit {prénom athlète sélectionné} · prépa {nom compétition A}"
  TOGGLE top-right (identique Espace Coach, positions inversées) :
    Pill gauche "Espace coach" [INACTIF: bg-gray-100 text-gray-500] → navigate('/club/coach')
    Pill droite "Aperçu athlète" [ACTIF: bg-orange-500 text-white, icône Eye w-4 h-4]
    Bouton exit → (identique)

BANNER COACH : identique à Mon Plan (voir spec #2 ci-dessus)

SECTION "Ma semaine" :
  Titre : "Ma semaine" h2 font-semibold inline-flex
  Légende (inline à droite) : "● Natation ● Vélo ● Course ■ Prépa physique"
    text-xs text-gray-500, dots colored (cyan/emerald/orange/slate)

  GRILLE 7 COLONNES (grid grid-cols-7 gap-3) :
    Chaque colonne (flex flex-col gap-2) :
      En-tête :
        dot sport (w-2 h-2 rounded-full, couleur sport du jour principal)
        day abbr (text-xs uppercase text-gray-400)
      
      Carte séance principale :
        rounded-xl p-3 bg-white dark:bg-slate-800 border border-gray-100
        border-l-[3px] couleur sport
        Nom sport : text-sm font-semibold (couleur sport)
        Description : text-xs text-gray-500 leading-tight
        Durée : text-xs font-mono font-semibold text-gray-700 mt-1
        
        Badge "Ajusté IA" (si aiAdjusted) :
          inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-md
          background: rgba(249,115,22,.16)
          color: #C2410C
          texte: "✦ Ajusté IA"
      
      Pills prépa physique (en-dessous carte principale) :
        text-[10px] font-medium px-1.5 py-0.5 rounded-md
        bg-slate-100 dark:bg-slate-700 text-slate-500
        Exemples : "Renfo bas du corps 40'", "Mobilité 20'", "Gainage 20'"
      
      VEN repos :
        dot gray, "Repos / Mobilité / —", texte grisé, pas de border colorée
    
    Jours dans maquette :
      LUN : cyan · Natation · Technique · éducatifs · 1h00
      MAR : emerald · Vélo · Endurance Z2 · 1h30 + "Renfo bas du corps 40'" pill
      MER : cyan · Natation · Seuil · 8×100 · 1h00 [Ajusté IA]
      JEU : orange · Course · VMA · 6×800 · 0h50
      VEN : gray · Repos · Mobilité · — (grisé)
      SAM : emerald · Vélo · Sortie longue · 2h30 [Ajusté IA] + "Mobilité 20'" pill
      DIM : orange · Course · Endurance Z2 · 1h15 [Ajusté IA] + "Gainage 20'" pill
```

---

### 0 — Connexion (`/login`)

**Fichier :** `client/src/pages/LoginPage.tsx`

```
LAYOUT SPLIT (grid grid-cols-2, min-h-screen) :

PANEL GAUCHE (fond orange gradient) :
  background : linear-gradient(135deg, #FB923C 0%, #EA580C 100%)
  Logo row : pill "M" (w-10 h-10 rounded-xl bg-white/20 text-white font-bold) + "Tri Planner" font-bold text-white + "Triathlon Club Nantais" text-sm text-white/70
  Titre hero : text-4xl font-bold text-white leading-tight (3 lignes)
    "Ton triathlon, du premier longueur à la ligne d'arrivée."
  Sous-titre : text-sm text-white/80 max-w-xs
    "Entraînement, compétitions et planification réunis. Et quand tu t'entraînes en club, ton coach affine ton plan avec l'aide de l'IA."
  Features list (space-y-3 mt-8) :
    Chaque item : icon pill (bg-white/20 rounded-lg p-2) + label text-sm text-white
      ClipboardList → "Plan d'entraînement adaptatif"
      Trophy → "Compétitions & compte à rebours"
      BarChart3 → "Suivi des 3 disciplines + stats"

PANEL DROIT (fond blanc) :
  bg-white flex items-center justify-center p-8
  Formulaire centré max-w-sm :
    h1 : "Bon retour 👋" text-2xl font-bold text-gray-900
    sous-titre : "Connecte-toi pour accéder à ton espace." text-sm text-gray-500 mb-6
    
    Form :
      Label "Adresse e-mail" + input (icon Mail left, placeholder "lea.fontaine@tcn.fr")
      Label "Mot de passe" + input (icon Lock left, masqué) + "Oublié ?" link text-orange-600 text-sm
      Checkbox "Rester connecté sur cet appareil" (orange checkbox quand coché)
      Button "Se connecter ›" — full width, bg orange gradient, rounded-xl, py-3
    
    Séparateur : "ou entrer en démo selon ton rôle" text-xs text-gray-400 text-center my-4
    
    Demo buttons (1 ou plusieurs) :
      Chaque bouton : bg-white border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-orange-200 w-full
      Avatar : w-8 h-8 rounded-lg bg-orange-gradient text-white text-sm font-bold (initiales)
      Nom : font-semibold text-sm text-gray-900 + badge rôle (bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full)
      Sous-texte : text-xs text-gray-400
      ChevronRight ml-auto text-gray-300
      Exemple : "LF" → "Léa Fontaine · Athlète" · "Mes plans, mes courses, mes stats"
```

---

### 7bis — Profil athlète (`/profil`)

**Fichier :** `client/src/pages/ProfilePage.tsx`

```
Header :
  h1 = "Profil athlète"
  sous-titre = "{prénom} {nom} · licencié(e) {club} depuis {année}"
  Pas de CTA (ou "✏ Modifier" dans la hero card)

HERO CARD (mb-6) :
  bg-white rounded-2xl border border-gray-100 overflow-hidden
  Bandeau haut : h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-t-2xl relative
  Avatar (overlapping) : w-20 h-20 rounded-2xl bg-orange-500 text-white text-2xl font-bold
    Positionnement : absolute bottom-0 left-6 translate-y-1/2, border-2 border-white
  
  Infos (pt-12 pb-5 px-6) :
    "Léa Fontaine" text-xl font-bold text-gray-900
    "Triathlète longue distance · Triathlon Club Nantais" text-sm text-gray-500
    Bouton "✏ Modifier" outline, text-sm, rounded-xl, ml-auto (position absolue top-right dans la card)
  
  Stats row (grid grid-cols-4 gap-0 border-t border-gray-100 mt-4) :
    Chaque colonne (px-5 py-4 border-r border-gray-100 last:border-0) :
      label : text-[10px] font-bold uppercase tracking-widest text-gray-400
      valeur : font-bold text-lg text-gray-900 leading-tight
      détail : text-xs text-gray-400
    Colonnes :
      LICENCE / "TCN-2021" / "Triathlon Club Nantais"
      CATÉGORIE / "Senior F" / "29 ans"
      SAISONS / "5" / "depuis 2021"
      COURSES / "23" / "3 podiums"

LAYOUT 2 colonnes (grid grid-cols-2 gap-5) :

COL GAUCHE — "Disciplines" :
  bg-white rounded-2xl border border-gray-100 p-5
  Chaque discipline (space-y-4) :
    flex justify-between items-start
    Gauche : dot couleur sport + nom sport (font-medium text-sm) + détail (text-xs text-gray-400, ex: "CSS 1:38/100m")
    Droite : badge niveau — "Confirmée" bg-cyan-100 text-cyan-700 / "Avancée" bg-orange-100 text-orange-700 / "Débutant" bg-gray-100 text-gray-500

COL DROITE — "Repères physiologiques" :
  bg-white rounded-2xl border border-gray-100 p-5
  sous-titre : "Utilisés pour calculer tes zones d'entraînement" text-xs text-gray-400 mb-4
  Grille (grid grid-cols-2 gap-4) :
    Chaque repère : label text-xs text-gray-400 + valeur font-mono font-semibold text-gray-900
    Exemples : FC repos/max, Seuil FC (172 bpm), FTP vélo (248 W), VMA course
```

---

### Overlay — Notifications

```
Déclencheur : clic sur l'icône Bell dans le header
Position : absolute top-full right-0 mt-2 — dropdown card au-dessus du dashboard
Style : bg-white rounded-2xl border border-gray-100 shadow-xl w-80 z-50

Header :
  "Notifications" text-sm font-semibold text-gray-900
  "Tout marquer lu" text-xs text-orange-600 cursor-pointer ml-auto

Fermeture : clic en dehors (backdrop transparent)

Items (divide-y divide-gray-50) :
  Chaque item : flex gap-3 px-4 py-3 hover:bg-gray-50

  Icon pill (w-8 h-8 rounded-lg flex-none) + contenu + timestamp
  Icon pills selon type :
    Plan IA → bg-orange-100 + Sparkles text-orange-600
    Prépa physique → bg-slate-100 + Dumbbell text-slate-500
    Séance → bg-orange-100 + Running/Activity text-orange-600
    Record → bg-emerald-100 + Zap text-emerald-600

  Contenu :
    Texte : text-sm text-gray-900 leading-snug
    Timestamp : text-[11px] text-gray-400 mt-0.5

  Lu vs non-lu : non-lu → fond légèrement orangé bg-orange-50/30

Items dans maquette :
  Sparkles — "Ton coach a envoyé un plan optimisé pour la semaine 6." — "il y a 2h"
  Dumbbell — "Julie B. a décalé ton renfo au mardi." — "hier"
  Activity — "Séance VMA prévue aujourd'hui à 18h00." — "aujourd'hui"
  Sparkles — "Nouveau record FTP détecté : 248 W 🎉" — "3 j"
```

---

### Overlay — Nouvelle séance

```
Déclencheur : clic sur "+ Séance" dans le header
Style : Modal centrée (voir composant Modal), max-w-md

Titre : "Nouvelle séance" text-xl font-bold
Sous-titre : "Ajoute une séance à ton calendrier" text-sm text-gray-500
Bouton fermeture X top-right

SECTION "Discipline" :
  Grid 4 colonnes (grid grid-cols-4 gap-3) :
  Chaque option = bouton card :
    rounded-xl border-2 p-4 flex flex-col items-center gap-2 cursor-pointer
    INACTIF : border-gray-200 bg-white text-gray-500
    ACTIF : border-orange-300 bg-orange-50/50 text-orange-700
    Icône sport (w-8 h-8, couleur sport)
    Nom sport text-xs font-semibold
  Options : Natation / Vélo / Course / Renfo

SECTION "Date & Durée" (grid grid-cols-2 gap-3) :
  Date : input type="date" ou DatePicker
  Durée : input placeholder "1h00" (format hh:mm)

SECTION "Type de séance" :
  Flex wrap gap-2 :
  Pills sélectionnables :
    INACTIF : border border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-600
    ACTIF : border-orange-300 bg-orange-50 text-orange-700 rounded-full px-3 py-1.5
  Options : "Endurance" (défaut) / "Seuil" / "VMA / Intervalles" / "Technique" / "Récupération"

SECTION "Notes (optionnel)" :
  textarea rows=3 placeholder "Objectif, allures cibles, ressenti attendu"
  rounded-xl border border-gray-200 focus:border-orange-300

Footer :
  Bouton "Annuler" outline
  Bouton "Ajouter la séance" bg orange gradient, flex-1
```

---

### Tokens de design globaux

```
Couleurs sport (confirmées Design System v2) :
  Natation  : text-cyan-600   (#0891B2), bg-cyan-50,   border-cyan-500
  Vélo      : text-emerald-600(#059669), bg-emerald-50, border-emerald-500
  Course    : text-orange-600 (#EA580C), bg-orange-50,  border-orange-500
  Renfo/Mob : text-slate-500  (#64748B), bg-white,      border-slate-300

Couleurs primaires (Design System v2 — palette Orange officielle) :
  Orange 300 : #FD8A74
  Orange 400 : #FB923C  ← gradient start
  Orange 500 : #F97316
  Orange 600 : #EA580C  ← gradient end
  Orange 700 : #C2410C
  Gradient CTA : linear-gradient(135deg, #FB923C, #EA580C)

Fond page :
  Fond (#F4F5F7) → variable CSS bg-page

Cards :
  bg-white (pas de dark mode prioritaire — les maquettes sont en THÈME CLAIR)
  border border-gray-100
  rounded-2xl

NOTE THÈME : toutes les maquettes sont en thème clair (light mode).
  Conserver les classes dark: pour le toggle manuel, mais le thème par défaut est LIGHT.
  Ne pas laisser prefers-color-scheme:dark activer les dark: classes automatiquement.
  Configurer Tailwind v4 avec @custom-variant dark (&:where(.dark, .dark *)) dans index.css.

animate-dot : @keyframes tpDot { 0%,100%{opacity:1;scale:1} 50%{opacity:.5;scale:.6} }
  Utilisé sur les dots de statut "● Plan à valider / Plan envoyé / Connecté · Coach"

bg-page : variable CSS sur <body>, fond légèrement chaud (voir index.css)
  .bg-page { background: radial-gradient(...), #F4F5F7; }
```
