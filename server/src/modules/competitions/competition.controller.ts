import { Request, Response } from 'express'
import * as competitionService from './competition.service.js'
import * as importService from './import.service.js'
import { competitionQuerySchema } from './competition.schema.js'

export async function findAll(req: Request, res: Response) {
  const query = competitionQuerySchema.parse(req.query)
  const result = await competitionService.findAll(req.user!.userId, query)
  res.json(result)
}

export async function findById(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const competition = await competitionService.findById(req.user!.userId, id)
  if (!competition) {
    res.status(404).json({ error: 'Compétition non trouvée' })
    return
  }
  res.json(competition)
}

export async function create(req: Request, res: Response) {
  const competition = await competitionService.create(req.user!.userId, req.body)
  res.status(201).json(competition)
}

export async function update(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const competition = await competitionService.update(req.user!.userId, id, req.body)
  if (!competition) {
    res.status(404).json({ error: 'Compétition non trouvée' })
    return
  }
  res.json(competition)
}

export async function remove(req: Request, res: Response) {
  const id = parseInt(req.params.id as string)
  const success = await competitionService.remove(req.user!.userId, id)
  if (!success) {
    res.status(404).json({ error: 'Compétition non trouvée' })
    return
  }
  res.status(204).send()
}

export async function importFile(req: Request, res: Response) {
  if (!req.file) {
    res.status(400).json({ error: 'Fichier requis' })
    return
  }

  const filename = req.file.originalname.toLowerCase()
  let parsed

  if (filename.endsWith('.csv')) {
    parsed = importService.parseCSV(req.file.buffer)
  } else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    parsed = importService.parseXLSX(req.file.buffer)
  } else {
    res.status(400).json({ error: 'Format de fichier non supporté. Utilisez CSV ou XLSX.' })
    return
  }

  const result = await competitionService.bulkCreate(req.user!.userId, parsed.valid)

  res.json({
    imported: result.imported.length,
    parseErrors: parsed.errors,
    insertErrors: result.errors,
  })
}

export async function suggestions(req: Request, res: Response) {
  const result = await competitionService.getSuggestions(req.user!.userId)
  res.json(result)
}

// Equipment
export async function addEquipmentItem(req: Request, res: Response) {
  const competitionId = parseInt(req.params.id as string)
  const { name, category } = req.body
  const item = await competitionService.addEquipmentItem(req.user!.userId, competitionId, name, category)
  if (!item) {
    res.status(404).json({ error: 'Compétition non trouvée' })
    return
  }
  res.status(201).json(item)
}

export async function updateEquipmentItem(req: Request, res: Response) {
  const competitionId = parseInt(req.params.id as string)
  const itemId = parseInt(req.params.itemId as string)
  const item = await competitionService.updateEquipmentItem(req.user!.userId, competitionId, itemId, req.body)
  if (!item) {
    res.status(404).json({ error: 'Élément non trouvé' })
    return
  }
  res.json(item)
}

export async function removeEquipmentItem(req: Request, res: Response) {
  const competitionId = parseInt(req.params.id as string)
  const itemId = parseInt(req.params.itemId as string)
  const success = await competitionService.removeEquipmentItem(req.user!.userId, competitionId, itemId)
  if (!success) {
    res.status(404).json({ error: 'Élément non trouvé' })
    return
  }
  res.status(204).send()
}
