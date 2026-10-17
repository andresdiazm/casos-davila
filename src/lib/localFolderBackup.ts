import { db } from '@/lib/db'
import { buildBackup } from '@/lib/backup'

const HANDLE_KEY = 'backupFolder'
const AUTO_SYNC_META_KEY = 'autoBackupEnabled'
const FILE_NAME = 'respaldo_casos.json'

export function isLocalFolderBackupSupported(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window
}

export async function pickBackupFolder(): Promise<FileSystemDirectoryHandle> {
  const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
  await db.handles.put({ key: HANDLE_KEY, handle })
  return handle
}

export async function getStoredFolderHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  const row = await db.handles.get(HANDLE_KEY)
  return row?.handle
}

export async function forgetBackupFolder(): Promise<void> {
  await db.handles.delete(HANDLE_KEY)
}

export async function checkPermission(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
  return handle.queryPermission({ mode: 'readwrite' })
}

export async function requestPermission(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
  return handle.requestPermission({ mode: 'readwrite' })
}

export async function writeBackupToFolder(handle: FileSystemDirectoryHandle): Promise<void> {
  const payload = await buildBackup()
  const fileHandle = await handle.getFileHandle(FILE_NAME, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(JSON.stringify(payload, null, 2))
  await writable.close()
}

export async function getAutoSyncEnabled(): Promise<boolean> {
  const row = await db.meta.get(AUTO_SYNC_META_KEY)
  return row?.value === 'true'
}

export async function setAutoSyncEnabled(enabled: boolean): Promise<void> {
  await db.meta.put({ key: AUTO_SYNC_META_KEY, value: enabled ? 'true' : 'false' })
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null

/** Escribe el respaldo en la carpeta vinculada, sin saturar el disco ante cambios seguidos. */
export function scheduleAutoSync(handle: FileSystemDirectoryHandle, onError: (err: unknown) => void): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    writeBackupToFolder(handle).catch(onError)
  }, 800)
}
