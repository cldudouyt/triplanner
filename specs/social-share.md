# Spec : Partage social des plans d'entraînement

## Objectif
Permettre aux utilisateurs de partager un plan d'entraînement via un lien public, sans compte requis pour le visualiser.

## Comportement attendu

### Créer un lien de partage
- Bouton "Partager" sur la page détail d'un plan
- Génère un `shareCode` aléatoire (8 caractères alphanumériques)
- URL publique : `https://triplanner.app/plans/shared/{shareCode}`
- Option : rendre le plan public (`isPublic: true`) pour apparaître dans une galerie

### Vue publique
- Page accessible sans authentification
- Affiche : nom du plan, niveau, durée, type d'épreuve, nombre de séances
- Affiche les séances avec leur description pédagogique
- **Ne montre pas** : données personnelles, résultats, wellness

### Galerie publique (optionnel)
- `/plans/templates` : liste les plans avec `isPublic: true`
- Filtres : type d'épreuve, niveau, durée
- Bouton "Copier ce plan dans mes plans"

## Implémentation

### Schema Prisma (déjà en place)
```prisma
model TrainingPlan {
  isPublic  Boolean @default(false)
  shareCode String? @unique
}
```

### Backend
- `GET /api/v1/training-plans/shared/:shareCode` — route publique (no auth)
- `POST /api/v1/training-plans/:id/share` — génère/révoque shareCode
- `GET /api/v1/training-plans/public` — galerie publique
- `POST /api/v1/training-plans/:id/copy` — copie un plan public

### Frontend
- `TrainingPlanDetailPage.tsx` : bouton partager + dialog avec lien
- `SharedPlanPage.tsx` : vue publique read-only
- `PublicPlansPage.tsx` : galerie (route `/discover`)

## Contraintes
- Le shareCode doit être révocable (remettre à null)
- Les séances copiées gardent les descriptions mais reset `completed=false`
