import { z } from 'zod'

export const createGoalSchema = z.object({
  sport: z.enum(['swim', 'bike', 'run', 'strength', 'all']),
  year: z.number().int().min(2024).max(2030),
  type: z.enum(['distance', 'duration', 'sessions']),
  targetValue: z.number().positive(),
  unit: z.string().min(1),
  label: z.string().optional(),
})

export const listGoalsSchema = z.object({
  year: z.coerce.number().int().optional(),
})

export type CreateGoalInput = z.infer<typeof createGoalSchema>
