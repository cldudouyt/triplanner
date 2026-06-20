import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Plus, ChevronLeft, Send } from 'lucide-react'

interface Group {
  id: number
  name: string
  level: string
  description: string
  icon: string
  color: string
  weeklyHours: number
  sessionsPerWeek: number
  members: { id: number; firstName: string; lastName: string; currentTSB: number; goal?: string }[]
}

interface BaseSession {
  day: string
  sport: string
  type: string
  duration: string
  description: string
}

interface AthleteAdjustment {
  userId: number
  firstName: string
  lastName: string
  tsb: number
  goal?: string
  adjustmentTags: string[]
  reason: string
  enabled: boolean
}

const GROUPS: Group[] = [
  {
    id: 1, name: 'Découverte', level: 'Débutant', description: 'Premiers pas en triathlon : technique, régularité et plaisir avant la performance.', icon: '🌱', color: 'cyan', weeklyHours: 5, sessionsPerWeek: 4,
    members: [{ id: 1, firstName: 'Yanis', lastName: 'Baki', currentTSB: 15, goal: 'Premier 5K' }, { id: 2, firstName: 'Emma', lastName: 'Le Goff', currentTSB: 9, goal: 'Aquathlon' }, { id: 3, firstName: 'Noé', lastName: 'Renaud', currentTSB: 11, goal: 'Découverte' }, { id: 4, firstName: 'Théo', lastName: 'Pichon', currentTSB: 6, goal: 'Premier tri' }],
  },
  {
    id: 2, name: 'Endurance Loisir', level: 'Intermédiaire', description: 'Forme et sorties longues, sans pression de chrono. Une à deux courses plaisir par an.', icon: '🚴', color: 'emerald', weeklyHours: 7, sessionsPerWeek: 5,
    members: [{ id: 5, firstName: 'Clara', lastName: 'Roux', currentTSB: 3, goal: 'Tri de Pornic' }, { id: 6, firstName: 'Marc', lastName: 'Berthier', currentTSB: -4, goal: 'Loisir' }, { id: 7, firstName: 'Julie', lastName: 'Lemaire', currentTSB: 7, goal: 'Endurance' }, { id: 8, firstName: 'Adrien', lastName: 'Daniel', currentTSB: 1, goal: 'Loisir' }],
  },
  {
    id: 3, name: 'Compétition', level: 'Avancé', description: "Objectifs de saison : Triathlon de Nantes, La Baule. Charge structurée et périodisée.", icon: '🏆', color: 'orange', weeklyHours: 8.5, sessionsPerWeek: 6,
    members: [{ id: 9, firstName: 'Léa', lastName: 'Fontaine', currentTSB: -5, goal: 'Tri de Nantes · J-24' }, { id: 10, firstName: 'Marc', lastName: 'Petit', currentTSB: 8, goal: 'Tri Sprint Vertou · J-12' }, { id: 11, firstName: 'Sofia', lastName: 'Adler', currentTSB: -2, goal: 'Half (Baud.)' }],
  },
  {
    id: 4, name: 'Longue Distance', level: 'Élite', description: 'Préparation Half & Ironman. Gros volumes, double séance et suivi rapproché.', icon: '⛰️', color: 'slate', weeklyHours: 12, sessionsPerWeek: 7,
    members: [{ id: 12, firstName: 'Hélène', lastName: 'Dubois', currentTSB: -7, goal: 'Ironman' }],
  },
]

const BASE_SESSIONS_BY_GROUP: Record<number, BaseSession[]> = {
  3: [
    { day: 'LUN', sport: 'Natation', type: 'swim', duration: '1h00', description: 'Technique · éducatifs' },
    { day: 'MAR', sport: 'Vélo', type: 'bike', duration: '1h55', description: 'Endurance Z2 + renfo' },
    { day: 'MER', sport: 'Natation', type: 'swim', duration: '1h00', description: 'Seuil · 8×100' },
    { day: 'JEU', sport: 'Course', type: 'run', duration: '0h50', description: 'VMA · 6×800' },
    { day: 'VEN', sport: 'Repos', type: 'rest', duration: '', description: '' },
    { day: 'SAM', sport: 'Vélo', type: 'bike', duration: '2h30', description: 'Sortie longue' },
    { day: 'DIM', sport: 'Course', type: 'run', duration: '1h15', description: 'Endurance Z2' },
  ],
}

