import prisma from '../../config/database.js'
import type { CreateCompetitionInput, UpdateCompetitionInput, CompetitionQuery } from './competition.schema.js'

export async function findAll(userId: number, query: CompetitionQuery) {
  const where: any = { userId }

  if (query.type) where.type = query.type
  if (query.subType) where.subType = query.subType
  if (query.status) where.status = query.status
  if (query.priority) where.priority = query.priority
  if (query.dateFrom || query.dateTo) {
    where.date = {}
    if (query.dateFrom) where.date.gte = new Date(query.dateFrom)
    if (query.dateTo) where.date.lte = new Date(query.dateTo)
  }

  const [data, total] = await Promise.all([
    prisma.competition.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: { equipmentItems: true },
    }),
    prisma.competition.count({ where }),
  ])

  return {
    data,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  }
}

export async function findById(userId: number, id: number) {
  return prisma.competition.findFirst({
    where: { id, userId },
    include: {
      equipmentItems: true,
      planCompetitions: {
        include: { plan: { select: { id: true, name: true, startDate: true, endDate: true } } },
      },
    },
  })
}

export async function create(userId: number, input: CreateCompetitionInput) {
  return prisma.competition.create({
    data: { ...input, userId },
    include: { equipmentItems: true },
  })
}

export async function update(userId: number, id: number, input: UpdateCompetitionInput) {
  const competition = await prisma.competition.findFirst({ where: { id, userId } })
  if (!competition) return null

  return prisma.competition.update({
    where: { id },
    data: input,
    include: { equipmentItems: true },
  })
}

export async function remove(userId: number, id: number) {
  const competition = await prisma.competition.findFirst({ where: { id, userId } })
  if (!competition) return false

  await prisma.competition.delete({ where: { id } })
  return true
}

export async function bulkCreate(userId: number, items: CreateCompetitionInput[]) {
  const results = []
  const errors = []

  for (let i = 0; i < items.length; i++) {
    try {
      const comp = await prisma.competition.create({
        data: { ...items[i], userId },
      })
      results.push(comp)
    } catch (err: any) {
      errors.push({ row: i + 1, message: err.message })
    }
  }

  return { imported: results, errors }
}

export async function getSuggestions(userId: number) {
  const competitions = await prisma.competition.findMany({
    where: { userId },
    select: { name: true, location: true },
  })
  return {
    names: [...new Set(competitions.map(c => c.name))],
    locations: [...new Set(competitions.filter(c => c.location).map(c => c.location!))],
  }
}

// Equipment items
export async function addEquipmentItem(userId: number, competitionId: number, name: string, category?: string) {
  const competition = await prisma.competition.findFirst({ where: { id: competitionId, userId } })
  if (!competition) return null

  return prisma.equipmentItem.create({
    data: { competitionId, name, category },
  })
}

export async function updateEquipmentItem(userId: number, competitionId: number, itemId: number, data: { checked?: boolean; name?: string; category?: string }) {
  const competition = await prisma.competition.findFirst({ where: { id: competitionId, userId } })
  if (!competition) return null

  return prisma.equipmentItem.update({
    where: { id: itemId },
    data,
  })
}

export async function removeEquipmentItem(userId: number, competitionId: number, itemId: number) {
  const competition = await prisma.competition.findFirst({ where: { id: competitionId, userId } })
  if (!competition) return false

  await prisma.equipmentItem.delete({ where: { id: itemId } })
  return true
}
