import { Request, Response } from 'express'
import * as recordsService from './records.service.js'

export async function createRecord(req: Request, res: Response) {
  const result = await recordsService.createRecord(req.user!.userId, req.body)
  res.status(201).json(result)
}

export async function getRecords(req: Request, res: Response) {
  const records = await recordsService.getRecords(req.user!.userId)
  res.json(records)
}

export async function getRecordsBySport(req: Request, res: Response) {
  const sport = req.params.sport as string
  const records = await recordsService.getRecordsBySport(req.user!.userId, sport)
  res.json(records)
}

export async function getCategories(_req: Request, res: Response) {
  res.json(recordsService.RECORD_CATEGORIES)
}

export async function deleteRecord(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  await recordsService.deleteRecord(req.user!.userId, id)
  res.status(204).send()
}
