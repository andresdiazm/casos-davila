import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ensureCatalogsSeeded } from '@/lib/db'
import {
  addTarea as addTareaRepo,
  createCase,
  deleteAllDemoCases,
  deleteTarea as deleteTareaRepo,
  getAllCases,
  restoreCase,
  softDeleteCase,
  toggleTarea as toggleTareaRepo,
  updateCase,
  type TareaInput,
} from '@/lib/casesRepo'
import { getCatalog } from '@/lib/catalogRepo'
import { seedDemoData } from '@/lib/seed'
import type { CaseDraft, CaseRecord, CatalogItem } from '@/types/case'

interface CasesContextValue {
  cases: CaseRecord[]
  catalogs: CatalogItem[]
  loading: boolean
  hasDemoData: boolean
  refresh: () => Promise<void>
  addCase: (draft: CaseDraft) => Promise<CaseRecord>
  editCase: (id: string, changes: Partial<CaseDraft>) => Promise<CaseRecord>
  removeCase: (id: string) => Promise<void>
  unremoveCase: (id: string) => Promise<void>
  loadDemoData: () => Promise<void>
  removeDemoData: () => Promise<void>
  addTarea: (caseId: string, input: TareaInput) => Promise<void>
  toggleTarea: (caseId: string, tareaId: string) => Promise<void>
  removeTarea: (caseId: string, tareaId: string) => Promise<void>
}

const CasesContext = createContext<CasesContextValue | undefined>(undefined)

export function CasesProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const [allCases, origenes, responsables, estados] = await Promise.all([
      getAllCases(),
      getCatalog('origen'),
      getCatalog('responsable'),
      getCatalog('estado'),
    ])
    setCases(allCases)
    setCatalogs([...origenes, ...responsables, ...estados])
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      await ensureCatalogsSeeded()
      if (!active) return
      await refresh()
      if (!active) return
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [refresh])

  const addCase = useCallback(
    async (draft: CaseDraft) => {
      const record = await createCase(draft)
      await refresh()
      return record
    },
    [refresh],
  )

  const editCase = useCallback(
    async (id: string, changes: Partial<CaseDraft>) => {
      const record = await updateCase(id, changes)
      await refresh()
      return record
    },
    [refresh],
  )

  const removeCase = useCallback(
    async (id: string) => {
      await softDeleteCase(id)
      await refresh()
    },
    [refresh],
  )

  const unremoveCase = useCallback(
    async (id: string) => {
      await restoreCase(id)
      await refresh()
    },
    [refresh],
  )

  const loadDemoData = useCallback(async () => {
    await seedDemoData()
    await refresh()
  }, [refresh])

  const removeDemoData = useCallback(async () => {
    await deleteAllDemoCases()
    await refresh()
  }, [refresh])

  const addTarea = useCallback(
    async (caseId: string, input: TareaInput) => {
      await addTareaRepo(caseId, input)
      await refresh()
    },
    [refresh],
  )

  const toggleTarea = useCallback(
    async (caseId: string, tareaId: string) => {
      await toggleTareaRepo(caseId, tareaId)
      await refresh()
    },
    [refresh],
  )

  const removeTarea = useCallback(
    async (caseId: string, tareaId: string) => {
      await deleteTareaRepo(caseId, tareaId)
      await refresh()
    },
    [refresh],
  )

  const hasDemoData = useMemo(() => cases.some((c) => c.isDemo), [cases])

  const value = useMemo<CasesContextValue>(
    () => ({
      cases,
      catalogs,
      loading,
      hasDemoData,
      refresh,
      addCase,
      editCase,
      removeCase,
      unremoveCase,
      loadDemoData,
      removeDemoData,
      addTarea,
      toggleTarea,
      removeTarea,
    }),
    [
      cases,
      catalogs,
      loading,
      hasDemoData,
      refresh,
      addCase,
      editCase,
      removeCase,
      unremoveCase,
      loadDemoData,
      removeDemoData,
      addTarea,
      toggleTarea,
      removeTarea,
    ],
  )

  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>
}

export function useCases(): CasesContextValue {
  const ctx = useContext(CasesContext)
  if (!ctx) throw new Error('useCases debe usarse dentro de CasesProvider')
  return ctx
}

export function useCatalog(type: 'origen' | 'responsable' | 'estado'): CatalogItem[] {
  const { catalogs } = useCases()
  return useMemo(
    () => catalogs.filter((c) => c.type === type && c.active).sort((a, b) => a.order - b.order),
    [catalogs, type],
  )
}
