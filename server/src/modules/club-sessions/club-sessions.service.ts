import prisma from '../../config/database.js'
import type { CreateSessionInput } from './club-sessions.schema.js'

export async function listSessions(userId: number, sport?: string) {
  const membership = await prisma.clubMember.findFirst({ where: { userId } })
  if (!membership) return []

  const sessions = await prisma.clubSession.findMany({
    where: {
      clubId: membership.clubId,
      date: { gte: new Date() },
      ...(sport ? { sport } : {}),
    },
    include: {
      registrations: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
      },
      coach: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: 'asc' },
  })

  return sessions.map(s => ({
    ...s,
    registeredCount: s.registrations.filter(r => !r.waitlist).length,
    waitlistCount: s.registrations.filter(r => r.waitlist).length,
    isRegistered: s.registrations.some(r => r.userId === userId && !r.waitlist),
    isWaitlisted: s.registrations.some(r => r.userId === userId && r.waitlist),
    attendees: s.registrations
      .filter(r => !r.waitlist)
      .slice(0, 5)
      .map(r => ({ id: r.user.id, firstName: r.user.firstName, lastName: r.user.lastName })),
  }))
}

export async function createSession(coachId: number, data: CreateSessionInput) {
  const membership = await prisma.clubMember.findFirst({ where: { userId: coachId, role: 'coach' } })
  if (!membership) throw new Error('Not a coach')

  return prisma.clubSession.create({
    data: { ...data, clubId: membership.clubId, coachId, date: new Date(data.date) },
  })
}

export async function registerForSession(sessionId: number, userId: number) {
  const session = await prisma.clubSession.findUnique({
    where: { id: sessionId },
    include: { registrations: { where: { waitlist: false } } },
  })
  if (!session) throw new Error('Session not found')

  const existing = await prisma.clubSessionRegistration.findUnique({
    where: { sessionId_userId: { sessionId, userId } },
  })
  if (existing) throw new Error('Already registered')

  const isFull = session.registrations.length >= session.capacity
  return prisma.clubSessionRegistration.create({
    data: { sessionId, userId, waitlist: isFull },
  })
}

export async function unregisterFromSession(sessionId: number, userId: number) {
  await prisma.clubSessionRegistration.delete({
    where: { sessionId_userId: { sessionId, userId } },
  })
  const first = await prisma.clubSessionRegistration.findFirst({
    where: { sessionId, waitlist: true },
    orderBy: { createdAt: 'asc' },
  })
  if (first) {
    await prisma.clubSessionRegistration.update({
      where: { id: first.id },
      data: { waitlist: false },
    })
  }
}

export async function getSessionAttendees(sessionId: number, coachId: number) {
  const session = await prisma.clubSession.findFirst({
    where: { id: sessionId, coachId },
    include: {
      registrations: {
        include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } },
        orderBy: [{ waitlist: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })
  if (!session) return null
  return session.registrations
}
