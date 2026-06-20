import { z } from 'zod'

export const createThreadSchema = z.object({
  recipientId: z.number().int().positive(),
  content: z.string().min(1),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1),
})

export type CreateThreadInput = z.infer<typeof createThreadSchema>
export type SendMessageInput = z.infer<typeof sendMessageSchema>
