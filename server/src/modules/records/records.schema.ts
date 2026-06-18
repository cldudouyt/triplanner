import { z } from 'zod'

export const createRecordSchema = z.object({
  body: z.object({
    sport: z.enum(['swim', 'bike', 'run']),
    category: z.string().min(1).max(50),
    value: z.number().positive(),
    unit: z.enum(['time', 'distance']),
    date: z.string().transform(val => new Date(val)),
    notes: z.string().max(500).optional(),
    sessionId: z.number().int().optional(),
    competitionId: z.number().int().optional(),
  }),
})

export type CreateRecordInput = z.infer<typeof createRecordSchema>['body']
