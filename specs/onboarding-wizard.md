# Spec : Onboarding Wizard — Configuration du profil athlète

## Objectif
Guider un nouvel utilisateur en 4 étapes pour configurer son profil athlète dès la première connexion, afin que l'IA et les statistiques soient pertinentes dès le départ.

## Déclencheur
Automatique si `user.onboardingCompleted === false` (champ à ajouter sur le modèle User).
Redirige vers `/onboarding` avant le Dashboard.

## Étapes du wizard

### Étape 1 — Profil athlète
- Prénom, nom (pré-remplis depuis l'inscription)
- Niveau global : Débutant / Intermédiaire / Avancé
- Sports pratiqués (multiselect) : Natation, Vélo, Course, Force

### Étape 2 — Objectif principal
- Type de compétition cible : Triathlon sprint / Olympic / Half / Ironman / Course à pied / Cyclisme
- Date de l'objectif principal (date picker)
- Objectif chronométrique (optionnel, texte libre)
→ Crée automatiquement une `Competition` avec `priority: 'A'`

### Étape 3 — Disponibilités
- Heures d'entraînement par semaine : curseur 2h–25h
- Jours disponibles (multiselect lun–dim)
- Contraintes : texte libre (blessure, horaires fixes...)
→ Pré-configure un `TrainingPlan` suggéré

### Étape 4 — Connexions
- Bouton "Connecter Strava" (optionnel)
- Bouton "Activer les notifications email" → active `NotificationPreferences`
- Résumé de ce qui va être créé

### Confirmation
- Crée la compétition + plan d'entraînement + préférences en une seule requête
- `user.onboardingCompleted = true`
- Redirige vers Dashboard avec confetti + message de bienvenue

## Design (Claude Design)

**Prototype à créer sur claude.ai/design :**
- Wizard multi-étapes avec barre de progression (4 steps)
- Chaque étape = une carte centrée (max-w-lg), fond blanc/slate-800
- Navigation : bouton "Précédent" + "Suivant" / "Terminer"
- Illustrations minimalistes SVG par étape (running, trophy, calendar, plug)
- Couleur accent : gradient bleu (from-blue-500 to-blue-600) cohérent avec le reste de l'app
- Animation : slide horizontal entre étapes (étape suivante → slide depuis la droite)
- Mobile-first : une seule colonne, full-screen sur mobile

**Exporter vers** : HTML autonome pour review design avant implémentation.

## Implémentation

### BDD
```prisma
model User {
  onboardingCompleted Boolean @default(false)
  level               String? // beginner | intermediate | advanced
  weeklyHours         Int?
  targetSports        String? // JSON array stringifié
}
```

### Backend
- `PATCH /api/v1/auth/onboarding` — reçoit toutes les données, crée Competition + Plan en transaction
- Route publique non, route auth oui

### Frontend
- `client/src/pages/OnboardingPage.tsx` — wizard 4 étapes, `useState<number>(0)` pour l'étape
- `client/src/components/onboarding/` — `StepProfile`, `StepGoal`, `StepAvailability`, `StepConnect`
- Route `/onboarding` dans `routes/index.tsx`, redirigé depuis `ProtectedRoute` si `!user.onboardingCompleted`

## Contraintes
- Tout le wizard peut être ignoré ("Passer" visible à chaque étape)
- L'onboarding ne se réaffiche pas si déjà complété
- Si Strava non connecté : pas d'erreur, juste ignoré
