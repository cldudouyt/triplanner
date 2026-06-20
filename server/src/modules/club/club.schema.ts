import { z } from 'zod'

export const generateSuggestionsSchema = z.object({
  athleteId: z.number().int().positive(),
  planId: z.number().int().positive(),
  weekNumber: z.number().int().min(1),
})

export const sendPlanSchema = z.object({
  suggestionId: z.number().int().positive(),
  appliedIds: z.array(z.string()),
  coachNote: z.string().optional(),
})

export const respondPlanSchema = z.object({
  suggestionId: z.number().int().positive(),
  action: z.enum(['accept', 'reject']),
})

export type GenerateSuggestionsInput = z.infer<typeof generateSuggestionsSchema>
export type SendPlanInput = z.infer<typeof sendPlanSchema>
export type RespondPlanInput = z.infer<typeof respondPlanSchema>
