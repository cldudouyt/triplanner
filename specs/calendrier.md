# Spec : Calendrier

> Source : capture `3-Calendrier.png` — Claude Design export  
> Route : `/calendar`

---

## Header de page

```
Calendrier
Planning d'entraînement · prépa Triathlon de Nantes
```

Sous-titre dynamique : nom du plan actif.

---

## Barre de navigation semaine

```
[<]    15 – 21 juin 2026    [>]     Semaine 6 / 12      Volume prévu : 11h10
```

- Flèches `<` `>` : semaine précédente / suivante
- Plage dates : `${lundiDDMMMM} – ${dimancheDD MMMM YYYY}`
- Chip "Semaine 6 / 12" : `bg-orange-100 text-orange-700 rounded-full px-3 py-1 text-sm font-medium`
- "Volume prévu" : aligné à droite, `text-sm font-semibold text-gray-900`

---

## Grille 7 jours

Colonnes égales (1/7 chacune), hauteur auto selon contenu.

### En-tête colonne

```
JEU         ← jour court 3 lettres, uppercase, text-xs text-gray-500
18          ← numéro du jour, text-lg font-semibold
```

Aujourd'hui : numéro en `text-orange-600 font-bold`, fond colonne légèrement teinté.

### Carte séance

```
┌───────────────────┐
│ Natation           │  ← nom sport, font-semibold text-sm
│ Technique          │  ← sous-type
│ · éducatifs        │  ← description courte
│ 1h00              │  ← durée, font-mono
└───────────────────┘
```

**Border-left :** 3px de la couleur sport (cyan natation, vert vélo, orange course).  
**Fond :** très légère teinte de la couleur sport (`rgba(sport-color, .06)`).  
**Arrondi :** `rounded-xl`.  
**Taille texte :** `text-xs` pour description, `text-sm font-semibold` pour nom.

### Carte prépa physique (Julie B.)

```
┌───────────────────┐
│ Renfo              │  ← texte slate
│ Bas du corps      │
│ (Julie B.)        │  ← coach de la prépa
│ 0h40              │
└───────────────────┘
```

**Design :** fond `bg-gray-100 dark:bg-slate-800`, border-left `3px solid #94A3B8` (slate), texte `text-gray-600`.  
Pas de couleur sport — c'est une séance externe (prépa physique).

### Jour vide

Colonne sans contenu → fond blanc, border dashed optionnel `border-2 border-dashed border-gray-100`.

---

## Exemple : semaine 15–21 juin 2026

| Jour | Séances |
|------|---------|
| LUN 15 | Natation · Technique · éducatifs · 1h00 |
| MAR 16 | Vélo · Endurance Z2 · 1h15 + Renfo · Bas du corps (Julie B.) · 0h40 |
| MER 17 | Natation · Seuil · 8×100 · 1h00 |
| JEU 18 | Course · VMA · 6×800 · 0h50 ← **Aujourd'hui** |
| VEN 19 | Mobilité · Récup (Julie B.) · 0h20 |
| SAM 20 | Vélo · Sortie longue · 2h30 |
| DIM 21 | Course · Endurance Z2 · 1h15 |

---

## Interactions

| Action | Comportement |
|--------|--------------|
| Clic carte séance | Ouvre panneau latéral ou modal de détail séance |
| Clic jour vide | Ouvre modal "Ajouter une séance" pré-remplie avec la date |
| `<` / `>` semaine | Navigue, recharge les séances |
| Drag & drop séance | Déplace vers un autre jour (met à jour la date en base) |
| Hover carte | `shadow-md -translate-y-0.5 transition-all` |

---

## États

- **Chargement :** grille avec 7 colonnes, cartes skeleton shimmer
- **Semaine sans séances :** 7 colonnes vides avec message central "Semaine de repos ou pas encore planifiée"
- **Séance passée non complétée :** carte avec icône ⚠ ambre, fond légèrement desaturé

---

## API

```
GET /api/v1/calendar?weekStart=2026-06-15   → toutes séances de la semaine
GET /api/v1/training-plans/active           → semaine courante, total semaines
PATCH /api/v1/training-sessions/:id         → drag & drop (update date)
POST /api/v1/training-sessions              → ajout séance depuis clic jour
```

---

## Responsive

- **Desktop** : grille 7 colonnes complète
- **Tablette** : grille 3-4 colonnes avec scroll horizontal ou 2 lignes (LUN-JEU / VEN-DIM)
- **Mobile** : vue liste verticale par jour, pas de grille
