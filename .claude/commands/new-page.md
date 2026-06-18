# Créer une nouvelle page frontend

Crée une nouvelle page React dans `client/src/pages/$ARGUMENTS.tsx` et l'enregistre dans le routeur.

## Structure à générer

### Page `client/src/pages/$ARGUMENTS.tsx`

Pattern standard du projet :

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

export default function $ARGUMENTSPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['$ARGUMENTS'],
    queryFn: () => api.list().then(r => r.data),
  })

  if (isLoading) return <SkeletonDashboard />

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Titre</h1>
      {/* ... */}
    </div>
  )
}
```

### Règles obligatoires
- **Dark mode** : chaque classe de couleur doit avoir sa variante `dark:`
  - `bg-white dark:bg-slate-800`
  - `text-gray-900 dark:text-gray-100`
  - `border-gray-200 dark:border-slate-700`
- **Loading** : utiliser `SkeletonDashboard` ou `SkeletonCard` pendant le chargement
- **Vide** : utiliser `EmptyState` avec la variante appropriée quand la liste est vide
- **Animation** : `animate-fade-in` sur le container principal

### Enregistrement dans le routeur

Après génération, rappeler d'ajouter la route dans `client/src/routes/` (ou le fichier de routes principal) :
```tsx
{ path: '/$ARGUMENTS', element: <$ARGUMENTSPage /> }
```

Et d'ajouter le lien dans le `Sidebar` si c'est une page principale.
