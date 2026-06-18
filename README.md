# Triathlon Planner

Application de planification de triathlon permettant de gerer ses competitions, plans d'entrainement et seances.

## Stack technique

- **Client** : React 19, TypeScript, Vite, TailwindCSS, React Query, React Router, FullCalendar
- **Serveur** : Express 5, TypeScript, Prisma (SQLite), JWT (authentification)
- **IA (optionnel)** : OpenAI (gpt-4o-mini) pour la generation de plans personnalises

## Pre-requis

- [Node.js](https://nodejs.org/) (v18 ou superieur)
- npm

## Demarrage rapide

```bash
# 1. Installer les dependances
cd server && npm install
cd ../client && npm install

# 2. Initialiser la base de donnees
cd ../server
npx prisma generate
npx prisma db push

# 3. Creer les templates et le compte de demo
npx tsx prisma/seed.ts
npx tsx prisma/seed-demo.ts

# 4. Lancer le serveur (terminal 1)
npm run dev

# 5. Lancer le client (terminal 2)
cd ../client
npm run dev
```

L'application est accessible sur **http://localhost:5173**.

## Compte de demo

Un compte pre-rempli est disponible pour tester toutes les fonctionnalites :

| | |
|---|---|
| **Email** | `demo@triathlon-planner.fr` |
| **Mot de passe** | `demo1234` |

### Contenu du compte demo

**8 competitions** :
- 3 passees avec resultats (Triathlon de Deauville, Semi de Paris, 10K de Vincennes)
- 5 futures a differents statuts : Triathlon de La Baule, Marathon de Bordeaux, Triathlon Sprint du Lac, Trail de la Sainte-Victoire, Half Ironman Nice
- Checklists d'equipement sur le triathlon La Baule (10 items) et le marathon Bordeaux (5 items)

**5 plans d'entrainement** couvrant tous les niveaux et disciplines :

| Plan | Niveau | Discipline | Duree | Etat |
|------|--------|-----------|-------|------|
| Mon premier 5K | Debutant | Course | 6 sem | Termine (100%) |
| Prepa Triathlon La Baule | Intermediaire | Triathlon | 12 sem | En cours (semaine 5/12) |
| Prepa Marathon Bordeaux | Avance | Course | 16 sem | Futur (pas commence) |
| Progression natation | Intermediaire | Natation | 8 sem | En cours (semaine 2/8) |
| Debuter en velo de route | Debutant | Velo | 6 sem | Termine + partage |

Chaque plan contient des seances avec descriptions pedagogiques detaillees (objectif, echauffement, contenu, retour au calme, conseils), des notes de suivi et des durees/distances reelles enregistrees.

### Regenerer le compte demo

```bash
cd server
npx tsx prisma/seed-demo.ts
```

Le script est idempotent : il supprime les anciennes donnees du compte demo avant de les recreer.

## Installation detaillee

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd TEST_Claude
```

### 2. Installer les dependances

```bash
# Dependances serveur
cd server
npm install

# Dependances client
cd ../client
npm install
```

### 3. Configurer l'environnement

Le fichier `server/.env` contient la configuration par defaut pour le developpement :

```env
DATABASE_URL="file:./dev.db"
ACCESS_TOKEN_SECRET="dev-access-secret-change-in-production"
REFRESH_TOKEN_SECRET="dev-refresh-secret-change-in-production"
PORT=3001
NODE_ENV=development
```

> En production, remplacez les secrets par des valeurs securisees.

#### Configuration IA (optionnel)

Pour activer la generation de plans par IA, ajoutez votre cle OpenAI dans `server/.env` :

```env
OPENAI_API_KEY=sk-...
```

Sans cette cle, l'application fonctionne normalement : le bouton de generation IA est simplement masque sur le formulaire de creation de plan.

### 4. Initialiser la base de donnees

```bash
cd server
npx prisma generate
npx prisma db push
```

Pour peupler la base avec les templates de plans (optionnel) :

```bash
npm run db:seed
```

Pour creer le compte de demo :

```bash
npm run db:seed:demo
```

> **Important** : Ne jamais utiliser `npx prisma migrate dev` — cette commande peut reinitialiser la base de donnees. Utiliser `npx prisma db push` pour appliquer les modifications de schema.

## Lancement en developpement

Ouvrir **deux terminaux** :

**Terminal 1 - Serveur** (port 3001) :

```bash
cd server
npm run dev
```

**Terminal 2 - Client** (port 5173) :

```bash
cd client
npm run dev
```

L'application est accessible sur **http://localhost:5173**.

Le client proxy automatiquement les appels `/api` vers le serveur (`http://localhost:3001`).

## Tests

Le projet utilise [Vitest](https://vitest.dev/) pour les tests unitaires et d'integration.

### Lancer les tests

```bash
# Tests serveur
cd server
npm test

# Tests client
cd client
npm test
```

### Mode watch (relance automatique)

```bash
# Serveur
cd server
npm run test:watch

# Client
cd client
npm run test:watch
```

### Couverture de code

```bash
# Serveur
cd server
npm run test:coverage

# Client
cd client
npm run test:coverage
```

Les rapports de couverture sont generes dans le dossier `coverage/` de chaque projet.

### Tests End-to-End (Playwright)

Le projet utilise [Playwright](https://playwright.dev/) pour les tests end-to-end.

#### Installation des navigateurs

```bash
cd client
npx playwright install
```

#### Lancer les tests E2E

```bash
# Lancer tous les tests E2E (headless)
npm run e2e

# Lancer avec interface graphique (debug)
npm run e2e:ui

# Lancer en mode visible (headed)
npm run e2e:headed
```

> **Note** : Les tests E2E demarrent automatiquement le serveur et le client avant execution.

#### Structure des tests E2E

```
client/e2e/
├── fixtures.ts            # Configuration et helpers d'authentification
├── auth.spec.ts           # Tests d'inscription et connexion
├── competitions.spec.ts   # Tests CRUD des competitions
├── training-plans.spec.ts # Tests des plans d'entrainement
└── navigation.spec.ts     # Tests de navigation et calendrier
```

### Structure des tests

```
server/tests/
├── setup.ts                    # Configuration globale des tests
├── helpers.ts                  # Fonctions utilitaires pour les tests
├── unit/                       # Tests unitaires
│   ├── password.test.ts        # Utilitaires de hachage
│   ├── jwt.test.ts             # Tokens JWT
│   ├── auth.schema.test.ts     # Validation schemas auth
│   ├── competition.schema.test.ts
│   ├── session.schema.test.ts
│   └── plan.schema.test.ts
└── integration/                # Tests d'integration API
    ├── auth.test.ts
    ├── competitions.test.ts
    ├── training-plans.test.ts
    └── sessions.test.ts

client/src/
├── api/*.test.ts               # Tests des clients API
└── utils/*.test.ts             # Tests des utilitaires
```

## Build de production

```bash
# Build du serveur
cd server
npm run build

# Build du client
cd ../client
npm run build
```

Le serveur compile se lance avec :

```bash
cd server
npm start
```

Le client compile se trouve dans `client/dist/` et peut etre servi par n'importe quel serveur de fichiers statiques.

## Scripts utiles

| Commande | Dossier | Description |
|---|---|---|
| `npm run dev` | server | Lance le serveur en mode developpement (hot reload) |
| `npm run dev` | client | Lance le client Vite en mode developpement |
| `npm run build` | server | Compile le TypeScript du serveur |
| `npm run build` | client | Compile le client pour la production |
| `npm test` | server | Lance les tests unitaires et d'integration |
| `npm test` | client | Lance les tests unitaires |
| `npm run test:watch` | server/client | Lance les tests en mode watch |
| `npm run test:coverage` | server/client | Lance les tests avec rapport de couverture |
| `npm run e2e` | client | Lance les tests Playwright (headless) |
| `npm run e2e:ui` | client | Lance les tests Playwright avec interface graphique |
| `npm run e2e:headed` | client | Lance les tests Playwright en mode visible |
| `npm run lint` | client | Analyse statique du code (ESLint) |
| `npm run db:push` | server | Synchronise le schema Prisma vers la BDD (non-destructif) |
| `npm run db:seed` | server | Peuple la base avec les templates |
| `npm run db:seed:demo` | server | Cree le compte de demo |
| `npm run db:check` | server | Verifie l'etat de la base de donnees |
| `npm run db:studio` | server | Ouvre Prisma Studio (interface d'admin BDD) |

## Structure du projet

```
TEST_Claude/
├── client/                # Application React (Vite)
│   ├── src/
│   │   ├── api/           # Clients API (axios) + tests
│   │   ├── components/    # Composants React
│   │   ├── context/       # Contextes (AuthContext)
│   │   ├── pages/         # Pages de l'application
│   │   ├── routes/        # Configuration du routage
│   │   └── utils/         # Utilitaires + tests
│   ├── e2e/               # Tests End-to-End (Playwright)
│   ├── tests/             # Configuration des tests
│   └── package.json
├── server/                # API Express
│   ├── prisma/            # Schema et seeds
│   ├── src/
│   │   ├── config/        # Configuration (env, database)
│   │   ├── middleware/    # Middlewares (auth, validation, upload)
│   │   ├── modules/       # Modules metier
│   │   │   ├── ai/            # Generation IA (OpenAI)
│   │   │   ├── auth/          # Authentification (register, login, refresh)
│   │   │   ├── competitions/  # Gestion des competitions
│   │   │   ├── training-plans/# Plans d'entrainement
│   │   │   ├── training-sessions/ # Seances d'entrainement
│   │   │   └── calendar/     # Vue calendrier
│   │   └── utils/         # Utilitaires (JWT, password)
│   ├── tests/             # Tests unitaires et d'integration
│   │   ├── unit/          # Tests unitaires
│   │   └── integration/   # Tests d'integration API
│   └── package.json
└── README.md
```
