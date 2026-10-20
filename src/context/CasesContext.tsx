import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
import {
  checkPermission,
  forgetBackupFolder,
  getAutoSyncEnabled,
  getStoredFolderHandle,
  isLocalFolderBackupSupported,
  pickBackupFolder,
  requestPermission,
  scheduleAutoSync,
  setAutoSyncEnabled as persistAutoSyncEnabled,
  writeBackupToFolder,
} from '@/lib/localFolderBackup'
import { useToast } from '@/context/ToastContext'
import type { CaseDraft, CaseRecord, CatalogItem, CatalogType } from '@/types/case'

interface BackupFolderState {
  supported: boolean
  connected: boolean
  folderName: string | null
  permission: PermissionState | null
  autoSyncEnabled: boolean
  syncing: boolean
}

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
  backupFolder: BackupFolderState
  connectBackupFolder: () => Promise<void>
  disconnectBackupFolder: () => Promise<void>
  reauthorizeBackupFolder: () => Promise<void>
  setBackupAutoSync: (enabled: boolean) => Promise<void>
  syncBackupNow: () => Promise<void>
}

const CasesContext = createContext<CasesContextValue | undefined>(undefined)

export function CasesProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast()
  const [cases, setCases] = useState<CaseRecord[]>([])
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)

  const [backupHandle, setBackupHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [backupPermission, setBackupPermission] = useState<PermissionState | null>(null)
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const refresh = useCallback(async () => {
    const [allCases, origenes, responsables, estados, servicios] = await Promise.all([
      getAllCases(),
      getCatalog('origen'),
      getCatalog('responsable'),
      getCatalog('estado'),
      getCatalog('servicio'),
    ])
    setCases(allCases)
    setCatalogs([...origenes, ...responsables, ...estados, ...servicios])
    if (backupHandle && autoSyncEnabled && backupPermission === 'granted') {
      scheduleAutoSync(backupHandle, () =>
        notify('error', 'No se pudo sincronizar el respaldo en la carpeta local.'),
      )
    }
  }, [backupHandle, autoSyncEnabled, backupPermission, notify])

  const refreshRef = useRef(refresh)
  useEffect(() => {
    refreshRef.current = refresh
  }, [refresh])

  useEffect(() => {
    let active = true
    ;(async () => {
      await ensureCatalogsSeeded()
      if (!active) return
      await refreshRef.current()
      if (!active) return
      setLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      const [handle, enabled] = await Promise.all([getStoredFolderHandle(), getAutoSyncEnabled()])
      if (!active) return
      setAutoSyncEnabled(enabled)
      if (handle) {
        const perm = await checkPermission(handle)
        if (!active) return
        setBackupHandle(handle)
        setBackupPermission(perm)
      }
    })()
    return () => {
      active = false
    }
  }, [])

  const connectBackupFolder = useCallback(async () => {
    const handle = await pickBackupFolder()
    setBackupHandle(handle)
    setBackupPermission('granted')
    setAutoSyncEnabled(true)
    await persistAutoSyncEnabled(true)
    try {
      await writeBackupToFolder(handle)
      notify('success', `Carpeta de respaldo vinculada: ${handle.name}`)
    } catch {
      notify('error', 'La carpeta se vinculó, pero no se pudo escribir el primer respaldo.')
    }
  }, [notify])

  const disconnectBackupFolder = useCallback(async () => {
    await forgetBackupFolder()
    await persistAutoSyncEnabled(false)
    setBackupHandle(null)
    setBackupPermission(null)
    setAutoSyncEnabled(false)
    notify('info', 'Carpeta de respaldo desvinculada.')
  }, [notify])

  const reauthorizeBackupFolder = useCallback(async () => {
    if (!backupHandle) return
    const perm = await requestPermission(backupHandle)
    setBackupPermission(perm)
    if (perm === 'granted') {
      notify('success', 'Acceso a la carpeta de respaldo reautorizado.')
    } else {
      notify('error', 'No se concedió acceso a la carpeta seleccionada.')
    }
  }, [backupHandle, notify])

  const setBackupAutoSync = useCallback(async (enabled: boolean) => {
    await persistAutoSyncEnabled(enabled)
    setAutoSyncEnabled(enabled)
  }, [])

  const syncBackupNow = useCallback(async () => {
    if (!backupHandle) return
    setSyncing(true)
    try {
      await writeBackupToFolder(backupHandle)
      notify('success', 'Respaldo guardado en la carpeta local.')
    } catch {
      notify('error', 'No se pudo guardar el respaldo en la carpeta local.')
    } finally {
      setSyncing(false)
    }
  }, [backupHandle, notify])

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

  const backupFolder = useMemo<BackupFolderState>(
    () => ({
      supported: isLocalFolderBackupSupported(),
      connected: backupHandle !== null,
      folderName: backupHandle?.name ?? null,
      permission: backupPermission,
      autoSyncEnabled,
      syncing,
    }),
    [backupHandle, backupPermission, autoSyncEnabled, syncing],
  )

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
      backupFolder,
      connectBackupFolder,
      disconnectBackupFolder,
      reauthorizeBackupFolder,
      setBackupAutoSync,
      syncBackupNow,
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
      backupFolder,
      connectBackupFolder,
      disconnectBackupFolder,
      reauthorizeBackupFolder,
      setBackupAutoSync,
      syncBackupNow,
    ],
  )

  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>
}

export function useCases(): CasesContextValue {
  const ctx = useContext(CasesContext)
  if (!ctx) throw new Error('useCases debe usarse dentro de CasesProvider')
  return ctx
}

export function useCatalog(type: CatalogType): CatalogItem[] {
  const { catalogs } = useCases()
  return useMemo(
    () => catalogs.filter((c) => c.type === type && c.active).sort((a, b) => a.order - b.order),
    [catalogs, type],
  )
}
