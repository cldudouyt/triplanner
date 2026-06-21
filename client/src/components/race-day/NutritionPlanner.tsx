import { useState } from 'react'
import { Droplets, Zap, Printer } from 'lucide-react'
import {
  calculateNutritionPlan,
  PHASE_COLORS,
  NUTRITYPE_ICONS,
  type NutritionParams,
} from '@/utils/nutrition'

export default function NutritionPlanner() {
  const [params, setParams] = useState<NutritionParams>({
    weight: 70,
    raceFormat: 'olympic',
    temperature: 22,
    intensity: 'hard',
  })

  const plan = calculateNutritionPlan(params)

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Planificateur Nutrition</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            Stratégie alimentaire pour le jour J
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 transition-colors"
        >
          <Printer className="w-3.5 h-3.5" /> Imprimer
        </button>
      </div>

      {/* Formulaire paramètres */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Format</label>
          <select
            value={params.raceFormat}
            onChange={e =>
              setParams(p => ({ ...p, raceFormat: e.target.value as NutritionParams['raceFormat'] }))
            }
            className="w-full text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="sprint" className="dark:bg-slate-700">Sprint</option>
            <option value="olympic" className="dark:bg-slate-700">Olympique</option>
            <option value="half" className="dark:bg-slate-700">Half (70.3)</option>
            <option value="full" className="dark:bg-slate-700">Full (140.6)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Poids (kg)
          </label>
          <input
            type="number"
            value={params.weight}
            min={40}
            max={120}
            onChange={e => setParams(p => ({ ...p, weight: +e.target.value }))}
            className="w-full text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Température (°C)
          </label>
          <input
            type="number"
            value={params.temperature}
            min={10}
            max={40}
            onChange={e => setParams(p => ({ ...p, temperature: +e.target.value }))}
            className="w-full text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
            Intensité
          </label>
          <select
            value={params.intensity}
            onChange={e =>
              setParams(p => ({ ...p, intensity: e.target.value as NutritionParams['intensity'] }))
            }
            className="w-full text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="moderate" className="dark:bg-slate-700">Modérée</option>
            <option value="hard" className="dark:bg-slate-700">Élevée</option>
            <option value="max" className="dark:bg-slate-700">Max</option>
          </select>
        </div>
      </div>

      {/* Métriques */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-center gap-2.5">
          <Droplets className="w-5 h-5 text-blue-500 flex-none" />
          <div>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Eau estimée</p>
            <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{plan.waterTotal} L</p>
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 flex items-center gap-2.5">
          <Zap className="w-5 h-5 text-orange-500 flex-none" />
          <div>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Glucides estimés</p>
            <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{plan.carbsTotal} g</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">
          Timeline nutrition
        </h4>
        <div className="space-y-2">
          {plan.timeline.map((entry, i) => {
            const colors = PHASE_COLORS[entry.phase]
            return (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${colors.bg} ${colors.border}`}
              >
                <span className="text-base flex-none">{NUTRITYPE_ICONS[entry.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${colors.text}`}>{entry.time}</span>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/50 dark:bg-black/20 ${colors.text}`}
                    >
                      {colors.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">
                    {entry.quantity} — {entry.type}
                  </p>
                  {entry.note && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{entry.note}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
