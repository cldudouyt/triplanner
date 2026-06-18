import * as XLSX from 'xlsx'
import { parse } from 'csv-parse/sync'
import { createCompetitionSchema } from './competition.schema.js'

const COLUMN_MAPPINGS: Record<string, string[]> = {
  name: ['name', 'nom', 'competition', 'race', 'course', 'épreuve'],
  date: ['date', 'date_competition', 'race_date'],
  location: ['location', 'lieu', 'city', 'ville', 'place'],
  type: ['type', 'discipline'],
  subType: ['subtype', 'sub_type', 'format', 'distance', 'sous-type'],
  chronoObjective: ['objectif', 'objective', 'goal', 'chrono', 'target_time', 'temps_cible'],
  priority: ['priority', 'priorite', 'priorité', 'importance'],
  budget: ['budget', 'cost', 'cout', 'coût'],
  registrationLink: ['link', 'lien', 'url', 'inscription', 'registration'],
  notes: ['notes', 'remarques', 'comments', 'commentaires'],
  accommodation: ['accommodation', 'hébergement', 'hebergement', 'hotel'],
  transport: ['transport', 'déplacement', 'deplacement'],
  status: ['status', 'statut', 'état', 'etat'],
  swimDistance: ['swim', 'natation', 'swim_distance'],
  bikeDistance: ['bike', 'vélo', 'velo', 'bike_distance'],
  runDistance: ['run', 'course_distance', 'run_distance', 'cap'],
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[^a-zàâäéèêëïîôùûüÿç0-9_]/g, '_')
}

function mapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  for (const header of headers) {
    const normalized = normalizeHeader(header)
    for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
      if (aliases.includes(normalized)) {
        mapping[header] = field
        break
      }
    }
  }
  return mapping
}

function parseRows(rows: Record<string, any>[]): { valid: any[]; errors: { row: number; message: string }[] } {
  if (rows.length === 0) return { valid: [], errors: [] }

  const headers = Object.keys(rows[0])
  const columnMap = mapColumns(headers)
  const valid: any[] = []
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const mapped: any = {}

    for (const [originalHeader, value] of Object.entries(row)) {
      const field = columnMap[originalHeader]
      if (field && value !== undefined && value !== null && value !== '') {
        if (['swimDistance', 'bikeDistance', 'runDistance', 'budget'].includes(field)) {
          mapped[field] = parseFloat(String(value))
        } else {
          mapped[field] = String(value)
        }
      }
    }

    // Default type/subType if missing
    if (!mapped.type) mapped.type = 'running'
    if (!mapped.subType) mapped.subType = '10k'

    const result = createCompetitionSchema.safeParse(mapped)
    if (result.success) {
      valid.push(result.data)
    } else {
      const fieldErrors = result.error.flatten().fieldErrors
      const messages = Object.entries(fieldErrors)
        .map(([f, msgs]) => `${f}: ${(msgs as string[]).join(', ')}`)
        .join('; ')
      errors.push({ row: i + 2, message: messages })
    }
  }

  return { valid, errors }
}

export function parseCSV(buffer: Buffer): { valid: any[]; errors: { row: number; message: string }[] } {
  const content = buffer.toString('utf-8')
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, any>[]
  return parseRows(rows)
}

export function parseXLSX(buffer: Buffer): { valid: any[]; errors: { row: number; message: string }[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet)
  return parseRows(rows)
}
