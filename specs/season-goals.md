# Spec : Objectifs de Saison

## Objectif
Permettre à l'utilisateur de fixer des objectifs annuels par sport (distance totale, nombre de séances, record cible) et suivre sa progression tout au long de la saison avec un graphe burn-up.

## Comportement attendu

### Définir un objectif
- Page dédiée `/goals` accessible depuis le menu
- Un objectif = `{ sport, year, type, targetValue, unit }`
  - `sport` : swim / bike / run / strength / all
  - `type` : distance (km), duration (heures), sessions (nombre)
  - `year` : année (défaut : année courante)
- Maximum 6 objectifs actifs (2 par sport principal)

### Suivi de progression
- Barre de progression (%) sur chaque objectif
- Valeur actuelle calculée depuis les `TrainingSession` complétées de l'année
- Projection fin d'année (tendance linéaire sur les semaines écoulées)
- Badge "Objectif atteint" + confetti si 100% franchi

### Widget dashboard
- Encart "Mes objectifs" sur le DashboardPage
- Affiche les 3 objectifs prioritaires avec progression
- Lien vers `/goals` pour voir tout

### Graphe burn-up (page Goals)
- Axe X : semaines de l'année (1-52)
- Axe Y : valeur cumulée
- Ligne réelle (vert) vs ligne cible (gris pointillé)
- Bibliothèque : Recharts (déjà utilisée dans StatisticsPage)

## Implémentation

### BDD — Nouveau modèle
```prisma
model SeasonGoal {
  id          Int      @id @default(autoincrement())
  userId      Int
  sport       String   // swim | bike | run | strength | all
  year        Int
  type        String   // distance | duration | sessions
  targetValue Float
  unit        String   // km | hours | sessions
  label       String?  // nom personnalisé optionnel
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
Après modification schema.prisma : `npx prisma db push`

### Backend — Nouveau module `goals`
Pattern standard (routes / controller / service / schema) :
- `GET    /api/v1/goals` — liste les objectifs de l'année courante
- `POST   /api/v1/goals` — créer un objectif
- `DELETE /api/v1/goals/:id` — supprimer
- `GET    /api/v1/goals/progress` — calcule progression depuis TrainingSession

Le service `goals.service.ts` :
- `getGoalsWithProgress(userId, year)` : joint les goals avec les sessions de l'année
  - Calcule `currentValue` (SUM distance/duration ou COUNT sessions)
  - Calcule `percentage` et `projection`
- Utilise Prisma aggregate (`_sum`, `_count`) sur `TrainingSession`

### Frontend
- `client/src/pages/GoalsPage.tsx`
  - Liste des objectifs + bouton Ajouter
  - Graphe burn-up par objectif (Recharts LineChart)
  - Formulaire inline (pas de modal) pour créer un objectif
- `client/src/components/dashboard/GoalsWidget.tsx`
  - Intégré dans DashboardPage
  - 3 objectifs max, barres de progression colorées par sport
- `client/src/api/goals.api.ts`

### Navigation
Ajouter lien "Objectifs" dans le menu sidebar (icône `Target` de lucide-react).

## Contraintes
- Si aucun objectif défini : `EmptyState` avec bouton "Définir mes objectifs"
- La progression est recalculée à chaque chargement (pas de cache BDD)
- Ne pas bloquer si `TrainingSession` n'a pas de `distance` (certains sports n'ont que `duration`)
