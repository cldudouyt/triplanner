# Ajouter un modèle Prisma

Ajoute un nouveau modèle au schéma `server/prisma/schema.prisma` et l'applique à la base de données.

## Workflow

### 1. Éditer `server/prisma/schema.prisma`

Pattern standard d'un modèle utilisateur :
```prisma
model NomDuModele {
  id        Int      @id @default(autoincrement())
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Champs métier ici
  nom       String
  valeur    Float?
  notes     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
}
```

Ne pas oublier d'ajouter la relation inverse sur `User` :
```prisma
model User {
  // ...existant...
  nomDuModeles NomDuModele[]
}
```

### 2. Appliquer le schéma

```powershell
cd "c:\dev\TEST_Claude\server"
npx prisma db push
```

⚠️ **Ne jamais utiliser `prisma migrate dev`** — cela peut réinitialiser la base.

### 3. Générer le module

Utiliser `/new-module` pour créer le CRUD correspondant.
