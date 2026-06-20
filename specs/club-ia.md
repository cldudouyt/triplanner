# Spec : Espace Club IA

> Source : captures `7-Espace club - Vue Coach.png` + `8-Espace club - Vue Athlete.png`  
> Client : TCN · Coach Thomas Mercier → athlètes club  
> Priorité : haute — différenciateur produit fort

---

## Contexte

Le club (TCN) veut une couche de gestion équipe **par-dessus** l'app individuelle. L'IA analyse la charge de chaque athlète et **propose** des ajustements de plan ; le **coach valide** avant envoi. L'athlète reçoit un plan enrichi avec badge "Optimisé IA" et le mot de son coach.

---

## Rôles

| Rôle | Accès | Interface |
|------|-------|-----------|
| `coach` | Tous les athlètes du club, assistant IA | Vue Coach (toggle header) |
| `athlete` | Son propre plan | Vue Athlète (toggle header) |
| `admin` | Gestion club | Admin existant |

Un même compte peut être coach ET athlète (le toggle de vue en header le permet).

---

## Route

```
/club          → redirige vers /club/coach ou /club/athlete selon rôle
/club/coach    → vue coach (roster + assistant IA)
/club/athlete  → vue athlète (plan reçu)
```

Nav sidebar (vue utilisateur normal) : `{ to: '/club', icon: Users, label: 'Espace club · IA' }` — entre Statistiques et Messages.

---

## Sidebar en mode Coach (différente du sidebar normal)

Quand l'utilisateur est en mode Coach, la sidebar change complètement :

```
[M] Tri Planner
    Triathlon Club Nantais

● Mode Coach                ← indicateur dot orange, fond orange teinté

  Tableau de bord
● Mon groupe               ← nav coach spécifique
  Plans & assignations
  Calendrier
  Compétitions
  Messages
```

**Indicateur "Mode Coach" :** dot orange animé (`animate-dot`) + texte, fond `bg-orange-50 dark:bg-orange-900/20`.

---

## Sidebar en mode Athlète (vue Espace Club)

```
[M] Tri Planner
    Triathlon Club Nantais

● Mode Athlète              ← indicateur dot gris

  Tableau de bord
● Mes coéquipiers           ← nav athlète spécifique
● Mon plan                  ← actif sur cet écran
  Calendrier
  Compétitions
  Messages
```

---

## Modèle de données (Prisma)

```prisma
model Club {
  id        Int      @id @default(autoincrement())
  name      String
  createdAt DateTime @default(now())
  members   ClubMember[]
}

model ClubMember {
  id        Int      @id @default(autoincrement())
  clubId    Int
  club      Club     @relation(fields: [clubId], references: [id], onDelete: Cascade)
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      String   // 'coach' | 'athlete'
  createdAt DateTime @default(now())
  @@unique([clubId, userId])
}

model CoachPlanSuggestion {
  id          Int      @id @default(autoincrement())
  coachId     Int
  athleteId   Int
  planId      Int
  weekNumber  Int
  suggestions Json     // tableau des ajustements IA
  coachNote   String?
  status      String   @default("draft") // draft | sent | accepted | rejected
  createdAt   DateTime @default(now())
  sentAt      DateTime?
  respondedAt DateTime?
}
```

---

## Vue Coach — Espace Club

### Header de page

```
Espace Coach
Triathlon Club Nantais · 12 athlètes · saison 2026
```

Toggle **Vue Coach / Vue Athlète** : pill segmenté dans le coin TOP-RIGHT du header de page (pas dans la sidebar).

```
[👤 Vue Coach]  [🏃 Vue Athlète]
```

- Actif : `bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-xl`
- Inactif : `bg-transparent text-gray-500 hover:text-gray-700`

### Stats club (3 cards en ligne)

| Métrique | Exemple | Description |
|----------|---------|-------------|
| Athlètes suivis | 12 | Membres du club avec rôle `athlete` |
| Plans actifs | 9 | Plans en cours (non terminés) |
| Séances faites · semaine | **84%** (71 / 84) | % en `text-emerald-600 font-bold text-2xl` |

### Roster — "Mon groupe" (titre de section)

Titre : `Mon groupe · Trié par charge`. Triée par CTL décroissant.

Chaque ligne (exemple réel) :

