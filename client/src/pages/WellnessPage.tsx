import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { wellnessApi, type CreateWellnessLogInput } from '@/api/wellness.api'
import { Heart, Moon, Brain, Zap, AlertTriangle, Activity, TrendingUp, Plus } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'

const READINESS_LEVELS = [
  { min: 80, label: 'Excellent', color: 'text-green-600', bg: 'bg-green-500', description: 'Prêt pour un entraînement intense' },
  { min: 60, label: 'Bon', color: 'text-blue-600', bg: 'bg-blue-500', description: 'Entraînement normal recommandé' },
  { min: 40, label: 'Modéré', color: 'text-amber-600', bg: 'bg-amber-500', description: 'Privilégiez un entraînement léger' },
  { min: 0, label: 'Faible', color: 'text-red-600', bg: 'bg-red-500', description: 'Repos ou récupération active conseillé' },
]

function getReadinessLevel(score: number) {
  return READINESS_LEVELS.find(l => score >= l.min) || READINESS_LEVELS[3]
}

function ScoreSlider({ value, onChange, labels, icon: Icon, title }: {
  value: number
  onChange: (v: number) => void
  labels: string[]
  icon: typeof Heart
  title: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
        <span className="ml-auto text-sm font-semibold text-gray-900 dark:text-gray-100">{value}/5</span>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
              v === value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            {labels[v - 1]}
          </button>
        ))}
      </div>
    </div>
  )
}

