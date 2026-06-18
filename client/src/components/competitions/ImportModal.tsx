import { useState, useRef } from 'react'
import { Upload, X, FileSpreadsheet } from 'lucide-react'
import { competitionsApi } from '@/api/competitions.api'

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  if (!open) return null

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const { data } = await competitionsApi.import(file)
      setResult(data)
      if (data.imported > 0) {
        onSuccess()
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de l'import")
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setFile(null)
    setResult(null)
    setError('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Importer des compétitions</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!result ? (
          <>
            <div
              className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(1)} Ko</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Cliquez pour sélectionner un fichier</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">CSV, XLSX ou XLS (max 5 Mo)</p>
                </>
              )}
            </div>

            <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
              <p className="font-medium mb-1 text-gray-700 dark:text-gray-300">Colonnes attendues :</p>
              <p>nom/name, date, lieu/location, type, distance/subType, objectif/chrono, priorité/priority, budget, notes</p>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Import en cours...' : 'Importer'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg">
                {result.imported} compétition(s) importée(s)
              </div>
              {result.parseErrors?.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">Erreurs de parsing :</p>
                  {result.parseErrors.map((e: any, i: number) => (
                    <p key={i}>Ligne {e.row}: {e.message}</p>
                  ))}
                </div>
              )}
              {result.insertErrors?.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                  <p className="font-medium mb-1">Erreurs d'insertion :</p>
                  {result.insertErrors.map((e: any, i: number) => (
                    <p key={i}>Ligne {e.row}: {e.message}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={reset} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                Importer un autre fichier
              </button>
              <button onClick={onClose} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Fermer
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