```
[LF orange]  Léa Fontaine     Avancé    CTL    FORME    ● Plan à valider
             Triathlon de               82      −5
             Nantes · J-24

[MP gris]    Marc Petit       Inter.    CTL    FORME    ● Plan envoyé
             Tri Sprint de              64      +8
             Vertou · J-12

[SA gris]    Sofia Adler      Avancé    CTL    FORME    ● Plan envoyé
             Half... · J-50            91      −2
```

**Statuts badge avec dot animé (`animate-dot`) :**
- `Plan à valider` → orange → sélectionne l'athlète dans l'assistant IA
- `Plan envoyé` → emerald
- `À assigner` → slate

**Interaction :** clic sur une ligne → sélectionne l'athlète dans le panneau Assistant IA à droite.  
**Ligne active** : `border: rgba(249,115,22,.5)`, `shadow: 0 14px 32px -16px rgba(234,88,12,.45)`.

### Assistant Plan IA (panneau droit — sticky)

Fond : `linear-gradient(165deg, rgba(249,115,22,.09), #FFFFFF 42%)`, border orange.

#### Structure

1. **Header IA** — icône étoile orange, titre "Assistant Plan IA", sous-titre "Coche les ajustements à appliquer"

2. **Athlète sélectionné** — mini card avec avatar, nom, course + forme TSB

3. **Prépa physique synchronisée** — bandeau slate si Julie B. a des séances :
   - Icône haltères
   - "Prépa physique synchronisée · Julie B. · N séances · X h prises en compte"

4. **Base du plan** — "Base : Prépa Triathlon · Semaine X / 12"

5. **Suggestions IA** (4 items, toggle on/off) :

Chaque suggestion :
```
[Toggle switch] [Icône tintée] [Titre · Delta badge] [Explication why]
```

| Suggestion | Icône | Couleur tint |
|-----------|-------|-------------|
| Charge hebdo allégée | balance | orange |
| Focus natation | vague | cyan |
| Récup renforcée | lit | emerald |
| Synchro prépa physique | haltères | slate |

Toggle actif : `bg: linear-gradient(135deg,#FB923C,#EA580C)`, knob à droite.  
Toggle inactif : `bg: #D1D5DB`, knob à gauche.  
Card active : `bg: rgba(249,115,22,.09)`, border orange.

6. **Aperçu du plan recomposé** (live, recalculé à chaque toggle) :

```
[X / 4 appliqués]
Volume TRI   Séances   Natation
8h35         6         2
↓ −30 min    (delta vs base)
─────────────────────────────
Prépa physique : 3 séances · 1h20 · aucun cumul / ⚠ cumul jeudi
```

7. **Mot du coach** — textarea plein largeur, placeholder "Ajoute un message pour l'athlète…"

8. **Actions** :
   - `Régénérer` (outline) → appel IA pour nouvelles suggestions
   - `Valider & envoyer · N ajust.` (primary orange) → crée `CoachPlanSuggestion` + notifie l'athlète

---

## Vue Athlète — Mon entraînement

### Header de page

```
Mon entraînement
Léa Fontaine · Prépa Triathlon de Nantes
```

Toggle Vue Coach / Vue Athlète identique (mais Vue Athlète active).

### Banner orange (gradient)

```
[✦ Optimisé par IA] [↔ Prépa physique incluse]    Reçu il y a 2h
Plan du coach · Semaine 6 / 12                    [✓ Accepter le plan]

[TM] « Belle régularité Léa. On allège un peu le vélo et on cale le
      renfo avec Julie, focus technique natation. »
```

- Gradient : `linear-gradient(135deg, #FB923C 0%, #F97316 52%, #EA580C 100%)`
- Orbe décoratif top-right
- Bouton "Accepter" : fond blanc, texte `#C2410C`, shadow noire

### Vue semaine "Ma semaine" (7 jours)

Légende horizontale au-dessus : `● Natation  ● Vélo  ● Course  ■ Prépa physique`

Grille 7 colonnes. Exemple réel (semaine 15–21 juin) :

