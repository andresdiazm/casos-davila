# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Sistema de Gestión de Casos de Riesgo Clínico — a local-first MVP for tracking clinical risk cases (brechas asistenciales, planes de mejora, seguimiento, tareas) at a health institution. 100% client-side: no backend, no external services. All data lives in the browser's IndexedDB, scoped per browser/profile. The UI and domain language are in Spanish.

## Commands

```bash
npm install        # install dependencies
npm run dev         # start Vite dev server (http://localhost:5173)
npm run build        # tsc -b && vite build -> dist/
npm run preview       # preview a production build locally
npm run lint         # oxlint
```

There is no test suite/framework configured in this repo.

`npm run lint` currently reports a handful of pre-existing `react(only-export-components)` warnings (files that export both a component and small helper functions/constants, e.g. `caseBadges.tsx`, `CaseForm.tsx`, `CasesContext.tsx`, `ToastContext.tsx`) and two `react(set-state-in-effect)` warnings (`CasesList.tsx`, `Settings.tsx`, both legitimate — resetting pagination on filter change and loading storage stats on mount). These are known and not regressions to fix reflexively.

## Deployment

The app deploys to two targets from the same `main` branch, both triggered automatically on push:

- **Vercel** — project linked via `vercel link` to this GitHub repo; builds with `base: '/'`.
- **GitHub Pages** — `.github/workflows/deploy-pages.yml` builds with `GH_PAGES=true npm run build` and deploys the `dist/` artifact. It also copies `dist/index.html` → `dist/404.html` so client-side routes work on refresh/deep-link (GH Pages has no server-side rewrites).

`vite.config.ts` sets `base` conditionally: `/casos-davila/` when `GH_PAGES=true`, otherwise `/`. `src/App.tsx` passes `basename={import.meta.env.BASE_URL}` to `BrowserRouter` so routing adapts to whichever base is active. **If the GitHub repo is ever renamed, update the hardcoded `/casos-davila/` path in `vite.config.ts`.**

## Architecture

### Data flow

```
IndexedDB (Dexie) <-> src/lib/*Repo.ts (CRUD) <-> CasesContext (global state) <-> pages/components
```

- `src/lib/db.ts` — Dexie database definition (`cases`, `catalogs`, `meta` tables) and catalog seeding (`ensureCatalogsSeeded`) for the built-in Origen/Estado/Responsable/Servicio values. Seeding is per-catalog-type (`seedCatalogTypeIfEmpty`, keyed off `db.catalogs.where('type').equals(...)`), not a single "is the whole table empty" check — so adding a brand-new catalog type later and listing it here will also backfill it into databases that already have other catalogs seeded, not just fresh ones.
- `src/lib/casesRepo.ts` — all case CRUD, soft delete/restore, duplicate detection, task (tarea) sub-CRUD, and the auto-generated audit history. `updateCase` diffs the changed fields against the stored record and appends `HistoryEntry` rows automatically — don't write case field updates directly through `db.cases.put`; always go through this repo so history stays consistent.
- `src/lib/catalogRepo.ts` — CRUD for the configurable catalogs (origen/responsable/servicio; estado is fixed in code, not editable via UI yet).
- `src/context/CasesContext.tsx` — the single source of truth for cases + catalogs in the UI. Every mutation (add/edit/remove/tasks/demo data) calls the repo then `refresh()`s the whole in-memory list; there's no fine-grained cache invalidation. `useCatalog(type)` is the hook for reading active catalog values in forms/filters.
- `src/context/ToastContext.tsx` — app-wide success/error/info notifications.

### Backward-compatible schema growth

The Dexie schema's indexed columns (`cases: 'id, caseNumber, rut, estado, origen, brecha, responsable, deleted, fechaInicio, fechaRevision'`) haven't changed since new fields keep getting added to `CaseRecord` (e.g. `resumenClinico`, `observaciones`, `tareas`, `montoSolicitado`/`montoAcordado`, `tipoPaciente`/`cama`/`diagnosticoPrincipal`, `descripcionBrecha`, `servicioInvolucrado`). New optional fields don't require a Dexie version bump, but older records won't have them on disk. The established pattern is: add the field to `CaseRecord`/`CaseDraft` in `src/types/case.ts`, then default it in `normalizeCase()` inside `casesRepo.ts` (applied on every read) so the rest of the app never has to null-check. Follow this pattern for new fields rather than bumping the schema version.

