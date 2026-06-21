import { Request, Response } from 'express'
import * as authService from './auth.service.js'

export async function register(req: Request, res: Response) {
  try {
    const user = await authService.register(req.body)
    res.status(201).json(user)
  } catch (err: any) {
    if (err.message === 'EMAIL_EXISTS') {
      res.status(409).json({ error: 'Cet email est déjà utilisé' })
      return
    }
    throw err
  }
}

const isProd = process.env.NODE_ENV === 'production'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
}

export async function login(req: Request, res: Response) {
  try {
    const result = await authService.login(req.body)
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS)
    res.json({ accessToken: result.accessToken, user: result.user })
  } catch (err: any) {
    if (err.message === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Email ou mot de passe incorrect' })
      return
    }
    throw err
  }
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.refreshToken
  if (!token) {
    res.status(401).json({ error: 'Refresh token manquant' })
    return
  }

  try {
    const result = await authService.refresh(token)
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS)
    res.json({ accessToken: result.accessToken })
  } catch (err: any) {
    if (err.message === 'INVALID_REFRESH_TOKEN') {
      res.status(401).json({ error: 'Refresh token invalide' })
      return
    }
    throw err
  }
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.refreshToken
  if (token) {
    await authService.logout(token)
  }
  res.clearCookie('refreshToken', { path: '/' })
  res.json({ message: 'Déconnecté' })
}

export async function me(req: Request, res: Response) {
  const user = await authService.getProfile(req.user!.userId)
  if (!user) {
    res.status(404).json({ error: 'Utilisateur non trouvé' })
    return
  }
  res.json(user)
}

export async function forgotPassword(req: Request, res: Response) {
  await authService.forgotPassword(req.body)
  // Toujours répondre 200 pour ne pas révéler si l'email existe
  res.json({ message: 'Si cet email existe, un code de réinitialisation a été envoyé' })
}

export async function resetPassword(req: Request, res: Response) {
  try {
    await authService.resetPassword(req.body)
    res.json({ message: 'Mot de passe réinitialisé avec succès' })
  } catch (err: any) {
    if (err.message === 'INVALID_RESET_CODE') {
      res.status(400).json({ error: 'Code invalide ou expiré' })
      return
    }
    throw err
  }
}

export async function completeOnboarding(req: Request, res: Response) {
  const userId = (req as any).userId as number
  const user = await authService.completeOnboarding(userId, req.body)
  res.json(user)
}
