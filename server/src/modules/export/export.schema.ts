import { z } from 'zod'

export const importDataSchema = z.object({
  competitions: z.array(z.record(z.string(), z.unknown())).optional(),
  trainingPlans: z.array(z.record(z.string(), z.unknown())).optional(),
  trainingSessions: z.array(z.record(z.string(), z.unknown())).optional(),
  wellnessLogs: z.array(z.record(z.string(), z.unknown())).optional(),
}).passthrough()

export type ImportDataInput = z.infer<typeof importDataSchema>
