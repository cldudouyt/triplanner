import prisma from '../../config/database.js'
import { config } from '../../config/env.js'

const STRAVA_API_URL = 'https://www.strava.com/api/v3'
const STRAVA_AUTH_URL = 'https://www.strava.com/oauth'

export function getAuthorizationUrl(state: string): string {
  if (!config.strava.clientId) {
    throw new Error('STRAVA_NOT_CONFIGURED')
  }

  const params = new URLSearchParams({
    client_id: config.strava.clientId,
    redirect_uri: config.strava.redirectUri,
    response_type: 'code',
    scope: 'read,activity:read_all',
    state,
  })

  return `${STRAVA_AUTH_URL}/authorize?${params}`
}

export async function exchangeCodeForToken(code: string) {
  const response = await fetch(`${STRAVA_AUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.strava.clientId,
      client_secret: config.strava.clientSecret,
      code,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    throw new Error('STRAVA_AUTH_FAILED')
  }

  return response.json()
}

export async function refreshStravaToken(refreshToken: string) {
  const response = await fetch(`${STRAVA_AUTH_URL}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.strava.clientId,
      client_secret: config.strava.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    throw new Error('STRAVA_REFRESH_FAILED')
  }

  return response.json()
}

export async function saveStravaConnection(userId: number, tokenData: any) {
  const expiresAt = new Date(tokenData.expires_at * 1000)

  return prisma.stravaConnection.upsert({
    where: { userId },
    create: {
      userId,
      athleteId: tokenData.athlete.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
    },
    update: {
      athleteId: tokenData.athlete.id,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
    },
  })
}

export async function getStravaConnection(userId: number) {
  return prisma.stravaConnection.findUnique({ where: { userId } })
}

export async function disconnectStrava(userId: number) {
  await prisma.stravaConnection.deleteMany({ where: { userId } })
}

async function getValidAccessToken(userId: number): Promise<string> {
  const connection = await prisma.stravaConnection.findUnique({ where: { userId } })
  if (!connection) {
    throw new Error('STRAVA_NOT_CONNECTED')
  }

  if (connection.expiresAt.getTime() < Date.now() + 5 * 60 * 1000) {
    const tokenData = await refreshStravaToken(connection.refreshToken)
    await prisma.stravaConnection.update({
      where: { userId },
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(tokenData.expires_at * 1000),
      },
    })
    return tokenData.access_token
  }

  return connection.accessToken
}

export async function getAthleteProfile(userId: number) {
  const accessToken = await getValidAccessToken(userId)

  const response = await fetch(`${STRAVA_API_URL}/athlete`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('STRAVA_API_ERROR')
  }

  return response.json()
}

export async function getActivities(userId: number, page = 1, perPage = 30) {
  const accessToken = await getValidAccessToken(userId)

  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  })

  const response = await fetch(`${STRAVA_API_URL}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) {
    throw new Error('STRAVA_API_ERROR')
  }

  return response.json()
}

export async function syncActivitiesWithSessions(userId: number) {
  const activities = await getActivities(userId, 1, 50)
  let synced = 0

  const plans = await prisma.trainingPlan.findMany({
    where: { userId },
    include: { sessions: { where: { completed: false } } },
  })

  for (const activity of activities) {
    const type = mapStravaType(activity.type)
    if (!type) continue

    const activityDate = new Date(activity.start_date)

    for (const plan of plans) {
      for (const session of plan.sessions) {
        if (!session.date) continue

        const sessionDate = new Date(session.date)
        const timeDiff = Math.abs(activityDate.getTime() - sessionDate.getTime())

        if (session.type === type && timeDiff < 24 * 60 * 60 * 1000) {
          await prisma.trainingSession.update({
            where: { id: session.id },
            data: {
              completed: true,
              actualDuration: Math.round(activity.moving_time / 60),
              actualDistance: activity.distance / 1000,
              notes: `Synced from Strava: ${activity.name}`,
            },
          })
          synced++
          break
        }
      }
    }
  }

  return { synced, total: activities.length }
}

function formatSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export async function syncActivitiesWithCompetitions(userId: number) {
  // Fetch last 90 days of activities (competitions can be recent or past)
  const accessToken = await getValidAccessToken(userId)
  const ninetyDaysAgo = Math.floor(Date.now() / 1000) - 90 * 24 * 60 * 60

  const params = new URLSearchParams({
    after: ninetyDaysAgo.toString(),
    per_page: '100',
  })

  const response = await fetch(`${STRAVA_API_URL}/athlete/activities?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!response.ok) throw new Error('STRAVA_API_ERROR')

  const activities: any[] = await response.json()

  // Get user's competitions in the same time range
  const startDate = new Date(ninetyDaysAgo * 1000)
  const competitions = await prisma.competition.findMany({
    where: {
      userId,
      date: { gte: startDate },
    },
  })

  let matched = 0

  for (const competition of competitions) {
    const compDate = new Date(competition.date)
    compDate.setHours(0, 0, 0, 0)

    // Find all activities on the same day as the competition
    const dayActivities = activities.filter(a => {
      const actDate = new Date(a.start_date)
      actDate.setHours(0, 0, 0, 0)
      return actDate.getTime() === compDate.getTime()
    })

    if (dayActivities.length === 0) continue

    // Check for a direct Triathlon activity
    const triathlonActivity = dayActivities.find(a =>
      a.type === 'Triathlon' || a.sport_type === 'Triathlon'
    )

    let resultStr = ''
    let totalTime = 0

    if (triathlonActivity) {
      totalTime = triathlonActivity.elapsed_time || triathlonActivity.moving_time || 0
      const pace = triathlonActivity.average_speed > 0
        ? ` — vitesse moy. ${(triathlonActivity.average_speed * 3.6).toFixed(1)} km/h`
        : ''
      resultStr = `Triathlon ${formatSeconds(totalTime)}${pace}`
    } else if (competition.type === 'triathlon' && dayActivities.length >= 2) {
      // Aggregate swim + bike + run
      const swimAct = dayActivities.find(a => ['Swim'].includes(a.type))
      const bikeAct = dayActivities.find(a => ['Ride', 'VirtualRide'].includes(a.type))
      const runAct = dayActivities.find(a => ['Run', 'VirtualRun'].includes(a.type))

      const parts: string[] = []
      if (swimAct) {
        totalTime += swimAct.moving_time || 0
        parts.push(`Natation ${formatSeconds(swimAct.moving_time)} (${(swimAct.distance / 1000).toFixed(2)}km)`)
      }
      if (bikeAct) {
        totalTime += bikeAct.moving_time || 0
        parts.push(`Vélo ${formatSeconds(bikeAct.moving_time)} (${(bikeAct.distance / 1000).toFixed(1)}km)`)
      }
      if (runAct) {
        totalTime += runAct.moving_time || 0
        parts.push(`Course ${formatSeconds(runAct.moving_time)} (${(runAct.distance / 1000).toFixed(1)}km)`)
      }

      if (parts.length > 0) {
        resultStr = `Total ${formatSeconds(totalTime)} — ${parts.join(', ')}`
      }
    } else if (dayActivities.length > 0) {
      // Single sport race (running, cycling...)
      const act = dayActivities[0]
      totalTime = act.moving_time || 0
      const distKm = (act.distance / 1000).toFixed(1)
      const typeLabel = mapStravaType(act.type) === 'run' ? 'Course' : mapStravaType(act.type) === 'bike' ? 'Vélo' : 'Natation'
      resultStr = `${typeLabel} ${formatSeconds(totalTime)} — ${distKm}km`
    }

    if (resultStr) {
      await prisma.competition.update({
        where: { id: competition.id },
        data: {
          result: resultStr,
          status: 'completed',
        },
      })
      matched++
    }
  }

  return { matched, total: competitions.length }
}

