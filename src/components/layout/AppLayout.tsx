import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'

const TITLES: Array<[RegExp, string]> = [
  [/^\/$/, 'Dashboard ejecutivo'],
  [/^\/casos\/nuevo$/, 'Nuevo caso'],
  [/^\/casos\/[^/]+$/, 'Ficha de caso'],
  [/^\/casos$/, 'Gestión de casos'],
  [/^\/seguimiento$/, 'Seguimiento'],
  [/^\/configuracion$/, 'Configuración'],
]

function titleForPath(path: string): string {
  return TITLES.find(([re]) => re.test(path))?.[1] ?? 'Riesgo Clínico'
}

export function AppLayout() {
  const location = useLocation()
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-fondo">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={titleForPath(location.pathname)} />
        <main className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
