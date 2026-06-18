import prisma from '../../config/database.js'
import type { CreateSessionInput, UpdateSessionInput } from './session.schema.js'

export async function findById(userId: number, id: number) {
  return prisma.trainingSession.findFirst({
    where: {
      id,
      plan: { userId },
    },
  })
}

export async function create(userId: number, input: CreateSessionInput) {
  const plan = await prisma.trainingPlan.findFirst({
    where: { id: input.planId, userId },
  })
  if (!plan) return null

  return prisma.trainingSession.create({ data: input })
}

export async function update(userId: number, id: number, input: UpdateSessionInput) {
  const session = await prisma.trainingSession.findFirst({
    where: { id, plan: { userId } },
  })
  if (!session) return null

  return prisma.trainingSession.update({
    where: { id },
    data: input,
  })
}

export async function remove(userId: number, id: number) {
  const session = await prisma.trainingSession.findFirst({
    where: { id, plan: { userId } },
  })
  if (!session) return false

  await prisma.trainingSession.delete({ where: { id } })
  return true
}
