import { db } from '@/lib/db'
import { nowISO } from '@/lib/dates'
import type { CaseDraft, CaseRecord, HistoryEntry, ImpactoFinancieroItem, Tarea } from '@/types/case'

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

const FIELD_LABELS: Record<string, string> = {
  nombre: 'Nombre',
  rut: 'RUT',
  tipoPaciente: 'Tipo de paciente',
  cama: 'Cama',
  diagnosticoPrincipal: 'Diagnóstico principal',
  servicioInvolucrado: 'Servicio involucrado',
  idReclamoOrdinario: 'ID de reclamo / ordinario',
  origen: 'Origen',
  fechaInicio: 'Fecha de inicio',
  estado: 'Estado',
  brecha: 'Brecha identificada',
  descripcionBrecha: 'Descripción de la brecha',
  planMejora: 'Plan de mejora',
  fechaRevision: 'Fecha de revisión',
  fechaPlanMejora: 'Fecha de plan de mejora',
  fechaPresentacionComite: 'Fecha de presentación en comité',
  montoSolicitado: 'Monto solicitado',
  montoAcordado: 'Monto acordado',
  responsable: 'Responsable',
  resumenClinico: 'Resumen clínico',
  observaciones: 'Observaciones',
}

/** Normaliza registros creados antes de incorporar resumen clínico, observaciones, tareas, montos, tipo de paciente, descripción de brecha, servicio involucrado, ID de reclamo/ordinario, fecha de presentación en comité e impacto financiero. */
function normalizeCase(record: CaseRecord): CaseRecord {
  return {
    ...record,
    resumenClinico: record.resumenClinico ?? '',
    observaciones: record.observaciones ?? '',
    montoSolicitado: record.montoSolicitado ?? '',
    montoAcordado: record.montoAcordado ?? '',
    tipoPaciente: record.tipoPaciente ?? '',
    cama: record.cama ?? '',
    diagnosticoPrincipal: record.diagnosticoPrincipal ?? '',
    descripcionBrecha: record.descripcionBrecha ?? '',
    servicioInvolucrado: record.servicioInvolucrado ?? '',
    idReclamoOrdinario: record.idReclamoOrdinario ?? '',
    fechaPresentacionComite: record.fechaPresentacionComite ?? '',
    tareas: record.tareas ?? [],
    impactoFinanciero: record.impactoFinanciero ?? [],
  }
}

async function nextCaseNumber(): Promise<string> {
  const result = await db.transaction('rw', db.meta, async () => {
    const row = await db.meta.get('caseCounter')
    const next = row ? parseInt(row.value, 10) + 1 : 1
    await db.meta.put({ key: 'caseCounter', value: String(next) })
    return next
  })
  return `CASO-${String(result).padStart(4, '0')}`
}

export async function getAllCases(includeDeleted = false): Promise<CaseRecord[]> {
  const all = await db.cases.toArray()
  const normalized = all.map(normalizeCase)
  return includeDeleted ? normalized : normalized.filter((c) => !c.deleted)
}

export async function getCaseById(id: string): Promise<CaseRecord | undefined> {
  const record = await db.cases.get(id)
  return record ? normalizeCase(record) : undefined
}

export async function findPotentialDuplicates(
  rut: string,
  fechaInicio: string,
  excludeId?: string,
): Promise<CaseRecord[]> {
  const all = await getAllCases()
  return all.filter(
    (c) => c.rut === rut && c.fechaInicio === fechaInicio && c.id !== excludeId,
  )
}

export async function createCase(draft: CaseDraft): Promise<CaseRecord> {
  const now = nowISO()
  const caseNumber = await nextCaseNumber()
  const record: CaseRecord = {
    ...draft,
    id: uuid(),
    caseNumber,
    tareas: [],
    impactoFinanciero: [],
    deleted: false,
    isDemo: false,
    createdAt: now,
    updatedAt: now,
    history: [
      {
        id: uuid(),
        timestamp: now,
        campo: 'Caso',
        valorAnterior: '',
        valorNuevo: 'Creado',
        descripcion: `Caso ${caseNumber} creado`,
      },
    ],
  }
  await db.cases.add(record)
  return record
}

export async function updateCase(
  id: string,
  changes: Partial<CaseDraft>,
): Promise<CaseRecord> {
  const raw = await db.cases.get(id)
  if (!raw) throw new Error('Caso no encontrado')
  const current = normalizeCase(raw)

  const now = nowISO()
  const historyAdditions: HistoryEntry[] = []

  for (const key of Object.keys(changes) as Array<keyof CaseDraft>) {
    const newValue = changes[key]
    const oldValue = current[key]
    if (newValue === undefined || newValue === oldValue) continue
    historyAdditions.push({
      id: uuid(),
      timestamp: now,
      campo: FIELD_LABELS[key] ?? key,
      valorAnterior: oldValue === '' || oldValue == null ? '—' : String(oldValue),
      valorNuevo: newValue === '' || newValue == null ? '—' : String(newValue),
      descripcion: `${FIELD_LABELS[key] ?? key} actualizado`,
    })
  }

  const updated: CaseRecord = {
    ...current,
    ...changes,
    updatedAt: now,
    history: [...current.history, ...historyAdditions],
  }
  await db.cases.put(updated)
  return updated
}

export async function softDeleteCase(id: string): Promise<void> {
  const current = await db.cases.get(id)
  if (!current) return
  const now = nowISO()
  await db.cases.put({
    ...current,
    deleted: true,
    updatedAt: now,
    history: [
      ...current.history,
      {
        id: uuid(),
        timestamp: now,
        campo: 'Caso',
        valorAnterior: 'Activo',
        valorNuevo: 'Eliminado',
        descripcion: 'Caso eliminado (eliminación lógica)',
      },
    ],
  })
}

