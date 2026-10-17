import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3, Download, FolderX } from 'lucide-react'
import { useCases } from '@/context/CasesContext'
import { useToast } from '@/context/ToastContext'
import { CaseFilterBar } from '@/components/cases/CaseFilterBar'
import { EstadoBadge, BrechaBadge, SeguimientoBadges, estadoLabel } from '@/components/cases/caseBadges'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { applyFilters, loadFilters, saveFilters, type CaseFilters } from '@/lib/caseFilters'
import { formatDateDisplay, formatDateTimeDisplay } from '@/lib/dates'
import { getSeguimientoInfo } from '@/lib/tracking'
import { buildCsv, downloadCsv } from '@/lib/csv'
import type { CaseRecord } from '@/types/case'
import clsx from 'clsx'

interface Column {
  id: string
  label: string
  defaultVisible: boolean
  value: (c: CaseRecord) => string
  render?: (c: CaseRecord) => React.ReactNode
}

const COLUMNS: Column[] = [
  { id: 'caseNumber', label: 'ID', defaultVisible: true, value: (c) => c.caseNumber },
  { id: 'rut', label: 'RUT', defaultVisible: true, value: (c) => c.rut },
  { id: 'nombre', label: 'Nombre', defaultVisible: true, value: (c) => c.nombre },
  { id: 'diagnosticoPrincipal', label: 'Diagnóstico', defaultVisible: true, value: (c) => c.diagnosticoPrincipal },
  { id: 'origen', label: 'Origen', defaultVisible: true, value: (c) => c.origen },
  {
    id: 'fechaInicio',
    label: 'Fecha inicio',
    defaultVisible: true,
    value: (c) => c.fechaInicio,
    render: (c) => formatDateDisplay(c.fechaInicio),
  },
  {
    id: 'estado',
    label: 'Estado',
    defaultVisible: true,
    value: (c) => estadoLabel(c.estado),
    render: (c) => <EstadoBadge estado={c.estado} />,
  },
  {
    id: 'brecha',
    label: 'Brecha',
    defaultVisible: true,
    value: (c) => c.brecha,
    render: (c) => <BrechaBadge brecha={c.brecha} />,
  },
  {
    id: 'fechaRevision',
    label: 'Fecha revisión',
    defaultVisible: true,
    value: (c) => c.fechaRevision,
    render: (c) => formatDateDisplay(c.fechaRevision),
  },
  {
    id: 'seguimiento',
    label: 'Seguimiento',
    defaultVisible: true,
    value: () => '',
    render: (c) => <SeguimientoBadges info={getSeguimientoInfo(c)} />,
  },
  { id: 'responsable', label: 'Responsable', defaultVisible: true, value: (c) => c.responsable },
  {
    id: 'updatedAt',
    label: 'Última modificación',
    defaultVisible: false,
    value: (c) => c.updatedAt,
    render: (c) => formatDateTimeDisplay(c.updatedAt),
  },
]

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export function CasesList() {
  const navigate = useNavigate()
  const { notify } = useToast()
  const { cases, loading } = useCases()
  const [searchParams] = useSearchParams()

  const [filters, setFilters] = useState<CaseFilters>(() => {
    const initial = loadFilters()
    const q = searchParams.get('q')
    return q ? { ...initial, search: q } : initial
  })
  const [sortKey, setSortKey] = useState<string>('fechaInicio')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id)),
  )
  const [showColPicker, setShowColPicker] = useState(false)

  useEffect(() => {
    saveFilters(filters)
    setPage(1)
  }, [filters])

  const filtered = useMemo(() => applyFilters(cases, filters), [cases, filters])

  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.id === sortKey)
    if (!col) return filtered
    const copy = [...filtered]
    copy.sort((a, b) => {
      const va = col.value(a)
      const vb = col.value(b)
      const cmp = va.localeCompare(vb, 'es')
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize)

  function toggleSort(colId: string) {
    if (sortKey === colId) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(colId)
      setSortDir('asc')
    }
  }

  function toggleColumn(colId: string) {
    setVisibleCols((prev) => {
      const next = new Set(prev)
      if (next.has(colId)) next.delete(colId)
      else next.add(colId)
      return next
    })
  }

  function exportFiltered() {
    const cols = COLUMNS.filter((c) => visibleCols.has(c.id))
    const headers = cols.map((c) => c.label)
    const rows = sorted.map((c) => cols.map((col) => col.value(c) || '—'))
    downloadCsv(`casos_filtrados_${new Date().toISOString().slice(0, 10)}.csv`, buildCsv(headers, rows))
    notify('success', `Se exportaron ${sorted.length} casos a CSV.`)
  }

  const activeColumns = COLUMNS.filter((c) => visibleCols.has(c.id))

  return (
    <div className="flex flex-col gap-3">
      <CaseFilterBar filters={filters} onChange={setFilters} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {sorted.length} {sorted.length === 1 ? 'resultado' : 'resultados'} de {cases.length} casos
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="secondary" icon={<Columns3 size={15} />} onClick={() => setShowColPicker((s) => !s)}>
              Columnas
            </Button>
            {showColPicker && (
              <div className="absolute right-0 top-full z-10 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                {COLUMNS.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols.has(c.id)}
                      onChange={() => toggleColumn(c.id)}
                      className="h-4 w-4 rounded border-slate-300 text-petroleo"
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <Button variant="secondary" icon={<Download size={15} />} onClick={exportFiltered} disabled={sorted.length === 0}>
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-400">Cargando casos...</p>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={<FolderX size={28} />}
            title="No se encontraron casos"
            description={
              cases.length === 0
                ? 'Aún no hay casos registrados. Cree uno nuevo o cargue datos de demostración desde Configuración.'
                : 'Ningún caso coincide con los filtros aplicados. Intente ajustarlos o límpielos.'
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {activeColumns.map((col) => (
                    <th key={col.id} className="whitespace-nowrap px-3 py-2">
                      <button
                        onClick={() => toggleSort(col.id)}
                        className="flex items-center gap-1 hover:text-grafito"
                      >
                        {col.label}
                        {sortKey === col.id ? (
                          sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : (
                          <ArrowUpDown size={12} className="opacity-30" />
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((c) => {
                  const info = getSeguimientoInfo(c)
                  const vencido = info.tardio || info.planVencido
                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/casos/${c.id}`)}
                      className={clsx(
                        'cursor-pointer border-b border-slate-100 transition-colors hover:bg-teal-50/40',
                        vencido && 'bg-red-50/40',
                      )}
                    >
                      {activeColumns.map((col) => (
                        <td key={col.id} className="whitespace-nowrap px-3 py-2 text-grafito">
                          {col.render ? col.render(c) : col.value(c) || '—'}
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {sorted.length > 0 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center gap-2">
            Filas por página
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setPage(1)
              }}
              className="rounded-md border border-slate-200 px-2 py-1"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span>
              Página {page} de {totalPages}
            </span>
            <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
