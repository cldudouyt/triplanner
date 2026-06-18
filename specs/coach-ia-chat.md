# Spec : Coach IA — Chat contextuel

## Objectif
Un assistant IA disponible en permanence via un bouton flottant, qui connaît le contexte complet de l'utilisateur (compétitions, plans, wellness, Strava).

## Comportement attendu

### Interface
- Bouton flottant (coin bas-droit) avec icône robot
- S'ouvre en panel latéral ou modale
- Historique de la conversation (session courante, pas persisté)

### Contexte injecté automatiquement
À chaque message, Claude reçoit :
- Prochaine compétition (nom, date, J-X jours)
- Plan en cours (semaine actuelle, séances à venir)
- Wellness du jour (readinessScore, fatigue)
- Alertes actives (tendance wellness)
- ATL/CTL/TSB actuels

### Exemples de questions
- "Est-ce que je suis prêt pour ma compétition dans 10 jours ?"
- "J'ai mal aux genoux depuis 3 jours, que faire ?"
- "Adapte ma séance d'aujourd'hui à mon niveau de forme"
- "Explique-moi mon TSB actuel"

### Format de réponse
Réponses courtes (200-400 tokens), en français, bienveillantes, pratiques.
Proposer des ajustements de séances quand pertinent.

## Implémentation

### Backend
- `POST /api/v1/ai/chat`
- Body : `{ message: string, conversationHistory: Message[] }`
- Injecte le contexte utilisateur dans le system prompt
- Streaming SSE pour affichage temps réel

### Frontend
- `client/src/components/coach/CoachChat.tsx`
- `client/src/components/coach/CoachButton.tsx` (bouton flottant)
- Rendu markdown des réponses
- Indicateur de saisie (streaming dots)

### Modèle Claude
- `claude-opus-4-8`, `thinking: { type: 'adaptive' }`, `max_tokens: 1000`
- Streaming obligatoire (latence visible sinon)

## System prompt
```
Tu es un coach triathlon personnel bienveillant et expert.
Tu connais le profil de l'athlète :
{context}

Réponds en français, de façon concise et actionnable (max 300 mots).
Adapte tes conseils à l'état de forme actuel.
```
