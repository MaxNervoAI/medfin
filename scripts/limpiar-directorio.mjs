#!/usr/bin/env node
/**
 * Limpieza del directorio tras la importación DEIS/MINSAL.
 *
 *   node --env-file=.env.local scripts/limpiar-directorio.mjs           # simulación
 *   node --env-file=.env.local scripts/limpiar-directorio.mjs --apply   # aplica
 *
 * 1. Elimina laboratorios clínicos y centros de diálisis (ruido para la
 *    mayoría de los profesionales). Nunca borra una fila enlazada por algún
 *    usuario ni una que tenga autor.
 * 2. Colapsa espacios dobles en `nombre` ("Clínica  Dávila" -> "Clínica Dávila").
 *    Si el nombre limpio choca con otra fila de la misma ciudad, se elimina la
 *    redundante en vez de actualizarla (el índice único lo impediría).
 */
import { createClient } from '@supabase/supabase-js'

const APPLY = process.argv.includes('--apply')
const TIPOS_A_ELIMINAR = ['laboratorio', 'centro_dialisis']

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

const limpiarEspacios = t => t.replace(/\s+/g, ' ').trim()
const normalizar = t => limpiarEspacios(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ── Cargar estado actual ──────────────────────────────────────────────────
async function traerTodo() {
  const filas = []
  const PAGINA = 1000
  for (let desde = 0; ; desde += PAGINA) {
    const { data, error } = await db
      .from('instituciones_directorio')
      .select('id, nombre, ciudad, tipo, verificada, created_by')
      .range(desde, desde + PAGINA - 1)
    if (error) throw new Error(error.message)
    filas.push(...data)
    if (data.length < PAGINA) break
  }
  return filas
}

const filas = await traerTodo()
console.log(`directorio actual: ${filas.length} filas`)

const { data: enlaces, error: eLinks } = await db
  .from('instituciones')
  .select('directorio_id')
  .not('directorio_id', 'is', null)
if (eLinks) throw new Error(eLinks.message)
const enlazados = new Set(enlaces.map(e => e.directorio_id))
console.log(`filas enlazadas por algún usuario: ${enlazados.size}`)

// ── 1. Tipos a eliminar ───────────────────────────────────────────────────
const candidatasBorrar = filas.filter(f =>
  TIPOS_A_ELIMINAR.includes(f.tipo) && !enlazados.has(f.id) && !f.created_by)
const protegidas = filas.filter(f =>
  TIPOS_A_ELIMINAR.includes(f.tipo) && (enlazados.has(f.id) || f.created_by))

console.log(`\n── Tipos fuera de catálogo (${TIPOS_A_ELIMINAR.join(', ')}) ──`)
console.log(`a eliminar: ${candidatasBorrar.length}`)
console.log(`protegidas (enlazadas o con autor): ${protegidas.length}`)
for (const p of protegidas.slice(0, 5)) console.log(`   conserva: ${p.nombre}`)

// ── 2. Espacios dobles ────────────────────────────────────────────────────
const idsBorrar = new Set(candidatasBorrar.map(f => f.id))
const quedan = filas.filter(f => !idsBorrar.has(f.id))

// Índice de claves ocupadas tras la eliminación
const clave = (nombre, ciudad) => `${normalizar(nombre)}|${ciudad ?? ''}`
const ocupadas = new Map()
for (const f of quedan) {
  const k = clave(f.nombre, f.ciudad)
  if (!ocupadas.has(k)) ocupadas.set(k, [])
  ocupadas.get(k).push(f)
}

const aRenombrar = []
const colisiones = []
for (const f of quedan) {
  const limpio = limpiarEspacios(f.nombre)
  if (limpio === f.nombre) continue
  const k = clave(limpio, f.ciudad)
  const otras = (ocupadas.get(k) ?? []).filter(o => o.id !== f.id)
  if (otras.length && !enlazados.has(f.id) && !f.created_by) {
    colisiones.push({ fila: f, choca: otras[0] })
  } else {
    aRenombrar.push({ id: f.id, antes: f.nombre, despues: limpio })
  }
}

console.log(`\n── Espacios dobles ──`)
console.log(`a renombrar: ${aRenombrar.length}`)
for (const r of aRenombrar.slice(0, 8)) console.log(`   "${r.antes}" -> "${r.despues}"`)
console.log(`redundantes por colisión (se eliminan): ${colisiones.length}`)
for (const c of colisiones.slice(0, 5)) console.log(`   "${c.fila.nombre}" choca con "${c.choca.nombre}"`)

const totalBorrar = candidatasBorrar.length + colisiones.length
console.log(`\nresumen: ${totalBorrar} eliminaciones, ${aRenombrar.length} renombrados`)
console.log(`directorio quedaría en ${filas.length - totalBorrar} filas`)

if (!APPLY) {
  console.log('\nSimulación: no se escribió nada. Usa --apply para confirmar.')
  process.exit(0)
}

// ── Aplicar ───────────────────────────────────────────────────────────────
const todosLosIdsBorrar = [...idsBorrar, ...colisiones.map(c => c.fila.id)]
const LOTE = 200
let borradas = 0
for (let i = 0; i < todosLosIdsBorrar.length; i += LOTE) {
  const lote = todosLosIdsBorrar.slice(i, i + LOTE)
  const { error } = await db.from('instituciones_directorio').delete().in('id', lote)
  if (error) { console.error('✗ Error al eliminar:', error.message); process.exit(1) }
  borradas += lote.length
  console.log(`  eliminadas ${borradas}/${todosLosIdsBorrar.length}`)
}

let renombradas = 0
for (const r of aRenombrar) {
  const { error } = await db.from('instituciones_directorio').update({ nombre: r.despues }).eq('id', r.id)
  if (error) { console.error(`✗ Error al renombrar ${r.id}:`, error.message); process.exit(1) }
  renombradas++
}

const { count } = await db.from('instituciones_directorio').select('*', { count: 'exact', head: true })
console.log(`\n✓ ${borradas} eliminadas, ${renombradas} renombradas. Directorio: ${count} filas.`)
