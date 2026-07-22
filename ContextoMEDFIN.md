# Medfin — Contexto del Proyecto

## Qué es
Plataforma web para médicos y profesionales de salud independientes en Chile que trabajan como prestadores (sin contrato fijo). Permite llevar el control de cobranzas, boletas y presupuesto mensual.

## Problema que resuelve
Los médicos independientes trabajan en múltiples instituciones, emiten boletas de honorarios al SII y tienen plazos distintos por institución. El desorden genera olvidos de boletas, pagos no cobrados y falta de claridad sobre ingresos mensuales.

## Nombre y stack
- **Nombre:** Medfin (la app se presenta como **Dr Wallet**)
- **Directorio:** `/Users/maxrojas/Documents/Projects/medfin`
- **Producción:** https://drwallet.cl (proyecto Vercel `drwallet`)
- **Stack:** Next.js 14 · TypeScript · Tailwind CSS · Supabase (auth + DB) · Resend (emails) · Vercel (deploy)
- **Puerto local:** 3001 (`npm run dev -- --port 3001`)

## Modelo de datos
- **Instituciones:** clínicas/hospitales donde trabaja el profesional
- **Reglas de plazo:** por institución + tipo de prestación → días para emitir boleta, días para recibir pago
- **Prestaciones:** registro de cada procedimiento, cirugía o turno con estado
- **Estados:** `realizada` → `boleta_emitida` → `pagada`
- **Retención honorarios:** dinámica, desde `tax_settings` (`getTaxRate()`); 14.5% por defecto
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
- **Project ref:** `wvtvqecuwxvjmezrkspi` (región sa-east-1)
- **Project URL:** https://wvtvqecuwxvjmezrkspi.supabase.co
- **Migraciones:** `/supabase/migrations/` (001 … 014). Se aplican en orden.
- **Auth:** Google OAuth + email/contraseña

### Directorio de instituciones
- `instituciones` → privadas de cada usuario (RLS `auth.uid() = user_id`)
- `instituciones_directorio` → catálogo compartido por todos
  - Los aportes sin verificar solo los ve su autor (`verificada or created_by = auth.uid()`)
  - Búsqueda vía RPC `buscar_directorio(termino, limite)`: ignora acentos y
    mayúsculas (columna generada `nombre_norm` + índice GIN trigram)
- Poblado desde el registro oficial DEIS/MINSAL (CC0) con
  `node --env-file=.env.local scripts/import-directorio.mjs [--apply]`

## Alertas por email
- Endpoint: `GET /api/alertas-email` con cabecera `Authorization: Bearer <CRON_SECRET>`
- Usa `createServiceRoleClient()`: un cron no tiene sesión, y con el cliente
  anónimo RLS devolvía cero perfiles
- Lógica en `/lib/utils.ts` → `generarAlertas()`
- Pendiente: configurar Resend con dominio propio + cron job en Vercel

## Desarrollo local
- Requiere `.env.local` (está en `.gitignore`). Ver `.env.example`.
- Acceso rápido opcional: `DEV_LOGIN_ENABLED=true` + `node scripts/create-dev-user.mjs`
  habilita el botón "Entrar como usuario de prueba" en `/login`. Solo funciona
  con `next dev`; en producción `/api/dev-login` responde 404.

## Pendientes MVP siguiente iteración
- [ ] Configurar Resend con dominio propio para emails
- [ ] Cron job diario en Vercel para alertas automáticas (falta `vercel.json`)
- [ ] Editar prestaciones (hoy solo se pueden eliminar)
- [ ] Número de boleta editable desde el detalle
- [ ] Filtro por mes en lista de cobranzas
- [ ] `inputMode="numeric"` en `NuevaPrestacionForm` (ya está en las otras pantallas)
