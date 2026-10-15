import { db } from '@/lib/db'
import type { CaseRecord, CatalogItem } from '@/types/case'

export const BACKUP_VERSION = 1

export interface BackupPayload {
  schema: 'gestor-casos-riesgo-clinico'
  version: number
  exportedAt: string
  cases: CaseRecord[]
  catalogs: CatalogItem[]
  meta: Array<{ key: string; value: string }>
}

export async function buildBackup(): Promise<BackupPayload> {
  const [cases, catalogs, meta] = await Promise.all([
    db.cases.toArray(),
    db.catalogs.toArray(),
    db.meta.toArray(),
  ])
  return {
    schema: 'gestor-casos-riesgo-clinico',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    cases,
    catalogs,
    meta,
  }
}

export function downloadBackup(payload: BackupPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = payload.exportedAt.slice(0, 10)
  a.href = url
  a.download = `respaldo_casos_${stamp}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  payload?: BackupPayload
}

export function validateBackup(raw: unknown): ValidationResult {
  const errors: string[] = []
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, errors: ['El archivo no contiene un objeto JSON válido.'] }
  }
  const obj = raw as Record<string, unknown>
  if (obj.schema !== 'gestor-casos-riesgo-clinico') {
    errors.push('El archivo no corresponde a un respaldo de este sistema.')
  }
  if (!Array.isArray(obj.cases)) {
    errors.push('El respaldo no contiene un listado de casos válido.')
  }
  if (!Array.isArray(obj.catalogs)) {
    errors.push('El respaldo no contiene catálogos válidos.')
  }
  if (errors.length > 0) return { valid: false, errors }
  return { valid: true, errors: [], payload: obj as unknown as BackupPayload }
}

export async function restoreBackup(payload: BackupPayload, mode: 'replace' | 'merge'): Promise<void> {
  await db.transaction('rw', db.cases, db.catalogs, db.meta, async () => {
    if (mode === 'replace') {
      await db.cases.clear()
      await db.catalogs.clear()
      await db.meta.clear()
    }
    if (payload.cases.length) await db.cases.bulkPut(payload.cases)
    if (payload.catalogs.length) await db.catalogs.bulkPut(payload.catalogs)
    if (payload.meta?.length) await db.meta.bulkPut(payload.meta)
  })
}