| Jour | Contenu |
|------|---------|
| LUN | ● Natation · Technique · éducatifs · 1h00 |
| MAR | ● Vélo · Endurance Z2 · 1h30 + pill [Renfo bas du corps 40'] |
| MER | ● Natation · Seuil · 8×100 · 1h00 + badge [Ajusté IA] |
| JEU | ● Course · VMA · 6×800 · 0h50 + badge [Ajusté IA] (orange) |
| VEN | ● Repos · Mobilité · — + pill [Mobilité 20'] |
| SAM | ● Vélo · Sortie longue · 2h30 + badge [Ajusté IA] |
| DIM | ● Course · Endurance Z2 · 1h15 + badge [Ajusté IA] + pill [Gainage 20'] |

**Badges "Ajusté IA" :** `bg: rgba(249,115,22,.16)`, `color: #C2410C`, icône ✦  
**Pills prépa physique** (Renfo/Mobilité/Gainage) : `bg-gray-100 text-gray-600 text-xs rounded-lg px-2 py-1`  
**Border card** : orange `border-orange-300` si ajustement IA, sinon `border-gray-200`

### Section "Ce que l'IA a ajusté"

Panel avec fond `linear-gradient(160deg, rgba(249,115,22,.07), #FFFFFF 45%)`, border orange.

Grille 2 colonnes de diff-cards :

```
Sortie longue vélo                 [Appliqué]
3h00 → 2h30  (strikethrough ancien, → flèche orange, nouveau en couleur)
Charge réduite : forme à −5...
```

Badge "Appliqué" → emerald. Badge "Ignoré" → slate.

---

## API Backend

```
GET  /api/v1/club                    → infos du club + membres
GET  /api/v1/club/roster             → liste athlètes avec CTL/TSB/statut
POST /api/v1/club/ai/generate        → IA génère suggestions pour un athlète
     body: { athleteId, planId, weekNumber }
     → CoachPlanSuggestion (status: draft)

POST /api/v1/club/ai/send            → valide et envoie le plan
     body: { suggestionId, appliedIds[], coachNote }
     → patch statut → 'sent', notifie athlète

PATCH /api/v1/club/plan/respond      → athlète accepte/refuse
     body: { suggestionId, action: 'accept'|'reject' }

GET  /api/v1/club/plan/:athleteId/current → plan actif de l'athlète (vue athlète)
```

### Génération IA

L'IA (`claude-opus-4-8`, `thinking: { type: 'adaptive' }`) reçoit :
- Données de l'athlète (CTL/ATL/TSB, wellness récent)
- Plan de base de la semaine (séances existantes)
- Séances prépa physique (coach Julie B.)
- Compétition prochaine (J-X)

Et retourne un JSON structuré :
```json
{
  "suggestions": [
    {
      "type": "reduce_volume",
      "title": "Charge hebdo allégée",
      "delta": "−30 min",
      "why": "Forme en baisse...",
      "changes": [{ "day": "sam", "from": {...}, "to": {...} }]
    }
  ]
}
```

---

## Frontend

```
client/src/pages/ClubPage.tsx               → route /club, redirect selon rôle
client/src/pages/ClubCoachPage.tsx          → vue coach
client/src/pages/ClubAthletePage.tsx        → vue athlète
client/src/components/club/RosterCard.tsx   → ligne athlète
client/src/components/club/AiAssistant.tsx  → panneau IA coach (sticky)
client/src/components/club/SuggestionToggle.tsx → item toggle suggestion
client/src/components/club/PlanPreview.tsx  → aperçu plan recomposé
client/src/components/club/WeekGrid.tsx     → grille 7 jours (vue athlète)
client/src/components/club/DiffCard.tsx     → card diff avant/après
client/src/api/club.api.ts                  → appels API club
```

---

## Contraintes

- Si `!user.clubId` → message "Vous n'appartenez pas encore à un club. Contactez votre coach."
- Si rôle `athlete` uniquement → pas de Vue Coach dans le toggle
- Régénération IA : max 3 fois par semaine par athlète (coût Claude)
- Plan envoyé mais non accepté après 48h → notification de relance coach
- Prépa physique visible seulement si les séances sont saisies dans le module `training-sessions` avec le tag `physical_prep`

---

## Design

Voir `specs/design-system.md` pour les tokens.

Points spécifiques à ce module :
- Toggle Coach/Athlète : pill segmenté dans le header (pas dans la sidebar)
- Roster : hover `transform: translateY(-2px)`, border orange quand actif
- Assistant IA : fond dégradé orange très subtil, border `rgba(249,115,22,.30)`
- Suggestions : toggle switch animé (transition transform .2s)
- Banner athlète : même pattern que le banner "Mon Plan" (gradient orange complet)
