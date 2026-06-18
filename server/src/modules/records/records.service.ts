import prisma from '../../config/database.js'

export interface CreateRecordInput {
  sport: string
  category: string
  value: number
  unit: string
  date: Date
  notes?: string
  sessionId?: number
  competitionId?: number
}

export async function createRecord(userId: number, data: CreateRecordInput) {
  // Check if this is actually a new PR (better than existing)
  const existing = await prisma.personalRecord.findFirst({
    where: {
      userId,
      sport: data.sport,
      category: data.category,
    },
    orderBy: { value: data.unit === 'time' ? 'asc' : 'desc' },
  })

  const isNewPR = !existing ||
    (data.unit === 'time' && data.value < existing.value) ||
    (data.unit === 'distance' && data.value > existing.value)

  const record = await prisma.personalRecord.create({
    data: {
      userId,
      ...data,
    },
  })

  return { record, isNewPR }
}

export async function getRecords(userId: number) {
  const records = await prisma.personalRecord.findMany({
    where: { userId },
    orderBy: { date: 'desc' },
  })

  // Group by sport and category, keep best for each
  const bestByCategory = new Map<string, typeof records[0]>()

  for (const record of records) {
    const key = `${record.sport}:${record.category}`
    const existing = bestByCategory.get(key)

    if (!existing) {
      bestByCategory.set(key, record)
    } else if (record.unit === 'time' && record.value < existing.value) {
      bestByCategory.set(key, record)
    } else if (record.unit === 'distance' && record.value > existing.value) {
      bestByCategory.set(key, record)
    }
  }

  return {
    best: Array.from(bestByCategory.values()),
    all: records,
  }
}

export async function getRecordsBySport(userId: number, sport: string) {
  return prisma.personalRecord.findMany({
    where: { userId, sport },
    orderBy: { date: 'desc' },
  })
}

export async function deleteRecord(userId: number, id: number) {
  return prisma.personalRecord.deleteMany({
    where: { id, userId },
  })
}

// Standard race categories for each sport
export const RECORD_CATEGORIES = {
  swim: [
    { value: '400m', label: '400m', unit: 'time' },
    { value: '750m', label: '750m', unit: 'time' },
    { value: '1500m', label: '1500m', unit: 'time' },
    { value: '1900m', label: '1900m (Half-IM)', unit: 'time' },
    { value: '3800m', label: '3800m (IM)', unit: 'time' },
  ],
  bike: [
    { value: '20km', label: '20km', unit: 'time' },
    { value: '40km', label: '40km', unit: 'time' },
    { value: '90km', label: '90km (Half-IM)', unit: 'time' },
    { value: '180km', label: '180km (IM)', unit: 'time' },
    { value: 'ftp', label: 'FTP (watts)', unit: 'distance' },
  ],
  run: [
    { value: '5k', label: '5K', unit: 'time' },
    { value: '10k', label: '10K', unit: 'time' },
    { value: 'semi-marathon', label: 'Semi-Marathon', unit: 'time' },
    { value: 'marathon', label: 'Marathon', unit: 'time' },
    { value: 'trail-50k', label: 'Trail 50K', unit: 'time' },
  ],
}
