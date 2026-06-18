import prisma from '../../config/database.js'
import type { Competition, TrainingSession } from '../../../generated/prisma/client.js'

export async function getPreferences(userId: number) {
  let prefs = await prisma.notificationPreferences.findUnique({ where: { userId } })
  if (!prefs) {
    prefs = await prisma.notificationPreferences.create({ data: { userId } })
  }
  return prefs
}

export async function updatePreferences(
  userId: number,
  data: {
    emailSessionReminder?: boolean
    emailCompetitionReminder?: boolean
    reminderDaysBefore?: number
  },
) {
  return prisma.notificationPreferences.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  })
}

export async function sendCompetitionReminder(userId: number, competition: Competition) {
  // In dev (NODE_ENV !== 'production'): log only
  // In prod: send email via nodemailer (SMTP config from process.env.SMTP_HOST/PORT/USER/PASS)
  // For now: always log to console
  console.log(`[NOTIFICATION] Competition reminder: userId=${userId}, competition=${competition.name}`)
}

export async function sendSessionReminder(userId: number, session: TrainingSession) {
  // In dev (NODE_ENV !== 'production'): log only
  // In prod: send email via nodemailer (SMTP config from process.env.SMTP_HOST/PORT/USER/PASS)
  // For now: always log to console
  console.log(`[NOTIFICATION] Session reminder: userId=${userId}, sessionId=${session.id}, date=${session.date}`)
}

export async function checkAndSendReminders() {
  const now = new Date()

  // Competitions
  const allPrefs = await prisma.notificationPreferences.findMany({
    where: { emailCompetitionReminder: true },
  })

  for (const pref of allPrefs) {
    const targetDate = new Date(now)
    targetDate.setDate(targetDate.getDate() + pref.reminderDaysBefore)
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    const competitions = await prisma.competition.findMany({
      where: {
        userId: pref.userId,
        status: 'planned',
        date: { gte: dayStart, lte: dayEnd },
      },
    })

    for (const comp of competitions) {
      await sendCompetitionReminder(pref.userId, comp)
    }
  }

  // Sessions
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tmStart = new Date(tomorrow)
  tmStart.setHours(0, 0, 0, 0)
  const tmEnd = new Date(tomorrow)
  tmEnd.setHours(23, 59, 59, 999)

  const sessionPrefs = await prisma.notificationPreferences.findMany({
    where: { emailSessionReminder: true },
  })

  for (const pref of sessionPrefs) {
    const sessions = await prisma.trainingSession.findMany({
      where: {
        plan: { userId: pref.userId },
        date: { gte: tmStart, lte: tmEnd },
      },
    })

    for (const s of sessions) {
      await sendSessionReminder(pref.userId, s)
    }
  }
}
