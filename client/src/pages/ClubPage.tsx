import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { clubApi } from '@/api/club.api'
import { SkeletonDashboard } from '@/components/ui/Skeleton'

export default function ClubPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['club-info'],
    queryFn: () => clubApi.getInfo().then(r => r.data),
  })

  useEffect(() => {
    if (data) {
      navigate('/club/coach', { replace: true })
    }
  }, [data, navigate])

  if (isLoading) return <SkeletonDashboard />
  return null
}
