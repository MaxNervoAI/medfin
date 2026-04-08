# Medfin — Contexto del Proyecto

## Qué es
Plataforma web para médicos y profesionales de salud independientes en Chile que trabajan como prestadores (sin contrato fijo). Permite llevar el control de cobranzas, boletas y presupuesto mensual.

## Problema que resuelve
Los médicos independientes trabajan en múltiples instituciones, emiten boletas de honorarios al SII y tienen plazos distintos por institución. El desorden genera olvidos de boletas, pagos no cobrados y falta de claridad sobre ingresos mensuales.

## Nombre y stack
- **Nombre:** Medfin
- **Directorio:** `/Users/diegoruedar/medfin`
- **Stack:** Next.js 14 · TypeScript · Tailwind CSS · Supabase (auth + DB) · Resend (emails) · Vercel (deploy)
- **Puerto local:** 3001 (`npm run dev -- --port 3001`)

## Modelo de datos
- **Instituciones:** clínicas/hospitales donde trabaja el profesional
- **Reglas de plazo:** por institución + tipo de prestación → días para emitir boleta, días para recibir pago
- **Prestaciones:** registro de cada procedimiento, cirugía o turno con estado
- **Estados:** `realizada` → `boleta_emitida` → `pagada`
- **Retención honorarios:** 14.5%
- **Turnos:** monto = horas × valor/hora

## Pantallas
| Ruta | Descripción |
|---|---|
| `/login` | Login con Google OAuth |
| `/dashboard` | Alertas urgentes + resumen del mes |
| `/prestaciones` | Lista de cobranzas con filtros por estado |
| `/prestaciones/nueva` | Formulario de registro de prestación |
| `/instituciones` | Gestión de instituciones y reglas de plazo |
| `/presupuesto` | Proyección de ingresos por mes |

## Variables de entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY           ← pendiente
RESEND_FROM_EMAIL        ← pendiente
NEXT_PUBLIC_APP_URL=http://localhost:3001
CRON_SECRET
```

## Supabase
- **Project URL:** https://pfccwiizjbqekabkwuju.supabase.co
- **Migración:** `/supabase/migrations/001_schema_inicial.sql`
- **Auth:** Google OAuth habilitado

## Alertas por email
- Endpoint: `GET /api/alertas-email?secret=CRON_SECRET`
- Lógica en `/lib/utils.ts` → `generarAlertas()`
- Pendiente: configurar Resend con dominio propio + cron job en Vercel

## Pendientes MVP siguiente iteración
- [ ] Configurar Resend con dominio propio para emails
- [ ] Cron job diario en Vercel para alertas automáticas
- [ ] Deploy en Vercel
- [ ] Editar prestaciones (hoy solo se pueden eliminar)
- [ ] Número de boleta editable desde el detalle
- [ ] Filtro por mes en lista de cobranzas
