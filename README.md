# Gestión de Casos de Riesgo Clínico

Aplicación web para registrar, consultar, clasificar y dar seguimiento a casos de riesgo clínico de una institución de salud: brechas asistenciales, planes de mejora, tareas y responsables.

MVP local, sin servidor ni servicios externos: toda la información se almacena en el navegador (IndexedDB) del computador donde se use.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Dexie (IndexedDB)
- Recharts
- Lucide React

## Desarrollo

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (por defecto `http://localhost:5173`).

## Build de producción

```bash
npm run build
```

Genera el sitio estático en `dist/`, que puede abrirse directamente en el navegador o servirse desde cualquier hosting estático.

## Datos

- Los datos quedan guardados en el navegador y perfil del computador donde se usa la aplicación. Borrar los datos del sitio o cambiar de navegador puede ocasionar pérdida de información.
- Desde **Configuración** se puede exportar/importar un respaldo completo en JSON y exportar los casos filtrados a CSV.
- No almacenar información clínica real identificable sin los controles institucionales de seguridad correspondientes.
