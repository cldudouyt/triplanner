# Spec : Design System — Tri Planner (Claude Design Export)

> Source : export Claude Design `Tri Planner.dc.html`  
> Remplace le design actuel (blue-600, gray-50, Inter).  
> À implémenter via `client/CLAUDE.md` + mise à jour des composants UI.

---

## Résumé des changements clés

| Élément | Avant | Après |
|---------|-------|-------|
| Couleur primaire | blue-600 (#2563EB) | orange (#EA580C → #FB923C) |
| Police | Inter | **Geist** (Google Fonts) |
| Fond page | gray-50 (#F9FAFB) | **#F4F5F7** + radial gradient |
| Fond sidebar | white | white (identique) |
| Active nav | gradient bleu | **orange tint + glow** |
| Logo icône | bleu | **gradient orange** |
| Header mobile | opaque | **glassmorphism** (backdrop-blur) |
| Bordures | gray-200 | **#ECEDF0** (légèrement warm) |
| Texte principal | gray-900 | **#1A1D27** (quasi-noir froid) |

---

## Tokens de couleur

### Palette principale

```css
/* Fond */
--bg-page:    #F4F5F7;
--bg-surface: #FFFFFF;
--bg-subtle:  #F8F9FB;
--bg-muted:   #F1F2F5;

/* Bordures */
--border:     #ECEDF0;
--border-sub: #F1F2F5;

/* Texte */
--text-primary:   #1A1D27;
--text-secondary: #6B7280;
--text-muted:     #9CA3AF;

/* Accent principal — orange (CTA, actif, primaire) */
--orange-light: #FB923C;   /* orange-400 */
--orange:       #F97316;   /* orange-500 */
--orange-dark:  #EA580C;   /* orange-600 */
--orange-cta:   linear-gradient(135deg, #FB923C, #EA580C);
--orange-glow:  0 10px 22px -8px rgba(234,88,12,.6);
--orange-tint:  rgba(249,115,22,.10);
--orange-ring:  0 0 0 1px rgba(249,115,22,.28), 0 8px 22px -10px rgba(234,88,12,.4);
```

### Couleurs sport (inchangées, renommées)

```css
--swim:  #0891B2;  /* cyan-600   */
--bike:  #059669;  /* emerald-600 */
--run:   #EA580C;  /* orange-600 */
--phys:  #64748B;  /* slate-500  */
--rest:  #9CA3AF;  /* gray-400   */

/* Teintes de fond (tint) */
--swim-tint: #ECFBFF;
--bike-tint: #ECFDF4;
--run-tint:  #FFF3EC;
--phys-tint: #F1F3F6;
```

### Couleurs sémantiques

```css
--success: #059669;  /* emerald-600 */
--danger:  #E11D48;  /* rose-600    */
--warning: #F59E0B;  /* amber-400   */
--info:    #0891B2;  /* cyan-600    */
```

---

## Typographie

### Police : Geist

```html
<!-- index.html — remplacer la police actuelle -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

```css
/* index.css */
body {
  font-family: 'Geist', system-ui, sans-serif;
}
```

### Hiérarchie typographique

| Usage | Taille | Poids | Color |
|-------|--------|-------|-------|
| Titre page (h1) | 21px / `text-xl` | 700 | `#1A1D27` |
| Titre section (h3) | 15px | 700 | `#1A1D27` |
| Valeur stat | 25px | 800 | `#1A1D27` |
| Corps texte | 13-14px | 400-600 | `#4B5563` |
| Label/caption | 11-12px | 600-700 | `#6B7280` |
| Micro-label | 10-11px | 700 + uppercase | `#9CA3AF` |
| Valeur numérique mono | — | 800 | `#1A1D27` |

---

## Layout

### Fond de page

```css
/* Fond avec radial gradient subtil — ambiance orange */
background:
  radial-gradient(120% 80% at 100% 0%, rgba(249,115,22,.10), transparent 52%),
  radial-gradient(100% 80% at 0% 100%, rgba(148,163,184,.12), transparent 55%),
  #F4F5F7;
```

Implémentation TailwindCSS (ajouter dans index.css) :
```css
.bg-page {
  background:
    radial-gradient(120% 80% at 100% 0%, rgba(249,115,22,.10), transparent 52%),
    radial-gradient(100% 80% at 0% 100%, rgba(148,163,184,.12), transparent 55%),
    #F4F5F7;
}
```

---

## Composants

### Sidebar

```
width: 240px
background: #FFFFFF
border-right: 1px solid #ECEDF0
padding: 20px 16px
```

**Logo** :
```html
<!-- Icône : gradient orange-400 → orange-600, border-radius 12px -->
<div style="width:38px;height:38px;border-radius:12px;
     background:linear-gradient(135deg,#FB923C,#EA580C);
     box-shadow:0 8px 18px -6px rgba(234,88,12,.5);">
  <!-- icône activité SVG blanc -->
</div>
<div>
  <div style="font-size:15.5px;font-weight:700;">Tri Planner</div>
  <div style="font-size:11px;color:#6B7280;">Subtitle</div>
</div>
```

**Nav item actif** :
```css
background: rgba(249,115,22,.12);
color: #1A1D27;
box-shadow: 0 0 0 1px rgba(249,115,22,.28), 0 8px 22px -10px rgba(234,88,12,.4);

/* Icône active */
background: linear-gradient(135deg,#FB923C,#EA580C);
color: #fff;

/* Icône inactive */
background: #F4F5F7;
color: #94A3B8;
```

**Widget objectif sidebar** :
```css
background: linear-gradient(150deg, rgba(249,115,22,.10), rgba(249,115,22,.04));
border: 1px solid rgba(249,115,22,.18);
border-radius: 16px;
```

**User footer** :
```css
background: #F4F5F7;
border-radius: 14px;
```

---

### Header sticky

```css
/* Glassmorphism */
background: rgba(255,255,255,.72);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border-bottom: 1px solid #ECEDF0;
```

**Bouton CTA header** :
```css
background: linear-gradient(135deg, #FB923C, #EA580C);
color: #fff;
box-shadow: 0 10px 22px -8px rgba(234,88,12,.6);
border-radius: 12px;
```

---

### Cards (surfaces)

```css
background: #FFFFFF;
border: 1px solid #ECEDF0;
border-radius: 18-20px;
box-shadow: 0 10px 30px -20px rgba(17,24,39,.22);
```

**Hover card compétition** :
```css
transition: transform .25s;
hover: transform: translateY(-4px);
```

**Session pill dans calendrier** :
```css
border-radius: 11px;
border-left: 3px solid <accent-couleur-sport>;
background: <tint-couleur-sport>;
```

---

### StatCards (tableau de bord)

```css
border-radius: 18px;
padding: 17px 18px;
background: #FFFFFF;
border: 1px solid #ECEDF0;
box-shadow: 0 8px 24px -18px rgba(17,24,39,.2);
```

**Icône stat** :
```css
width: 34px; height: 34px;
border-radius: 10px;
background: <tint>;    /* rgba(249,115,22,.12) | rgba(8,145,178,.12) | ... */
color: <accent>;
```

**Valeur** :
```css
font-size: 25px;
font-weight: 800;
letter-spacing: -0.02em;
```

---

### Boutons

**Primary (CTA fort)** :
```css
background: linear-gradient(135deg, #FB923C, #EA580C);
color: #fff;
box-shadow: 0 12px 26px -10px rgba(234,88,12,.6);
border-radius: 12px;
font-weight: 700;
/* active: transform: scale(.98) */
```

**Secondary (outline)** :
```css
border: 1px solid #E5E7EB;
background: #FFFFFF;
color: #4B5563;
border-radius: 12px;
/* hover: background: #F4F5F7 */
```

---

### Banner IA (Mon Plan)

```css
background: linear-gradient(135deg, #FB923C 0%, #F97316 52%, #EA580C 100%);
box-shadow: 0 22px 54px -26px rgba(234,88,12,.6);
border-radius: 20px;

/* Orbe décoratif */
position: absolute; top: -60px; right: -30px;
width: 230px; height: 230px; border-radius: 50%;
background: rgba(255,255,255,.12);
```

**Badge IA inline** :
```css
background: rgba(255,255,255,.22);
color: #fff;
border-radius: 999px;
font-size: 11.5px; font-weight: 700;
```

---

### Cards Compétition

**Header de la card (gradient selon priorité)** :
```css
/* Priorité A */
background: linear-gradient(135deg, #F43F5E, #E11D48);
/* Priorité B */
background: linear-gradient(135deg, #FB923C, #EA580C);
/* Priorité C */
background: linear-gradient(135deg, #64748B, #475569);
```

**Stats disciplines (swim/bike/run)** :
```css
/* Mini-card discipline */
padding: 9px 10px;
border-radius: 11px;
background: #F8F9FB;
```

---

### Notes IA (inline)

```css
background: rgba(249,115,22,.07);
border: 1px solid rgba(249,115,22,.24);
border-radius: 13px;
color: #9A3412;  /* orange-900 */
```

---

### Focus/Ring inputs

```css
/* focus */
border-color: #F97316;
box-shadow: 0 0 0 3px rgba(249,115,22,.18);
```

---

### Progress bars

```css
/* Track */
height: 9px;
border-radius: 99px;
background: #F1F2F5;

/* Fill orange */
background: linear-gradient(90deg, #FB923C, #EA580C);

/* Fill cyan */
background: linear-gradient(90deg, #22D3EE, #0891B2);
```

---

### Messages / Chat

```css
/* Bulle expéditeur (moi) */
background: linear-gradient(135deg, #FB923C, #EA580C);
color: #fff;
border-radius: 14px 14px 4px 14px;

/* Bulle reçue */
background: #FFFFFF;
color: #1A1D27;
border-radius: 14px 14px 14px 4px;
box-shadow: 0 4px 14px -10px rgba(17,24,39,.3);
```

---

## Animations

```css
/* Dot live (badge statut inscrit) */
@keyframes tpDot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(.6); opacity: .5; }
}
.animate-dot { animation: tpDot 1.7s ease-in-out infinite; }
```

---

## Implémentation TailwindCSS — mapping

| Token design | Tailwind équivalent | Notes |
|-------------|---------------------|-------|
| `#1A1D27` | `text-gray-900` / custom | Plus froid que gray-900 (#111827). Ajouter en custom si besoin |
| `#6B7280` | `text-gray-500` | ✓ exact |
| `#9CA3AF` | `text-gray-400` | ✓ exact |
| `#ECEDF0` | `border-gray-200` | Légèrement warm, acceptable |
| `#F4F5F7` | `bg-gray-100` | Très proche |
| `#F8F9FB` | `bg-gray-50` | Très proche |
| `#EA580C` | `text-orange-600` | ✓ exact |
| `#FB923C` | `text-orange-400` | ✓ exact |
| `#0891B2` | `text-cyan-600` | ✓ exact |
| `#059669` | `text-emerald-600` | ✓ exact |

### Variables CSS custom à ajouter dans `index.css`

```css
:root {
  --color-primary: #EA580C;
  --color-primary-light: #FB923C;
  --text-base: #1A1D27;
  --border-color: #ECEDF0;
  --bg-subtle: #F8F9FB;
}
```

---

## Checklist d'implémentation

- [ ] **FONT** — Ajouter Geist dans `index.html` + `body { font-family: 'Geist', ... }` dans `index.css`
- [ ] **FOND** — `AppLayout.tsx` : `bg-gray-50 dark:bg-slate-900` → classe `.bg-page` avec radial gradient
- [ ] **SIDEBAR** — Logo : gradient orange (remplace gradient bleu) + active state orange
- [ ] **PRIMAIRE** — Remplacer toutes les occurrences `blue-500/blue-600` par `orange-500/orange-600` sur les boutons CTA
- [ ] **HEADER** — Ajouter `backdrop-blur-sm bg-white/70` sur le header mobile sticky
- [ ] **StatCard** — Ombre plus prononcée + tint par couleur d'icône
- [ ] **Cards compétition** — Header gradient selon priorité A/B/C
- [ ] **Progress bars** — Hauteur 9px, radius 99px, gradient orange
- [ ] **Focus ring** — Orange ring sur tous les inputs (`focus:ring-orange-500`)
- [ ] **Nav active** — Remplacer le gradient bleu par orange tint + ring
- [ ] **Badge statut** — Dot animé avec `animate-dot`
- [ ] **`constants.ts`** — Mettre à jour `SPORT_COLORS` avec les nouvelles tintes

---

## Fichiers à modifier

| Fichier | Changements |
|---------|-------------|
| `client/index.html` | Ajouter Geist font |
| `client/src/index.css` | Variables CSS + `.bg-page` + `font-family` + `animate-dot` |
| `client/src/components/layout/Sidebar.tsx` | Logo orange, active orange, widget objectif |
| `client/src/components/layout/AppLayout.tsx` | Header glassmorphism |
| `client/src/components/ui/Button.tsx` | Primary → gradient orange |
| `client/src/components/ui/StatCard.tsx` | Tint icône par couleur |
| `client/src/components/ui/Card.tsx` | Border-radius 20px, shadow ajustée |
| `client/src/components/ui/ProgressBar.tsx` | Height 9px, gradient orange |
| `client/src/utils/constants.ts` | Ajouter `tint` dans SPORT_COLORS |
| `client/src/pages/LoginPage.tsx` | Logo orange |
| `client/src/pages/RegisterPage.tsx` | Logo orange |
