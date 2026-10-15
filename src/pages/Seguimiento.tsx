import { useNavigate } from 'react-router-dom'
import { AlarmClockOff, CalendarCheck, CalendarClock, ClipboardX } from 'lucide-react'
import { useCases } from '@/context/CasesContext'
import { EmptyState } from '@/components/ui/EmptyState'
import { EstadoBadge, BrechaBadge } from '@/components/cases/caseBadges'
import { formatDateDisplay } from '@/lib/dates'
import { getSeguimientoInfo } from '@/lib/tracking'
import type { CaseRecord } from '@/types/case'

interface GroupConfig {
  key: string
  title: string
  description: string
  icon: React.ReactNode
  tone: string
  dateField: 'fechaRevision' | 'fechaPlanMejora'
  filter: (c: CaseRecord) => boolean
}

function GroupTable({ config, items }: { config: GroupConfig; items: CaseRecord[] }) {
  const navigate = useNavigate()
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <div className={`rounded-full p-2 ${config.tone}`}>{config.icon}</div>
        <div>
          <h3 className="text-sm font-semibold text-grafito">
            {config.title} <span className="text-slate-400">({items.length})</span>
          </h3>
          <p className="text-xs text-slate-500">{config.description}</p>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-slate-400">No hay casos en esta categoría.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-2">ID</th>
                <th className="px-5 py-2">Nombre</th>
                <th className="px-5 py-2">Fecha clave</th>
                <th className="px-5 py-2">Estado</th>
                <th className="px-5 py-2">Brecha</th>
                <th className="px-5 py-2">Responsable</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/casos/${c.id}`)}
                  className="cursor-pointer border-t border-slate-100 hover:bg-teal-50/40"
                >
                  <td className="px-5 py-2.5 font-medium text-grafito">{c.caseNumber}</td>
                  <td className="px-5 py-2.5">{c.nombre}</td>
                  <td className="px-5 py-2.5">{formatDateDisplay(c[config.dateField])}</td>
                  <td className="px-5 py-2.5">
                    <EstadoBadge estado={c.estado} />
                  </td>
                  <td className="px-5 py-2.5">
                    <BrechaBadge brecha={c.brecha} />
                  </td>
                  <td className="px-5 py-2.5">{c.responsable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function Seguimiento() {
  const { cases, loading } = useCases()

  const groups: GroupConfig[] = [
    {
      key: 'tardio',
      title: 'Seguimiento tardío',
      description: 'Casos abiertos cuya fecha de revisión ya está vencida',
      icon: <AlarmClockOff size={16} />,
      tone: 'bg-red-50 text-alerta',
      dateField: 'fechaRevision',
      filter: (c) => getSeguimientoInfo(c).tardio,
    },
    {
      key: 'hoy',
      title: 'Revisión pendiente para hoy',
      description: 'Casos con fecha de revisión programada para el día de hoy',
      icon: <CalendarClock size={16} />,
      tone: 'bg-amber-50 text-ambar',
      dateField: 'fechaRevision',
      filter: (c) => getSeguimientoInfo(c).hoy,
    },
    {
      key: 'planVencido',
      title: 'Planes de mejora vencidos',
      description: 'Casos con brecha identificada cuyo plan de mejora superó la fecha comprometida',
      icon: <ClipboardX size={16} />,
      tone: 'bg-red-50 text-alerta',
      dateField: 'fechaPlanMejora',
      filter: (c) => getSeguimientoInfo(c).planVencido,
    },
    {
      key: 'vigente',
      title: 'Seguimiento vigente',
      description: 'Casos abiertos con fecha de revisión programada a futuro',
      icon: <CalendarCheck size={16} />,
      tone: 'bg-teal-50 text-petroleo',
      dateField: 'fechaRevision',
      filter: (c) => getSeguimientoInfo(c).vigente,
    },
  ]

  const grouped = groups.map((g) => ({ config: g, items: cases.filter(g.filter) }))

  if (loading) return <p className="text-sm text-slate-400">Cargando seguimiento...</p>

  if (cases.length === 0) {
    return (
      <EmptyState
        icon={<CalendarClock size={28} />}
        title="Sin casos para seguimiento"
        description="Cuando existan casos con fechas de revisión o planes de mejora, aparecerán agrupados aquí."
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {grouped.map(({ config, items }) => (
        <GroupTable key={config.key} config={config} items={items} />
      ))}
    </div>
  )
}
