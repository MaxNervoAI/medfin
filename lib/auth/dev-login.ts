/**
 * Acceso rápido para desarrollo local.
 *
 * NO es un bypass de autenticación: inicia una sesión real de Supabase con un
 * usuario dedicado de pruebas. Por eso RLS, las políticas y todas las rutas se
 * comportan exactamente igual que en producción — no hay caminos divergentes.
 *
 * Está protegido por tres condiciones independientes. En producción la primera
 * ya es imposible de cumplir: `next build` / `next start` y Vercel siempre
 * fijan NODE_ENV en 'production'.
 */
export function isDevLoginEnabled(): boolean {
  return (
    // 1. Solo con `next dev`. Nunca en un build de producción.
    process.env.NODE_ENV === 'development' &&
    // 2. Opt-in explícito en .env.local — no basta con estar en desarrollo.
    process.env.DEV_LOGIN_ENABLED === 'true' &&
    // 3. Nunca dentro de Vercel (VERCEL=1 en preview y production).
    !process.env.VERCEL &&
    // 4. Y solo si hay credenciales de prueba configuradas.
    Boolean(process.env.DEV_LOGIN_EMAIL) &&
    Boolean(process.env.DEV_LOGIN_PASSWORD)
  )
}
