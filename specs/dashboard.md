# Spec : Tableau de bord

> Source : capture `1-Tableau de bord.png` — Claude Design export  
> Écran principal post-login, route `/`

---

## Layout global

### Sidebar (persistant, toutes pages)

```
[M] Tri Planner
    Triathlon Club Nantais       ← sous-titre en gris secondaire

● Tableau de bord               ← actif : fond orange teinté, pill arrondi
  Mon plan
  Calendrier
  Compétitions
  Statistiques
  Espace club · IA
  Messages                [2]   ← badge orange non-lus

─────────────────────────────
Widget compétition A :
┌──────────────────────────┐
│ Triathlon de Nantes       │
│ Objectif A · dans 24 jours│
│ ████████░░  Prépa s.6/12 │
└──────────────────────────┘
```

**Logo sidebar :** carré orange gradient (`from-orange-400 to-orange-600`) avec lettre "M" (initiale du club ou user), texte bold "Tri Planner" + sous-titre "Triathlon Club Nantais" en `text-xs text-gray-500`.

**Widget compétition A :** toujours visible en bas de sidebar. Fond `linear-gradient(150deg, rgba(249,115,22,.10), rgba(249,115,22,.04))`, border `rgba(249,115,22,.18)`. Barre de progression orange.

---

### Header (toutes pages)

```
[Titre page + sous-titre]   [🔍 Rechercher une séance...]   [🔔]  [+ Séance]
```

- Search : `placeholder="Rechercher une séance..."`, `rounded-xl`, fond gris clair
- Bell : icône seule, hover gris
- `+ Séance` : bouton orange primaire (`bg-gradient-to-br from-orange-400 to-orange-600`)

---

## Tableau de bord — Contenu

### Header de page

```
Bonjour, Léa 👋
Mercredi 18 juin · Semaine 6 / 12 — Prépa Triathlon de Nantes
```

Salutation avec emoji + prénom de l'utilisateur. Sous-titre dynamique : `${dateJour} · Semaine ${currentWeek} / ${totalWeeks} — ${planName}`.

---

### Ligne 1 — 4 StatCards

| Card | Valeur | Delta | Libellé delta | Couleur icône |
|------|--------|-------|---------------|---------------|
| Fitness (CTL) | 78 TSS/j | ↑ 6 | — | orange (étoile) |
| Volume | 9h32 | ↑ 1h12 | — | cyan (horloge) |
| Séances | 5 / 6 | — | "cette sem." | teal (check) |
| Forme (TSB) | +12 | — | "frais" | rose (cœur) |

- 4 colonnes sur desktop, 2×2 sur tablette, 1 col sur mobile
- Format valeur : `text-[25px] font-extrabold tracking-tight`
- Delta positif : vert emerald `text-emerald-600` avec flèche ↑
- Libellé secondaire ("cette sem.", "frais") : badge pill gris

---

### Ligne 2 — Deux colonnes (2/3 + 1/3)

#### Colonne gauche : Charge d'entraînement (graphique)

```
Charge d'entraînement   ● CTL  ● ATL  ● TSB
42 derniers jours · TSS quotidien
[graphique linéaire 3 courbes]
```

- Légende : orange = CTL, cyan = ATL, vert = TSB
- Fond sous CTL : zone orange semi-transparente (`rgba(249,115,22,.15)`)
- X-axis : dates, Y-axis : TSS
- Source data : `GET /api/v1/statistics/training-load?days=42`

#### Colonne droite : Objectifs

```
Objectifs                    Voir tout →
─────────────────────────────────────
Prépa Tri de Nantes    Sem. 6/12
Volume hebdo : 11h cible
[████████░░░]

Natation — technique               68%
3,4 / 5 km cette semaine
[██████░░░░]  (cyan)

Seuil course                       85%
VMA 18,2 km/h → 0,4...
[████████░░]  (orange)
```

- Titre section avec lien "Voir tout" → `/goals`
- Barre de progression : couleur selon discipline
- Source data : `GET /api/v1/goals?active=true` + `GET /api/v1/statistics/week-progress`

---

## États

- **Chargement :** `<SkeletonDashboard />` sur toute la page
- **Pas de plan actif :** remplace graphique + objectifs par `<EmptyState variant="training" />` + CTA "Créer mon premier plan"
- **Pas de compétition A :** widget sidebar affiche "Aucune compétition prévue" avec lien vers `/competitions`

---

## API

```
GET /api/v1/statistics/dashboard   → { ctl, atl, tsb, weekVolume, weekSessions }
GET /api/v1/statistics/training-load?days=42
GET /api/v1/goals?active=true
GET /api/v1/training-plans/active  → semaine courante + totalWeeks
GET /api/v1/competitions?priority=A&upcoming=true  → widget sidebar
GET /api/v1/statistics/week-progress
```

---

## Interactions

| Élément | Action |
|---------|--------|
| "Voir tout" objectifs | → `/goals` |
| Clic graphique | Tooltip avec valeur exacte au survol |
| Barre progression objectif | Tooltip "X / Y — Z% atteint" |
| "+ Séance" header | Ouvre modal création séance rapide |
| 🔍 Search | Ouvre recherche globale (séances, plans, compétitions) |
| 🔔 Bell | Ouvre panneau notifications |
