import { Request, Response, NextFunction } from 'express'
import * as adminService from './admin.service.js'

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await adminService.getDashboardStats()
    res.json(stats)
  } catch (error) {
    next(error)
  }
}

export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string | undefined,
      sortBy: req.query.sortBy as 'createdAt' | 'email' | 'firstName' | undefined,
      sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
    }

    const result = await adminService.listUsers(params)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string)
    const user = await adminService.getUserById(id)

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json(user)
  } catch (error) {
    next(error)
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string)
    const user = await adminService.updateUser(id, req.body)
    res.json(user)
  } catch (error) {
    next(error)
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseInt(req.params.id as string)
    const currentUserId = req.user!.userId

    await adminService.deleteUser(id, currentUserId)
    res.status(204).send()
  } catch (error) {
    if (error instanceof Error && error.message === 'CANNOT_DELETE_SELF') {
      res.status(400).json({ error: 'Cannot delete your own account' })
      return
    }
    next(error)
  }
}

export async function listContent(req: Request, res: Response, next: NextFunction) {
  try {
    const params = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      type: req.query.type as 'plans' | 'competitions' | undefined,
      search: req.query.search as string | undefined,
    }

    const result = await adminService.listContent(params)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

export async function deleteContent(req: Request, res: Response, next: NextFunction) {
  try {
    const type = req.params.type as string as 'plan' | 'competition'
    const id = parseInt(req.params.id as string)

    await adminService.deleteContent(type, id)
    res.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function getSystemLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const logs = await adminService.getSystemLogs()
    res.json(logs)
  } catch (error) {
    next(error)
  }
}