export async function getActivitiesSummaryForAI(userId: number, weeks = 8): Promise<string | null> {
  let activities: any[]
  try {
    const accessToken = await getValidAccessToken(userId)
    const weeksAgo = Math.floor(Date.now() / 1000) - weeks * 7 * 24 * 60 * 60

    const params = new URLSearchParams({
      after: weeksAgo.toString(),
      per_page: '100',
    })

    const response = await fetch(`${STRAVA_API_URL}/athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) return null
    activities = await response.json()
  } catch {
    return null
  }

  if (!activities || activities.length === 0) return null

  // Group by sport
  interface SportSummary {
    sessions: number
    totalDistance: number
    totalTime: number
    speeds: number[]
  }

  const sports: Record<string, SportSummary> = {}

  for (const act of activities) {
    const type = mapStravaType(act.type)
    if (!type || type === 'strength') continue

    if (!sports[type]) {
      sports[type] = { sessions: 0, totalDistance: 0, totalTime: 0, speeds: [] }
    }

    sports[type].sessions++
    sports[type].totalDistance += act.distance || 0
    sports[type].totalTime += act.moving_time || 0
    if (act.average_speed > 0) sports[type].speeds.push(act.average_speed)
  }

  if (Object.keys(sports).length === 0) return null

  const sportLabels: Record<string, string> = { swim: 'Natation', bike: 'Vélo', run: 'Course' }

  const lines = [
    `Historique d'entraînement Strava (${weeks} dernières semaines, ${activities.length} activités) :`,
  ]

  for (const [type, data] of Object.entries(sports)) {
    const avgSpeed = data.speeds.length > 0
      ? data.speeds.reduce((a, b) => a + b, 0) / data.speeds.length
      : 0

    const distKm = (data.totalDistance / 1000).toFixed(0)
    const weeklyDist = (data.totalDistance / 1000 / weeks).toFixed(1)
    const sessionsPerWeek = (data.sessions / weeks).toFixed(1)

    let speedStr = ''
    if (type === 'run' && avgSpeed > 0) {
      const paceSecPerKm = 1000 / avgSpeed
      const paceMin = Math.floor(paceSecPerKm / 60)
      const paceSec = Math.round(paceSecPerKm % 60)
      speedStr = `, allure moy. ${paceMin}:${String(paceSec).padStart(2, '0')}/km`
    } else if (type === 'bike' && avgSpeed > 0) {
      speedStr = `, vitesse moy. ${(avgSpeed * 3.6).toFixed(1)} km/h`
    } else if (type === 'swim' && avgSpeed > 0) {
      const pace100m = 100 / avgSpeed
      const paceMin = Math.floor(pace100m / 60)
      const paceSec = Math.round(pace100m % 60)
      speedStr = `, allure moy. ${paceMin}:${String(paceSec).padStart(2, '0')}/100m`
    }

    lines.push(`- ${sportLabels[type] || type} : ${data.sessions} séances, ${distKm}km total (~${weeklyDist}km/semaine, ~${sessionsPerWeek} séances/semaine${speedStr})`)
  }

  return lines.join('\n')
}

function mapStravaType(stravaType: string): string | null {
  const mapping: Record<string, string> = {
    Swim: 'swim',
    Ride: 'bike',
    VirtualRide: 'bike',
    MountainBikeRide: 'bike',
    GravelRide: 'bike',
    EBikeRide: 'bike',
    Run: 'run',
    VirtualRun: 'run',
    Walk: 'run',
    Hike: 'run',
    TrailRun: 'run',
    WeightTraining: 'strength',
    Workout: 'strength',
    Crossfit: 'strength',
    Yoga: 'strength',
  }
  return mapping[stravaType] || null
}
