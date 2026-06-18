# Spec : Planificateur Nutrition Race-Day

## Objectif
Calculer et afficher un plan de nutrition/hydratation personnalisé pour le jour de la compétition, basé sur les distances, la durée estimée et les conditions météo.

## Comportement attendu

### Accès
- Bouton "Plan nutrition" dans `RaceDayPage.tsx` (section dédiée, après la checklist)
- Aussi accessible depuis `CompetitionDetailPage.tsx` si statut `planned`

### Inputs utilisateur
- Poids (kg) — depuis profil ou saisi à la volée
- Température estimée (°C) — depuis météo si disponible, sinon saisie manuelle
- Intensité prévue : Confort / Race-pace / Tout donner
- Produits disponibles : liste multiselect (gel / barre / boisson isotonique / eau / banana...)

### Calculs (service frontend, pas d'IA)

#### Hydratation
- Base : 500–750ml/h selon température
- < 15°C → 400ml/h | 15–25°C → 600ml/h | > 25°C → 800ml/h
- Ajustement poids : × (poids / 70)

#### Nutrition (glucides)
- Effort < 60min : pas de glucides nécessaires
- 60–90min : 30–45g/h
- 90–150min : 45–60g/h
- > 150min : 60–90g/h

#### Plan détaillé (timeline)
Découper la course en segments (natation / T1 / vélo / T2 / course) avec timing précis :
```
Avant le départ : 500ml eau 30min avant, 1 gel si > 90min
Vélo km 10 : 1 bidon (500ml boisson isotonique)
Vélo km 20 : 1 gel + 200ml eau
T2 : 1 gorgée d'eau
Course km 2.5 : 1 ravitaillement (eau + sel)
Arrivée : réhydratation 500ml + protéines
```

### Affichage
- Timeline visuelle verticale avec horodatage estimé
- Chaque item : icône produit + quantité + timing + note
- Couleur selon segment : cyan (nage) → vert (vélo) → orange (course)
- Résumé : total glucides (g), total liquides (ml), coût calorique estimé

### Sauvegarde
- `localStorage` uniquement (pas persisté BDD)
- Bouton "Copier" → texte formaté pour coller ailleurs
- Bouton "Imprimer" → `window.print()` avec CSS print media

## Design (Claude Design)

**Prototype à créer sur claude.ai/design :**
- Layout vertical timeline (comme les timelines de course triathlon)
- Icônes produits : eau 💧, gel ⚡, barre 🍫, banane 🍌, isotonique 🧃
- Code couleur sport (cyan/vert/orange) sur les segments
- Version mobile-first (utilisé en transition T1/T2)
- Toggle "Afficher détails / Vue synthèse"

**Exporter vers** : HTML autonome pour validation avant implémentation.

## Implémentation

### Frontend uniquement (pas de backend nécessaire)
- `client/src/components/race-day/NutritionPlanner.tsx`
  - Props : `competition` (pour distances + subType), `startTime`
  - Calculs purs TypeScript (fonctions utilitaires dans `utils/nutrition.ts`)
  - Formulaire : poids + température + intensité + produits
  - Timeline générée dynamiquement
- `client/src/utils/nutrition.ts` — fonctions de calcul exportables et testables

### Intégration
- Importer dans `RaceDayPage.tsx` comme Section 5 (après checklist)
- Accessible uniquement si `competition.swimDistance || competition.bikeDistance || competition.runDistance`

## Contraintes
- Avertissement visible : "Ces recommandations sont indicatives. Consultez un nutritionniste pour un plan personnalisé."
- Fonctionne hors-ligne (localStorage + calculs locaux)
- Pas d'appel API, pas d'IA (calculs déterministes basés sur des standards sportifs)
