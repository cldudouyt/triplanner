# Tri Planner — Guide Claude Code

Application de planification triathlon : compétitions, plans d'entraînement, wellness, IA, Strava, espace club coach.

## Démarrage rapide

```powershell
# Option A — Docker (recommandé, démarre PostgreSQL + backend + frontend)
docker-compose up

# Option B — Local (nécessite PostgreSQL installé sur le port 5432)
# Configurer DATABASE_URL dans server/.env (voir .env.example)
cd server && npm run dev    # terminal 1
cd client && npm run dev   # terminal 2
```

URL : http://localhost:5173  
Compte démo athlète : `demo@triathlon-planner.fr` / `demo1234`  
Compte démo coach   : `thomas.mercier@triathlon-nantes.fr` / `coach1234`  
Compte démo admin   : `marie.lemoine@triathlon-nantes.fr` / `admin1234`

> Après toute modification de `schema.prisma` : `npx prisma db push` puis `npx prisma generate` puis `npm run db:seed:demo` pour que les comptes démo aient `onboardingCompleted = true`.

## Stack technique

| Couche | Technologies |
|--------|-------------|
| Frontend | React 19, TypeScript, Vite, TailwindCSS 4, TanStack Query, React Router 7 |
| Backend | Express 5, TypeScript, tsx (dev), Prisma 7, PostgreSQL (`@prisma/adapter-pg`) |
| Temps réel | WebSockets (`ws`) pour messagerie coach ↔ athlète |
| Auth | JWT (access 15min + refresh 7j via cookies httpOnly) |
| IA | Anthropic Claude (`claude-opus-4-8`) via `@anthropic-ai/sdk` |
| Intégrations | Strava OAuth 2.0 + API v3 |

## Architecture

```
TEST_Claude/
├── CLAUDE.md
├── Dockerfile                   ← multi-stage (builder + production)
├── docker-compose.yml           ← dev avec hot-reload
├── docker-compose.prod.yml      ← production
├── .github/workflows/
│   ├── ci.yml                   ← typecheck + tests + docker build
│   └── deploy.yml               ← déploiement sur tag v*.*.*
├── client/                      ← React app (Vite)
│   └── src/
│       ├── api/                 ← clients axios + types TS (seances-club.api, annuaire.api, admin.api…)
│       ├── components/
│       │   ├── ui/              ← Button, Card, Badge, Modal, StatCard, Skeleton, EmptyState…
│       │   ├── layout/          ← AppLayout (TopBar incluse), Sidebar, AdminLayout, ClubCoachLayout
│       │   ├── modals/          ← NewSessionModal
│       │   ├── onboarding/      ← composants wizard (StepProfile, StepAvailability…)
│       │   └── race-day/        ← NutritionPlanner
│       ├── context/             ← AuthContext, ThemeContext
│       ├── hooks/               ← useMessagesSocket
│       ├── pages/               ← une page = une route
│       │   └── admin/           ← AdminDashboardPage, AdminMembresPage, AdminInvitationsPage
│       └── utils/               ← constants, formatDate, nutrition.ts
└── server/                      ← Express API
    ├── prisma/
    │   ├── schema.prisma        ← source de vérité du schéma BDD
    │   ├── seed.ts              ← templates de plans
    │   └── seed-demo.ts         ← 3 comptes démo (athlete/coach/admin) + données
    └── src/
        ├── config/              ← env.ts, database.ts
        ├── middleware/          ← auth.ts, validate.ts, errorHandler.ts
        └── modules/             ← un dossier par domaine métier
            ├── ai/              ← génération plans + analyse résultats + coach chat
            ├── auth/            ← register/login/refresh/logout + PATCH /onboarding
            ├── club/            ← espace club + GET /directory (annuaire)
            ├── club-sessions/   ← séances collectives (GET/POST + register/unregister)
            ├── competitions/    ← CRUD compétitions
            ├── training-plans/  ← CRUD plans
            ├── training-sessions/ ← CRUD séances
            ├── calendar/        ← vue calendrier
            ├── statistics/      ← stats + ATL/CTL/TSB
            ├── wellness/        ← check-ins + alertes tendance
            ├── strava/          ← OAuth + sync activités + compétitions
            ├── groups/          ← groupes d'entraînement club + stats coach
            ├── records/         ← records personnels
            ├── achievements/    ← badges
            ├── export/          ← JSON/CSV export + import
            ├── messages/        ← messagerie coach ↔ athlète (WebSocket)
            ├── goals/           ← objectifs de saison
            ├── notifications/   ← push + cron
            └── admin/           ← panel admin + CODIR (membres, invitations, rôles)
```

## Pattern module backend

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

PostgreSQL via `@prisma/adapter-pg`. URL dans `server/.env` → `DATABASE_URL`.

