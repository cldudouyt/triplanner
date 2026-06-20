import { z } from 'zod'

export const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.enum(['Débutant', 'Intermédiaire', 'Avancé', 'Élite']),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  weeklyHours: z.number().positive().optional(),
  sessionsPerWeek: z.number().int().positive().optional(),
})

export const addMemberSchema = z.object({
  userId: z.number().int().positive(),
})
