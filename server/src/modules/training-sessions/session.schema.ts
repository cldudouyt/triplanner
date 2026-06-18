import { z } from 'zod'

export const sessionTypes = ['swim', 'bike', 'run', 'strength', 'rest', 'brick'] as const
export const intensities = ['easy', 'moderate', 'hard', 'interval', 'race-pace'] as const

export const createSessionSchema = z.object({
  planId: z.number().int(),
  weekNumber: z.number().int().min(1),
  dayOfWeek: z.number().int().min(1).max(7),
  date: z.string().transform(s => new Date(s)).optional(),
  type: z.enum(sessionTypes),
  title: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().int().optional(),
  distance: z.number().optional(),
  intensity: z.enum(intensities).optional(),
})

export const updateSessionSchema = z.object({
  weekNumber: z.number().int().min(1).optional(),
  dayOfWeek: z.number().int().min(1).max(7).optional(),
  date: z.string().transform(s => new Date(s)).optional(),
  type: z.enum(sessionTypes).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  duration: z.number().int().optional(),
  distance: z.number().optional(),
  intensity: z.enum(intensities).optional(),
  completed: z.boolean().optional(),
  actualDuration: z.number().int().optional(),
  actualDistance: z.number().optional(),
  notes: z.string().optional(),
})

export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>
