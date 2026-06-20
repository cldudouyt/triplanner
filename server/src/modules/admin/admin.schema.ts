import { z } from 'zod'

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  isAdmin: z.boolean().optional(),
}).strict()

export type UpdateUserInput = z.infer<typeof updateUserSchema>
