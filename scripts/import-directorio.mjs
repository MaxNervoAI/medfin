#!/usr/bin/env node
/**
 * Importa el registro oficial de establecimientos de salud (DEIS / MINSAL)
 * al directorio compartido `instituciones_directorio`.
 *
 *   node scripts/import-directorio.mjs            # simulación (no escribe)
 *   node scripts/import-directorio.mjs --apply    # escribe en la base
 *
 * Fuente: Portal de Datos Abiertos de Chile, licencia CC0.
 *   https://datos.gob.cl/dataset/establecimientos-de-salud-vigentes
 *
 * El nombre del CSV lleva la fecha, así que el recurso se resuelve por la API
 * de CKAN en vez de fijar la URL. El script es idempotente: solo inserta lo
 * que falta, comparando por (nombre normalizado, comuna).
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const APPLY = process.argv.includes('--apply')
const CKAN = 'https://datos.gob.cl/api/3/action/package_show?id=establecimientos-de-salud-vigentes'

// Tipos del registro oficial que le sirven a un profesional que emite boletas.
const TIPO_MAP = {
  'Hospital':                  ({ publico }) => (publico ? 'hospital_publico' : 'clinica_privada'),
  'Clínica':                   () => 'clinica_privada',
  'Centro de Salud Privado':   () => 'centro_medico',
  'Centro de Especialidades':  () => 'centro_medico',
  'Laboratorio Clínico':       () => 'laboratorio',
  'Centro de Diálisis':        () => 'centro_dialisis',
}

function loadEnv(file) {
  try {
    for (const raw of readFileSync(resolve(process.cwd(), file), 'utf-8').split('\n')) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!(key in process.env)) process.env[key] = value
    }
  } catch {
    /* puede no existir */
  }
}
loadEnv('.env.local')

/** Debe coincidir con la columna generada `nombre_norm` en Postgres. */
function normalizar(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Parser CSV mínimo con soporte de comillas dobles. */
function parseCSV(texto, delim = ';') {
  const filas = []
  let campo = ''
  let fila = []
  let enComillas = false

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++ } else { enComillas = false }
      } else campo += c
    } else if (c === '"') {
      enComillas = true
    } else if (c === delim) {
      fila.push(campo); campo = ''
    } else if (c === '\n') {
      fila.push(campo); filas.push(fila); fila = []; campo = ''
    } else if (c !== '\r') {
      campo += c
    }
  }
  if (campo !== '' || fila.length) { fila.push(campo); filas.push(fila) }

  const [cabecera, ...resto] = filas
  return resto
    .filter(r => r.length === cabecera.length)
    .map(r => Object.fromEntries(cabecera.map((h, i) => [h.replace(/^﻿/, '').trim(), r[i]])))
}

function limpiarRegion(glosa) {
  return (glosa || '').replace(/^Región\s+(de\s+la\s+|del\s+|de\s+)?/i, '').trim() || null
}

// ── 1. Resolver el CSV vigente ────────────────────────────────────────────
console.log('→ Resolviendo el recurso en datos.gob.cl…')
const meta = await fetch(CKAN).then(r => r.json())
if (!meta?.success) {
  console.error('✗ No se pudo consultar la API de CKAN.')
  process.exit(1)
}
const recurso = meta.result.resources.find(r => (r.format || '').toLowerCase() === 'csv')
if (!recurso) {
  console.error('✗ El dataset no expone ningún recurso CSV.')
  process.exit(1)
}
console.log(`  ${recurso.name}`)
console.log(`  actualizado: ${meta.result.metadata_modified}`)

// ── 2. Descargar y filtrar ────────────────────────────────────────────────
console.log('→ Descargando…')
const csv = await fetch(recurso.url).then(r => r.text())
const filas = parseCSV(csv)
console.log(`  ${filas.length} establecimientos en el registro`)

const candidatos = new Map()
let descartadosCerrados = 0
let descartadosTipo = 0

