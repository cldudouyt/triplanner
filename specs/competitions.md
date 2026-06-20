# Spec : Compétitions

> Source : capture `4-Competitions.png` — Claude Design export  
> Route : `/competitions`

---

## Header de page

```
Compétitions
Tes objectifs de saison et résultats
```

---

## Section 1 : Objectifs de saison

Titre "Objectifs de saison" + grille 3 cartes (une par priorité A / B / C).

### Carte Objectif A — Priorité Rouge

```
┌────────────────────────┐
│ OBJECTIF A         J-24 │  ← badge "J-24" top-right
│                   19 OCT│
│ Triathlon de Nantes     │
│ Nantes, FR              │
│                         │
│ ● Inscrit    Olympique  │
│                         │
│ ● NAT  ● VÉLO  ● C.À.P │
│ 1,5km   40 km   10 km  │
└────────────────────────┘
```

**Design :**
- Gradient : `linear-gradient(135deg, #EF4444 0%, #DC2626 100%)` (rouge)
- Badge "J-24" : rectangle arrondi blanc/20, texte blanc bold, date dessous en blanc/70
- Texte : entièrement blanc
- "OBJECTIF A" : `text-xs font-bold uppercase tracking-widest text-white/70`
- Nom compétition : `text-xl font-bold text-white`
- Lieu : `text-sm text-white/70`

**Statuts possibles (dot + texte) :**
- `● Inscrit` → dot vert, texte blanc
- `● Planifié` → dot ambre, texte blanc  
- `● Dossard à venir` → dot gris, texte blanc/70

**Distances :** 3 colonnes (NAT / VÉLO / C.À.P), valeurs en `font-mono font-bold text-white`.

### Carte Objectif B — Priorité Orange

Même structure, gradient : `linear-gradient(135deg, #FB923C 0%, #EA580C 100%)` (orange).

### Carte Objectif C — Priorité Slate

Même structure, gradient : `linear-gradient(135deg, #334155 0%, #1E293B 100%)` (slate sombre).  
Badge "J-12" toujours blanc sur fond semi-transparent.

### Variante J-X

Le badge "J-X" est calculé dynamiquement : `Math.ceil((raceDate - today) / 86400000)` jours.
- J-0 : "Aujourd'hui !" en vert
- Passé : "Terminée" en gris

---

## Section 2 : Résultats récents

Tableau avec colonnes : **COURSE · FORMAT · TEMPS · ALLURE C.À.P · RANG**

```
COURSE                    FORMAT   TEMPS      ALLURE C.À.P   RANG
─────────────────────────────────────────────────────────────────
Triathlon de Pornic       Sprint   1h12:40    4:18 /km       8e
```

**Design tableau :**
- En-têtes : `text-xs font-semibold uppercase tracking-wider text-gray-500`
- Ligne : `hover:bg-orange-50/50 dark:hover:bg-slate-800/50 transition-colors`
- Temps : `font-mono font-semibold`
- Rang : badge pill si top 10 (`bg-amber-100 text-amber-800`)
- Clic ligne → `CompetitionDetailPage` (`/competitions/:id`)

---

## Actions globales

- Header "+ Séance" → modal création séance rapide (identique partout)
- Bouton "+ Ajouter une compétition" → modal/page création
- Filtres (à venir) : par année, par statut, par format

---

## États

- **Aucune compétition :** `<EmptyState variant="competitions" />` + CTA "Ajouter ma première compétition"
- **Chargement :** skeleton 3 cards gradient + skeleton tableau
- **Compétition passée sans résultat :** ligne tableau avec "—" dans TEMPS + CTA "Saisir le résultat"

---

## API

```
GET /api/v1/competitions?sort=date&order=asc     → compétitions à venir
GET /api/v1/competitions?status=completed&limit=10 → résultats récents
POST /api/v1/competitions                         → création
```

---

## Règles métier

- Max 1 objectif A (pivot de la saison)
- Max 3 objectifs B
- Objectifs C : illimités
- La carte Objectif A est toujours en première position
- Les J-X sont recalculés à chaque render (pas de cache)
