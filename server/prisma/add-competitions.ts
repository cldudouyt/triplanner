import 'dotenv/config'
import { PrismaClient } from '../generated/prisma/index.js'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { hashPassword } from '../src/utils/password.js'

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const email = 'cldudouyt@gmail.com'

  // Verifier si le compte existe, sinon le creer
  let user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    const password = await hashPassword('demo1234')
    user = await prisma.user.create({
      data: {
        email,
        password,
        firstName: 'Utilisateur',
        lastName: 'Cldudouyt',
      },
    })
    console.log(`Compte cree: ${email} / demo1234`)
  } else {
    console.log(`Compte existant: ${email} (id=${user.id})`)
  }

  const competitions = [
    {
      name: '10 km d\'Orvault',
      date: new Date('2026-03-08'),
      location: 'Orvault',
      type: 'running',
      subType: '10k',
      status: 'registered',
      priority: 'B',
      runDistance: 10000,
    },
    {
      name: 'Semi-marathon de Nantes',
      date: new Date('2026-04-26'),
      location: 'Nantes',
      type: 'running',
      subType: 'semi-marathon',
      status: 'registered',
      priority: 'B',
      runDistance: 21100,
    },
    {
      name: 'Triathlon d\'Angers',
      date: new Date('2026-05-16'),
      location: 'Angers',
      type: 'triathlon',
      subType: 'sprint',
      status: 'registered',
      priority: 'B',
      swimDistance: 750,
      bikeDistance: 20000,
      runDistance: 5000,
    },
    {
      name: 'Triathlon des Sables-d\'Olonne',
      date: new Date('2026-05-17'),
      location: 'Sables-d\'Olonne',
      type: 'triathlon',
      subType: 'sprint',
      status: 'registered',
      priority: 'B',
      swimDistance: 750,
      bikeDistance: 20000,
      runDistance: 5000,
    },
    {
      name: 'Triathlon de La Roche-sur-Yon',
      date: new Date('2026-05-24'),
      location: 'La Roche-sur-Yon',
      type: 'triathlon',
      subType: 'sprint',
      status: 'registered',
      priority: 'B',
      swimDistance: 750,
      bikeDistance: 20000,
      runDistance: 5000,
    },
    {
      name: 'Triathlon de Montreuil-Juigne',
      date: new Date('2026-06-07'),
      location: 'Montreuil-Juigne',
      type: 'triathlon',
      subType: 'olympic',
      status: 'registered',
      priority: 'B',
      swimDistance: 1500,
      bikeDistance: 40000,
      runDistance: 10000,
    },
    {
      name: 'Triathlon du Val-Andre',
      date: new Date('2026-07-04'),
      location: 'Val-Andre',
      type: 'triathlon',
      subType: 'sprint',
      status: 'planned',
      priority: 'C',
      notes: 'Epreuve sur 2 jours : 2026-07-04 au 2026-07-05. Format Sprint ou Olympique a confirmer.',
      swimDistance: 750,
      bikeDistance: 20000,
      runDistance: 5000,
    },
    {
      name: 'Semi Cancale - Saint-Malo',
      date: new Date('2026-08-23'),
      location: 'Cancale - Saint-Malo',
      type: 'running',
      subType: 'semi-marathon',
      status: 'planned',
      priority: 'C',
      runDistance: 21100,
    },
    {
      name: 'Triathlon de Dinard',
      date: new Date('2026-09-13'),
      location: 'Dinard',
      type: 'triathlon',
      subType: 'olympic',
      status: 'registered',
      priority: 'A',
      notes: 'Objectif principal de la saison',
      swimDistance: 1500,
      bikeDistance: 40000,
      runDistance: 10000,
    },
    {
      name: 'Triathlon Audencia La Baule',
      date: new Date('2026-09-19'),
      location: 'La Baule',
      type: 'triathlon',
      subType: 'sprint',
      status: 'planned',
      priority: 'C',
      notes: 'Epreuve sur 2 jours : 2026-09-19 au 2026-09-20',
      swimDistance: 750,
      bikeDistance: 20000,
      runDistance: 5000,
    },
    {
      name: 'Bayman Triathlon',
      date: new Date('2026-10-11'),
      location: undefined,
      type: 'triathlon',
      subType: 'olympic',
      status: 'registered',
      priority: 'B',
      swimDistance: 1500,
      bikeDistance: 40000,
      runDistance: 10000,
    },
  ]

  let count = 0
  for (const comp of competitions) {
    await prisma.competition.create({
      data: {
        userId: user.id,
        ...comp,
      },
    })
    count++
    console.log(`  + ${comp.name} (${comp.date.toISOString().slice(0, 10)})`)
  }

  console.log(`\n${count} competitions ajoutees au compte ${email}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
