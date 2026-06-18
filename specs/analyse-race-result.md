# Spec : Analyse IA des résultats de compétition

## Objectif
Après une compétition terminée (statut `completed`, `result` rempli), proposer une analyse IA du résultat avec des recommandations pour la prochaine saison.

## Comportement attendu

### Déclencheur
Bouton "Analyser avec Claude" sur la page détail d'une compétition dont :
- `status === 'completed'`
- `result` est rempli (résultat Strava ou saisi manuellement)

### Contenu de l'analyse
Claude reçoit en contexte :
- Type de compétition (triathlon sprint, marathon, etc.)
- Résultat obtenu (temps + splits si dispo)
- Objectif chronométrique (`chronoObjective`)
- Plan d'entraînement associé (volume, niveau)
- Données wellness J-7 avant la compétition
- ATL/CTL/TSB du jour de la course

Claude produit :
1. **Évaluation** : résultat vs objectif (atteint / raté / dépassé)
2. **Points forts** : ce qui a bien fonctionné
3. **Points d'amélioration** : sur quoi travailler
4. **Recommandations** : 3 actions concrètes pour la prochaine fois
5. **Forme le jour J** : interprétation du TSB (était-il en forme ?)

### Format réponse
JSON :
```json
{
  "evaluation": "Objectif atteint en 1:23:45 (-2min vs objectif)",
  "strengths": ["Excellente natation (17min)", "..."],
  "improvements": ["Transition T1 lente (3min)", "..."],
  "recommendations": ["...", "...", "..."],
  "formAnalysis": "TSB +12 le jour J = forme optimale. Bon timing d'affûtage."
}
```

## Implémentation

### Backend
- `POST /api/v1/ai/analyze-competition` (nouveau endpoint)
- Paramètre : `{ competitionId: number }`
- Service : enrichir le contexte depuis BDD, appeler Claude

### Frontend
- `client/src/pages/CompetitionDetailPage.tsx`
- Bouton + modal ou section dépliante pour afficher l'analyse
- Skeleton pendant la génération (peut prendre ~10s)

## Modèle Claude
`claude-opus-4-8` avec `thinking: { type: 'adaptive' }`, `max_tokens: 4000`