const DEFAULT_SESSIONS: BaseSession[] = [
  { day: 'LUN', sport: 'Natation', type: 'swim', duration: '0h45', description: 'Technique' },
  { day: 'MAR', sport: 'Vélo', type: 'bike', duration: '1h00', description: 'Endurance Z2' },
  { day: 'MER', sport: 'Course', type: 'run', duration: '0h40', description: 'Seuil' },
  { day: 'JEU', sport: 'Repos', type: 'rest', duration: '', description: '' },
  { day: 'VEN', sport: 'Natation', type: 'swim', duration: '0h45', description: 'Technique' },
  { day: 'SAM', sport: 'Vélo', type: 'bike', duration: '1h30', description: 'Sortie longue' },
  { day: 'DIM', sport: 'Repos', type: 'rest', duration: '', description: '' },
]

const SPORT_STYLE: Record<string, { text: string; border: string; bg: string }> = {
  swim: { text: 'text-cyan-600', border: 'border-l-cyan-500', bg: 'bg-cyan-50' },
  bike: { text: 'text-emerald-600', border: 'border-l-emerald-500', bg: 'bg-emerald-50' },
  run: { text: 'text-orange-600', border: 'border-l-orange-500', bg: 'bg-orange-50' },
  rest: { text: 'text-gray-400', border: 'border-l-gray-200', bg: 'bg-gray-50' },
}

const LEVEL_BADGE: Record<string, string> = {
  'Débutant': 'bg-cyan-100 text-cyan-700',
  'Intermédiaire': 'bg-emerald-100 text-emerald-700',
  'Avancé': 'bg-orange-100 text-orange-700',
  'Élite': 'bg-purple-100 text-purple-700',
}

const AVATAR_COLORS = ['bg-orange-500', 'bg-cyan-500', 'bg-emerald-500', 'bg-purple-500', 'bg-rose-500', 'bg-teal-500']

function avatarColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function getInitials(first: string, last: string) {
  return (first[0] ?? '') + (last[0] ?? '')
}

function generateAdjustments(group: Group): AthleteAdjustment[] {
  return group.members.map((m) => {
    const tsb = m.currentTSB
    let tags: string[]
    let reason: string

    if (tsb < -4) {
      tags = ['Charge -8%', 'Natation +1 séance']
      reason = 'Forme en baisse après 2 grosses semaines : on allège le vélo et on renforce la technique natation.'
    } else if (tsb > 6) {
      const days = Math.round(tsb * 1.5)
      tags = [`Affûtage course J-${days}`]
      reason = `Course dans ${days} jours : début d'affûtage, on réduit le volume et on garde l'intensité.`
    } else {
      tags = ['Plan de base']
      reason = 'Forme stable, le plan de base s\'applique sans modification.'
    }

    return { userId: m.id, firstName: m.firstName, lastName: m.lastName, tsb, goal: m.goal, adjustmentTags: tags, reason, enabled: true }
  })
}

const STEPS = ['Groupe', 'Plan de base', 'Optimisation IA', 'Aperçu & envoi']

