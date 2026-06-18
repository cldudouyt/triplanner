import { z } from 'zod'

const competitionIdSchema = z.object({
  id: z.number().int(),
  isPrimary: z.boolean().optional(),
})

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  targetType: z.string().min(1),
  durationWeeks: z.number().int().min(1),
  level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  weeklyHours: z.number().int().min(2).max(25).optional(),
  competitionIds: z.array(competitionIdSchema).optional(),
  startDate: z.string().transform(s => new Date(s)).optional(),
  autoGenerate: z.boolean().optional(),
})

export const updatePlanSchema = createPlanSchema.partial()

export const createFromTemplateSchema = z.object({
  competitionIds: z.array(competitionIdSchema).optional(),
  startDate: z.string().transform(s => new Date(s)),
})

export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
export type CompetitionIdInput = z.infer<typeof competitionIdSchema>
