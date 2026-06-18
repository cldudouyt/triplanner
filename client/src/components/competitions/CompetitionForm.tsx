import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { COMPETITION_TYPES, TRIATHLON_SUBTYPES, RUNNING_SUBTYPES, PRIORITIES, STATUSES, KNOWN_EVENTS, KNOWN_CITIES } from '@/utils/constants'
import { competitionsApi, type Competition } from '@/api/competitions.api'
import { formatInputDate } from '@/utils/formatDate'
import { useState, useEffect } from 'react'
import Autocomplete from '@/components/ui/Autocomplete'
import { Button } from '@/components/ui/Button'
import clsx from 'clsx'

interface CompetitionFormProps {
  competition?: Competition
}

const inputClasses = clsx(
  'w-full px-3 py-2.5 rounded-xl border transition-all duration-200',
  'bg-white dark:bg-slate-800',
  'text-gray-900 dark:text-gray-100',
  'border-gray-300 dark:border-slate-600',
  'focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
  'dark:focus:ring-blue-400/50 dark:focus:border-blue-400',
  'outline-none'
)

const labelClasses = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5'

export default function CompetitionForm({ competition }: CompetitionFormProps) {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([...KNOWN_EVENTS])
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([...KNOWN_CITIES])
  const isEdit = !!competition

  useEffect(() => {
    competitionsApi.suggestions().then(res => {
      const apiNames = res.data.names
      const apiLocations = res.data.locations
      setNameSuggestions(prev => [...new Set([...prev, ...apiNames])].sort())
      setLocationSuggestions(prev => [...new Set([...prev, ...apiLocations])].sort())
    }).catch(() => {})
  }, [])

  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting } } = useForm({
    defaultValues: competition
      ? {
          ...competition,
          date: formatInputDate(competition.date),
          registrationLink: competition.registrationLink || '',
        }
      : {
          type: 'triathlon',
          subType: 'sprint',
          priority: 'B',
          status: 'planned',
          date: '',
          name: '',
        },
  })

  const watchType = watch('type')
  const subtypes = watchType === 'triathlon' ? TRIATHLON_SUBTYPES : RUNNING_SUBTYPES

  const onSubmit = async (data: any) => {
    try {
      setError('')
      const payload = {
        ...data,
        swimDistance: data.swimDistance ? Number(data.swimDistance) : undefined,
        bikeDistance: data.bikeDistance ? Number(data.bikeDistance) : undefined,
        runDistance: data.runDistance ? Number(data.runDistance) : undefined,
        budget: data.budget ? Number(data.budget) : undefined,
      }

      if (isEdit) {
        await competitionsApi.update(competition.id, payload)
      } else {
        await competitionsApi.create(payload)
      }
      navigate('/competitions')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-8 animate-fade-in">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Informations principales */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Informations principales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClasses}>Nom *</label>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Nom requis' }}
              render={({ field }) => (
                <Autocomplete
                  suggestions={nameSuggestions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Ex: Marathon de Paris"
                  className={inputClasses}
                />
              )}
            />
            {errors.name && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.name.message as string}</p>}
          </div>
          <div>
            <label className={labelClasses}>Date *</label>
            <input
              type="date"
              {...register('date', { required: 'Date requise' })}
              className={inputClasses}
            />
            {errors.date && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors.date.message as string}</p>}
          </div>
          <div>
            <label className={labelClasses}>Lieu</label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  suggestions={locationSuggestions}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Commencez à taper une ville..."
                  icon
                  className={inputClasses}
                />
              )}
            />
          </div>
          <div>
            <label className={labelClasses}>Type *</label>
            <select
              {...register('type')}
              className={inputClasses}
            >
              {COMPETITION_TYPES.map(t => (
                <option key={t.value} value={t.value} className="dark:bg-slate-800">{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Distance / Format *</label>
            <select
              {...register('subType')}
              className={inputClasses}
            >
              {subtypes.map(s => (
                <option key={s.value} value={s.value} className="dark:bg-slate-800">{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Distance (course à pied uniquement) */}
      {watchType === 'running' && (
        <section className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Distance</h2>
          <div className="max-w-xs">
            <label className={labelClasses}>Distance course (m)</label>
            <input
              type="number"
              {...register('runDistance')}
              placeholder="Ex: 42195"
              className={inputClasses}
            />
          </div>
        </section>
      )}

      {/* Objectifs */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Objectifs & Résultat</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Objectif chrono (HH:MM:SS)</label>
            <input
              {...register('chronoObjective')}
              placeholder="01:30:00"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Résultat (HH:MM:SS)</label>
            <input
              {...register('result')}
              placeholder="01:28:45"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Priorité</label>
            <select {...register('priority')} className={inputClasses}>
              {PRIORITIES.map(p => (
                <option key={p.value} value={p.value} className="dark:bg-slate-800">{p.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClasses}>Statut</label>
            <select {...register('status')} className={inputClasses}>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value} className="dark:bg-slate-800">{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Logistique */}
      <section className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Logistique</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClasses}>Lien d'inscription</label>
            <input
              {...register('registrationLink')}
              type="url"
              placeholder="https://..."
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Budget (EUR)</label>
            <input
              type="number"
              step="0.01"
              {...register('budget')}
              placeholder="0.00"
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Hébergement</label>
            <input
              {...register('accommodation')}
              placeholder="Hôtel, Airbnb..."
              className={inputClasses}
            />
          </div>
          <div>
            <label className={labelClasses}>Transport</label>
            <input
              {...register('transport')}
              placeholder="Train, voiture..."
              className={inputClasses}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClasses}>Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Notes personnelles..."
              className={clsx(inputClasses, 'resize-none')}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/competitions')}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
        >
          {isEdit ? 'Mettre à jour' : 'Créer la compétition'}
        </Button>
      </div>
    </form>
  )
}
