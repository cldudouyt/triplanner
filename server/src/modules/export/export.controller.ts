import { Request, Response } from 'express'
import * as exportService from './export.service.js'

export async function exportJSON(req: Request, res: Response) {
  const data = await exportService.exportUserData(req.user!.userId)

  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Content-Disposition', `attachment; filename="triathlon-planner-export-${new Date().toISOString().split('T')[0]}.json"`)
  res.json(data)
}

export async function exportCSV(req: Request, res: Response) {
  const data = await exportService.exportUserData(req.user!.userId)
  const csv = exportService.exportToCSV(data)

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="triathlon-planner-export-${new Date().toISOString().split('T')[0]}.csv"`)
  res.send('\uFEFF' + csv) // BOM for Excel compatibility
}

export async function importData(req: Request, res: Response) {
  const data = req.body

  if (!data || typeof data !== 'object') {
    res.status(400).json({ error: 'Format de données invalide' })
    return
  }

  const results = await exportService.importUserData(req.user!.userId, data)
  res.json({
    message: 'Import terminé',
    results,
  })
}
