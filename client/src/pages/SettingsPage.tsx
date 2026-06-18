import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { exportApi, downloadBlob } from '@/api/export.api'
import { stravaApi } from '@/api/strava.api'
import { notificationsApi } from '@/api/notifications.api'
import { Download, Upload, FileJson, FileSpreadsheet, AlertCircle, CheckCircle, Link2, Unlink, RefreshCw, Trophy, Bell } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [importResult, setImportResult] = useState<any>(null)
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()

  // Handle Strava callback params
  useEffect(() => {
    if (searchParams.get('strava_connected')) {
      toast.success('Strava connecté avec succès!')
      searchParams.delete('strava_connected')
      setSearchParams(searchParams)
      queryClient.invalidateQueries({ queryKey: ['strava-status'] })
    }
    if (searchParams.get('strava_error')) {
      toast.error(`Erreur Strava: ${searchParams.get('strava_error')}`)
      searchParams.delete('strava_error')
      setSearchParams(searchParams)
    }
  }, [searchParams, setSearchParams, queryClient])

  // Strava status query
  const { data: stravaStatus, isLoading: loadingStrava } = useQuery({
    queryKey: ['strava-status'],
    queryFn: () => stravaApi.getStatus().then(r => r.data),
  })

  const exportJSONMutation = useMutation({
    mutationFn: async () => {
      const response = await exportApi.exportJSON()
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      downloadBlob(blob, `triathlon-planner-export-${new Date().toISOString().split('T')[0]}.json`)
    },
    onSuccess: () => toast.success('Export JSON téléchargé'),
    onError: () => toast.error('Erreur lors de l\'export'),
  })

  const exportCSVMutation = useMutation({
    mutationFn: async () => {
      const response = await exportApi.exportCSV()
      downloadBlob(response.data, `triathlon-planner-export-${new Date().toISOString().split('T')[0]}.csv`)
    },
    onSuccess: () => toast.success('Export CSV téléchargé'),
    onError: () => toast.error('Erreur lors de l\'export'),
  })

  const importMutation = useMutation({
    mutationFn: (data: any) => exportApi.importData(data).then(r => r.data),
    onSuccess: (result) => {
      setImportResult(result)
      setImportError('')
      toast.success('Import terminé')
    },
    onError: (err: any) => {
      setImportError(err.response?.data?.error || 'Erreur lors de l\'import')
      setImportResult(null)
    },
  })

  // Strava mutations
  const connectStravaMutation = useMutation({
    mutationFn: async () => {
      const { data } = await stravaApi.getAuthUrl()
      window.location.href = data.url
    },
    onError: () => toast.error('Erreur lors de la connexion Strava'),
  })

  const disconnectStravaMutation = useMutation({
    mutationFn: () => stravaApi.disconnect(),
    onSuccess: () => {
      toast.success('Strava déconnecté')
      queryClient.invalidateQueries({ queryKey: ['strava-status'] })
    },
    onError: () => toast.error('Erreur lors de la déconnexion'),
  })

  const syncStravaMutation = useMutation({
    mutationFn: () => stravaApi.sync().then(r => r.data),
    onSuccess: (result) => {
      toast.success(`${result.synced} séance(s) synchronisée(s)`)
      queryClient.invalidateQueries({ queryKey: ['statistics'] })
    },
    onError: () => toast.error('Erreur lors de la synchronisation'),
  })

  const syncCompetitionsMutation = useMutation({
    mutationFn: () => stravaApi.syncCompetitions().then(r => r.data),
    onSuccess: (result) => {
      if (result.matched > 0) {
        toast.success(`${result.matched} compétition(s) mise(s) à jour avec les résultats Strava`)
        queryClient.invalidateQueries({ queryKey: ['competitions'] })
      } else {
        toast.success('Aucune compétition correspondante trouvée sur les 90 derniers jours')
      }
    },
    onError: () => toast.error('Erreur lors de la synchronisation des compétitions'),
  })

  // Notifications preferences
  const { data: notifPrefs, isLoading: loadingNotif } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => notificationsApi.getPreferences().then(r => r.data),
  })

  const updateNotifMutation = useMutation({
    mutationFn: (data: Parameters<typeof notificationsApi.updatePreferences>[0]) =>
      notificationsApi.updatePreferences(data).then(r => r.data),
    onSuccess: () => {
      toast.success('Préférences de notification mises à jour')
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  })

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      importMutation.mutate(data)
    } catch {
      setImportError('Le fichier n\'est pas un JSON valide')
      setImportResult(null)
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Paramètres</h1>

      {/* Export Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Exporter mes données
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Téléchargez toutes vos données (compétitions, plans d'entraînement, séances) dans le format de votre choix.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => exportJSONMutation.mutate()}
            disabled={exportJSONMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <FileJson className="w-4 h-4" />
            {exportJSONMutation.isPending ? 'Export...' : 'Export JSON'}
          </button>
          <button
            onClick={() => exportCSVMutation.mutate()}
            disabled={exportCSVMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportCSVMutation.isPending ? 'Export...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Importer des données
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Importez des données depuis un fichier JSON exporté précédemment. Les données seront ajoutées à vos données existantes.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelect}
          className="hidden"
          id="import-file"
        />
        <label
          htmlFor="import-file"
          className={`inline-flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${importMutation.isPending ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <Upload className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {importMutation.isPending ? 'Import en cours...' : 'Sélectionner un fichier JSON'}
          </span>
        </label>

        {/* Import Error */}
        {importError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{importError}</p>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
              <span className="font-medium text-green-700 dark:text-green-400">Import terminé</span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">{importResult.results.competitions.created}</span> compétition(s) créée(s)
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">{importResult.results.trainingPlans.created}</span> plan(s) d'entraînement créé(s)
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">{importResult.results.sessions.created}</span> séance(s) créée(s)
              </p>

              {/* Errors */}
              {(importResult.results.competitions.errors.length > 0 ||
                importResult.results.trainingPlans.errors.length > 0 ||
                importResult.results.sessions.errors.length > 0) && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-amber-600 dark:text-amber-400">
                    Voir les erreurs
                  </summary>
                  <ul className="mt-2 space-y-1 text-red-600 dark:text-red-400">
                    {importResult.results.competitions.errors.map((e: string, i: number) => (
                      <li key={`c-${i}`}>{e}</li>
                    ))}
                    {importResult.results.trainingPlans.errors.map((e: string, i: number) => (
                      <li key={`p-${i}`}>{e}</li>
                    ))}
                    {importResult.results.sessions.errors.map((e: string, i: number) => (
                      <li key={`s-${i}`}>{e}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Strava Integration */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.5 14.846h4.171" fill="#FC4C02"/>
          </svg>
          Strava
        </h2>

        {loadingStrava ? (
          <div className="animate-pulse h-16 bg-gray-100 dark:bg-slate-700 rounded-lg" />
        ) : stravaStatus?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 dark:text-green-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Connecté {stravaStatus.athlete ? `en tant que ${stravaStatus.athlete.firstname} ${stravaStatus.athlete.lastname}` : ''}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
              <p>• <strong>Sync séances</strong> : met à jour la durée/distance réelles dans vos plans d'entraînement</p>
              <p>• <strong>Sync compétitions</strong> : importe les résultats de course dans vos fiches compétition</p>
              <p>• La génération de plan IA utilise automatiquement vos données Strava</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => syncStravaMutation.mutate()}
                disabled={syncStravaMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${syncStravaMutation.isPending ? 'animate-spin' : ''}`} />
                {syncStravaMutation.isPending ? 'Sync...' : 'Sync séances'}
              </button>
              <button
                onClick={() => syncCompetitionsMutation.mutate()}
                disabled={syncCompetitionsMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <Trophy className={`w-4 h-4 ${syncCompetitionsMutation.isPending ? 'animate-spin' : ''}`} />
                {syncCompetitionsMutation.isPending ? 'Sync...' : 'Sync compétitions'}
              </button>
              <button
                onClick={() => disconnectStravaMutation.mutate()}
                disabled={disconnectStravaMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                <Unlink className="w-4 h-4" />
                Déconnecter
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connectez votre compte Strava pour synchroniser automatiquement vos activités avec vos séances d'entraînement.
            </p>
            <button
              onClick={() => connectStravaMutation.mutate()}
              disabled={connectStravaMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-[#FC4C02] text-white rounded-lg hover:bg-[#e04400] disabled:opacity-50 transition-colors"
            >
              <Link2 className="w-4 h-4" />
              {connectStravaMutation.isPending ? 'Connexion...' : 'Connecter Strava'}
            </button>
          </div>
        )}
      </div>

      {/* Notifications Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configurez les rappels par email pour vos compétitions et séances d'entraînement.
        </p>

        {loadingNotif ? (
          <div className="animate-pulse space-y-3">
            <div className="h-10 bg-gray-100 dark:bg-slate-700 rounded-lg" />
            <div className="h-10 bg-gray-100 dark:bg-slate-700 rounded-lg" />
            <div className="h-10 bg-gray-100 dark:bg-slate-700 rounded-lg" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Competition reminder toggle */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Rappels compétition</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Recevoir un email avant chaque compétition planifiée</p>
              </div>
              <button
                role="switch"
                aria-checked={notifPrefs?.emailCompetitionReminder ?? true}
                onClick={() =>
                  updateNotifMutation.mutate({
                    emailCompetitionReminder: !(notifPrefs?.emailCompetitionReminder ?? true),
                  })
                }
                disabled={updateNotifMutation.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  (notifPrefs?.emailCompetitionReminder ?? true)
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    (notifPrefs?.emailCompetitionReminder ?? true) ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Session reminder toggle */}
            <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Rappels séance</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Recevoir un email la veille de chaque séance planifiée</p>
              </div>
              <button
                role="switch"
                aria-checked={notifPrefs?.emailSessionReminder ?? true}
                onClick={() =>
                  updateNotifMutation.mutate({
                    emailSessionReminder: !(notifPrefs?.emailSessionReminder ?? true),
                  })
                }
                disabled={updateNotifMutation.isPending}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                  (notifPrefs?.emailSessionReminder ?? true)
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    (notifPrefs?.emailSessionReminder ?? true) ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Days before selector */}
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Jours avant</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Combien de jours avant l'événement envoyer le rappel</p>
              </div>
              <select
                value={notifPrefs?.reminderDaysBefore ?? 1}
                onChange={(e) =>
                  updateNotifMutation.mutate({ reminderDaysBefore: Number(e.target.value) })
                }
                disabled={updateNotifMutation.isPending}
                className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <option key={d} value={d} className="dark:bg-slate-700">
                    {d} jour{d > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Informations du compte
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Pour modifier vos informations personnelles ou supprimer votre compte, contactez le support.
        </p>
      </div>
    </div>
  )
}
