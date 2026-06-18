import prisma from '../../config/database.js'

export async function exportUserData(userId: number) {
  const [user, competitions, trainingPlans] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true, createdAt: true },
    }),
    prisma.competition.findMany({
      where: { userId },
      include: { equipmentItems: true },
      orderBy: { date: 'asc' },
    }),
    prisma.trainingPlan.findMany({
      where: { userId, isTemplate: false },
      include: {
        sessions: { orderBy: [{ weekNumber: 'asc' }, { dayOfWeek: 'asc' }] },
        competitions: {
          include: { competition: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return {
    exportDate: new Date().toISOString(),
    version: '1.0',
    user: {
      email: user?.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
      createdAt: user?.createdAt,
    },
    competitions: competitions.map(c => ({
      name: c.name,
      date: c.date.toISOString(),
      location: c.location,
      type: c.type,
      subType: c.subType,
      swimDistance: c.swimDistance,
      bikeDistance: c.bikeDistance,
      runDistance: c.runDistance,
      chronoObjective: c.chronoObjective,
      result: c.result,
      registrationLink: c.registrationLink,
      notes: c.notes,
      priority: c.priority,
      budget: c.budget,
      accommodation: c.accommodation,
      transport: c.transport,
      status: c.status,
      equipmentItems: c.equipmentItems.map(e => ({
        name: e.name,
        checked: e.checked,
        category: e.category,
      })),
    })),
    trainingPlans: trainingPlans.map(p => ({
      name: p.name,
      description: p.description,
      targetType: p.targetType,
      level: p.level,
      weeklyHours: p.weeklyHours,
      durationWeeks: p.durationWeeks,
      startDate: p.startDate?.toISOString(),
      endDate: p.endDate?.toISOString(),
      linkedCompetitions: p.competitions.map(pc => pc.competition.name),
      sessions: p.sessions.map(s => ({
        weekNumber: s.weekNumber,
        dayOfWeek: s.dayOfWeek,
        date: s.date?.toISOString(),
        type: s.type,
        title: s.title,
        description: s.description,
        duration: s.duration,
        distance: s.distance,
        intensity: s.intensity,
        completed: s.completed,
        actualDuration: s.actualDuration,
        actualDistance: s.actualDistance,
        notes: s.notes,
      })),
    })),
  }
}

export function exportToCSV(data: Awaited<ReturnType<typeof exportUserData>>): string {
  const lines: string[] = []

  // Competitions CSV
  lines.push('# COMPETITIONS')
  lines.push('Nom,Date,Lieu,Type,Sous-type,Distance natation (km),Distance vélo (km),Distance course (km),Objectif chrono,Résultat,Priorité,Statut')
  for (const c of data.competitions) {
    lines.push([
      escapeCSV(c.name),
      c.date.split('T')[0],
      escapeCSV(c.location || ''),
      c.type,
      c.subType,
      c.swimDistance || '',
      c.bikeDistance || '',
      c.runDistance || '',
      escapeCSV(c.chronoObjective || ''),
      escapeCSV(c.result || ''),
      c.priority,
      c.status,
    ].join(','))
  }

  lines.push('')
  lines.push('# TRAINING SESSIONS')
  lines.push('Plan,Semaine,Jour,Date,Type,Titre,Durée (min),Distance (km),Intensité,Complété,Durée réelle,Distance réelle,Notes')

  for (const p of data.trainingPlans) {
    for (const s of p.sessions) {
      lines.push([
        escapeCSV(p.name),
        s.weekNumber,
        s.dayOfWeek,
        s.date?.split('T')[0] || '',
        s.type,
        escapeCSV(s.title || ''),
        s.duration || '',
        s.distance || '',
        s.intensity || '',
        s.completed ? 'Oui' : 'Non',
        s.actualDuration || '',
        s.actualDistance || '',
        escapeCSV(s.notes || ''),
      ].join(','))
    }
  }

  return lines.join('\n')
}

function escapeCSV(str: string): string {
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function importUserData(userId: number, data: any) {
  const results = {
    competitions: { created: 0, errors: [] as string[] },
    trainingPlans: { created: 0, errors: [] as string[] },
    sessions: { created: 0, errors: [] as string[] },
  }

  // Import competitions
  if (data.competitions?.length) {
    for (const c of data.competitions) {
      try {
        const competition = await prisma.competition.create({
          data: {
            userId,
            name: c.name,
            date: new Date(c.date),
            location: c.location,
            type: c.type || 'triathlon',
            subType: c.subType || 'sprint',
            swimDistance: c.swimDistance,
            bikeDistance: c.bikeDistance,
            runDistance: c.runDistance,
            chronoObjective: c.chronoObjective,
            result: c.result,
            registrationLink: c.registrationLink,
            notes: c.notes,
            priority: c.priority || 'B',
            budget: c.budget,
            accommodation: c.accommodation,
            transport: c.transport,
            status: c.status || 'planned',
          },
        })

        // Import equipment items
        if (c.equipmentItems?.length) {
          await prisma.equipmentItem.createMany({
            data: c.equipmentItems.map((e: any) => ({
              competitionId: competition.id,
              name: e.name,
              checked: e.checked || false,
              category: e.category,
            })),
          })
        }

        results.competitions.created++
      } catch (err: any) {
        results.competitions.errors.push(`Competition "${c.name}": ${err.message}`)
      }
    }
  }

  // Import training plans
  if (data.trainingPlans?.length) {
    for (const p of data.trainingPlans) {
      try {
        const plan = await prisma.trainingPlan.create({
          data: {
            userId,
            name: p.name,
            description: p.description,
            targetType: p.targetType,
            level: p.level,
            weeklyHours: p.weeklyHours,
            durationWeeks: p.durationWeeks,
            startDate: p.startDate ? new Date(p.startDate) : null,
            endDate: p.endDate ? new Date(p.endDate) : null,
            isTemplate: false,
          },
        })

        results.trainingPlans.created++

        // Import sessions
        if (p.sessions?.length) {
          for (const s of p.sessions) {
            try {
              await prisma.trainingSession.create({
                data: {
                  planId: plan.id,
                  weekNumber: s.weekNumber,
                  dayOfWeek: s.dayOfWeek,
                  date: s.date ? new Date(s.date) : null,
                  type: s.type,
                  title: s.title,
                  description: s.description,
                  duration: s.duration,
                  distance: s.distance,
                  intensity: s.intensity,
                  completed: s.completed || false,
                  actualDuration: s.actualDuration,
                  actualDistance: s.actualDistance,
                  notes: s.notes,
                },
              })
              results.sessions.created++
            } catch (err: any) {
              results.sessions.errors.push(`Session "${s.title || 'sans titre'}": ${err.message}`)
            }
          }
        }
      } catch (err: any) {
        results.trainingPlans.errors.push(`Plan "${p.name}": ${err.message}`)
      }
    }
  }

  return results
}
