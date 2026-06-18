import api from './client'

export interface ImportResult {
  message: string
  results: {
    competitions: { created: number; errors: string[] }
    trainingPlans: { created: number; errors: string[] }
    sessions: { created: number; errors: string[] }
  }
}

export const exportApi = {
  exportJSON: () =>
    api.get('/export/json'),

  exportCSV: () =>
    api.get('/export/csv', { responseType: 'blob' }),

  importData: (data: any) =>
    api.post<ImportResult>('/export/import', data),
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
