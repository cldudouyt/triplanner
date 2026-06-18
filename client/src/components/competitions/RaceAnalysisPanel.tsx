import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, ChevronDown, ChevronUp, CheckCircle2, TrendingUp, Lightbulb, Activity } from 'lucide-react'
import { aiApi, type CompetitionAnalysis } from '@/api/ai.api'
import { Skeleton } from '@/components/ui/Skeleton'

interface RaceAnalysisPanelProps {
  competitionId: number
  canAnalyze: boolean
}

function AnalysisSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-violet-200 dark:border-violet-800 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-violet-500" />
        <span className="font-semibold text-gray-900 dark:text-gray-100">Analyse Claude en cours…</span>
      </div>
      <div className="space-y-4">
        {/* Évaluation block */}
        <div className="rounded-lg p-4 bg-violet-50 dark:bg-violet-900/20 space-y-2">
          <Skeleton variant="text" height="0.875rem" width="100%" />
          <Skeleton variant="text" height="0.875rem" width="80%" />
        </div>
        {/* Points forts block */}
        <div className="space-y-2">
          <Skeleton variant="text" height="0.875rem" width="40%" />
          <Skeleton variant="text" height="0.875rem" width="90%" />
          <Skeleton variant="text" height="0.875rem" width="70%" />
        </div>
        {/* Axes d'amélioration block */}
        <div className="space-y-2">
          <Skeleton variant="text" height="0.875rem" width="50%" />
          <Skeleton variant="text" height="0.875rem" width="85%" />
          <Skeleton variant="text" height="0.875rem" width="65%" />
        </div>
        {/* Recommandations block */}
        <div className="space-y-2">
          <Skeleton variant="text" height="0.875rem" width="45%" />
          <Skeleton variant="text" height="0.875rem" width="95%" />
          <Skeleton variant="text" height="0.875rem" width="75%" />
          <Skeleton variant="text" height="0.875rem" width="60%" />
        </div>
        {/* Forme le jour J block */}
        <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-slate-700">
          <Skeleton variant="text" height="0.875rem" width="35%" />
          <Skeleton variant="text" height="0.875rem" width="88%" />
        </div>
      </div>
    </div>
  )
}

export default function RaceAnalysisPanel({ competitionId, canAnalyze }: RaceAnalysisPanelProps) {
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [analysis, setAnalysis] = useState<CompetitionAnalysis | null>(null)

  const analyzeMutation = useMutation({
    mutationFn: () => aiApi.analyzeCompetition(competitionId).then(r => r.data),
    onSuccess: (data) => {
      setAnalysis(data)
      setAnalysisOpen(true)
    },
  })

  if (!canAnalyze && !analysis && !analyzeMutation.isPending && !analyzeMutation.isError) {
    return null
  }

  return (
    <>
      {canAnalyze && (
        <div className="flex justify-start">
          <button
            onClick={() => analysis ? setAnalysisOpen(o => !o) : analyzeMutation.mutate()}
            disabled={analyzeMutation.isPending}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600 text-white rounded-lg transition-colors disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {analyzeMutation.isPending ? 'Analyse en cours…' : analysis ? (analysisOpen ? 'Masquer l\'analyse' : 'Voir l\'analyse') : 'Analyser avec Claude'}
          </button>
        </div>
      )}

      {analyzeMutation.isPending && <AnalysisSkeleton />}

      {analyzeMutation.isError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300">
          Erreur lors de l'analyse. Vérifiez que la clé ANTHROPIC_API_KEY est configurée.
        </div>
      )}

      {analysis && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-violet-200 dark:border-violet-700 p-6 animate-fade-in">
          <button
            onClick={() => setAnalysisOpen(o => !o)}
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Analyse Claude</span>
            </div>
            {analysisOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>

          {analysisOpen && (
            <div className="mt-4 space-y-5">
              {/* Évaluation */}
              <div className="bg-violet-50 dark:bg-violet-900/20 rounded-lg p-4">
                <p className="text-sm text-violet-800 dark:text-violet-200 font-medium">{analysis.evaluation}</p>
              </div>

              {/* Points forts */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Points forts</h4>
                </div>
                <ul className="space-y-1">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-green-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Axes d'amélioration */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Axes d'amélioration</h4>
                </div>
                <ul className="space-y-1">
                  {analysis.improvements.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommandations */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-4 w-4 text-blue-500" />
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Recommandations</h4>
                </div>
                <ol className="space-y-1">
                  {analysis.recommendations.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-blue-500 font-medium mt-0.5">{i + 1}.</span> {s}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Forme le jour J */}
              <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-rose-500" />
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Forme le jour J</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.formAnalysis}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}
