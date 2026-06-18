# Recréer le compte démo

Supprime et recrée le compte de démonstration avec toutes ses données.

## Commande

```powershell
cd "c:\dev\TEST_Claude\server"
npx tsx prisma/seed-demo.ts
```

## Compte démo recréé

| Champ | Valeur |
|-------|--------|
| Email | `demo@triathlon-planner.fr` |
| Mot de passe | `demo1234` |

## Contenu
- 8 compétitions (3 passées avec résultats, 5 futures)
- 5 plans d'entraînement à différents niveaux
- Séances avec données réelles
- Logs wellness
- Records personnels
- Badges débloqués

Le script est idempotent : il supprime toutes les données de ce compte avant de les recréer.
