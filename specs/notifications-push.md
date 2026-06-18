# Spec : Notifications Push / Email

## Objectif
Envoyer des rappels automatiques avant les compétitions et les séances d'entraînement.

## Comportement attendu

### Rappels compétition
- J-7, J-3, J-1 avant chaque compétition avec statut `planned`
- Canal : email (SMTP déjà configuré dans env.ts)
- Contenu : nom, date, lieu, checklist équipement

### Rappels séance
- Veille de chaque séance à 20h
- Canal : email
- Contenu : titre séance, durée, type, description courte

### Préférences
Modèle `NotificationPreferences` existe déjà en BDD :
```
emailSessionReminder: Boolean
emailCompetitionReminder: Boolean
reminderDaysBefore: Int (défaut: 1)
```

## Implémentation

### Backend
- `server/src/modules/notifications/notifications.service.ts`
  - `sendCompetitionReminder(userId, competition)`
  - `sendSessionReminder(userId, session)`
- Cron job (node-cron) dans `server/src/index.ts` — s'exécute tous les jours à 8h
- Le service email (`nodemailer`) est déjà configuré dans le projet

### Frontend
- Page Paramètres : section "Notifications" déjà mentionnée
- `PATCH /api/v1/notifications/preferences` pour sauvegarder

## Dépendances
- `node-cron` (à installer)
- `nodemailer` (déjà installé)

## Contraintes
- En mode dev (`NODE_ENV=development`), logger les emails dans la console au lieu de les envoyer
- Ne pas envoyer si `emailSessionReminder: false`