function ReadinessGauge({ score }: { score: number }) {
  const level = getReadinessLevel(score)
  const angle = (score / 100) * 180 - 90

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-24 overflow-hidden">
        <svg viewBox="0 0 200 100" className="w-full">
          {/* Background arc */}
          <path d="M 10 95 A 85 85 0 0 1 190 95" fill="none" className="stroke-gray-200 dark:stroke-slate-600" strokeWidth="12" strokeLinecap="round" />
          {/* Colored arc */}
          <path
            d="M 10 95 A 85 85 0 0 1 190 95"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 267} 267`}
          />
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="33%" stopColor="#f59e0b" />
              <stop offset="66%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          {/* Needle */}
          <line
            x1="100"
            y1="95"
            x2={100 + 65 * Math.cos((angle * Math.PI) / 180)}
            y2={95 - 65 * Math.sin((angle * Math.PI) / 180)}
            className="stroke-gray-800 dark:stroke-gray-200"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="100" cy="95" r="5" className="fill-gray-800 dark:fill-gray-200" />
        </svg>
      </div>
      <div className="text-center -mt-2">
        <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">{score}</span>
        <span className="text-lg text-gray-400 dark:text-gray-500">/100</span>
      </div>
      <span className={`text-sm font-semibold ${level.color} mt-1`}>{level.label}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">{level.description}</span>
    </div>
  )
}

function TrendChart({ data }: { data: { date: string; readinessScore: number }[] }) {
  if (data.length === 0) return null

  const maxScore = 100
  const width = 100
  const height = 40
  const padding = 2

  const points = data.map((d, i) => {
    const x = padding + ((width - 2 * padding) * i) / Math.max(data.length - 1, 1)
    const y = height - padding - ((height - 2 * padding) * d.readinessScore) / maxScore
    return `${x},${y}`
  })

  const areaPoints = [...points, `${padding + ((width - 2 * padding) * (data.length - 1)) / Math.max(data.length - 1, 1)},${height - padding}`, `${padding},${height - padding}`]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32">
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints.join(' ')} fill="url(#trendFill)" />
      <polyline points={points.join(' ')} fill="none" stroke="#3b82f6" strokeWidth="0.8" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = padding + ((width - 2 * padding) * i) / Math.max(data.length - 1, 1)
        const y = height - padding - ((height - 2 * padding) * d.readinessScore) / maxScore
        return <circle key={i} cx={x} cy={y} r="1" fill="#3b82f6" />
      })}
    </svg>
  )
}

export default function WellnessPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateWellnessLogInput>({
    date: new Date().toISOString().split('T')[0],
    sleepQuality: 3,
    fatigue: 3,
    mood: 3,
    muscleSoreness: 3,
    stress: 3,
  })

  const { data: todayLog } = useQuery({
    queryKey: ['wellness', 'today'],
    queryFn: () => wellnessApi.getToday().then(r => r.data),
  })

  const { data: trend } = useQuery({
    queryKey: ['wellness', 'trend'],
    queryFn: () => wellnessApi.getTrend(14).then(r => r.data),
  })

  const { data: history } = useQuery({
    queryKey: ['wellness', 'history'],
    queryFn: () => wellnessApi.getLogs(30).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateWellnessLogInput) => wellnessApi.createLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wellness'] })
      setShowForm(false)
      toast.success('Check-in bien-être enregistré !')
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement')
    },
  })

  const handleSubmit = () => {
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bien-être & Récupération</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Suivez votre état de forme quotidien</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Check-in du jour
        </Button>
      </div>

      {/* Readiness Score */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score de préparation</CardTitle>
          </CardHeader>
          <CardContent>
            {todayLog ? (
              <ReadinessGauge score={todayLog.readinessScore} />
            ) : (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-3">Pas encore de check-in aujourd'hui</p>
                <Button size="sm" onClick={() => setShowForm(true)}>
                  Faire mon check-in
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendance (14 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            {trend && trend.logs.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Moy. préparation</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{trend.averageReadiness}</span>
                </div>
                <TrendChart data={trend.logs} />
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1">
                  <span>{trend.logs.length > 0 ? new Date(trend.logs[0].date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}</span>
                  <span>{trend.logs.length > 0 ? new Date(trend.logs[trend.logs.length - 1].date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : ''}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Pas encore assez de données</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Continuez vos check-ins quotidiens</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's details */}
      {todayLog && (
        <Card>
          <CardHeader>
            <CardTitle>Détails du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Sommeil', value: todayLog.sleepQuality, icon: Moon, extra: todayLog.sleepHours ? `${todayLog.sleepHours}h` : undefined },
                { label: 'Fatigue', value: 6 - todayLog.fatigue, icon: Zap },
                { label: 'Moral', value: todayLog.mood, icon: Brain },
                { label: 'Douleurs', value: 6 - todayLog.muscleSoreness, icon: AlertTriangle },
                { label: 'Stress', value: 6 - todayLog.stress, icon: Activity },
              ].map(({ label, value, icon: Icon, extra }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-gray-50 dark:bg-slate-700">
                  <Icon className="w-5 h-5 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                  <div className="flex justify-center gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map(v => (
                      <div
                        key={v}
                        className={`w-2 h-2 rounded-full ${v <= value ? 'bg-blue-500' : 'bg-gray-200 dark:bg-slate-600'}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  {extra && <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-0.5">{extra}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique (30 jours)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map(log => {
                const level = getReadinessLevel(log.readinessScore)
                return (
                  <div key={log.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                    <div className="text-center min-w-[60px]">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {new Date(log.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {new Date(log.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${level.bg}`} />
                        <span className={`text-sm font-medium ${level.color}`}>{level.label}</span>
                        <span className="text-sm text-gray-400 dark:text-gray-500">- Score {log.readinessScore}</span>
                      </div>
                    </div>
                    <div className="w-24 bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${level.bg}`}
                        style={{ width: `${log.readinessScore}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check-in Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Check-in bien-être" size="lg">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <ScoreSlider
            value={form.sleepQuality}
            onChange={v => setForm(prev => ({ ...prev, sleepQuality: v }))}
            labels={['Très mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent']}
            icon={Moon}
            title="Qualité du sommeil"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Heures de sommeil</label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={form.sleepHours || ''}
              onChange={e => setForm(prev => ({ ...prev, sleepHours: e.target.value ? parseFloat(e.target.value) : undefined }))}
              placeholder="ex: 7.5"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <ScoreSlider
            value={form.fatigue}
            onChange={v => setForm(prev => ({ ...prev, fatigue: v }))}
            labels={['Frais', 'Léger', 'Normal', 'Fatigué', 'Épuisé']}
            icon={Zap}
            title="Niveau de fatigue"
          />

          <ScoreSlider
            value={form.mood}
            onChange={v => setForm(prev => ({ ...prev, mood: v }))}
            labels={['Très bas', 'Bas', 'Neutre', 'Bon', 'Excellent']}
            icon={Brain}
            title="Moral"
          />

          <ScoreSlider
            value={form.muscleSoreness}
            onChange={v => setForm(prev => ({ ...prev, muscleSoreness: v }))}
            labels={['Aucune', 'Légère', 'Modérée', 'Forte', 'Sévère']}
            icon={AlertTriangle}
            title="Douleurs musculaires"
          />

          <ScoreSlider
            value={form.stress}
            onChange={v => setForm(prev => ({ ...prev, stress: v }))}
            labels={['Zen', 'Faible', 'Normal', 'Élevé', 'Très élevé']}
            icon={Activity}
            title="Niveau de stress"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">FC repos (bpm)</label>
              <input
                type="number"
                min="20"
                max="250"
                value={form.restingHR || ''}
                onChange={e => setForm(prev => ({ ...prev, restingHR: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="ex: 55"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">VFC / HRV (ms)</label>
              <input
                type="number"
                min="0"
                max="300"
                value={form.hrv || ''}
                onChange={e => setForm(prev => ({ ...prev, hrv: e.target.value ? parseInt(e.target.value) : undefined }))}
                placeholder="ex: 65"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              value={form.notes || ''}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Comment vous sentez-vous aujourd'hui ?"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSubmit} loading={createMutation.isPending}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
