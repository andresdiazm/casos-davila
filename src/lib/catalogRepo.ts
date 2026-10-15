import { db } from '@/lib/db'
import type { CatalogItem, CatalogType } from '@/types/case'

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `cat_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export async function getCatalog(type: CatalogType): Promise<CatalogItem[]> {
  const items = await db.catalogs.where('type').equals(type).toArray()
  return items.sort((a, b) => a.order - b.order)
}

export async function getActiveCatalog(type: CatalogType): Promise<CatalogItem[]> {
  const items = await getCatalog(type)
  return items.filter((i) => i.active)
}

export async function addCatalogItem(type: CatalogType, label: string): Promise<CatalogItem> {
  const existing = await getCatalog(type)
  const item: CatalogItem = {
    id: uuid(),
    type,
    label,
    active: true,
    order: existing.length,
    builtIn: false,
  }
  await db.catalogs.add(item)
  return item
}

export async function updateCatalogItem(id: string, changes: Partial<CatalogItem>): Promise<void> {
  await db.catalogs.update(id, changes)
}

export async function setCatalogItemActive(id: string, active: boolean): Promise<void> {
  await db.catalogs.update(id, { active })
}

export async function deleteCatalogItem(id: string): Promise<void> {
  const item = await db.catalogs.get(id)
  if (item?.builtIn) throw new Error('No se puede eliminar un valor predefinido del sistema')
  await db.catalogs.delete(id)
}

export async function getAllCatalogs(): Promise<CatalogItem[]> {
  return db.catalogs.toArray()
}
