export const dynamic = 'force-dynamic'

import LoginClient from './LoginClient'
import { isDevLoginEnabled } from '@/lib/auth/dev-login'

export default function LoginPage() {
  // Se evalúa en el servidor. En producción siempre es false, así que el botón
  // nunca se renderiza. (El marcado sí viaja en el bundle como código muerto;
  // la seguridad la da /api/dev-login, que responde 404 fuera de desarrollo.)
  return <LoginClient devLoginEnabled={isDevLoginEnabled()} />
}
