# Tri Planner — Design System (Claude Design)

Ce fichier est lu automatiquement par Claude quand il travaille dans le dossier `client/`.
Il définit les règles de design à respecter impérativement sur chaque composant, page ou PR.

---

## Principe fondamental

**Réutiliser avant de créer.** Avant d'écrire une classe Tailwind custom ou un nouveau composant, vérifier si `client/src/components/ui/` contient déjà ce qu'il faut.

---

## Composants UI disponibles

### `Card` — conteneur principal
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

<Card>                          // bg-white dark, border, rounded-2xl, p-6
<Card hover>                    // + hover:shadow-lg hover:-translate-y-1
<Card padding="sm">             // p-4 (défaut: "md" = p-6, "lg" = p-8)
<Card animate>                  // + animate-fade-in-up

<CardHeader>                    // flex justify-between mb-4
<CardTitle>                     // font-semibold, gère h1–h4 via prop `as`
<CardTitle as="h2">
<CardContent>                   // div wrapper simple
```

### `Button` — boutons d'action
```tsx
import { Button } from '@/components/ui/Button'

<Button>                        // variant="primary" (gradient bleu)
<Button variant="secondary">    // gris neutre
<Button variant="outline">      // bordure + fond transparent
<Button variant="ghost">        // texte seul, hover discret
<Button variant="danger">       // gradient rouge
<Button size="sm|md|lg">
<Button loading>                // spinner + disabled auto
<Button icon={<Icon />}>        // icône à gauche (iconPosition="right" pour droite)
<Button pulse>                  // animation pulse-scale (appel à l'action fort)
```

### `Badge` — étiquettes et statuts
```tsx
import { Badge } from '@/components/ui/Badge'

<Badge variant="success">       // vert
<Badge variant="warning">       // ambre
<Badge variant="danger">        // rouge
<Badge variant="info">          // cyan
<Badge variant="swim|bike|run|strength|rest">  // couleurs sport
<Badge dot>                     // pastille colorée avant le texte
<Badge dot pulse>               // pastille animée (live, en cours)
<Badge size="sm">               // plus petit (défaut: "md")
```

### `Modal` — dialogues
```tsx
import { Modal, ConfirmModal } from '@/components/ui/Modal'

<Modal isOpen={open} onClose={() => setOpen(false)} title="Titre">
  {/* contenu */}
</Modal>
// size: "sm" | "md" | "lg" | "xl" (défaut: "md")
// Fermeture : Escape + clic backdrop inclus

<ConfirmModal
  isOpen={open} onClose={...} onConfirm={...}
  title="Supprimer ?" message="Cette action est irréversible."
  variant="danger"           // "primary" | "warning" | "danger"
  confirmLabel="Supprimer"
  loading={isPending}
/>
```

### `StatCard` — carte de métrique
```tsx
import { StatCard } from '@/components/ui/StatCard'

<StatCard
  title="Distance totale"
  value="342 km"
  subtitle="ce mois"
  icon={<MapPin className="w-5 h-5" />}
  color="orange"             // blue | green | orange | purple | red | cyan
  trend={+12}                // nombre → affiche TrendingUp/Down + %
  animate                    // animate-fade-in-up
/>
```

### `Skeleton` — états de chargement
```tsx
import { SkeletonCard, SkeletonStatCard, SkeletonDashboard } from '@/components/ui/Skeleton'

<SkeletonCard className="h-48" />   // placeholder shimmer générique
<SkeletonStatCard />                 // placeholder pour StatCard
<SkeletonDashboard />                // placeholder page complète
```

### `EmptyState` — état vide
```tsx
import { EmptyState } from '@/components/ui/EmptyState'

<EmptyState variant="competitions" />
<EmptyState variant="training" />
<EmptyState variant="calendar" />
<EmptyState variant="statistics" />
<EmptyState variant="wellness" />
```

### `ProgressBar` / `CircularProgress`
```tsx
import { ProgressBar, CircularProgress } from '@/components/ui/ProgressBar'

