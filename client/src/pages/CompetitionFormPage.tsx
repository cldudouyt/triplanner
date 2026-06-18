import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { competitionsApi } from '@/api/competitions.api'
import CompetitionForm from '@/components/competitions/CompetitionForm'

export default function CompetitionFormPage() {
  const { id } = useParams()
  const isEdit = !!id

  const { data: competition, isLoading } = useQuery({
    queryKey: ['competition', id],
    queryFn: () => competitionsApi.get(Number(id)).then(r => r.data),
    enabled: isEdit,
  })

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEdit ? 'Modifier la compétition' : 'Nouvelle compétition'}
      </h1>
      <CompetitionForm competition={isEdit ? competition : undefined} />
    </div>
  )
}
