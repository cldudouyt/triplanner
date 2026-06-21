import prisma from '../../config/database.js'

export async function getThreads(userId: number) {
  const allThreads = await prisma.messageThread.findMany({
    orderBy: { lastAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { senderId: true, content: true, createdAt: true, readBy: true },
      },
    },
  })

  // Filter only threads where userId is a participant
  const userThreads = allThreads.filter((thread) => {
    const participants = JSON.parse(thread.participants) as number[]
    return participants.includes(userId)
  })

  // Enrich with the other participant's info
  const enriched = await Promise.all(
    userThreads.map(async (thread) => {
      const participants = JSON.parse(thread.participants) as number[]
      const isGroup = participants.length > 2 || !!thread.groupName
      const otherUserId = participants.find((id) => id !== userId) ?? participants[0]

      let otherParticipant: { id: number; firstName: string; lastName: string; role?: string }

      if (isGroup && thread.groupName) {
        otherParticipant = { id: 0, firstName: thread.groupName, lastName: '', role: undefined }
      } else {
        const otherUser = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: { id: true, firstName: true, lastName: true },
        })
        const membership = otherUser
          ? await prisma.clubMember.findFirst({
              where: { userId: otherUser.id },
              select: { role: true },
            })
          : null
        const roleDisplay = membership?.role === 'coach' ? 'Coach' : membership?.role !== 'athlete' ? membership?.role : undefined
        otherParticipant = {
          id: otherUser?.id ?? 0,
          firstName: otherUser?.firstName ?? 'Inconnu',
          lastName: otherUser?.lastName ?? '',
          role: roleDisplay,
        }
      }

      const lastMsg = thread.messages[0] ?? null
      const unreadCount = thread.messages.filter((m) => {
        const readBy = JSON.parse(m.readBy) as number[]
        return m.senderId !== userId && !readBy.includes(userId)
      }).length

      return {
        id: thread.id,
        participants,
        lastMessage: thread.lastMessage,
        lastAt: thread.lastAt,
        createdAt: thread.createdAt,
        otherParticipant,
        latestMessage: lastMsg
          ? {
              senderId: lastMsg.senderId,
              content: lastMsg.content,
              createdAt: lastMsg.createdAt,
            }
          : null,
        unreadCount,
      }
    })
  )

  return enriched
}

export async function getMessages(threadId: number, userId: number, limit = 50) {
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } })
  if (!thread) return null

  const participants = JSON.parse(thread.participants) as number[]
  if (!participants.includes(userId)) return null

  const messages = await prisma.message.findMany({
    where: { threadId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })

  return messages.map((m) => ({
    ...m,
    readBy: JSON.parse(m.readBy) as number[],
  }))
}

export async function createThread(userId: number, recipientId: number, content: string) {
  // Check if a thread already exists between these two users
  const allThreads = await prisma.messageThread.findMany()
  const existing = allThreads.find((t) => {
    const participants = JSON.parse(t.participants) as number[]
    return participants.includes(userId) && participants.includes(recipientId) && participants.length === 2
  })

  if (existing) {
    // Send message in existing thread
    const message = await prisma.message.create({
      data: {
        threadId: existing.id,
        senderId: userId,
        content,
        readBy: JSON.stringify([userId]),
      },
    })

    await prisma.messageThread.update({
      where: { id: existing.id },
      data: {
        lastMessage: content,
        lastAt: new Date(),
      },
    })

    return {
      thread: existing,
      message: { ...message, readBy: JSON.parse(message.readBy) as number[] },
    }
  }

  // Create new thread
  const participants = JSON.stringify([userId, recipientId])

  const thread = await prisma.messageThread.create({
    data: {
      participants,
      lastMessage: content,
      lastAt: new Date(),
    },
  })

  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      senderId: userId,
      content,
      readBy: JSON.stringify([userId]),
    },
  })

  return {
    thread,
    message: { ...message, readBy: JSON.parse(message.readBy) as number[] },
  }
}

export async function sendMessage(threadId: number, userId: number, content: string) {
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } })
  if (!thread) return null

  const participants = JSON.parse(thread.participants) as number[]
  if (!participants.includes(userId)) return null

  const message = await prisma.message.create({
    data: {
      threadId,
      senderId: userId,
      content,
      readBy: JSON.stringify([userId]),
    },
  })

  await prisma.messageThread.update({
    where: { id: threadId },
    data: {
      lastMessage: content,
      lastAt: new Date(),
    },
  })

  const sender = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  })

  return {
    ...message,
    readBy: JSON.parse(message.readBy) as number[],
    senderName: sender ? `${sender.firstName} ${sender.lastName}` : '',
  }
}

export async function getThreadParticipants(threadId: number) {
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: { participants: true },
  })
  if (!thread) return null
  const participantIds = JSON.parse(thread.participants) as number[]
  return { participantIds }
}

export async function markAsRead(threadId: number, userId: number) {
  const thread = await prisma.messageThread.findUnique({ where: { id: threadId } })
  if (!thread) return false

  const participants = JSON.parse(thread.participants) as number[]
  if (!participants.includes(userId)) return false

  // Get all unread messages not sent by this user
  const messages = await prisma.message.findMany({
    where: { threadId, senderId: { not: userId } },
  })

  await Promise.all(
    messages.map(async (m) => {
      const readBy = JSON.parse(m.readBy) as number[]
      if (!readBy.includes(userId)) {
        readBy.push(userId)
        await prisma.message.update({
          where: { id: m.id },
          data: { readBy: JSON.stringify(readBy) },
        })
      }
    })
  )

  return true
}

export async function getUnreadCount(userId: number) {
  const allMessages = await prisma.message.findMany({
    where: { senderId: { not: userId } },
    select: { threadId: true, readBy: true },
  })

  // Filter to threads where the user is a participant
  const threads = await prisma.messageThread.findMany()
  const userThreadIds = new Set(
    threads
      .filter((t) => {
        const participants = JSON.parse(t.participants) as number[]
        return participants.includes(userId)
      })
      .map((t) => t.id)
  )

  const count = allMessages.filter((m) => {
    if (!userThreadIds.has(m.threadId)) return false
    const readBy = JSON.parse(m.readBy) as number[]
    return !readBy.includes(userId)
  }).length

  return { count }
}
