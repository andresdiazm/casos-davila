export type Brecha = 'pendiente' | 'si' | 'no'

export type TipoPaciente = '' | 'hospitalizado' | 'ambulatorio' | 'mixto'

export type EstadoCasoId =
  | 'ingresado'
  | 'en_revision'
  | 'pendiente_antecedentes'
  | 'en_implementacion'
  | 'en_seguimiento'
  | 'cerrado'

export interface HistoryEntry {
  id: string
  timestamp: string
  campo: string
  valorAnterior: string
  valorNuevo: string
  descripcion: string
}

export interface Tarea {
  id: string
  descripcion: string
  responsable: string
  fechaLimite: string
  completada: boolean
  createdAt: string
}

export interface CaseRecord {
  id: string
  caseNumber: string
  rut: string
  nombre: string
  tipoPaciente: TipoPaciente
  cama: string
  diagnosticoPrincipal: string
  servicioInvolucrado: string
  origen: string
  fechaInicio: string
  estado: EstadoCasoId
  brecha: Brecha
  descripcionBrecha: string
  planMejora: string
  fechaRevision: string
  fechaPlanMejora: string
  montoSolicitado: string
  montoAcordado: string
  responsable: string
  resumenClinico: string
  observaciones: string
  tareas: Tarea[]
  deleted: boolean
  isDemo: boolean
  createdAt: string
  updatedAt: string
  history: HistoryEntry[]
}

export type CaseDraft = Omit<
  CaseRecord,
  'id' | 'caseNumber' | 'deleted' | 'isDemo' | 'createdAt' | 'updatedAt' | 'history' | 'tareas'
>

export type CatalogType = 'origen' | 'responsable' | 'estado' | 'servicio'

export interface CatalogItem {
  id: string
  type: CatalogType
  label: string
  active: boolean
  order: number
  builtIn: boolean
}

export interface SeguimientoInfo {
  tardio: boolean
  vigente: boolean
  hoy: boolean
  planVencido: boolean
}
