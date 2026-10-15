import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { useToast } from '@/context/ToastContext'
import { addCatalogItem, deleteCatalogItem, setCatalogItemActive } from '@/lib/catalogRepo'
import type { CatalogItem, CatalogType } from '@/types/case'

interface Props {
  title: string
  description: string
  type: CatalogType
  items: CatalogItem[]
  onChanged: () => void
}

export function CatalogManager({ title, description, type, items, onChanged }: Props) {
  const { notify } = useToast()
  const [newLabel, setNewLabel] = useState('')

  async function handleAdd() {
    const label = newLabel.trim()
    if (!label) return
    if (items.some((i) => i.label.toLowerCase() === label.toLowerCase())) {
      notify('error', 'Ese valor ya existe en el catálogo.')
      return
    }
    await addCatalogItem(type, label)
    setNewLabel('')
    onChanged()
    notify('success', 'Valor agregado al catálogo.')
  }

  async function handleToggle(item: CatalogItem) {
    await setCatalogItemActive(item.id, !item.active)
    onChanged()
  }

  async function handleDelete(item: CatalogItem) {
    try {
      await deleteCatalogItem(item.id)
      onChanged()
      notify('success', 'Valor eliminado del catálogo.')
    } catch (err) {
      notify('error', err instanceof Error ? err.message : 'No se pudo eliminar el valor.')
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-grafito">{title}</h3>
      <p className="mb-3 text-xs text-slate-500">{description}</p>
      <ul className="mb-3 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
        {items
          .sort((a, b) => a.order - b.order)
          .map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
            >
              <label className="flex items-center gap-2 text-sm text-grafito">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={() => handleToggle(item)}
                  className="h-4 w-4 rounded border-slate-300 text-petroleo"
                />
                <span className={item.active ? '' : 'text-slate-400 line-through'}>{item.label}</span>
              </label>
              {!item.builtIn && (
                <button
                  onClick={() => handleDelete(item)}
                  className="text-slate-400 hover:text-alerta"
                  aria-label={`Eliminar ${item.label}`}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </li>
          ))}
      </ul>
      <div className="flex gap-2">
        <TextInput
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nuevo valor..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <Button variant="secondary" icon={<Plus size={15} />} onClick={handleAdd}>
          Agregar
        </Button>
      </div>
    </div>
  )
}
