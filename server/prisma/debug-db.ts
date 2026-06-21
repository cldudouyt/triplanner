import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../generated/prisma/index.js'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const threads = await prisma.messageThread.findMany({ include: { messages: { take: 2 } } })
console.log('threads:', JSON.stringify(threads.map(t => ({
  id: t.id,
  participants: t.participants,
  groupName: t.groupName,
  lastMessage: t.lastMessage,
  msgCount: t.messages.length,
})), null, 2))

const users = await prisma.user.findMany({ select: { id: true, email: true, firstName: true } })
console.log('users:', users.map(u => `${u.id}:${u.firstName}(${u.email})`).join(', '))

await prisma.$disconnect()
