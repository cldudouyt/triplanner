import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database.js'

export async function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isAdmin: true },
    })

    if (!user?.isAdmin) {
      res.status(403).json({ error: 'Admin access required' })
      return
    }

    next()
  } catch {
    res.status(500).json({ error: 'Failed to verify admin status' })
  }
}
