#!/usr/bin/env node
/**
 * Crea (o actualiza) el usuario de pruebas para desarrollo local.
 *
 *   node scripts/create-dev-user.mjs
 *
 * Lee .env.local y usa la service role key para crear el usuario con el email
 * ya confirmado, de modo que `signInWithPassword` funcione de inmediato.
 *
 * Se niega a ejecutarse si NODE_ENV es 'production'.
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

if (process.env.NODE_ENV === 'production') {
  console.error('✗ No se ejecuta con NODE_ENV=production.')
  process.exit(1)
}

// Carga .env.local sin dependencias externas
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
    // el archivo puede no existir; seguimos con las variables del entorno
  }
}
loadEnv('.env.local')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.DEV_LOGIN_EMAIL
const password = process.env.DEV_LOGIN_PASSWORD

const faltantes = Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  DEV_LOGIN_EMAIL: email,
  DEV_LOGIN_PASSWORD: password,
}).filter(([, v]) => !v).map(([k]) => k)

if (faltantes.length) {
  console.error(`✗ Faltan variables en .env.local: ${faltantes.join(', ')}`)
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const { data: existentes, error: listError } = await admin.auth.admin.listUsers()
if (listError) {
  console.error('✗ No se pudo consultar los usuarios:', listError.message)
  process.exit(1)
}

const existente = existentes.users.find(u => u.email === email)

if (existente) {
  const { error } = await admin.auth.admin.updateUserById(existente.id, {
    password,
    email_confirm: true,
  })
  if (error) {
    console.error('✗ No se pudo actualizar el usuario:', error.message)
    process.exit(1)
  }
  console.log(`✓ Contraseña actualizada para ${email}`)
  console.log(`  user id: ${existente.id}`)
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) {
    console.error('✗ No se pudo crear el usuario:', error.message)
    process.exit(1)
  }
  console.log(`✓ Usuario de pruebas creado: ${email}`)
  console.log(`  user id: ${data.user.id}`)
}

console.log('\nYa puedes usar el botón "Entrar como usuario de prueba" en /login.')
