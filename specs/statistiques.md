# Spec : Statistiques

> Source : capture `5-Statistiques.png` — Claude Design export  
> Route : `/statistics`

---

## Header de page

```
Statistiques
12 dernières semaines · toutes disciplines
```

Sous-titre dynamique selon la période sélectionnée (filtre à venir).

---

## Section 1 : 4 StatCards de synthèse

Grille 4 colonnes (desktop), 2 colonnes (tablette), 1 colonne (mobile).

| Card | Valeur | Delta | Couleur icône |
|------|--------|-------|---------------|
| Volume total | 118 h | ↑ 9% vs cycle préc. | blue/slate |
| Distance | 1 240 km | ↑ 12% | green emerald |
| Séances | 68 | ↑ 4 | orange |
| Dénivelé vélo | 9 850 m | ↑ 1 200 m | cyan |

**Format delta :**
- Pourcentage : `↑ 9%` en `text-emerald-600 text-xs font-medium`
- Valeur absolue : `↑ 4` ou `↑ 1 200 m`
- Libellé contexte : "vs cycle préc." en `text-gray-400 text-xs`

---

## Section 2 : Deux colonnes (2/3 + 1/3)

### Colonne gauche : Volume hebdomadaire (graphique)

```
Volume hebdomadaire     ● Nat.  ● Vélo  ● C.À.P
[barres empilées S1 → S8]
         S1  S2  S3  S4  S5  S6  S7  S8
```

- Type : barres empilées verticales
- Couleurs : Natation = cyan, Vélo = emerald, C.À.P = orange
- Axe Y : heures (format `Xh`)
- Axe X : numéro de semaine (S1, S2...)
- Survol barre : tooltip avec détail par discipline
- Source : `GET /api/v1/statistics/weekly-volume?weeks=12`

### Colonne droite : Répartition par discipline

```
Répartition
──────────────────────────────
● Vélo                    52%
[████████████░░░░░░░░░░░]  (emerald)
61 h · sorties + home-trainer

● Course à pied           30%
[████████░░░░░░░░░░░░░░░]  (orange)
35 h · 410 km

● Natation                18%
[████░░░░░░░░░░░░░░░░░░░]  (cyan)
22 h · 64 km
```

**Design :**
- Titre : `font-semibold text-gray-900`
- Nom discipline + pourcentage : même ligne, `justify-between`
- Barre : `h-2 rounded-full`, couleur discipline, fond `bg-gray-100`
- Détail sous barre : `text-xs text-gray-500`
- Ordre : trié par % décroissant

---

## Section 3 (non visible, en-dessous du scroll)

D'après les fonctionnalités existantes (`statistics.service.ts`), cette section contiendrait :

- **ATL/CTL/TSB** sur les 42 derniers jours (graphique linéaire) — déjà sur le dashboard
- **Records personnels** par discipline → lien vers `/records`
- **Corrélation wellness** : scatter plot wellness vs performance
- **Historique mensuel** : tableau récapitulatif mois par mois

---

## Filtres (à venir, non visibles dans le design actuel)

- Période : 4 semaines / 8 semaines / 12 semaines / 6 mois / Année
- Discipline : Toutes / Natation / Vélo / Course / Renforcement

---

## États

- **Chargement :** `<SkeletonDashboard />` adapté (4 stat cards + 2 blocs)
- **Pas assez de données** (< 4 semaines) : message "Continuez à vous entraîner, les statistiques apparaîtront après 4 semaines."
- **Données Strava disponibles :** bandeau info "Données enrichies via Strava" si `stravaConnection` active

---

## API

```
GET /api/v1/statistics/summary?weeks=12       → 4 chiffres clés + deltas
GET /api/v1/statistics/weekly-volume?weeks=12 → données graphique barres
GET /api/v1/statistics/discipline-split?weeks=12 → répartition %
GET /api/v1/statistics/training-load          → CTL/ATL/TSB
GET /api/v1/records                           → records personnels
```