export async function restoreCase(id: string): Promise<void> {
  const current = await db.cases.get(id)
  if (!current) return
  const now = nowISO()
  await db.cases.put({
    ...current,
    deleted: false,
    updatedAt: now,
    history: [
      ...current.history,
      {
        id: uuid(),
        timestamp: now,
        campo: 'Caso',
        valorAnterior: 'Eliminado',
        valorNuevo: 'Activo',
        descripcion: 'Caso restaurado',
      },
    ],
  })
}

export interface TareaInput {
  descripcion: string
  responsable?: string
  fechaLimite?: string
}

export async function addTarea(caseId: string, input: TareaInput): Promise<CaseRecord> {
  const raw = await db.cases.get(caseId)
  if (!raw) throw new Error('Caso no encontrado')
  const current = normalizeCase(raw)
  const now = nowISO()
  const tarea: Tarea = {
    id: uuid(),
    descripcion: input.descripcion,
    responsable: input.responsable ?? '',
    fechaLimite: input.fechaLimite ?? '',
    completada: false,
    createdAt: now,
  }
  const updated: CaseRecord = {
    ...current,
    tareas: [...current.tareas, tarea],
    updatedAt: now,
    history: [
      ...current.history,
      {
        id: uuid(),
        timestamp: now,
        campo: 'Tareas',
        valorAnterior: '—',
        valorNuevo: tarea.descripcion,
        descripcion: 'Tarea agregada',
      },
    ],
  }
  await db.cases.put(updated)
  return updated
}

export async function toggleTarea(caseId: string, tareaId: string): Promise<CaseRecord> {
  const raw = await db.cases.get(caseId)
  if (!raw) throw new Error('Caso no encontrado')
  const current = normalizeCase(raw)
  const tarea = current.tareas.find((t) => t.id === tareaId)
  if (!tarea) throw new Error('Tarea no encontrada')
  const now = nowISO()
  const updated: CaseRecord = {
    ...current,
    tareas: current.tareas.map((t) => (t.id === tareaId ? { ...t, completada: !t.completada } : t)),
    updatedAt: now,
    history: [
      ...current.history,
      {
        id: uuid(),
        timestamp: now,
        campo: 'Tareas',
        valorAnterior: tarea.completada ? 'Completada' : 'Pendiente',
        valorNuevo: tarea.completada ? 'Pendiente' : 'Completada',
        descripcion: `Tarea "${tarea.descripcion}" actualizada`,
      },
    ],
  }
  await db.cases.put(updated)
  return updated
}

export async function deleteTarea(caseId: string, tareaId: string): Promise<CaseRecord> {
  const raw = await db.cases.get(caseId)
  if (!raw) throw new Error('Caso no encontrado')
  const current = normalizeCase(raw)
  const tarea = current.tareas.find((t) => t.id === tareaId)
  const now = nowISO()
  const updated: CaseRecord = {
    ...current,
    tareas: current.tareas.filter((t) => t.id !== tareaId),
    updatedAt: now,
    history: [
      ...current.history,
      {
        id: uuid(),
        timestamp: now,
        campo: 'Tareas',
        valorAnterior: tarea?.descripcion ?? '—',
        valorNuevo: '—',
        descripcion: 'Tarea eliminada',
      },
    ],
  }
  await db.cases.put(updated)
  return updated
}

export interface ImpactoFinancieroInput {
  item: string
  monto: string
}

export async function addImpactoFinanciero(
  caseId: string,
  input: ImpactoFinancieroInput,
): Promise<CaseRecord> {
  const raw = await db.cases.get(caseId)
  if (!raw) throw new Error('Caso no encontrado')
  const current = normalizeCase(raw)
  const now = nowISO()
  const entry: ImpactoFinancieroItem = {
    id: uuid(),
    item: input.item,
    monto: input.monto,
    createdAt: now,
  }
  const updated: CaseRecord = {
    ...current,
    impactoFinanciero: [...current.impactoFinanciero, entry],
    updatedAt: now,
    history: [
      ...current.history,
      {
        id: uuid(),
        timestamp: now,
        campo: 'Impacto financiero',
        valorAnterior: '—',
        valorNuevo: `${entry.item}: ${entry.monto}`,
        descripcion: 'Ítem de impacto financiero agregado',
      },
    ],
  }
  await db.cases.put(updated)
  return updated
}

export async function deleteImpactoFinanciero(caseId: string, itemId: string): Promise<CaseRecord> {
  const raw = await db.cases.get(caseId)
  if (!raw) throw new Error('Caso no encontrado')
  const current = normalizeCase(raw)
  const entry = current.impactoFinanciero.find((i) => i.id === itemId)
  const now = nowISO()
  const updated: CaseRecord = {
    ...current,
    impactoFinanciero: current.impactoFinanciero.filter((i) => i.id !== itemId),
    updatedAt: now,
    history: [
      ...current.history,
      {
        id: uuid(),
        timestamp: now,
        campo: 'Impacto financiero',
        valorAnterior: entry ? `${entry.item}: ${entry.monto}` : '—',
        valorNuevo: '—',
        descripcion: 'Ítem de impacto financiero eliminado',
      },
    ],
  }
  await db.cases.put(updated)
  return updated
}

export async function bulkPutCases(records: CaseRecord[]): Promise<void> {
  await db.cases.bulkPut(records)
}

export async function deleteAllDemoCases(): Promise<number> {
  const demos = await db.cases.where('id').notEqual('').toArray()
  const toDelete = demos.filter((c) => c.isDemo)
  await db.cases.bulkDelete(toDelete.map((c) => c.id))
  return toDelete.length
}

export async function clearAllCases(): Promise<void> {
  await db.cases.clear()
  await db.meta.delete('caseCounter')
}

export { uuid }
