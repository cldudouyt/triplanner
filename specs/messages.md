# Spec : Messages

> Source : capture `6-Messages.png` — Claude Design export  
> Priorité : moyenne — pré-requis pour Club IA (communication coach ↔ athlète)

---

## Contexte

Messagerie interne entre athlètes et leurs coachs (dans le contexte Club IA), ou entre utilisateurs du groupe. Accessible depuis la sidebar nav item "Messages" avec un badge de compteur non-lus.

Header de page : **"Messages · Échanges avec ton coach et le club"**

---

## Fils visibles (exemple Léa)

| Avatar | Nom | Rôle | Dernier message | Délai |
|--------|-----|------|-----------------|-------|
| TM (orange) | Thomas Mercier | Coach | "J'ai ajusté ta semaine, focus natation." | 2h |
| JB (gris) | Julie B. · prépa | Coach prépa physique | "Renfo décalé au mardi, ok pour toi ?" | hier |
| GR (gris) | Groupe Half La Baule | Groupe | "Sofia : sortie longue dimanche ?" | 2j |

Le rôle est affiché en sous-titre sur le nom dans la liste : `"Coach"`, `"prépa"`, `"Groupe"`.

---

## Conversation active (Thomas Mercier)

**Header :** avatar TM (orange) + `Thomas Mercier` (bold) + `Coach · en ligne` (texte vert petit)

**Messages :**

Reçu (gauche, gris) :
> "Salut Léa ! Belle semaine dernière, tu progresses bien en natation 💪" — 09:12

Envoyé (droite, orange gradient) :
> "Merci coach ! Par contre les jambes étaient lourdes sur la VMA." — 09:20

**Barre de saisie :** `"Écrire un message..."` + bouton send (icône avion, fond orange).

---

## Route

```
/messages              → liste des conversations
/messages/:threadId    → conversation ouverte
```

Nav sidebar : `{ to: '/messages', icon: MessageSquare, label: 'Messages', badge: unreadCount }` — en bas du nav, avant Paramètres.

---

## Modèle de données (Prisma)

```prisma
model MessageThread {
  id           Int       @id @default(autoincrement())
  participants Int[]     // tableau de userId
  lastMessage  String?
  lastAt       DateTime?
  createdAt    DateTime  @default(now())
  messages     Message[]
}

model Message {
  id        Int           @id @default(autoincrement())
  threadId  Int
  thread    MessageThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  senderId  Int
  sender    User          @relation(fields: [senderId], references: [id])
  content   String
  readBy    Int[]         // tableau de userId qui ont lu
  createdAt DateTime      @default(now())
}
```

---

## Layout

Split-view 2 colonnes sur desktop :
- **Gauche (360px)** : liste des fils + barre de recherche
- **Droite (flex-1)** : conversation active

Sur mobile : vue liste → tap → vue conversation (back button).

---

## Liste des fils (colonne gauche)

### Header

```
Messages  [Nouveau message ✏]
[🔍 Rechercher une conversation...]
```

### Fil d'item

```
[Avatar gradient] [Nom correspondant · il y a Xh]
                  [Extrait du dernier message]
                  [Badge N non-lus → bg orange]
```

- Fil actif : `bg-orange-500/8`, border gauche `border-l-2 border-orange-500`
- Fil non-lu : nom en **font-semibold**, extrait en `text-gray-900`
- Fil lu : nom normal, extrait en `text-gray-500`
- Tri : par `lastAt` décroissant

---

## Conversation (colonne droite)

### Header conversation

```
[← retour mobile]  [Avatar] [Nom · Titre/Rôle]  [⋯ options]
```

Sticky, glassmorphism : `bg-white/80 backdrop-blur-sm border-b`.

### Zone messages

Scroll vertical. Messages groupés par jour avec séparateur date centré :
```
─────── Aujourd'hui ───────
```

**Bulle message ENVOYÉ (droite) :**
```
                               [Contenu message]  [lu ✓]
                                    [HH:MM]
```
Fond : `bg-gradient-to-br from-orange-400 to-orange-600`, texte blanc, `rounded-[18px] rounded-br-[4px]`.

**Bulle message REÇU (gauche) :**
```
[Avatar S]  [Contenu message]
                [HH:MM]
```
Fond : `bg-white border border-gray-100 shadow-sm`, `rounded-[18px] rounded-bl-[4px]`.

### Zone saisie

Sticky en bas :
```
[📎] [Textarea "Écrivez un message..."] [Envoyer →]
```

- Textarea : auto-resize jusqu'à 4 lignes
- Envoi : `Enter` (sans Shift) ou bouton → POST `/api/v1/messages`
- Bouton désactivé si message vide
- Bouton envoyer : gradient orange, icône ArrowRight

---

## API Backend

```
GET  /api/v1/messages                    → liste des fils de l'utilisateur
GET  /api/v1/messages/:threadId          → messages d'un fil (paginated, limit 50)
POST /api/v1/messages                    → créer fil + premier message
     body: { recipientId, content }
POST /api/v1/messages/:threadId          → ajouter message dans un fil
     body: { content }
PATCH /api/v1/messages/:threadId/read    → marquer tous les messages comme lus
GET  /api/v1/messages/unread-count       → nombre total non-lus (badge sidebar)
```

### Temps réel (optionnel — phase 2)

Polling toutes les 10s sur `GET /api/v1/messages/:threadId` ou SSE sur `/api/v1/messages/stream`.

---

## Frontend

```
client/src/pages/MessagesPage.tsx              → layout split-view
client/src/components/messages/ThreadList.tsx  → liste des fils gauche
client/src/components/messages/ThreadItem.tsx  → un fil dans la liste
client/src/components/messages/Conversation.tsx → zone messages + input
client/src/components/messages/MessageBubble.tsx → bulle individuelle
client/src/api/messages.api.ts                 → appels API
```

---

## Intégration Club IA

- Quand un coach envoie un plan via "Valider & envoyer", un message automatique est créé dans le fil coach ↔ athlète :
  > *"📋 J'ai mis à jour ton plan pour la semaine 6. [Voir le plan →]"*
- L'athlète reçoit une notification (badge +1 sur Messages dans la sidebar)
- La conversation `coach ↔ athlète` est créée automatiquement à l'assignation club

---

## Design

- Badge non-lu sidebar : pastille orange `bg-orange-500 text-white text-xs rounded-full w-5 h-5`
- Bulles émetteur : gradient orange identique au bouton primary
- Séparateur date : `text-xs text-gray-400 uppercase tracking-wide`
- Avatar : initiales sur fond gradient unique par user (hash du nom → couleur)
- Nouveau message modal : overlay avec champ "Destinataire" (autocomplete membres du club)
