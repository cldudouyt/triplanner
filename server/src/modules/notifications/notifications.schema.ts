import { z } from 'zod'

export const updatePreferencesSchema = z.object({
  emailSessionReminder: z.boolean().optional(),
  emailCompetitionReminder: z.boolean().optional(),
  reminderDaysBefore: z.number().int().min(1).max(7).optional(),
})
