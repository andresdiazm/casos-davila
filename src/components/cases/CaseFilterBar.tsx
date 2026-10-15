import { RotateCcw } from 'lucide-react'
import { SelectInput, TextInput } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { useCatalog } from '@/context/CasesContext'
import { defaultFilters, type CaseFilters } from '@/lib/caseFilters'

interface Props {
  filters: CaseFilters
  onChange: (filters: CaseFilters) => void
}

export function CaseFilterBar({ filters, onChange }: Props) {
  const origenes = useCatalog('origen')
  const responsables = useCatalog('responsable')

  function set<K extends keyof CaseFilters>(key: K, value: CaseFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        <TextInput
          placeholder="Buscar nombre, RUT o ID"
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
        />
        <SelectInput value={filters.origen} onChange={(e) => set('origen', e.target.value)}>
          <option value="">Origen: Todos</option>
          {origenes.map((o) => (
            <option key={o.id} value={o.label}>
              {o.label}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.estado} onChange={(e) => set('estado', e.target.value)}>
          <option value="">Estado: Todos</option>
          <option value="ingresado">Ingresado</option>
          <option value="en_revision">En revisión</option>
          <option value="pendiente_antecedentes">Pendiente de antecedentes</option>
          <option value="en_implementacion">En implementación</option>
          <option value="en_seguimiento">En seguimiento</option>
          <option value="cerrado">Cerrado</option>
        </SelectInput>
        <SelectInput value={filters.responsable} onChange={(e) => set('responsable', e.target.value)}>
          <option value="">Responsable: Todos</option>
          {responsables.map((r) => (
            <option key={r.id} value={r.label}>
              {r.label}
            </option>
          ))}
        </SelectInput>
        <SelectInput value={filters.brecha} onChange={(e) => set('brecha', e.target.value)}>
          <option value="">Brecha: Todas</option>
          <option value="si">Sí</option>
          <option value="no">No</option>
          <option value="pendiente">Pendiente</option>
        </SelectInput>
        <Button
          variant="ghost"
          icon={<RotateCcw size={14} />}
          onClick={() => onChange({ ...defaultFilters })}
        >
          Limpiar filtros
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-4 border-t border-slate-100 pt-3">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Fecha inicio desde
          <TextInput
            type="date"
            className="w-auto"
            value={filters.fechaInicioDesde}
            onChange={(e) => set('fechaInicioDesde', e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          hasta
          <TextInput
            type="date"
            className="w-auto"
            value={filters.fechaInicioHasta}
            onChange={(e) => set('fechaInicioHasta', e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={filters.soloTardios}
            onChange={(e) => set('soloTardios', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-petroleo focus:ring-turquesa"
          />
          Solo seguimiento tardío
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={filters.soloPlanVencido}
            onChange={(e) => set('soloPlanVencido', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-petroleo focus:ring-turquesa"
          />
          Solo plan de mejora vencido
        </label>
      </div>
    </div>
  )
}