```powershell
# ✅ Modifier le schéma
cd server
npx prisma db push          # applique les changements (nécessite PostgreSQL)
npx prisma generate         # régénère le client (toujours après db push)

# ❌ NE JAMAIS utiliser
npx prisma migrate dev      # interdit

# Utilitaires
npm run db:studio           # Prisma Studio (GUI)
npm run db:seed:demo        # recrée le compte démo
npm run db:check            # vérifie l'état
```

**Règle absolue** : toujours utiliser `db push`, jamais `migrate dev`.

> Note Prisma 7 : la `url` de connexion va dans `prisma.config.ts` (pas dans `schema.prisma`). Le client utilise `PrismaPg({ connectionString: process.env.DATABASE_URL })` dans `src/config/database.ts`.

## Modèle de données clés

```
User → TrainingPlan → TrainingSession
     → Competition  ← PlanCompetition ← TrainingPlan
     → WellnessLog
     → StravaConnection
     → PersonalRecord
     → UserAchievement
     → SeasonGoal
     → ClubMember → Club → TrainingGroup → TrainingGroupMember
                         → ClubSession → ClubSessionRegistration
                         → Invitation (sentBy User)
     → coachSessions (ClubSession via "CoachSessions")
     → sessionRegistrations (ClubSessionRegistration)

User fields notables :
  onboardingCompleted Boolean @default(false)
  level               String?
  weeklyHoursAvailable Int?
  isAdmin              Boolean @default(false)

ClubMember.role : 'athlete' | 'coach' | 'admin'
```

## Routes frontend

```
/                → SmartRoot → /login (pas de landing page publique — mode club)
/login           → LoginPage (boutons démo Léa + Thomas + Marie admin)
/register        → RegisterPage
/onboarding      → OnboardingPage (4 étapes, redirect auto si !user.onboardingCompleted)
/dashboard       → DashboardPage
/training        → TrainingPlansPage
/calendar        → CalendarPage (grille CSS custom 7 colonnes — FullCalendar supprimé)
/competitions    → CompetitionsPage (+ section Objectifs A/B/C)
/statistics      → StatisticsPage
/wellness        → WellnessPage
/goals           → GoalsPage
/records         → PersonalRecordsPage
/achievements    → AchievementsPage
/race-day/:id    → RaceDayPage (+ NutritionPlanner intégré)
/messages        → MessagesPage (2 panneaux : threads + conversation, WebSocket)
/profil          → ProfilePage
/club            → ClubPage
/seances-club    → SeancesClubPage (réservation créneaux collectifs)
/annuaire        → AnnuairePage (annuaire des licenciés du club)
/club/coach      → ClubCoachDashboardPage
/club/coach/groupes    → ClubCoachGroupsPage
/club/coach/seances    → ClubCoachSeancesPage (gestion séances)
/club/coach/calendrier → ClubCoachCalendarPage
/club/coach/plans      → ClubCoachPlanWizardPage (wizard 4 étapes)
/discover        → PublicPlansPage
/admin           → AdminDashboardPage  ← CODIR (sidebar violet)
/admin/membres   → AdminMembresPage (droits : Membre / Coach / Admin CODIR)
/admin/invitations → AdminInvitationsPage (inviter + relancer)
/admin/users     → AdminUsersPage
/admin/content   → AdminContentPage
/admin/logs      → AdminLogsPage
```

## Variables d'environnement (server/.env)

Voir `server/.env.example` pour la liste complète. Essentiels :

```env
DATABASE_URL="postgresql://triplan:triplan@localhost:5432/triplan_dev"
ACCESS_TOKEN_SECRET="dev-access-secret-change-in-production"
REFRESH_TOKEN_SECRET="dev-refresh-secret-change-in-production"
PORT=3001
NODE_ENV=development
ANTHROPIC_API_KEY=sk-ant-...   # optionnel — section IA masquée sans clé
STRAVA_CLIENT_ID=              # optionnel — boutons désactivés sans clé
STRAVA_CLIENT_SECRET=
```

## Conventions de code

### TypeScript
- **Pas de `any` implicite** — typer ou utiliser `unknown`
- **Imports avec `.js`** côté serveur (ESM) : `import foo from './foo.js'`
- **Pas de `require()`** — tout en ESM (`import`)

### React / Design System
- **Design tokens** : voir `client/src/design/tokens.ts`
- **Couleur primaire = orange** (gradient `#FB923C → #EA580C`), JAMAIS bleu pour les CTAs
- **Admin CODIR = violet** (gradient `#8B5CF6 → #7C3AED`) — identité visuelle distincte
- **Dark mode** : toujours ajouter les variantes `dark:` sur les classes Tailwind
- **Couleurs sport** (depuis `utils/constants.ts`) : swim→cyan, bike→emerald, run→orange, strength→slate
- **Animations** : `animate-fade-in` sur les pages, `animate-scale-in` sur les modales
- **Composants UI** : `client/src/components/ui/` — Button, Card, Badge, Modal, StatCard, Skeleton, EmptyState, ProgressBar, Toast
- **TopBar** : sticky, search + settings + bell + "Séance" — composant `client/src/components/layout/TopBar.tsx`
- **Modales** : `client/src/components/modals/` — NewSessionModal

