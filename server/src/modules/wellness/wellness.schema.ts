import { z } from 'zod'

export const createWellnessLogSchema = z.object({
  body: z.object({
    date: z.string().transform(val => new Date(val)),
    sleepQuality: z.number().int().min(1).max(5),
    sleepHours: z.number().min(0).max(24).optional(),
    fatigue: z.number().int().min(1).max(5),
    mood: z.number().int().min(1).max(5),
    muscleSoreness: z.number().int().min(1).max(5),
    stress: z.number().int().min(1).max(5),
    restingHR: z.number().int().min(20).max(250).optional(),
    hrv: z.number().int().min(0).max(300).optional(),
    notes: z.string().max(500).optional(),
  }),
})

export const updateWellnessLogSchema = createWellnessLogSchema

export type CreateWellnessLogInput = z.infer<typeof createWellnessLogSchema>['body']
