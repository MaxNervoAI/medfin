export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { generarAlertas } from '@/lib/utils'
import type { Prestacion } from '@/types'

// Este endpoint puede llamarse desde un cron job (ej. Vercel Cron)
// GET /api/alertas-email?secret=TU_SECRET
export async function GET(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Obtener todos los perfiles con email
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, email')
    .not('email', 'is', null)

  if (!profiles?.length) {
    return Response.json({ sent: 0 })
  }

  let sent = 0

  for (const profile of profiles) {
    if (!profile.email) continue

    // Obtener prestaciones activas del usuario
    const { data: prestaciones } = await supabase
      .from('prestaciones')
      .select('*')
      .eq('user_id', profile.id)
      .neq('estado', 'pagada')

    if (!prestaciones?.length) continue

    const alertas = generarAlertas(prestaciones as Prestacion[])
    if (alertas.length === 0) continue

    // Armar el email
    const html = buildEmailHTML(profile.nombre ?? 'Doctor', alertas)

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Medfin <alertas@medfin.cl>',
      to: profile.email,
      subject: `Medfin: tienes ${alertas.length} alerta${alertas.length > 1 ? 's' : ''} pendiente${alertas.length > 1 ? 's' : ''}`,
      html,
    })

    if (!error) sent++
  }

  return Response.json({ sent })
}

function buildEmailHTML(nombre: string, alertas: ReturnType<typeof generarAlertas>): string {
  const primerNombre = nombre.split(' ')[0]

  const alertasHTML = alertas.map(a => {
    const color = a.tipo.includes('vencida') || a.tipo.includes('vencido') ? '#ef4444' : '#f59e0b'
    const texto = {
      boleta_vencida: 'Boleta VENCIDA — emite tu boleta cuanto antes',
      boleta_vence_hoy: 'Emite tu boleta HOY',
      boleta_por_vencer: `Tienes ${a.dias_restantes} día${a.dias_restantes !== 1 ? 's' : ''} para emitir la boleta`,
      pago_vencido: 'El pago está VENCIDO — contacta a la institución',
      pago_vence_hoy: 'El pago vence HOY',
    }[a.tipo]

    return `
      <div style="border-left: 4px solid ${color}; padding: 12px 16px; margin-bottom: 12px; background: #fafafa; border-radius: 0 8px 8px 0;">
        <p style="margin: 0 0 4px; font-weight: 600; color: #1e293b;">${a.institucion_nombre} — ${a.tipo_prestacion}</p>
        <p style="margin: 0 0 4px; color: ${color}; font-weight: 500;">${texto}</p>
        <p style="margin: 0; color: #64748b; font-size: 14px;">Fecha límite: ${a.fecha_limite.split('-').reverse().join('/')}</p>
      </div>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
      <div style="background: #2563eb; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px;">
        <h1 style="color: white; margin: 0; font-size: 22px;">Medfin</h1>
        <p style="color: #93c5fd; margin: 4px 0 0; font-size: 14px;">Resumen de alertas</p>
      </div>

      <p style="font-size: 16px;">Hola, ${primerNombre}.</p>
      <p style="color: #475569;">Tienes <strong>${alertas.length} alerta${alertas.length > 1 ? 's' : ''}</strong> que requieren tu atención:</p>

      ${alertasHTML}

      <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'https://medfin.cl'}/prestaciones"
         style="display: block; background: #2563eb; color: white; text-align: center; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: 600; margin-top: 24px;">
        Ver en Medfin
      </a>

      <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; text-align: center;">
        Medfin · Finanzas para profesionales de salud
      </p>
    </body>
    </html>
  `
}
