import { z } from 'zod'

export const competitionTypes = ['triathlon', 'running'] as const
export const triathlonSubTypes = ['sprint', 'olympic', 'half-ironman', 'ironman'] as const
export const runningSubTypes = ['5k', '10k', 'semi-marathon', 'marathon', 'trail', 'ultra'] as const
export const priorities = ['A', 'B', 'C'] as const
export const statuses = ['planned', 'registered', 'completed', 'dns', 'dnf'] as const

export const createCompetitionSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  date: z.string().transform(s => new Date(s)),
  location: z.string().nullish(),
  type: z.enum(competitionTypes),
  subType: z.string().min(1),
  swimDistance: z.number().nullish(),
  bikeDistance: z.number().nullish(),
  runDistance: z.number().nullish(),
  chronoObjective: z.string().nullish(),
  result: z.string().nullish(),
  registrationLink: z.string().url().nullish().or(z.literal('')),
  notes: z.string().nullish(),
  priority: z.enum(priorities).default('B'),
  budget: z.number().nullish(),
  accommodation: z.string().nullish(),
  transport: z.string().nullish(),
  status: z.enum(statuses).default('planned'),
})

export const updateCompetitionSchema = createCompetitionSchema.partial()

export const competitionQuerySchema = z.object({
  type: z.string().optional(),
  subType: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sortBy: z.string().default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(20),
})

export type CreateCompetitionInput = z.infer<typeof createCompetitionSchema>
export type UpdateCompetitionInput = z.infer<typeof updateCompetitionSchema>
export type CompetitionQuery = z.infer<typeof competitionQuerySchema>
