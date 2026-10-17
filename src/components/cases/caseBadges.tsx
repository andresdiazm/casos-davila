import { Badge } from '@/components/ui/Badge'
import type { Brecha, EstadoCasoId, SeguimientoInfo, TipoPaciente } from '@/types/case'

const ESTADO_LABELS: Record<EstadoCasoId, string> = {
  ingresado: 'Ingresado',
  en_revision: 'En revisión',
  pendiente_antecedentes: 'Pendiente de antecedentes',
  en_implementacion: 'En implementación',
  en_seguimiento: 'En seguimiento',
  cerrado: 'Cerrado',
}

export function estadoLabel(estado: string): string {
  return ESTADO_LABELS[estado as EstadoCasoId] ?? estado
}

const TIPO_PACIENTE_LABELS: Record<Exclude<TipoPaciente, ''>, string> = {
  hospitalizado: 'Hospitalizado',
  ambulatorio: 'Ambulatorio',
  mixto: 'Mixto',
}

export function tipoPacienteLabel(tipo: string): string {
  return TIPO_PACIENTE_LABELS[tipo as Exclude<TipoPaciente, ''>] ?? ''
}

export function EstadoBadge({ estado }: { estado: string }) {
  const tone = estado === 'cerrado' ? 'neutral' : estado === 'en_implementacion' ? 'warning' : 'info'
  return <Badge tone={tone}>{estadoLabel(estado)}</Badge>
}

export function BrechaBadge({ brecha }: { brecha: Brecha }) {
  if (brecha === 'si') return <Badge tone="danger">Brecha: Sí</Badge>
  if (brecha === 'no') return <Badge tone="success">Brecha: No</Badge>
  return <Badge tone="warning">Brecha: Pendiente</Badge>
}

export function SeguimientoBadges({ info }: { info: SeguimientoInfo }) {
  return (
    <>
      {info.tardio && <Badge tone="danger">Seguimiento tardío</Badge>}
      {info.hoy && <Badge tone="warning">Revisión hoy</Badge>}
      {info.vigente && <Badge tone="info">Seguimiento vigente</Badge>}
      {info.planVencido && <Badge tone="danger">Plan de mejora vencido</Badge>}
    </>
  )
}
