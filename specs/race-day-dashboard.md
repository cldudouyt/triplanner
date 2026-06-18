# Spec : Race Day Dashboard

## Objectif
Le jour d'une compétition, remplacer le dashboard habituel par une vue immersive centrée sur la course : countdown, splits cibles, checklist race-day, météo, et saisie du résultat en fin de journée.

## Déclencheur
Automatique si `competition.date === today` ET `competition.status === 'planned'`.

## Contenu de la vue

### 1. Header course
- Nom de la compétition, type/subType, lieu
- Countdown en temps réel jusqu'à `startTime` (heure de départ configurable)
- Badge "RACE DAY" animé (pulse)

### 2. Splits cibles
Calculés depuis `chronoObjective` selon les ratios standards triathlon :
- Sprint : swim 18%, T1 4%, bike 38%, T2 3%, run 37%
- Olympic : swim 16%, T1 3%, bike 42%, T2 2%, run 37%
- Half/Full : même ratio adjusté
Affichage : `Natation → 17min | T1 → 3min | Vélo → 42min | T2 → 2min | Course → 32min`

### 3. Forme du jour
- TSB du jour (interprétation : optimal si +5 à +15)
- Wellness du matin (readinessScore si check-in fait ce jour)

### 4. Checklist race-day
Groupes prédéfinis, cochables localement (non persisté) :
- **Pré-départ** : Dossard, Combinaison, Vélo vérifié, Nutrition, Hydratation
- **Transition T1** : Casque, Chaussures vélo, Lunettes
- **Transition T2** : Chaussures course, Dossard, Casquette
- **Post-course** : Ravitaillement, Saisir résultat

### 5. Météo (optionnel)
Si `competition.location` est défini + `OPENWEATHER_API_KEY` configuré :
- Température, vent, précipitations prévues à l'heure de départ
- Sinon : masqué sans message d'erreur

### 6. Saisir le résultat
Bouton "Terminer la course" → formulaire inline :
- Champ `result` (temps final)
- Champ `notes` (ressenti, incidents)
- Passe `status` à `completed`

## Implémentation

### BDD
Ajouter à `Competition` :
```prisma
startTime String? // "08:30"
```
Appliquer avec `npx prisma db push` (pas migrate dev).

### Backend
Aucun nouveau endpoint requis.
- `GET /api/v1/competitions` filtre côté client (date === today)
- `PATCH /api/v1/competitions/:id` pour sauvegarder le résultat (existe déjà)

### Frontend
- `client/src/components/dashboard/RaceDayBanner.tsx`
  - Intégré dans `DashboardPage.tsx` en haut de page si course aujourd'hui
  - Lien vers `/race-day/:id`
- `client/src/pages/RaceDayPage.tsx`
  - Route `/race-day/:id`
  - Countdown avec `setInterval` chaque seconde
  - Splits calculés depuis `chronoObjective` (parsing `"1h25"` → 85min)
  - Météo : fetch OpenWeatherMap si API key présente
  - Formulaire résultat via `useMutation` + `competitionsApi.update`

### Modèle Claude
Non utilisé sur cette feature.

## Contraintes
- Si `startTime` absent : countdown affiche "Aujourd'hui !" sans heure précise
- La checklist est locale (useState), pas persistée en BDD
- Fonctionne sans OPENWEATHER_API_KEY (section météo masquée)
- Mobile-first : utilisé au bord de l'eau avant le départ
