# Créer un nouveau module backend

Crée un nouveau module Express/Prisma/TypeScript dans `server/src/modules/$ARGUMENTS/`.

## Structure à créer

Génère les 4 fichiers suivants en respectant exactement les patterns du projet (voir CLAUDE.md) :

### 1. `$ARGUMENTS.schema.ts`
Schémas Zod pour `Create${Name}Input` et `Update${Name}Input`. Utiliser `z.string().min(1)` pour les champs requis, `.optional()` pour les optionnels.

### 2. `$ARGUMENTS.service.ts`
- Import `prisma from '../../config/database.js'`
- Fonctions : `create(userId, data)`, `list(userId)`, `getById(userId, id)`, `update(userId, id, data)`, `delete(userId, id)`
- Toutes les requêtes filtrent par `userId` pour isolation des données

### 3. `$ARGUMENTS.controller.ts`
- Import `Request, Response` depuis express
- Un handler par opération CRUD
- Récupérer `userId` via `req.user!.userId`
- Répondre avec `res.json()` ou `res.status(201).json()` pour create

### 4. `$ARGUMENTS.routes.ts`
```typescript
import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createSchema, updateSchema } from './$ARGUMENTS.schema.js'
import * as controller from './$ARGUMENTS.controller.js'

const router = Router()
router.use(authenticate)
router.get('/', controller.list)
router.post('/', validate(createSchema), controller.create)
router.get('/:id', controller.getById)
router.put('/:id', validate(updateSchema), controller.update)
router.delete('/:id', controller.delete)
export default router
```

## Après création

Rappeler à l'utilisateur d'ajouter dans `server/src/app.ts` :
```typescript
import ${name}Routes from './modules/$ARGUMENTS/$ARGUMENTS.routes.js'
app.use('/api/v1/$ARGUMENTS', ${name}Routes)
```

Et dans le client, créer `client/src/api/$ARGUMENTS.api.ts` avec les méthodes correspondantes.
