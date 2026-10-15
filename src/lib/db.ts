import Dexie, { type Table } from 'dexie'
import type { CaseRecord, CatalogItem } from '@/types/case'

export const ESTADOS_BASE: Array<{ id: string; label: string; order: number }> = [
  { id: 'ingresado', label: 'Ingresado', order: 1 },
  { id: 'en_revision', label: 'En revisión', order: 2 },
  { id: 'pendiente_antecedentes', label: 'Pendiente de antecedentes', order: 3 },
  { id: 'en_implementacion', label: 'En implementación de mejora', order: 4 },
  { id: 'en_seguimiento', label: 'En seguimiento', order: 5 },
  { id: 'cerrado', label: 'Cerrado', order: 6 },
]

const ORIGENES_BASE = [
  'Reclamo de paciente',
  'Evento adverso',
  'Evento centinela',
  'Auditoría clínica',
  'Hallazgo interno',
  'Solicitud de jefatura',
  'Mediación o demanda',
  'Fiscalización o requerimiento regulatorio',
  'Otro',
]

const RESPONSABLES_BASE = ['Calidad y Seguridad del Paciente', 'Subdirección Médica', 'Enfermería Supervisión']

class AppDatabase extends Dexie {
  cases!: Table<CaseRecord, string>
  catalogs!: Table<CatalogItem, string>
  meta!: Table<{ key: string; value: string }, string>

  constructor() {
    super('gestor_casos_riesgo_clinico')
    this.version(1).stores({
      cases: 'id, caseNumber, rut, estado, origen, brecha, responsable, deleted, fechaInicio, fechaRevision',
      catalogs: 'id, type, order',
      meta: 'key',
    })
  }
}

export const db = new AppDatabase()

let seedPromise: Promise<void> | null = null

export function ensureCatalogsSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await db.catalogs.count()
      if (count > 0) return
      const items: CatalogItem[] = []
      ESTADOS_BASE.forEach((e) => {
        items.push({ id: e.id, type: 'estado', label: e.label, active: true, order: e.order, builtIn: true })
      })
      ORIGENES_BASE.forEach((label, idx) => {
        items.push({
          id: `origen_${idx}`,
          type: 'origen',
          label,
          active: true,
          order: idx,
          builtIn: true,
        })
      })
      RESPONSABLES_BASE.forEach((label, idx) => {
        items.push({
          id: `responsable_${idx}`,
          type: 'responsable',
          label,
          active: true,
          order: idx,
          builtIn: false,
        })
      })
      await db.catalogs.bulkAdd(items)
    })()
  }
  return seedPromise
}
