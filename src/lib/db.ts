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

const SERVICIOS_BASE = ['Urgencia', 'Pabellón', 'Maternidad', 'UPC']

export interface StoredHandle {
  key: string
  handle: FileSystemDirectoryHandle
}

class AppDatabase extends Dexie {
  cases!: Table<CaseRecord, string>
  catalogs!: Table<CatalogItem, string>
  meta!: Table<{ key: string; value: string }, string>
  handles!: Table<StoredHandle, string>

  constructor() {
    super('gestor_casos_riesgo_clinico')
    this.version(1).stores({
      cases: 'id, caseNumber, rut, estado, origen, brecha, responsable, deleted, fechaInicio, fechaRevision',
      catalogs: 'id, type, order',
      meta: 'key',
    })
    this.version(2).stores({
      cases: 'id, caseNumber, rut, estado, origen, brecha, responsable, deleted, fechaInicio, fechaRevision',
      catalogs: 'id, type, order',
      meta: 'key',
      handles: 'key',
    })
  }
}

export const db = new AppDatabase()

let seedPromise: Promise<void> | null = null

/** Siembra un catálogo solo si aún no tiene valores, para que los catálogos agregados en
 * versiones posteriores (p. ej. "servicio") también se creen en bases de datos existentes. */
async function seedCatalogTypeIfEmpty(items: CatalogItem[]): Promise<void> {
  if (items.length === 0) return
  const type = items[0].type
  const count = await db.catalogs.where('type').equals(type).count()
  if (count > 0) return
  await db.catalogs.bulkAdd(items)
}

export function ensureCatalogsSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      await seedCatalogTypeIfEmpty(
        ESTADOS_BASE.map((e) => ({ id: e.id, type: 'estado', label: e.label, active: true, order: e.order, builtIn: true })),
      )
      await seedCatalogTypeIfEmpty(
        ORIGENES_BASE.map((label, idx) => ({
          id: `origen_${idx}`,
          type: 'origen',
          label,
          active: true,
          order: idx,
          builtIn: true,
        })),
      )
      await seedCatalogTypeIfEmpty(
        RESPONSABLES_BASE.map((label, idx) => ({
          id: `responsable_${idx}`,
          type: 'responsable',
          label,
          active: true,
          order: idx,
          builtIn: false,
        })),
      )
      await seedCatalogTypeIfEmpty(
        SERVICIOS_BASE.map((label, idx) => ({
          id: `servicio_${idx}`,
          type: 'servicio',
          label,
          active: true,
          order: idx,
          builtIn: false,
        })),
      )
    })()
  }
  return seedPromise
}
