import prisma from '../src/config/database.js'
import { hashPassword } from '../src/utils/password.js'

async function createAdmin() {
  const email = process.argv[2] || 'admin@example.com'
  const password = process.argv[3] || 'admin123'

  try {
    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.upsert({
      where: { email },
      update: { isAdmin: true },
      create: {
        email,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isAdmin: true,
      },
    })

    console.log(`Admin user created/updated:`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Password: ${password}`)
    console.log(`  isAdmin: ${user.isAdmin}`)
  } catch (error) {
    console.error('Error creating admin user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
