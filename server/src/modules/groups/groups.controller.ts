import type { Request, Response } from 'express'
import * as groupsService from './groups.service.js'

export async function getGroups(req: Request, res: Response) {
  const userId = (req as any).userId as number
  const groups = await groupsService.listGroups(userId)
  res.json(groups)
}

export async function getStats(req: Request, res: Response) {
  const userId = (req as any).userId as number
  const stats = await groupsService.getGroupStats(userId)
  res.json(stats)
}

export async function createGroup(req: Request, res: Response) {
  const userId = (req as any).userId as number
  const group = await groupsService.createGroup(userId, req.body)
  res.status(201).json(group)
}

export async function addGroupMember(req: Request, res: Response) {
  const groupId = parseInt(req.params['id'] as string, 10)
  const { userId } = req.body as { userId: number }
  const member = await groupsService.addMember(groupId, userId)
  res.status(201).json(member)
}

export async function removeGroupMember(req: Request, res: Response) {
  const groupId = parseInt(req.params['id'] as string, 10)
  const userId = parseInt(req.params['userId'] as string, 10)
  await groupsService.removeMember(groupId, userId)
  res.json({ ok: true })
}
