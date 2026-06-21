export interface NutritionParams {
  weight: number        // kg
  raceFormat: 'sprint' | 'olympic' | 'half' | 'full'
  temperature: number  // Celsius
  intensity: 'moderate' | 'hard' | 'max'
}

export interface NutritionEntry {
  time: string         // ex: "T+0:30"
  phase: 'before' | 'swim' | 'bike' | 'run'
  type: 'eau' | 'gel' | 'barre' | 'boisson'
  quantity: string     // ex: "500ml", "1 gel"
  note?: string
}

export interface NutritionPlan {
  waterTotal: number   // litres
  carbsTotal: number   // grammes
  timeline: NutritionEntry[]
}

const FORMAT_DURATIONS: Record<NutritionParams['raceFormat'], { swim: number; bike: number; run: number }> = {
  sprint: { swim: 15, bike: 45, run: 20 },
  olympic: { swim: 25, bike: 65, run: 40 },
  half: { swim: 35, bike: 150, run: 110 },
  full: { swim: 65, bike: 300, run: 240 },
}

export function calculateNutritionPlan(params: NutritionParams): NutritionPlan {
  const { raceFormat, temperature, intensity } = params
  const dur = FORMAT_DURATIONS[raceFormat]
  const totalMin = dur.swim + dur.bike + dur.run
  const heatBonus = Math.max(0, (temperature - 20) * 0.05) // +5% par degré au-dessus de 20°C
  const intensityMult = intensity === 'max' ? 1.15 : intensity === 'hard' ? 1.05 : 1.0

  const sweatRate = 0.8 * (1 + heatBonus) * intensityMult // L/h
  const waterTotal = Math.round((sweatRate * (totalMin / 60)) * 10) / 10
  const carbsPerHour = raceFormat === 'sprint' ? 40 : raceFormat === 'olympic' ? 50 : 60
  const carbsTotal = Math.round(carbsPerHour * (totalMin / 60) * intensityMult)

  const timeline: NutritionEntry[] = []

  // Avant la course
  timeline.push({ time: 'J-1h30', phase: 'before', type: 'boisson', quantity: '500ml', note: 'Eau ou boisson isotonique' })
  timeline.push({ time: 'J-0h15', phase: 'before', type: 'gel', quantity: '1 gel', note: 'Gel énergétique + 200ml eau' })

  // Vélo (la phase principale de nutrition)
  if (dur.bike >= 45) {
    timeline.push({ time: 'Vélo +20min', phase: 'bike', type: 'eau', quantity: '500ml' })
    timeline.push({ time: 'Vélo +40min', phase: 'bike', type: 'gel', quantity: '1 gel', note: '+ 200ml eau' })
  }
  if (dur.bike >= 90) {
    timeline.push({ time: 'Vélo +60min', phase: 'bike', type: 'barre', quantity: '1/2 barre', note: 'Barre ou banane' })
    timeline.push({ time: 'Vélo +90min', phase: 'bike', type: 'boisson', quantity: '500ml', note: 'Boisson isotonique' })
  }
  if (dur.bike >= 150) {
    timeline.push({ time: 'Vélo +120min', phase: 'bike', type: 'gel', quantity: '1 gel' })
    timeline.push({ time: 'Vélo +150min', phase: 'bike', type: 'boisson', quantity: '500ml' })
  }

  // Début run
  if (dur.run >= 30) {
    timeline.push({ time: 'Run +15min', phase: 'run', type: 'eau', quantity: '200ml' })
  }
  if (dur.run >= 60) {
    timeline.push({ time: 'Run +30min', phase: 'run', type: 'gel', quantity: '1 gel', note: 'Gel caféiné si fatigue' })
    timeline.push({ time: 'Run +45min', phase: 'run', type: 'eau', quantity: '200ml' })
  }

  return { waterTotal, carbsTotal, timeline }
}

export const PHASE_COLORS: Record<
  NutritionEntry['phase'],
  { bg: string; border: string; text: string; label: string }
> = {
  before: {
    bg: 'bg-gray-50 dark:bg-slate-800',
    border: 'border-gray-200 dark:border-slate-700',
    text: 'text-gray-600 dark:text-gray-400',
    label: 'Avant',
  },
  swim: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    text: 'text-cyan-700 dark:text-cyan-400',
    label: 'Natation',
  },
  bike: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-400',
    label: 'Vélo',
  },
  run: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-700 dark:text-orange-400',
    label: 'Course',
  },
}

export const NUTRITYPE_ICONS: Record<NutritionEntry['type'], string> = {
  eau: '💧',
  gel: '🍯',
  barre: '🍫',
  boisson: '🥤',
}