<ProgressBar value={65} max={100} color="orange" />
<CircularProgress value={72} size={80} color="cyan" />
```

### `Toast` — notifications
```tsx
// Utiliser react-hot-toast (déjà configuré dans App.tsx)
import toast from 'react-hot-toast'

toast.success('Plan créé !')
toast.error('Erreur lors de la sauvegarde')
toast('Message neutre')
```

---

## Couleurs sport — source de vérité

```tsx
import { SPORT_COLORS } from '@/utils/constants'

// SPORT_COLORS.swim  → { color: '#06b6d4', bg: 'bg-cyan-500' }
// SPORT_COLORS.bike  → { color: '#22c55e', bg: 'bg-green-500' }
// SPORT_COLORS.run   → { color: '#f97316', bg: 'bg-orange-500' }
// SPORT_COLORS.strength → { color: '#a855f7', bg: 'bg-purple-500' }
// SPORT_COLORS.rest  → { color: '#94a3b8', bg: 'bg-slate-400' }
```

Ne jamais coder les couleurs sport en dur (`#06b6d4`). Toujours passer par `SPORT_COLORS`.

---

## Dark mode — règles obligatoires

Chaque classe de couleur doit avoir sa variante `dark:`. Jamais l'une sans l'autre.

| Contexte | Light | Dark |
|----------|-------|------|
| Fond card | `bg-white` | `dark:bg-slate-800` |
| Fond page | `bg-gray-50` | `dark:bg-slate-900` |
| Fond input | `bg-white` | `dark:bg-slate-700` |
| Fond hover | `hover:bg-gray-50` | `dark:hover:bg-slate-700` |
| Texte principal | `text-gray-900` | `dark:text-gray-100` |
| Texte secondaire | `text-gray-500` | `dark:text-gray-400` |
| Texte désactivé | `text-gray-400` | `dark:text-gray-600` |
| Bordure | `border-gray-200` | `dark:border-slate-700` |
| Séparateur | `border-gray-100` | `dark:border-slate-700` |
| Label form | `text-gray-700` | `dark:text-gray-300` |
| Placeholder | `placeholder-gray-400` | `dark:placeholder-gray-500` |
| `<option>` | — | `dark:bg-slate-700` (obligatoire sur les select) |

**Badges colorés en dark mode** (fond transparent, pas opaque) :
```
success → bg-green-100 text-green-800   dark:bg-green-900/30 dark:text-green-300
warning → bg-amber-100 text-amber-800   dark:bg-amber-900/30 dark:text-amber-300
danger  → bg-red-100 text-red-800       dark:bg-red-900/30   dark:text-red-300
info    → bg-cyan-100 text-cyan-800     dark:bg-cyan-900/30  dark:text-cyan-300
violet  → bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300
```

---

## Animations — classes disponibles

```css
animate-fade-in       /* opacity 0→1 (0.3s) — pages, sections */
animate-fade-in-up    /* opacity+translateY (0.4s) — cards */
animate-scale-in      /* scale 0.9→1 (0.2s) — modales, panels */
animate-shimmer       /* shimmer loading (skeleton) */
animate-progress-fill /* progress bars */
animate-pulse-scale   /* pulse + scale (bouton CTA fort) */
```

Règles d'usage :
- `animate-fade-in` → conteneur de page (le `<div className="max-w-... animate-fade-in">`)
- `animate-scale-in` → toute modale ou panel qui apparaît
- `animate-fade-in-up` → cartes dans une grille (via prop `animate` sur `<Card>` ou `<StatCard>`)
- Ne pas animer les éléments inline (spans, labels) — uniquement les blocs

---

## Typographie

```
Titre page h1    : text-2xl font-bold text-gray-900 dark:text-gray-100
Titre section h2 : text-lg font-semibold text-gray-900 dark:text-gray-100
Titre card h3    : font-semibold text-gray-900 dark:text-gray-100   ← CardTitle par défaut
Label form       : text-sm font-medium text-gray-700 dark:text-gray-300
Corps texte      : text-sm text-gray-600 dark:text-gray-400
Texte secondaire : text-xs text-gray-500 dark:text-gray-400
Valeur numérique : font-mono (temps, distances, stats)
```

