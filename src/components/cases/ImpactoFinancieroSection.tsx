import { useState } from 'react'
import { CircleDollarSign, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SelectInput, TextInput } from '@/components/ui/Field'
import { useCases, useCatalog } from '@/context/CasesContext'
import { useToast } from '@/context/ToastContext'
import { formatCLP } from '@/lib/currency'
import type { ImpactoFinancieroItem } from '@/types/case'

interface ImpactoFinancieroSectionProps {
  caseId: string
  items: ImpactoFinancieroItem[]
  title?: string
}

export function ImpactoFinancieroSection({ caseId, items, title = 'Impacto financiero' }: ImpactoFinancieroSectionProps) {
  const { addImpactoFinanciero, removeImpactoFinanciero } = useCases()
  const { notify } = useToast()
  const itemsCatalogo = useCatalog('itemFinanciero')
  const [item, setItem] = useState('')
  const [monto, setMonto] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const total = items.reduce((sum, i) => sum + (Number(i.monto) || 0), 0)

  async function handleAdd() {
    if (!item || !monto.trim()) return
    setSubmitting(true)
    try {
      await addImpactoFinanciero(caseId, { item, monto })
      setItem('')
      setMonto('')
      notify('success', 'Ítem de impacto financiero agregado.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(itemId: string) {
    await removeImpactoFinanciero(caseId, itemId)
    notify('success', 'Ítem eliminado.')
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-grafito">
        <CircleDollarSign size={16} /> {title}
        {items.length > 0 && <span className="font-normal text-slate-400">· Total: {formatCLP(String(total))}</span>}
      </h3>

      {items.length === 0 ? (
        <p className="mb-4 text-sm text-slate-400">Sin ítems de impacto financiero registrados para este caso.</p>
      ) : (
        <ul className="mb-4 flex flex-col gap-2">
          {items.map((i) => (
            <li
              key={i.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
            >
              <span className="text-sm text-grafito">{i.item}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-grafito">{formatCLP(i.monto)}</span>
                <button
                  onClick={() => handleDelete(i.id)}
                  className="text-slate-400 hover:text-alerta"
                  aria-label="Eliminar ítem"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-[1fr_auto_auto]">
        <SelectInput value={item} onChange={(e) => setItem(e.target.value)}>
          <option value="">Seleccione un ítem...</option>
          {itemsCatalogo.map((c) => (
            <option key={c.id} value={c.label}>
              {c.label}
            </option>
          ))}
        </SelectInput>
        <TextInput
          type="number"
          min="0"
          step="1"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          placeholder="Monto"
          className="sm:w-36"
        />
        <Button
          variant="secondary"
          icon={<Plus size={15} />}
          onClick={handleAdd}
          disabled={submitting || !item || !monto.trim()}
        >
          Agregar
        </Button>
      </div>
    </section>
  )
}
