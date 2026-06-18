import prisma from '../../config/database.js'
import { hashPassword, comparePassword } from '../../utils/password.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js'
import { sendPasswordResetEmail } from '../../utils/email.js'
import { config } from '../../config/env.js'
import crypto from 'node:crypto'
import type { RegisterInput, LoginInput, ForgotPasswordInput, ResetPasswordInput } from './auth.schema.js'

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new Error('EMAIL_EXISTS')
  }

  const hashedPassword = await hashPassword(input.password)
  const user = await prisma.user.create({
    data: {
      email: input.email,
      password: hashedPassword,
      firstName: input.firstName,
      lastName: input.lastName,
    },
    select: { id: true, email: true, firstName: true, lastName: true },
  })

  return user
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const valid = await comparePassword(input.password, user.password)
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const payload = { userId: user.id, email: user.email }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + config.refreshTokenExpiryMs),
    },
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin,
    },
  }
}

export async function refresh(oldRefreshToken: string) {
  let payload
  try {
    payload = verifyRefreshToken(oldRefreshToken)
  } catch {
    throw new Error('INVALID_REFRESH_TOKEN')
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: oldRefreshToken },
  })
  if (!stored) {
    throw new Error('INVALID_REFRESH_TOKEN')
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } })

  const newPayload = { userId: payload.userId, email: payload.email }
  const accessToken = generateAccessToken(newPayload)
  const refreshToken = generateRefreshToken(newPayload)

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: payload.userId,
      expiresAt: new Date(Date.now() + config.refreshTokenExpiryMs),
    },
  })

  return { accessToken, refreshToken }
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
}

export async function getProfile(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true, isAdmin: true, createdAt: true },
  })
}

const RESET_CODE_EXPIRY_MS = 15 * 60 * 1000 // 15 minutes

export async function forgotPassword(input: ForgotPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    // Ne pas révéler si l'email existe ou non
    return
  }

  // Supprimer les anciens codes pour cet utilisateur
  await prisma.passwordResetCode.deleteMany({ where: { userId: user.id } })

  const code = crypto.randomInt(100_000, 999_999).toString()

  await prisma.passwordResetCode.create({
    data: {
      code,
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_CODE_EXPIRY_MS),
    },
  })

  // Send email (also logs in dev mode)
  await sendPasswordResetEmail(user.email, code)
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user) {
    throw new Error('INVALID_RESET_CODE')
  }

  const resetCode = await prisma.passwordResetCode.findFirst({
    where: { userId: user.id, code: input.code },
  })

  if (!resetCode || resetCode.expiresAt < new Date()) {
    // Supprimer le code expiré s'il existe
    if (resetCode) {
      await prisma.passwordResetCode.delete({ where: { id: resetCode.id } })
    }
    throw new Error('INVALID_RESET_CODE')
  }

  const hashedPassword = await hashPassword(input.newPassword)

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } }),
    prisma.passwordResetCode.deleteMany({ where: { userId: user.id } }),
    // Révoquer tous les refresh tokens existants
    prisma.refreshToken.deleteMany({ where: { userId: user.id } }),
  ])
}
