# Vérifier les types TypeScript

Lance la vérification TypeScript sur les deux projets (serveur et client) et affiche les erreurs.

## Commandes à exécuter

```powershell
cd "c:\dev\TEST_Claude\server"
npx tsc --noEmit
```

```powershell
cd "c:\dev\TEST_Claude\client"
npx tsc --noEmit
```

Si les deux commandes ne produisent aucune sortie, tout est OK.

En cas d'erreurs, les analyser et proposer des corrections.
