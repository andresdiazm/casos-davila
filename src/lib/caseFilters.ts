import type { CaseRecord } from '@/types/case'
import { getSeguimientoInfo } from '@/lib/tracking'

export interface CaseFilters {
  search: string
  origen: string
  servicio: string
  estado: string
  responsable: string
  brecha: string
  fechaInicioDesde: string
  fechaInicioHasta: string
  soloTardios: boolean
  soloPlanVencido: boolean
}

export const defaultFilters: CaseFilters = {
  search: '',
  origen: '',
  servicio: '',
  estado: '',
  responsable: '',
  brecha: '',
  fechaInicioDesde: '',
  fechaInicioHasta: '',
  soloTardios: false,
  soloPlanVencido: false,
}

const STORAGE_KEY = 'casos_filters_v1'

export function loadFilters(): CaseFilters {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultFilters }
    return { ...defaultFilters, ...JSON.parse(raw) }
  } catch {
    return { ...defaultFilters }
  }
}

export function saveFilters(filters: CaseFilters): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
  } catch {
    // almacenamiento no disponible; se ignora silenciosamente
  }
}

export function applyFilters(cases: CaseRecord[], filters: CaseFilters): CaseRecord[] {
  const search = filters.search.trim().toLowerCase()
  return cases.filter((c) => {
    if (search) {
      const haystack = `${c.nombre} ${c.rut} ${c.caseNumber}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }
    if (filters.origen && c.origen !== filters.origen) return false
    if (filters.servicio && c.servicioInvolucrado !== filters.servicio) return false
    if (filters.estado && c.estado !== filters.estado) return false
    if (filters.responsable && c.responsable !== filters.responsable) return false
    if (filters.brecha && c.brecha !== filters.brecha) return false
    if (filters.fechaInicioDesde && c.fechaInicio < filters.fechaInicioDesde) return false
    if (filters.fechaInicioHasta && c.fechaInicio > filters.fechaInicioHasta) return false
    const info = getSeguimientoInfo(c)
    if (filters.soloTardios && !info.tardio) return false
    if (filters.soloPlanVencido && !info.planVencido) return false
    return true
  })
}
