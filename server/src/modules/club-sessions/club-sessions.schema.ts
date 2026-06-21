import { z } from 'zod'

export const createSessionSchema = z.object({
  title: z.string().min(1),
  sport: z.enum(['swim', 'bike', 'run', 'strength']),
  date: z.string(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(1),
  capacity: z.number().int().min(1).max(100).default(16),
  description: z.string().optional(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