`CaseDraft` is `CaseRecord` minus the server/system-managed fields (`id`, `caseNumber`, `deleted`, `isDemo`, `createdAt`, `updatedAt`, `history`, `tareas`) — it's what `CaseForm` edits and what `createCase`/`updateCase` accept. `tareas` (tasks) are mutated through dedicated repo functions (`addTarea`/`toggleTarea`/`deleteTarea`), not through the draft/form flow, since they're a sub-list with their own lifecycle.

### Domain/business logic

`src/lib/tracking.ts` encodes the seguimiento (follow-up) rules — keep these here rather than inlining date comparisons in components:
- `getSeguimientoInfo(caso)` → tardío/hoy/vigente flags are based on `fechaRevision` and freeze once a case is `cerrado` (closed cases don't generate new tardío alerts).
- Plan de mejora overdue (`planVencido`) is evaluated independently of case `estado` — closing or changing a case's status never auto-clears an overdue plan.

### RUT field

The RUT input is intentionally **not validated** (no checksum, no required format, no auto-formatting) — it accepts any non-empty string. `src/lib/rut.ts` still exports `validarRut`/`formatearRut` (Chilean módulo-11 checksum) but they're only used internally by `src/lib/seed.ts` to generate plausible-looking demo RUTs, not in the form validation path. Don't re-wire strict RUT validation into `CaseForm` unless explicitly asked — it was deliberately removed.

### Routing & layout

`src/App.tsx` defines all routes under one `AppLayout` (`src/components/layout/`): Dashboard (`/`), Casos (`/casos`), Nuevo caso (`/casos/nuevo`), Ficha (`/casos/:id`), Seguimiento (`/seguimiento`), Configuración (`/configuracion`). Case list filters persist across navigation via `sessionStorage` (`src/lib/caseFilters.ts`), not through routing/query state (except an initial `?q=` search param read once from the Topbar's search box).

### Styling

Tailwind CSS v4 via the `@tailwindcss/vite` plugin (no `tailwind.config.js` — theme tokens are declared with `@theme` in `src/index.css`: palette colors `petroleo`/`turquesa`/`grafito`/`fondo`/`alerta`/`ambar`, and the font stack). No external font loading — system font stack only, kept deliberately offline-friendly. Path alias `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

### Backup / export

`src/lib/backup.ts` handles full-database JSON export/import (used by Configuración for respaldo). `src/lib/csv.ts` handles the Excel-compatible CSV export (semicolon-delimited, UTF-8 BOM) from the Casos list, exporting whatever columns/filters/sort are currently active.

### Local folder auto-backup (File System Access API)

`src/lib/localFolderBackup.ts` wraps the File System Access API (`showDirectoryPicker`, `FileSystemDirectoryHandle`) to let the user link a real folder on disk and have `respaldo_casos.json` (built via `buildBackup()`) written there automatically. Chromium-only (Chrome/Edge) — `isLocalFolderBackupSupported()` feature-detects and the Settings UI hides the panel entirely when unsupported, so Firefox/Safari users just keep the manual export/import flow.

- Types aren't in this project's `lib.dom.d.ts` yet — ambient declarations live in `src/types/file-system-access.d.ts`. Extend that file rather than reaching for a `@types/*` package if more of the API is needed later.
- The `FileSystemDirectoryHandle` is stored directly in IndexedDB (structured-clonable in Chromium) in the `handles` table — this required a Dexie schema version bump (`db.ts` is now at version 2; follow the same pattern — repeat all existing stores plus the new one in a new `.version(N).stores({...})` call — if another store is ever added).
- Permission can't be silently regained after a reload (`handle.queryPermission`/`requestPermission` need a user gesture) — `CasesContext` surfaces `backupFolder.permission` so Settings can show a "Reautorizar" button when it's not `'granted'`.
- `CasesContext` owns the connect/disconnect/auto-sync state (`backupFolder`, `connectBackupFolder`, `syncBackupNow`, etc.) and calls `scheduleAutoSync()` (debounced 800ms) at the end of every `refresh()` when auto-sync is on and permission is granted — so any case/catalog/task mutation anywhere in the app re-triggers a write, not just actions taken from the Settings page.