---

## Formulaires

### Input standard
```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Nom
  </label>
  <input
    type="text"
    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600
               bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
               focus:ring-2 focus:ring-blue-500 focus:border-transparent
               placeholder-gray-400 dark:placeholder-gray-500 transition-colors"
  />
</div>
```

### Select
```tsx
<select className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-600
                   bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent">
  <option className="dark:bg-slate-700">Option 1</option>
</select>
```

### Textarea
Mêmes classes que l'input + `resize-none`.

### Toggle switch (préférences)
```tsx
<label className="flex items-center justify-between cursor-pointer">
  <span className="text-sm text-gray-700 dark:text-gray-300">Activer</span>
  <div
    onClick={toggle}
    className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer
      ${enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform
      ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
  </div>
</label>
```

---

## Structure d'une page

```tsx
export default function MaPage() {
  // 1. Data fetching
  const { data, isLoading } = useQuery({ queryKey: ['ma-resource'], queryFn: ... })

  // 2. Skeleton
  if (isLoading) return <SkeletonDashboard />

  // 3. Empty state
  if (!data?.length) return <EmptyState variant="..." />

  // 4. Page
  return (
    <div className="max-w-4xl animate-fade-in">        {/* max-w selon contenu */}
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Titre</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sous-titre</p>
        </div>
        <Button icon={<Plus />}>Ajouter</Button>
      </div>

      {/* Contenu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(item => (
          <Card key={item.id} hover animate>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
              <Badge variant="success">Actif</Badge>
            </CardHeader>
            <CardContent>...</CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

---

## Icônes — lucide-react

```tsx
import { NomDeLIcone } from 'lucide-react'
// Taille standard dans les boutons : className="h-4 w-4"
// Taille dans les headers de section : className="h-5 w-5"
// Taille dans les StatCard : className="w-5 h-5"
```

Icônes courantes dans ce projet :
- Navigation : `LayoutDashboard`, `Trophy`, `Dumbbell`, `Calendar`, `BarChart3`, `Target`
- Actions : `Plus`, `Edit`, `Trash2`, `Share2`, `Download`, `Upload`, `ExternalLink`
- Sport : `Activity`, `MapPin`, `Clock`, `Zap`, `Heart`, `Flame`
- IA : `Sparkles`, `Bot`, `Lightbulb`
- État : `CheckCircle2`, `AlertTriangle`, `Info`, `X`, `ChevronDown`, `ChevronUp`

---

## Layouts courants

### Grille 3 colonnes avec sidebar
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2 space-y-6">
    {/* Contenu principal */}
  </div>
  <div className="space-y-6">
    {/* Sidebar droite */}
  </div>
</div>
```

### Grille de stats (4 colonnes)
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <StatCard ... />
</div>
```

### Section avec titre et séparateur
```tsx
<div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Titre section</h3>
  <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
    {/* contenu */}
  </div>
</div>
```

---

## Règles absolues

1. **Ne jamais créer** un composant Button, Card, Badge, Modal custom — utiliser ceux de `ui/`.
2. **Toujours le dark mode** — chaque classe couleur a sa paire `dark:`.
3. **`animate-fade-in` sur chaque page** — le `<div>` racine de la page.
4. **`animate-scale-in` sur chaque modale** — le composant Modal l'applique déjà automatiquement.
5. **`SPORT_COLORS`** pour les couleurs sport — jamais de valeur hex en dur.
6. **Skeleton avant EmptyState** — l'ordre `isLoading → isEmpty → content` est impératif.
7. **Pas de `style={{color: '...'}}` pour les couleurs Tailwind** — seulement pour les couleurs dynamiques (`SPORT_COLORS.swim.color`).