for (const f of filas) {
  const estado = (f.EstadoFuncionamiento || '').trim().toLowerCase()
  if (!estado.startsWith('vigente')) { descartadosCerrados++; continue }

  const tipoGlosa = (f.TipoEstablecimientoGlosa || '').trim()
  const mapear = TIPO_MAP[tipoGlosa]
  if (!mapear) { descartadosTipo++; continue }

  const nombre = (f.EstablecimientoGlosa || '').trim()
  if (!nombre) continue

  const sistema = (f.TipoSistemaSaludGlosa || '').trim().toLowerCase()
  const ciudad = (f.ComunaGlosa || '').trim() || null

  // Clave idéntica al índice único (nombre_norm, coalesce(ciudad,''))
  const clave = `${normalizar(nombre)}|${ciudad ?? ''}`
  if (candidatos.has(clave)) continue

  candidatos.set(clave, {
    nombre,
    rut: null, // el registro DEIS no publica RUT
    ciudad,
    region: limpiarRegion(f.RegionGlosa),
    tipo: mapear({ publico: sistema === 'público' || sistema === 'fuerzas armadas y de orden' }),
    verificada: true, // proviene del registro oficial
  })
}

console.log(`  ${candidatos.size} candidatos tras filtrar`)
console.log(`  (${descartadosCerrados} cerrados, ${descartadosTipo} de tipo no relevante)`)

const porTipo = {}
for (const c of candidatos.values()) porTipo[c.tipo] = (porTipo[c.tipo] ?? 0) + 1
for (const [t, n] of Object.entries(porTipo).sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(5)}  ${t}`)
}

// ── 3. Comparar con lo que ya existe ──────────────────────────────────────
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('\n✗ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const db = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

console.log('\n→ Leyendo el directorio actual…')
const existentes = new Set()
const TAMANO_PAGINA = 1000
for (let desde = 0; ; desde += TAMANO_PAGINA) {
  const { data, error } = await db
    .from('instituciones_directorio')
    .select('nombre, ciudad')
    .range(desde, desde + TAMANO_PAGINA - 1)
  if (error) {
    console.error('✗ No se pudo leer el directorio:', error.message)
    console.error('  ¿La tabla instituciones_directorio existe y es accesible?')
    process.exit(1)
  }
  for (const r of data) existentes.add(`${normalizar(r.nombre)}|${r.ciudad ?? ''}`)
  if (data.length < TAMANO_PAGINA) break
}
console.log(`  ${existentes.size} ya en el directorio`)

const nuevos = [...candidatos.entries()]
  .filter(([clave]) => !existentes.has(clave))
  .map(([, valor]) => valor)

console.log(`\n→ ${nuevos.length} por insertar`)

if (!nuevos.length) {
  console.log('✓ El directorio ya está al día.')
  process.exit(0)
}

if (!APPLY) {
  console.log('\nEjemplos:')
  for (const n of nuevos.slice(0, 8)) {
    console.log(`  ${n.nombre.slice(0, 46).padEnd(48)} ${(n.ciudad ?? '—').padEnd(18)} ${n.tipo}`)
  }
  console.log('\nSimulación: no se escribió nada. Ejecuta con --apply para confirmar.')
  process.exit(0)
}

// ── 4. Insertar por lotes ─────────────────────────────────────────────────
const LOTE = 500
let insertados = 0
for (let i = 0; i < nuevos.length; i += LOTE) {
  const lote = nuevos.slice(i, i + LOTE)
  const { error } = await db.from('instituciones_directorio').insert(lote)
  if (error) {
    console.error(`✗ Falló el lote ${i / LOTE + 1}:`, error.message)
    process.exit(1)
  }
  insertados += lote.length
  console.log(`  ${insertados}/${nuevos.length}`)
}

console.log(`\n✓ ${insertados} establecimientos incorporados al directorio.`)
