# Spec : Rapport de Performance PDF

## Objectif
Générer un rapport PDF de la saison de l'athlète — statistiques, progression, compétitions, wellness — exportable et partageable, produit par Claude IA avec mise en page soignée.

## Comportement attendu

### Déclencheur
Bouton "Générer le rapport" dans la page Statistiques ou Export.
Paramètre : période (ce mois / ce trimestre / cette année / 12 derniers mois).

### Contenu du rapport (7 sections)

1. **Page de couverture**
   - Nom de l'athlète, période, date de génération
   - Photo de profil (initiales si absente)
   - Résumé en 1 phrase généré par Claude : *"Saison solide : +23% de volume, objectif Quiberon atteint."*

2. **Synthèse performance**
   - Volume total par sport (km + heures)
   - Comparaison avec la période précédente (delta %)
   - Graphe SVG inline (barres mensuelles par sport)

3. **Charge d'entraînement**
   - Évolution ATL/CTL/TSB sur la période
   - Semaine de charge peak, semaine de repos la plus longue

4. **Compétitions**
   - Liste avec résultats vs objectifs
   - Taux d'atteinte des objectifs chronométriques (%)

5. **Wellness & récupération**
   - Moyenne readiness, fatigue, sommeil sur la période
   - Alertes déclenchées + jours de récupération recommandés respectés

6. **Records personnels**
   - Nouveaux records établis sur la période
   - Comparaison avec records all-time

7. **Recommandations IA**
   - 3 points forts de la période
   - 3 axes de progression pour la prochaine période
   - Généré par Claude avec le contexte complet

### Format PDF
- A4, portrait
- Police : Inter (Google Fonts)
- Couleurs : palette TriPlanner (bleu, sport colors)
- Pages : ~8-12 selon volume de données

## Design (Claude Design)

**Prototype à créer sur claude.ai/design :**
- Maquette de chaque page du rapport (couverture, sections 1-7)
- Style "rapport annuel sportif" : propre, lisible, couleurs vives sur fond blanc
- Graphes : SVG simples (pas de JS requis dans le PDF)
- Export depuis Claude Design → HTML → conversion PDF via `html-pdf` ou `puppeteer`

**Référence visuelle** : rapport de fin d'année Strava / Garmin Connect Annual Report.

## Implémentation

### Backend
- `POST /api/v1/export/performance-report` — body : `{ period: 'month'|'quarter'|'year'|'12months' }`
- `export.service.ts` : `generatePerformanceReport(userId, period)` :
  1. Agréger stats, compétitions, wellness, records sur la période
  2. Appeler Claude pour générer les textes (synthèse + recommandations)
  3. Rendre un template HTML avec les données
  4. Convertir HTML → PDF via `puppeteer` (à installer)
  5. Retourner le buffer PDF avec header `Content-Type: application/pdf`

### Frontend
- Bouton "Rapport PDF" dans `ExportPage.tsx` ou `StatisticsPage.tsx`
- Select période + bouton générer
- Skeleton 5s pendant génération (Claude + PDF)
- `window.open(URL.createObjectURL(blob))` pour ouvrir le PDF

### Dépendances à installer
```
server: puppeteer (ou @sparticuz/chromium pour prod légère)
```

## Contraintes
- Génération côté serveur uniquement (pas de client-side PDF)
- Si données insuffisantes (< 10 séances) : message explicatif plutôt qu'un rapport vide
- Mode dev : logger la durée de génération (objectif < 30s)