function StepProgress({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((label, i) => {
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${done || active ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                style={done || active ? { background: 'linear-gradient(135deg,#FB923C,#EA580C)' } : undefined}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <div className="mt-1 text-center">
                <p className={`text-[10px] font-bold uppercase tracking-wide ${active ? 'text-orange-600' : done ? 'text-gray-400' : 'text-gray-300'}`}>Étape {i + 1}</p>
                <p className={`text-xs font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-3 mb-5 ${i < current ? 'bg-orange-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Step1({ onSelect }: { onSelect: (g: Group) => void }) {
  const [selected, setSelected] = useState<number | null>(null)

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">Choisis l'équipe à qui assigner ce plan. Chaque groupe a un volume cible adapté à son niveau.</p>
      <div className="grid grid-cols-2 gap-4">
        {GROUPS.map((g) => {
          const isSelected = selected === g.id
          const levelClass = LEVEL_BADGE[g.level] ?? 'bg-gray-100 text-gray-600'
          return (
            <button
              key={g.id}
              onClick={() => { setSelected(g.id); onSelect(g) }}
              className={`text-left rounded-2xl border-2 p-5 transition-all hover:shadow-md ${isSelected ? 'border-orange-400 bg-orange-50/40' : 'border-gray-100 bg-white hover:border-orange-200'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{g.icon}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{g.name}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${levelClass}`}>{g.level}</span>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-none ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">{g.description}</p>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                  {g.members.slice(0, 4).map((m) => (
                    <div key={m.id} className={`w-6 h-6 rounded-full ${avatarColor(m.firstName)} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}>
                      {getInitials(m.firstName, m.lastName)}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-500">{g.members.length} athlètes</span>
                <span className="text-xs font-semibold text-gray-700 ml-auto">{g.weeklyHours}h / sem · {g.sessionsPerWeek} séances</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function parseDuration(d: string): number {
  if (!d) return 0
  const [h, m] = d.split('h').map(Number)
  return (h || 0) * 60 + (m || 0)
}

function formatMin(min: number): string {
  if (min === 0) return '0h'
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, '0')}`
}

function Step2({ group }: { group: Group }) {
  const sessions = BASE_SESSIONS_BY_GROUP[group.id] ?? DEFAULT_SESSIONS
  const totalMin = sessions.reduce((a, s) => a + parseDuration(s.duration), 0)
  const swimMin = sessions.filter(s => s.type === 'swim').reduce((a, s) => a + parseDuration(s.duration), 0)
  const bikeMin = sessions.filter(s => s.type === 'bike').reduce((a, s) => a + parseDuration(s.duration), 0)
  const runMin = sessions.filter(s => s.type === 'run').reduce((a, s) => a + parseDuration(s.duration), 0)
  const active = sessions.filter(s => s.type !== 'rest').length

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xl">{group.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">Plan de base · {group.name}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${LEVEL_BADGE[group.level] ?? 'bg-gray-100 text-gray-600'}`}>{group.level}</span>
          </div>
          <p className="text-xs text-gray-400">Modèle hebdo pour tout le groupe · {formatMin(totalMin)} · {active} séances</p>
        </div>
        <button className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-xl hover:bg-gray-50 transition-colors">
          <Plus className="w-3.5 h-3.5" /> Ajouter une séance
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-6">
        {sessions.map((s, i) => {
          const style = SPORT_STYLE[s.type] ?? SPORT_STYLE.rest
          if (s.type === 'rest') {
            return (
              <div key={i} className="rounded-xl border border-dashed border-gray-200 p-3 text-center">
                <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">{s.day}</p>
                <p className="text-xs text-gray-300">Repos</p>
              </div>
            )
          }
          return (
            <div key={i} className={`rounded-xl border-l-[3px] p-3 ${style.border} ${style.bg} cursor-pointer hover:-translate-y-0.5 hover:shadow-sm transition-all`}>
              <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">{s.day}</p>
              <p className={`text-xs font-semibold ${style.text}`}>{s.sport}</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{s.description}</p>
              <p className="text-xs font-mono font-semibold text-gray-700 mt-1">{s.duration}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-gray-100 p-4">
        <p className="text-sm font-semibold text-gray-700 mb-3">Équilibre des disciplines</p>
        {totalMin > 0 && (
          <>
            <div className="h-2 rounded-full overflow-hidden flex mb-2">
              <div className="bg-cyan-500 h-full" style={{ width: `${(swimMin / totalMin) * 100}%` }} />
              <div className="bg-emerald-500 h-full" style={{ width: `${(bikeMin / totalMin) * 100}%` }} />
              <div className="bg-orange-500 h-full" style={{ width: `${(runMin / totalMin) * 100}%` }} />
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              <span><span className="text-cyan-500 font-semibold">●</span> Nat. {formatMin(swimMin)}</span>
              <span><span className="text-emerald-500 font-semibold">●</span> Vélo {formatMin(bikeMin)}</span>
              <span><span className="text-orange-500 font-semibold">●</span> Course {formatMin(runMin)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Step3({ group, adjustments, onToggle }: { group: Group; adjustments: AthleteAdjustment[]; onToggle: (userId: number) => void }) {
  const optimizedCount = adjustments.filter(a => a.enabled && a.adjustmentTags[0] !== 'Plan de base').length

  return (
    <div>
      <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 mb-5 flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm flex-none"
          style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
        >
          ✦
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-900 text-sm">L'IA personnalise le plan pour chaque athlète</p>
            <span className="text-orange-600 font-bold text-sm">{optimizedCount}/{group.members.length}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            À partir du plan de base, l'IA ajuste charge, équilibre des disciplines et récupération selon la forme (TSB).{' '}
            <span className="text-orange-600 font-medium cursor-pointer hover:underline">Décoche pour garder le plan de base.</span>
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {adjustments.map((a) => {
          const tsbClass = a.tsb < -3 ? 'bg-red-100 text-red-700' : a.tsb > 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
          const isBase = a.adjustmentTags[0] === 'Plan de base'
          return (
            <div
              key={a.userId}
              className={`rounded-2xl border p-4 transition-all ${a.enabled && !isBase ? 'border-orange-200 bg-orange-50/20' : 'border-gray-100 bg-white'}`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-9 h-9 rounded-full ${avatarColor(a.firstName)} flex items-center justify-center text-white text-xs font-bold flex-none`}>
                  {getInitials(a.firstName, a.lastName)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-gray-900">{a.firstName} {a.lastName}</span>
                    {a.goal && <span className="text-xs text-gray-400">· {a.goal}</span>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tsbClass}`}>
                      TSB {a.tsb >= 0 ? `+${a.tsb}` : a.tsb}
                    </span>
                    {a.adjustmentTags.filter(t => t !== 'Plan de base').map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{tag}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => onToggle(a.userId)}
                  className={`relative w-9 h-5 rounded-full transition-all flex-none ${a.enabled ? '' : 'bg-gray-200'}`}
                  style={a.enabled ? { background: 'linear-gradient(135deg,#FB923C,#EA580C)' } : undefined}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${a.enabled ? 'left-4' : 'left-0.5'}`} />
                </button>
              </div>
              {!isBase && (
                <p className="text-xs text-gray-500 ml-12">
                  <span className="font-semibold text-gray-600">Pourquoi : </span>{a.reason}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Step4({ group, adjustments, onSend }: { group: Group; adjustments: AthleteAdjustment[]; onSend: () => void }) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [message, setMessage] = useState('Bonne semaine à tous 💪\nFocus technique natation, et on lève le pied côté vélo pour ceux qui sont fatigués.')
  const [sent, setSent] = useState(false)

  const athlete = group.members[selectedIdx]
  const adjustment = adjustments[selectedIdx]
  const sessions = BASE_SESSIONS_BY_GROUP[group.id] ?? DEFAULT_SESSIONS
  const optimizedCount = adjustments.filter(a => a.enabled && a.adjustmentTags[0] !== 'Plan de base').length
  const baseCount = adjustments.filter(a => !a.enabled || a.adjustmentTags[0] === 'Plan de base').length

  const handleSend = () => {
    setSent(true)
    setTimeout(onSend, 1500)
  }

  if (!athlete) return null

  return (
    <div className="grid grid-cols-[1fr_280px] gap-5">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <p className="font-semibold text-gray-900 text-sm">Aperçu — ce que reçoit l'athlète</p>
          <div className="flex gap-1.5 ml-2">
            {group.members.map((m, i) => (
              <button
                key={m.id}
                onClick={() => setSelectedIdx(i)}
                className={`w-8 h-8 rounded-full text-white text-xs font-bold transition-all ${avatarColor(m.firstName)} ${i === selectedIdx ? 'ring-2 ring-orange-500 ring-offset-1' : 'opacity-60 hover:opacity-80'}`}
              >
                {getInitials(m.firstName, m.lastName)}
              </button>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl overflow-hidden mb-4 relative p-5"
          style={{ background: 'linear-gradient(135deg,#FB923C 0%,#F97316 52%,#EA580C 100%)', boxShadow: '0 22px 54px -26px rgba(234,88,12,.6)' }}
        >
          <div className="absolute -top-16 -right-8 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-semibold bg-white/25 text-white px-3 py-1 rounded-full">✦ Optimisé IA</span>
              {adjustment && adjustment.adjustmentTags[0] !== 'Plan de base' && (
                <span className="text-[10px] font-semibold bg-white/25 text-white px-3 py-1 rounded-full">↔ Prépa physique</span>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{athlete.firstName} {athlete.lastName} · {group.name}</h3>
            <p className="text-sm text-white/80">Plan semaine 6 / 12 · {group.weeklyHours}h · {group.sessionsPerWeek} séances</p>
            {adjustment && adjustment.adjustmentTags[0] !== 'Plan de base' && (
              <div className="flex gap-2 mt-3">
                {adjustment.adjustmentTags.map(tag => (
                  <span key={tag} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-7 gap-1 mt-4">
              {sessions.map((s, i) => {
                const dot = s.type === 'swim' ? 'bg-cyan-300' : s.type === 'bike' ? 'bg-emerald-300' : s.type === 'run' ? 'bg-orange-200' : 'bg-white/20'
                return (
                  <div key={i} className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${dot}`} />
                    <p className="text-[10px] text-white/60">{s.day}</p>
                    <p className="text-[10px] font-mono font-bold text-white">{s.duration || '—'}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <p className="font-semibold text-gray-900 text-sm mb-0.5">Envoyer le plan</p>
        <p className="text-xs text-gray-400 mb-4">{group.name} · {group.members.length} athlètes</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-orange-500 text-sm">✦</span>
              <span className="text-sm text-gray-700">Plans optimisés IA</span>
            </div>
            <span className="font-bold text-gray-900">{optimizedCount}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">☐</span>
              <span className="text-sm text-gray-700">Plans de base</span>
            </div>
            <span className="font-bold text-gray-900">{baseCount}</span>
          </div>
        </div>

        <p className="text-xs font-medium text-gray-500 mb-2">Mot du coach (envoyé au groupe)</p>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2.5 resize-none focus:outline-none focus:border-orange-300 mb-4"
          placeholder="Ajoute un message pour le groupe…"
        />

        <button
          onClick={handleSend}
          disabled={sent}
          className="w-full flex items-center justify-center gap-2 text-white text-sm font-semibold py-3 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-70"
          style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
        >
          {sent ? (
            <><Check className="w-4 h-4" /> Plan envoyé !</>
          ) : (
            <><Send className="w-4 h-4" /> Envoyer à {group.members.length} athlètes</>
          )}
        </button>
      </div>
    </div>
  )
}

export default function ClubCoachPlanWizardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [adjustments, setAdjustments] = useState<AthleteAdjustment[]>([])

  const handleGroupSelect = (g: Group) => setSelectedGroup(g)

  const handleNext = () => {
    if (step === 0 && !selectedGroup) return
    if (step === 1 && selectedGroup) {
      setAdjustments(generateAdjustments(selectedGroup))
    }
    setStep(s => Math.min(s + 1, 3))
  }

  const handleBack = () => {
    if (step === 0) navigate('/club/coach')
    else setStep(s => s - 1)
  }

  const handleToggle = (userId: number) => {
    setAdjustments(prev => prev.map(a => a.userId === userId ? { ...a, enabled: !a.enabled } : a))
  }

  const canNext = step === 0 ? selectedGroup !== null : true

  return (
    <div className="animate-fade-in">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Créer un plan d'entraînement</h1>
          <p className="text-sm text-gray-500 mt-1">Assigne un plan à une équipe, ajusté par l'IA selon chaque athlète</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="text-sm font-medium text-gray-700">Semaine 6 / 12 · saison 2026</span>
        </div>
      </div>

      <StepProgress current={step} />

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5">
        {step === 0 && <Step1 onSelect={handleGroupSelect} />}
        {step === 1 && selectedGroup && <Step2 group={selectedGroup} />}
        {step === 2 && selectedGroup && <Step3 group={selectedGroup} adjustments={adjustments} onToggle={handleToggle} />}
        {step === 3 && selectedGroup && <Step4 group={selectedGroup} adjustments={adjustments} onSend={() => navigate('/club/coach')} />}
      </div>

      {step < 3 && (
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 px-4 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Retour
          </button>
          <button
            onClick={handleNext}
            disabled={!canNext}
            className="flex items-center gap-2 text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
          >
            {step === 1 ? 'Optimiser par athlète' : step === 0 ? 'Suivant →' : 'Suivant →'}
          </button>
        </div>
      )}
    </div>
  )
}
