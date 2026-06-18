import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { achievementsApi, type Achievement } from '@/api/achievements.api'
import { Award, Lock, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  training: { label: 'Entraînement', color: 'bg-blue-100 text-blue-800' },
  consistency: { label: 'Régularité', color: 'bg-orange-100 text-orange-800' },
  distance: { label: 'Distance', color: 'bg-green-100 text-green-800' },
  competition: { label: 'Compétition', color: 'bg-red-100 text-red-800' },
  wellness: { label: 'Bien-être', color: 'bg-purple-100 text-purple-800' },
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = achievement.unlocked
  const progress = achievement.progress

  return (
    <div className={`relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300 ${
      isUnlocked
        ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-white shadow-lg shadow-amber-100/50'
        : progress > 0
        ? 'border-gray-200 bg-white hover:border-blue-200 hover:shadow-md'
        : 'border-gray-100 bg-gray-50 opacity-60'
    }`}>
      {isUnlocked && (
        <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-400/10 rounded-full" />
      )}

      <div className="flex items-start gap-4">
        <div className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
          {achievement.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
              {achievement.name}
            </h3>
            {isUnlocked && <Award className="w-4 h-4 text-amber-500" />}
            {!isUnlocked && progress === 0 && <Lock className="w-3 h-3 text-gray-400" />}
          </div>
          <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
            {achievement.description}
          </p>

          {!isUnlocked && progress > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Progression</span>
                <span className="font-medium text-blue-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {isUnlocked && achievement.unlockedAt && (
            <p className="text-xs text-amber-600 mt-2">
              Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_CONFIG[achievement.category]?.color || 'bg-gray-100 text-gray-600'}`}>
          {CATEGORY_CONFIG[achievement.category]?.label || achievement.category}
        </span>
      </div>
    </div>
  )
}

export default function AchievementsPage() {
  const queryClient = useQueryClient()

  const { data: achievements, isLoading } = useQuery({
    queryKey: ['achievements'],
    queryFn: () => achievementsApi.getAll().then(r => r.data),
  })

  const checkMutation = useMutation({
    mutationFn: () => achievementsApi.check(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      const newUnlocks = res.data.newUnlocks.length
      if (newUnlocks > 0) {
        toast.success(`${newUnlocks} nouveau${newUnlocks > 1 ? 'x' : ''} badge${newUnlocks > 1 ? 's' : ''} débloqué${newUnlocks > 1 ? 's' : ''} !`)
      } else {
        toast.success('Badges mis à jour')
      }
    },
  })

  // Auto-check achievements on page load
  useEffect(() => {
    checkMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const unlocked = achievements?.filter(a => a.unlocked) || []
  const inProgress = achievements?.filter(a => !a.unlocked && a.progress > 0) || []
  const locked = achievements?.filter(a => !a.unlocked && a.progress === 0) || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Badges & Récompenses</h1>
          <p className="text-gray-500 mt-1">
            {unlocked.length} / {achievements?.length || 0} badges débloqués
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => checkMutation.mutate()}
          loading={checkMutation.isPending}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Vérifier
        </Button>
      </div>

      {/* Progress overview */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🏆</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progression globale</span>
                <span className="text-sm font-bold text-blue-600">
                  {achievements ? Math.round((unlocked.length / achievements.length) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${achievements ? (unlocked.length / achievements.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unlocked achievements */}
      {unlocked.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Débloqués ({unlocked.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map(a => <AchievementCard key={a.id} achievement={a} />)}
          </div>
        </div>
      )}

      {/* In progress */}
      {inProgress.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">En cours ({inProgress.length})</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map(a => <AchievementCard key={a.id} achievement={a} />)}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-400" />
            Verrouillés ({locked.length})
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map(a => <AchievementCard key={a.id} achievement={a} />)}
          </div>
        </div>
      )}
    </div>
  )
}
