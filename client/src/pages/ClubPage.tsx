import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clubApi } from '@/api/club.api'
import { SkeletonDashboard } from '@/components/ui/Skeleton'
import ClubAthletePage from './ClubAthletePage'

export default function ClubPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['club-info'],
    queryFn: () => clubApi.getInfo().then(r => r.data),
  })

  useEffect(() => {
    if (data?.role === 'coach') {
      navigate('/club/coach', { replace: true })
    }
  }, [data, navigate])

  if (isLoading) return <SkeletonDashboard />
  if (!data?.club) return (
    <div className="animate-fade-in flex flex-col items-center justify-center min-h-[50vh] text-center">
      <p className="text-gray-500 dark:text-gray-400 text-sm">Tu n'appartiens à aucun club pour l'instant.</p>
    </div>
  )
  if (data.role === 'coach') return null

  return <ClubAthletePage />
}
