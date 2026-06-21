import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Activity, Bike, Waves, ArrowRight, Sparkles } from 'lucide-react'
import { authApi } from '@/api/auth.api'

// ─── Step Profile ─────────────────────────────────────────────────────────────

interface StepProfileProps {
  data: { level: string; sports: string[] }
  onChange: (d: Partial<{ level: string; sports: string[] }>) => void
}

function StepProfile({ data, onChange }: StepProfileProps) {
  const levels = [
    { value: 'débutant', label: 'Débutant', desc: 'Je débute le triathlon' },
    { value: 'intermédiaire', label: 'Intermédiaire', desc: 'Quelques saisons derrière moi' },
    { value: 'avancé', label: 'Avancé', desc: 'Compétiteur régulier' },
    { value: 'élite', label: 'Élite', desc: 'Niveau performance' },
  ]

  const sports = [
    { value: 'swim', label: 'Natation', icon: <Waves className="w-5 h-5" />, color: 'text-cyan-600' },
    { value: 'bike', label: 'Vélo', icon: <Bike className="w-5 h-5" />, color: 'text-emerald-600' },
    { value: 'run', label: 'Course', icon: <Activity className="w-5 h-5" />, color: 'text-orange-600' },
  ]

  const toggleSport = (sport: string) => {
    const current = data.sports
    const updated = current.includes(sport) ? current.filter(s => s !== sport) : [...current, sport]
    onChange({ sports: updated })
  }

  return (
    <div className="animate-scale-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Ton profil athlète</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Ces informations permettent à l'IA de calibrer ton plan d'entraînement.
      </p>

      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Ton niveau</p>
        <div className="space-y-2">
          {levels.map(lvl => (
            <button
              key={lvl.value}
              type="button"
              onClick={() => onChange({ level: lvl.value })}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                data.level === lvl.value
                  ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-orange-200 dark:hover:border-orange-800'
              }`}
            >
              <div>
                <p
                  className={`text-sm font-semibold ${
                    data.level === lvl.value
                      ? 'text-orange-700 dark:text-orange-400'
                      : 'text-gray-800 dark:text-gray-200'
                  }`}
                >
                  {lvl.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{lvl.desc}</p>
              </div>
              {data.level === lvl.value && (
                <div
                  className="w-5 h-5 rounded-full flex-none flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
                >
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Disciplines pratiquées</p>
        <div className="grid grid-cols-3 gap-3">
          {sports.map(sport => (
            <button
              key={sport.value}
              type="button"
              onClick={() => toggleSport(sport.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                data.sports.includes(sport.value)
                  ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-orange-200 dark:hover:border-orange-800'
              }`}
            >
              <span
                className={`${
                  data.sports.includes(sport.value) ? 'text-orange-600 dark:text-orange-400' : sport.color
                }`}
              >
                {sport.icon}
              </span>
              <span
                className={`text-xs font-semibold ${
                  data.sports.includes(sport.value)
                    ? 'text-orange-700 dark:text-orange-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {sport.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Step Availability ────────────────────────────────────────────────────────

interface StepAvailabilityProps {
  data: { weeklyHoursAvailable: number }
  onChange: (d: Partial<{ weeklyHoursAvailable: number }>) => void
}

function StepAvailability({ data, onChange }: StepAvailabilityProps) {
  const getCommitmentLabel = (hours: number) => {
    if (hours <= 4) return { label: 'Léger', desc: 'Idéal pour débuter ou maintenir une forme générale' }
    if (hours <= 8) return { label: 'Modéré', desc: 'Bon équilibre sport et vie quotidienne' }
    if (hours <= 12) return { label: 'Soutenu', desc: 'Préparation compétition sérieuse' }
    return { label: 'Intensif', desc: 'Engagement performeur ou élite' }
  }

  const commitment = getCommitmentLabel(data.weeklyHoursAvailable)

  return (
    <div className="animate-scale-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        Disponibilité hebdomadaire
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Combien d'heures par semaine peux-tu consacrer à l'entraînement ?
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Heures / semaine</span>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {data.weeklyHoursAvailable}
            </span>
            <span className="text-sm text-gray-400">h</span>
          </div>
        </div>

        <input
          type="range"
          min={1}
          max={40}
          value={data.weeklyHoursAvailable}
          onChange={e => onChange({ weeklyHoursAvailable: parseInt(e.target.value) })}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-orange-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1h</span>
          <span>40h</span>
        </div>
      </div>

      <div
        className="rounded-xl p-4 mb-6"
        style={{ background: 'rgba(249,115,22,.07)', border: '1px solid rgba(249,115,22,.24)' }}
      >
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-none mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">{commitment.label}</p>
            <p className="text-xs text-orange-700 dark:text-orange-400 mt-0.5">{commitment.desc}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Ou saisir directement</p>
        <input
          type="number"
          min={1}
          max={40}
          value={data.weeklyHoursAvailable}
          onChange={e => {
            const val = Math.min(40, Math.max(1, parseInt(e.target.value) || 1))
            onChange({ weeklyHoursAvailable: val })
          }}
          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
    </div>
  )
}

// ─── Step Competition ─────────────────────────────────────────────────────────

interface StepCompetitionProps {
  onSkip: () => void
  onAdd: () => void
}

function StepCompetition({ onSkip, onAdd }: StepCompetitionProps) {
  return (
    <div className="animate-scale-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Première compétition</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Ajoute ta compétition cible pour que l'IA calibre ton plan d'entraînement.
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-8 text-center mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
        >
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Ajoute ton objectif de saison</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Avec une compétition cible, l'IA peut créer un plan adapté à ta date de course, ton format et ton
          niveau.
        </p>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/30"
          style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
        >
          <Trophy className="w-4 h-4" />
          Ajouter une compétition
        </button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="w-full text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 py-2 transition-colors"
      >
        Passer cette étape →
      </button>
    </div>
  )
}

// ─── Step Connect ─────────────────────────────────────────────────────────────

interface StepConnectProps {
  onComplete: () => void
}

function StepConnect({ onComplete }: StepConnectProps) {
  return (
    <div className="animate-scale-in">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Connecter Strava</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
        Synchronise tes activités pour enrichir l'analyse de l'IA.
      </p>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100 dark:bg-orange-900/30">
            <Activity className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Strava</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sync automatique des activités</p>
          </div>
        </div>
        <ul className="space-y-2 text-xs text-gray-500 dark:text-gray-400">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-none" />
            Importe automatiquement tes séances Strava
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-none" />
            L'IA analyse tes performances réelles pour ajuster le plan
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-none" />
            Sync des compétitions et résultats
          </li>
        </ul>
      </div>

      <div className="rounded-xl p-3 mb-6 bg-gray-50 dark:bg-slate-700/50 border border-gray-100 dark:border-slate-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Cette étape est optionnelle — tu peux connecter Strava plus tard depuis les Paramètres.
        </p>
      </div>

      <button
        type="button"
        onClick={onComplete}
        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/30"
        style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
      >
        Terminer la configuration
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Main OnboardingPage ──────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({
    level: '',
    weeklyHoursAvailable: 8,
    sports: [] as string[],
  })
  const navigate = useNavigate()

  const steps = ['Profil', 'Disponibilité', 'Compétition', 'Strava']

  const handleComplete = async () => {
    try {
      await authApi.completeOnboarding({
        level: data.level || 'intermédiaire',
        weeklyHoursAvailable: data.weeklyHoursAvailable,
        sports: data.sports.length > 0 ? data.sports : undefined,
      })
      navigate('/dashboard')
    } catch {
      navigate('/dashboard') // fail gracefully
    }
  }

  const handleAddCompetition = async () => {
    try {
      await authApi.completeOnboarding({
        level: data.level || 'intermédiaire',
        weeklyHoursAvailable: data.weeklyHoursAvailable,
        sports: data.sports.length > 0 ? data.sports : undefined,
      })
    } catch {
      // fail gracefully
    }
    navigate('/competitions/new')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Header avec logo + barre de progression */}
      <div className="flex-none px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg text-white font-bold text-sm flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
              >
                M
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">Tri Planner</span>
            </div>
            <span className="text-xs text-gray-400">
              {step + 1} / {steps.length}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${((step + 1) / steps.length) * 100}%`,
                background: 'linear-gradient(90deg,#FB923C,#EA580C)',
              }}
            />
          </div>
          {/* Step labels */}
          <div className="flex justify-between mt-2">
            {steps.map((label, i) => (
              <span
                key={label}
                className={`text-[10px] font-medium transition-colors ${
                  i <= step ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu des étapes */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {step === 0 && (
            <StepProfile
              data={data}
              onChange={d => setData(prev => ({ ...prev, ...d }))}
            />
          )}
          {step === 1 && (
            <StepAvailability
              data={data}
              onChange={d => setData(prev => ({ ...prev, ...d }))}
            />
          )}
          {step === 2 && (
            <StepCompetition onSkip={() => setStep(3)} onAdd={handleAddCompetition} />
          )}
          {step === 3 && <StepConnect onComplete={handleComplete} />}
        </div>
      </div>

      {/* Footer navigation (steps 0 and 1 only) */}
      {step < 2 && (
        <div className="flex-none px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button
              type="button"
              onClick={() => step > 0 && setStep(step - 1)}
              className={`text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors ${
                step === 0 ? 'invisible' : ''
              }`}
            >
              ← Précédent
            </button>
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all hover:shadow-lg hover:shadow-orange-500/30"
              style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
            >
              Suivant →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
