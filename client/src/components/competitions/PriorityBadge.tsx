import { PRIORITIES } from '@/utils/constants'

export default function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITIES.find(p => p.value === priority) || PRIORITIES[1]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
