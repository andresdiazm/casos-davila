import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, FilePlus2, ClipboardCheck, Settings, Stethoscope } from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/casos', label: 'Casos', icon: FolderKanban, end: false },
  { to: '/casos/nuevo', label: 'Nuevo caso', icon: FilePlus2, end: true },
  { to: '/seguimiento', label: 'Seguimiento', icon: ClipboardCheck, end: true },
  { to: '/configuracion', label: 'Configuración', icon: Settings, end: true },
]

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-petroleo text-white">
          <Stethoscope size={18} />
        </div>
        <div>
          <p className="text-sm font-semibold text-grafito leading-tight">Riesgo Clínico</p>
          <p className="text-xs text-slate-400 leading-tight">Gestión de casos</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-petroleo text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-grafito',
              )
            }
          >
            <Icon size={17} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 text-xs text-slate-400">
        Datos almacenados localmente en este navegador.
      </div>
    </aside>
  )
}
