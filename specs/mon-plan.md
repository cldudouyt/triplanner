# Spec : Mon Plan

> Source : capture `2-Mon plan.png` — Claude Design export  
> Route : `/plan`

---

## Header de page

```
Mon plan
Semaine 6 / 12 · optimisé par le coach et l'IA
```

Sous-titre dynamique : quand un plan coach IA est actif, il précise "optimisé par le coach et l'IA".

---

## Banner "Plan du coach" (conditionnel)

Affiché uniquement si un `CoachPlanSuggestion` de statut `sent` existe pour la semaine courante.

```
┌─────────────────────────────────────────────────────────────┐
│ ✦ Optimisé par IA     ↔ Prépa physique incluse    Reçu il y a 2h  │
│                                                              │
│  Plan du coach · Semaine 6 / 12          ✓ Accepter le plan │
│                                                              │
│  [TM] « Belle régularité Léa. On allège un peu le vélo et   │
│         on cale le renfo avec Julie, focus technique nat. »  │
└─────────────────────────────────────────────────────────────┘
```

**Design :**
- Gradient : `linear-gradient(135deg, #FB923C 0%, #F97316 52%, #EA580C 100%)`
- Shadow : `0 22px 54px -26px rgba(234,88,12,.6)`
- Orbe décoratif : cercle semi-transparent top-right
- Badges : `bg-white/25 text-white rounded-full px-3 py-1 text-xs font-medium`
- "Reçu il y a 2h" : `text-white/70 text-xs`
- Titre : `text-2xl font-bold text-white`
- Bouton "Accepter" : `bg-white text-orange-700 font-semibold rounded-xl px-6 py-2.5` + hover `bg-orange-50`
- Avatar coach : initiales sur cercle blanc/20, nom + citation en blanc

**Interactions :**
- "Accepter le plan" → `PATCH /api/v1/club/plan/respond` `{ action: 'accept' }` → banner disparaît, toast "Plan accepté !"
- Si refus : bouton secondaire "Refuser" (hidden, accessible via "..." menu)

---

## Layout principal — Deux colonnes

### Colonne gauche : Semaine courante

**En-tête colonne :**
```
Cette semaine      8h35 tri · 1h prépa
```
Volume total triathlon + volume prépa physique séparé.

**Liste des séances par jour :**

```
LUN  ●(cyan)   Natation     1h00
MAR  ●(vert)   Vélo         1h55
MER  ●(cyan)   Natation  IA  1h00    ← badge "IA" si ajusté par IA
JEU  ●(orange) Course       0h50    ← selected / aujourd'hui
...
```

- Chaque ligne : dot couleur sport + nom sport + badge "IA" si ajustement + durée
- Ligne sélectionnée : fond orange teinté `bg-orange-500/8`, border-left `2px solid #EA580C`
- Badge "IA" : petit pill `bg-orange-100 text-orange-700 text-[10px] font-semibold px-1.5 rounded`
- Clic → sélectionne et affiche le détail à droite

---

### Colonne droite : Détail séance

**En-tête détail :**
```
● Course     Aujourd'hui           0h50
18 juin · VMA · 6×800               durée
```

- Point couleur sport + type séance
- Badge "Aujourd'hui" (ou date) : pill gris ou orange si today
- Durée : `font-mono text-xl font-bold`
- Sous-titre : date · type d'entraînement · répétitions

**Bloc intensité :**
```
[ VMA · 95-100% ]    ← badge teinté selon intensité
```

**Blocs de séance (zones) :**

| Bloc | Durée | Description |
|------|-------|-------------|
| Échauffement | 15 min | Footing souple + 4 lignes droites · Gammes (talons-fesses...) |
| Travail principal | — | — |
| Retour au calme | — | — |

Chaque bloc : `bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4`, titre `font-semibold text-sm`, description `text-sm text-gray-600`.

**Note IA (si ajustement) :**
```tsx
<div style={{ background: 'rgba(249,115,22,.07)', borderColor: 'rgba(249,115,22,.24)' }}
     className="flex gap-2 p-3 rounded-xl border">
  <Sparkles className="w-4 h-4 text-orange-600" />
  <span className="text-sm text-orange-900">Intensité réduite par rapport au plan de base...</span>
</div>
```

**Actions séance :**
- `Marquer comme faite` (primary orange)
- `Modifier` (outline)
- `Déplacer` (ghost)

---

## États

- **Chargement :** skeleton colonne gauche (5 lignes) + skeleton détail droite
- **Pas de plan actif :** `<EmptyState variant="training" />` + CTA "Créer un plan" / "Générer avec l'IA"
- **Semaine terminée :** toutes les séances cochées → bandeau vert "Semaine complétée 🎉"

---

## API

```
GET /api/v1/training-plans/active          → plan actif + semaine courante
GET /api/v1/training-sessions?week=current → séances de la semaine
GET /api/v1/club/plan/current              → plan coach IA s'il existe (status: sent)
PATCH /api/v1/training-sessions/:id/complete → marquer faite
PATCH /api/v1/club/plan/respond            → accepter/refuser plan coach
```
