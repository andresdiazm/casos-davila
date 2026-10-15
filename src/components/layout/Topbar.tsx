import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export function Topbar({ title }: { title: string }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate(`/casos?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <h1 className="text-lg font-semibold text-grafito">{title}</h1>
      <div className="flex items-center gap-3">
        <form onSubmit={onSearch} className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, RUT o ID..."
            className="w-64 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-turquesa focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </form>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => navigate('/casos/nuevo')}>
          Nuevo caso
        </Button>
      </div>
    </header>
  )
}
