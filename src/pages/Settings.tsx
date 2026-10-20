import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, Database, Download, FlaskConical, FolderCog, FolderOpen, Trash2, Upload } from 'lucide-react'
import { useCases } from '@/context/CasesContext'
import { useToast } from '@/context/ToastContext'
import { CatalogManager } from '@/components/settings/CatalogManager'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Modal } from '@/components/ui/Modal'
import { buildBackup, downloadBackup, restoreBackup, validateBackup, type BackupPayload } from '@/lib/backup'
import { getAllCases } from '@/lib/casesRepo'
import { getAllCatalogs } from '@/lib/catalogRepo'

export function Settings() {
  const {
    catalogs,
    refresh,
    hasDemoData,
    loadDemoData,
    removeDemoData,
    backupFolder,
    connectBackupFolder,
    disconnectBackupFolder,
    reauthorizeBackupFolder,
    setBackupAutoSync,
    syncBackupNow,
  } = useCases()
  const { notify } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [storageInfo, setStorageInfo] = useState<{ cases: number; catalogItems: number; usageMb?: number }>({
    cases: 0,
    catalogItems: 0,
  })
  const [pendingImport, setPendingImport] = useState<BackupPayload | null>(null)
  const [confirmClearDemo, setConfirmClearDemo] = useState(false)

  async function loadStorageInfo() {
    const [allCases, allCatalogs] = await Promise.all([getAllCases(true), getAllCatalogs()])
    let usageMb: number | undefined
    if (navigator.storage?.estimate) {
      const estimate = await navigator.storage.estimate()
      if (estimate.usage) usageMb = Math.round((estimate.usage / (1024 * 1024)) * 10) / 10
    }
    setStorageInfo({ cases: allCases.length, catalogItems: allCatalogs.length, usageMb })
  }

  useEffect(() => {
    loadStorageInfo()
  }, [])

  async function handleExport() {
    const payload = await buildBackup()
    downloadBackup(payload)
    notify('success', 'Respaldo exportado correctamente.')
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const result = validateBackup(parsed)
      if (!result.valid || !result.payload) {
        notify('error', result.errors.join(' '))
        return
      }
      setPendingImport(result.payload)
    } catch {
      notify('error', 'No fue posible leer el archivo. Verifique que sea un respaldo JSON válido.')
    }
  }

  async function handleRestore(mode: 'replace' | 'merge') {
    if (!pendingImport) return
    await restoreBackup(pendingImport, mode)
    setPendingImport(null)
    await refresh()
    await loadStorageInfo()
    notify('success', 'Respaldo importado correctamente.')
  }

  async function handleConnectFolder() {
    try {
      await connectBackupFolder()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      notify('error', 'No se pudo vincular la carpeta seleccionada.')
    }
  }

  async function handleLoadDemo() {
    await loadDemoData()
    await loadStorageInfo()
    notify('success', 'Datos de demostración cargados.')
  }

  async function handleRemoveDemo() {
    setConfirmClearDemo(false)
    await removeDemoData()
    await loadStorageInfo()
    notify('success', 'Datos de demostración eliminados.')
  }

  const origenes = catalogs.filter((c) => c.type === 'origen')
  const responsables = catalogs.filter((c) => c.type === 'responsable')
  const servicios = catalogs.filter((c) => c.type === 'servicio')

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <CatalogManager
          title="Origen del caso"
          description="Catálogo de orígenes disponibles al registrar un caso."
          type="origen"
          items={origenes}
          onChanged={refresh}
        />
        <CatalogManager
          title="Responsables"
          description="Personas o unidades responsables que pueden asignarse a un caso."
          type="responsable"
          items={responsables}
          onChanged={refresh}
        />
        <CatalogManager
          title="Servicio involucrado"
          description="Servicios o unidades clínicas disponibles al registrar un caso."
          type="servicio"
          items={servicios}
          onChanged={refresh}
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-1 text-sm font-semibold text-grafito">Respaldo de información</h3>
        <p className="mb-4 text-xs text-slate-500">
          Exporte un respaldo completo en formato JSON o restaure uno previamente generado por este sistema.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" icon={<Download size={15} />} onClick={handleExport}>
            Exportar respaldo completo
          </Button>
          <Button variant="secondary" icon={<Upload size={15} />} onClick={() => fileInputRef.current?.click()}>
            Importar respaldo
          </Button>
          <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileSelected} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-grafito">
          <FolderCog size={15} /> Carpeta de respaldo local
        </h3>

        {!backupFolder.supported ? (
          <p className="text-xs text-slate-500">
            Este navegador no permite vincular una carpeta del computador para guardar respaldos automáticamente.
            Use Chrome o Edge para esta función, o siga usando la exportación manual de arriba.
          </p>
        ) : !backupFolder.connected ? (
          <>
            <p className="mb-4 text-xs text-slate-500">
              Vincule una carpeta real de este computador para que el sistema guarde ahí una copia actualizada del
              respaldo cada vez que registre o modifique un caso.
            </p>
            <Button variant="secondary" icon={<FolderOpen size={15} />} onClick={handleConnectFolder}>
              Conectar carpeta
            </Button>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-slate-500">
              Carpeta vinculada: <span className="font-medium text-grafito">{backupFolder.folderName}</span>
            </p>

            {backupFolder.permission !== 'granted' && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-ambar">
                <AlertTriangle size={14} />
                <span className="flex-1">
                  Se perdió el acceso a la carpeta tras recargar la página. Reautorice para seguir guardando ahí.
                </span>
                <Button size="sm" variant="secondary" onClick={reauthorizeBackupFolder}>
                  Reautorizar
                </Button>
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={backupFolder.autoSyncEnabled}
                onChange={(e) => setBackupAutoSync(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-petroleo focus:ring-turquesa"
              />
              Guardar automáticamente en esta carpeta al registrar o modificar casos
            </label>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                icon={<Download size={15} />}
                onClick={syncBackupNow}
                disabled={backupFolder.syncing || backupFolder.permission !== 'granted'}
              >
                {backupFolder.syncing ? 'Guardando...' : 'Guardar ahora'}
              </Button>
              <Button variant="ghost" onClick={disconnectBackupFolder}>
                Desvincular carpeta
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-grafito">
          <FlaskConical size={15} /> Datos de demostración
        </h3>
        <p className="mb-4 text-xs text-slate-500">
          Cargue casos ficticios para explorar la interfaz, o elimínelos cuando esté listo para trabajar con datos
          reales.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleLoadDemo}>
            Cargar datos de demostración
          </Button>
          <Button
            variant="danger"
            icon={<Trash2 size={15} />}
            disabled={!hasDemoData}
            onClick={() => setConfirmClearDemo(true)}
          >
            Eliminar datos de demostración
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-grafito">
          <Database size={15} /> Almacenamiento local
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Toda la información se guarda en IndexedDB, dentro de este navegador y perfil de este computador.
          Borrar los datos del sitio, usar modo incógnito o cambiar de navegador puede ocasionar la pérdida de la
          información. Respalde regularmente.
        </p>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-slate-400">Casos almacenados</dt>
            <dd className="text-lg font-semibold text-grafito">{storageInfo.cases}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Valores de catálogo</dt>
            <dd className="text-lg font-semibold text-grafito">{storageInfo.catalogItems}</dd>
          </div>
          {storageInfo.usageMb !== undefined && (
            <div>
              <dt className="text-xs text-slate-400">Espacio utilizado</dt>
              <dd className="text-lg font-semibold text-grafito">{storageInfo.usageMb} MB</dd>
            </div>
          )}
        </dl>
      </section>

      {pendingImport && (
        <Modal title="Importar respaldo" onClose={() => setPendingImport(null)} width="sm">
          <p className="mb-4 text-sm text-slate-600">
            Se encontraron {pendingImport.cases.length} casos en el archivo. ¿Cómo desea aplicar la importación?
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="danger" onClick={() => handleRestore('replace')}>
              Reemplazar todos los datos actuales
            </Button>
            <Button variant="primary" onClick={() => handleRestore('merge')}>
              Combinar con los datos actuales
            </Button>
            <Button variant="ghost" onClick={() => setPendingImport(null)}>
              Cancelar
            </Button>
          </div>
        </Modal>
      )}

      {confirmClearDemo && (
        <ConfirmDialog
          title="Eliminar datos de demostración"
          message="Se eliminarán permanentemente todos los casos marcados como demostración. Esta acción no afecta a los casos reales."
          confirmLabel="Eliminar"
          danger
          onConfirm={handleRemoveDemo}
          onCancel={() => setConfirmClearDemo(false)}
        />
      )}
    </div>
  )
}