### API client
```typescript
// client/src/api/mon-module.api.ts
export const monApi = {
  list: () => api.get<MonType[]>('/mon-endpoint'),
  create: (data: CreateInput) => api.post<MonType>('/mon-endpoint', data),
}
```

### Validation serveur
```typescript
import { z } from 'zod'
export const createSchema = z.object({ name: z.string().min(1) })
router.post('/', validate(createSchema), controller.create)
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

## Tests

```powershell
# Vérification TypeScript
cd server; npx tsc --noEmit
cd client; npx tsc --noEmit

# Tests unitaires Vitest (server)
cd server; npm test             # 34+ tests : statistics + wellness services
cd server; npm run test:coverage

# Tests E2E Playwright (client)
cd client; npm run e2e          # auth.spec.ts + competitions.spec.ts
```

## Déploiement

```powershell
# Build Docker
docker build -t tri-planner .
docker run -p 3001:3001 --env-file server/.env tri-planner

# Docker Compose dev
docker-compose up

# Docker Compose prod
docker-compose -f docker-compose.prod.yml up -d
```

Health check : `GET /api/health` → `{ status, version, uptime, db, timestamp }`

## Commandes slash disponibles

- `/new-module` — scaffolde un nouveau module backend
- `/new-page` — scaffolde une nouvelle page frontend
- `/db-query` — inspecte la base SQLite via MCP
- `/check-types` — vérifie TypeScript sur les deux projets
- `/seed-demo` — recrée le compte démo

## Fonctionnalités

| Feature | État | Notes |
|---------|------|-------|
| Auth JWT | ✅ | register/login/refresh/logout + rate limiting |
| Onboarding wizard | ✅ | 4 étapes, redirect auto, PATCH /auth/onboarding |
| Mode club | ✅ | `/` → `/login` (pas de landing page publique) |
| Compétitions CRUD | ✅ | avec checklist équipement, section Objectifs A/B/C |
| Plans d'entraînement | ✅ | génération auto + IA Claude |
| Calendrier | ✅ | grille CSS 7 colonnes custom (FullCalendar retiré) |
| Statistiques | ✅ | ATL/CTL/TSB + graphes + corrélation wellness |
| Wellness | ✅ | check-ins + alertes tendance |
| Strava OAuth | ✅ | sync séances + sync compétitions |
| IA — Génération plans | ✅ | avec contexte Strava |
| IA — Analyse résultats | ✅ | POST /ai/analyze-competition |
| IA — Coach Chat | ✅ | streaming SSE, contexte complet |
| Race Day Dashboard | ✅ | countdown, splits, checklist + NutritionPlanner |
| Nutrition Race-Day | ✅ | calcul hydratation/glucides + timeline |
| Notifications Push | ✅ | cron 08h00, email rappels |
| Partage Social Plans | ✅ | liens publics, galerie /discover |
| Objectifs de Saison | ✅ | CRUD goals, progression temps réel |
| Records | ✅ | records personnels par sport |
| Achievements | ✅ | système de badges |
| Export | ✅ | JSON + CSV |
| Admin système | ✅ | panel administration (users, content, logs) |
| Dark mode | ✅ | TailwindCSS dark: + localStorage |
| Design System | ✅ | tokens, Badge, StatCard, TopBar, modales, 404 |
| Espace Coach | ✅ | dashboard, groupes (4), calendrier club, wizard plan IA |
| Séances club (coach) | ✅ | création séances collectives, gestion inscriptions |
| Séances club (athlète) | ✅ | inscription/désinscription créneaux, liste d'attente |
| Annuaire club | ✅ | licenciés par groupe, search, rôles |
| Messages | ✅ | messagerie coach ↔ athlète (WebSocket temps réel) |
| Profil utilisateur | ✅ | avatar, stats globales, repères physiologiques |
| Admin CODIR | ✅ | sidebar violet, membres & droits, invitations |
| PWA / Mobile | ✅ | manifest.webmanifest, favicon SVG orange |
| Déploiement | ✅ | Dockerfile multi-stage, docker-compose, CI/CD GitHub Actions |
| Sécurité | ✅ | helmet, rate limiting IA, pino logs, Sentry, validation Zod |
| Tests unitaires | ✅ | 34 tests Vitest (statistics + wellness services) |
| Tests E2E | ✅ | Playwright auth + competitions |
