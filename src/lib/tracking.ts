import type { CaseRecord, SeguimientoInfo } from '@/types/case'
import { isFuture, isPast, isToday } from '@/lib/dates'

/**
 * Seguimiento tardío solo se evalúa sobre fechaRevision y se congela al cerrar el caso
 * (un caso cerrado no debe seguir generando nuevas alertas de vencimiento).
 * El vencimiento del plan de mejora es independiente del estado del caso:
 * cambiar el estado no "cumple" el plan automáticamente.
 */
export function getSeguimientoInfo(caso: CaseRecord): SeguimientoInfo {
  const cerrado = caso.estado === 'cerrado'
  const tieneFechaRevision = Boolean(caso.fechaRevision)

  const tardio = !cerrado && tieneFechaRevision && isPast(caso.fechaRevision)
  const hoy = !cerrado && tieneFechaRevision && isToday(caso.fechaRevision)
  const vigente = !cerrado && tieneFechaRevision && isFuture(caso.fechaRevision)

  const planVencido = caso.brecha === 'si' && Boolean(caso.fechaPlanMejora) && isPast(caso.fechaPlanMejora)

  return { tardio, vigente, hoy, planVencido }
}

export function esCasoAbierto(caso: CaseRecord): boolean {
  return caso.estado !== 'cerrado'
}
