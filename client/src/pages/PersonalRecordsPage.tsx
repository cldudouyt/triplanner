import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recordsApi, type CreateRecordInput, type PersonalRecord } from '@/api/records.api'
import { Medal, Plus, Trash2, Clock, Trophy } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import toast from 'react-hot-toast'

const SPORT_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  swim: { label: 'Natation', icon: '🏊', color: 'from-blue-500 to-blue-600' },
  bike: { label: 'Vélo', icon: '🚴', color: 'from-gray-500 to-gray-600' },
  run: { label: 'Course', icon: '🏃', color: 'from-green-500 to-green-600' },
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}h${m.toString().padStart(2, '0')}'${s.toString().padStart(2, '0')}"`
  return `${m}'${s.toString().padStart(2, '0')}"`
}

function TimeInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const h = Math.floor(value / 3600)
  const m = Math.floor((value % 3600) / 60)
  const s = Math.floor(value % 60)

  const updateTime = (hours: number, mins: number, secs: number) => {
    onChange(hours * 3600 + mins * 60 + secs)
  }

  return (
    <div className="flex items-center gap-2">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Heures</label>
        <input
          type="number"
          min="0"
          max="99"
          value={h}
          onChange={e => updateTime(parseInt(e.target.value) || 0, m, s)}
          className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <span className="text-lg font-bold text-gray-400 mt-4">:</span>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Min</label>
        <input
          type="number"
          min="0"
          max="59"
          value={m}
          onChange={e => updateTime(h, parseInt(e.target.value) || 0, s)}
          className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <span className="text-lg font-bold text-gray-400 mt-4">:</span>
      <div>
        <label className="block text-xs text-gray-500 mb-1">Sec</label>
        <input
          type="number"
          min="0"
          max="59"
          value={s}
          onChange={e => updateTime(h, m, parseInt(e.target.value) || 0)}
          className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  )
}

function RecordCard({ record, onDelete }: { record: PersonalRecord; onDelete: () => void }) {
  const sport = SPORT_CONFIG[record.sport]

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
      <div className="text-2xl">{sport?.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">{record.category.toUpperCase()}</span>
          <span className="text-xs text-gray-400">{sport?.label}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="w-3 h-3 text-gray-400" />
          <span className="text-lg font-bold text-gray-900">
            {record.unit === 'time' ? formatTime(record.value) : `${record.value}`}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {new Date(record.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        {record.notes && <p className="text-xs text-gray-500 mt-1">{record.notes}</p>}
      </div>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function PersonalRecordsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [activeSport, setActiveSport] = useState<string>('run')
  const [form, setForm] = useState<CreateRecordInput>({
    sport: 'run',
    category: '5k',
    value: 0,
    unit: 'time',
    date: new Date().toISOString().split('T')[0],
  })

  const { data: records } = useQuery({
    queryKey: ['records'],
    queryFn: () => recordsApi.getAll().then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['records', 'categories'],
    queryFn: () => recordsApi.getCategories().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateRecordInput) => recordsApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['records'] })
      setShowForm(false)
      if (res.data.isNewPR) {
        toast.success('Nouveau record personnel !')
      } else {
        toast.success('Performance enregistrée')
      }
    },
    onError: () => toast.error('Erreur lors de l\'enregistrement'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => recordsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] })
      toast.success('Record supprimé')
    },
  })

  const handleSportChange = (sport: string) => {
    setForm(prev => ({
      ...prev,
      sport,
      category: categories?.[sport]?.[0]?.value || '',
      unit: categories?.[sport]?.[0]?.unit || 'time',
    }))
  }

  const bestRecords = records?.best || []
  const filteredRecords = bestRecords.filter(r => r.sport === activeSport)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Records Personnels</h1>
          <p className="text-gray-500 mt-1">Suivez vos meilleures performances</p>
        </div>
        <Button onClick={() => setShowForm(true)} icon={<Plus className="w-4 h-4" />}>
          Ajouter un record
        </Button>
      </div>

      {/* Sport tabs */}
      <div className="flex gap-2">
        {Object.entries(SPORT_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setActiveSport(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSport === key
                ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>{config.icon}</span>
            {config.label}
          </button>
        ))}
      </div>

      {/* Best records */}
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Meilleurs records - {SPORT_CONFIG[activeSport]?.label}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <Medal className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Aucun record pour ce sport</p>
              <p className="text-xs text-gray-400 mt-1">Ajoutez votre premier record !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onDelete={() => deleteMutation.mutate(record.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All records history */}
      {records?.all && records.all.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique complet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {records.all.slice(0, 20).map(record => (
                <div key={record.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 text-sm">
                  <span>{SPORT_CONFIG[record.sport]?.icon}</span>
                  <span className="font-medium text-gray-900">{record.category.toUpperCase()}</span>
                  <span className="text-gray-600">
                    {record.unit === 'time' ? formatTime(record.value) : record.value}
                  </span>
                  <span className="text-gray-400 ml-auto">
                    {new Date(record.date).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add record modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nouveau record" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
            <div className="flex gap-2">
              {Object.entries(SPORT_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleSportChange(key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    form.sport === key
                      ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{config.icon}</span>
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Distance / Catégorie</label>
            <select
              value={form.category}
              onChange={e => {
                const cat = categories?.[form.sport]?.find(c => c.value === e.target.value)
                setForm(prev => ({ ...prev, category: e.target.value, unit: cat?.unit || 'time' }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            >
              {categories?.[form.sport]?.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {form.unit === 'time' ? 'Temps' : 'Valeur'}
            </label>
            {form.unit === 'time' ? (
              <TimeInput value={form.value} onChange={v => setForm(prev => ({ ...prev, value: v }))} />
            ) : (
              <input
                type="number"
                value={form.value}
                onChange={e => setForm(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="ex: 250"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optionnel)</label>
            <input
              type="text"
              value={form.notes || ''}
              onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="ex: Marathon de Paris, conditions parfaites"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={() => createMutation.mutate(form)} loading={createMutation.isPending}>
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
