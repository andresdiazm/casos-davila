import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { CasesProvider } from '@/context/CasesContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { Dashboard } from '@/pages/Dashboard'
import { CasesList } from '@/pages/CasesList'
import { NewCase } from '@/pages/NewCase'
import { CaseDetail } from '@/pages/CaseDetail'
import { Seguimiento } from '@/pages/Seguimiento'
import { Settings } from '@/pages/Settings'

export default function App() {
  return (
    <ToastProvider>
      <CasesProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/casos" element={<CasesList />} />
              <Route path="/casos/nuevo" element={<NewCase />} />
              <Route path="/casos/:id" element={<CaseDetail />} />
              <Route path="/seguimiento" element={<Seguimiento />} />
              <Route path="/configuracion" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CasesProvider>
    </ToastProvider>
  )
}
