import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  AlarmClockOff,
  ClipboardList,
  ClipboardX,
  FileQuestion,
  FolderCheck,
  FolderOpen,
  Layers,
  ShieldAlert,
} from 'lucide-react'
import { useCases } from '@/context/CasesContext'
import { StatCard } from '@/components/dashboard/StatCard'
import { ChartCard } from '@/components/dashboard/ChartCard'
import { estadoLabel } from '@/components/cases/caseBadges'
import { getSeguimientoInfo } from '@/lib/tracking'
import { monthKey, monthLabel } from '@/lib/dates'

const CHART_COLORS = ['#174A5B', '#16A5A5', '#E7A33E', '#8894A0', '#5B8A99', '#D9534F']

export function Dashboard() {
  const { cases, loading } = useCases()

  if (loading) {
    return <p className="text-sm text-slate-400">Cargando indicadores...</p>
  }

  const total = cases.length
  const cerrados = cases.filter((c) => c.estado === 'cerrado').length
  const abiertos = total - cerrados
  const conBrecha = cases.filter((c) => c.brecha === 'si').length
  const brechaPendiente = cases.filter((c) => c.brecha === 'pendiente').length
  const tardios = cases.filter((c) => getSeguimientoInfo(c).tardio).length
  const planesVencidos = cases.filter((c) => getSeguimientoInfo(c).planVencido).length

  const porEstado = Object.entries(
    cases.reduce<Record<string, number>>((acc, c) => {
      acc[c.estado] = (acc[c.estado] ?? 0) + 1
      return acc
    }, {}),
  ).map(([estado, value]) => ({ name: estadoLabel(estado), value }))

  const porOrigen = Object.entries(
    cases.reduce<Record<string, number>>((acc, c) => {
      acc[c.origen] = (acc[c.origen] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  const porResponsable = Object.entries(
    cases.reduce<Record<string, number>>((acc, c) => {
      acc[c.responsable] = (acc[c.responsable] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  const porMes = Object.entries(
    cases.reduce<Record<string, number>>((acc, c) => {
      const key = monthKey(c.fechaInicio)
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {}),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ name: monthLabel(key), value }))

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Total de casos" value={total} icon={<Layers size={20} />} />
        <StatCard label="Casos abiertos" value={abiertos} icon={<FolderOpen size={20} />} />
        <StatCard label="Casos cerrados" value={cerrados} icon={<FolderCheck size={20} />} />
        <StatCard label="Con brecha identificada" value={conBrecha} icon={<ShieldAlert size={20} />} tone="warning" />
        <StatCard
          label="Pendientes de evaluación de brecha"
          value={brechaPendiente}
          icon={<FileQuestion size={20} />}
        />
        <StatCard label="Seguimiento tardío" value={tardios} icon={<AlarmClockOff size={20} />} tone="alert" />
        <StatCard label="Planes de mejora vencidos" value={planesVencidos} icon={<ClipboardX size={20} />} tone="alert" />
        <StatCard label="Catálogo de casos activos" value={abiertos + cerrados} icon={<ClipboardList size={20} />} />
      </div>

      {total === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          No hay datos suficientes para mostrar gráficos. Registre casos o cargue datos de demostración desde
          Configuración.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Distribución por estado">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip />
                <Pie data={porEstado} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {porEstado.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Distribución por origen">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porOrigen} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-turquesa)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Casos por responsable">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porResponsable}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-petroleo)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Evolución mensual de ingresos de casos">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={porMes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="var(--color-ambar)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  )
}
