import { isDevLoginEnabled } from '@/lib/auth/dev-login'

/**
 * NODE_ENV es de solo lectura en el tipado de Node, por eso se reasigna así.
 */
function setEnv(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) {
      delete (process.env as Record<string, string | undefined>)[key]
    } else {
      ;(process.env as Record<string, string | undefined>)[key] = value
    }
  }
}

const ENV_ORIGINAL = { ...process.env }

const DEV_COMPLETO = {
  NODE_ENV: 'development',
  DEV_LOGIN_ENABLED: 'true',
  DEV_LOGIN_EMAIL: 'dev@drwallet.local',
  DEV_LOGIN_PASSWORD: 'secreto',
  VERCEL: undefined,
}

afterEach(() => {
  process.env = { ...ENV_ORIGINAL }
})

describe('isDevLoginEnabled', () => {
  it('se activa solo cuando se cumplen todas las condiciones en desarrollo', () => {
    setEnv(DEV_COMPLETO)
    expect(isDevLoginEnabled()).toBe(true)
  })

  it('NUNCA se activa en producción, aunque todo lo demás esté configurado', () => {
    setEnv({ ...DEV_COMPLETO, NODE_ENV: 'production' })
    expect(isDevLoginEnabled()).toBe(false)
  })

  it('NUNCA se activa en test', () => {
    setEnv({ ...DEV_COMPLETO, NODE_ENV: 'test' })
    expect(isDevLoginEnabled()).toBe(false)
  })

  it('NUNCA se activa dentro de Vercel, aunque NODE_ENV sea development', () => {
    setEnv({ ...DEV_COMPLETO, VERCEL: '1' })
    expect(isDevLoginEnabled()).toBe(false)
  })

  it('está apagado por defecto: requiere opt-in explícito', () => {
    setEnv({ ...DEV_COMPLETO, DEV_LOGIN_ENABLED: undefined })
    expect(isDevLoginEnabled()).toBe(false)
  })

  it('no se activa si DEV_LOGIN_ENABLED no es exactamente "true"', () => {
    for (const valor of ['1', 'yes', 'TRUE', 'on', '']) {
      setEnv({ ...DEV_COMPLETO, DEV_LOGIN_ENABLED: valor })
      expect(isDevLoginEnabled()).toBe(false)
    }
  })

  it('no se activa sin credenciales de prueba', () => {
    setEnv({ ...DEV_COMPLETO, DEV_LOGIN_EMAIL: undefined })
    expect(isDevLoginEnabled()).toBe(false)

    setEnv({ ...DEV_COMPLETO, DEV_LOGIN_PASSWORD: undefined })
    expect(isDevLoginEnabled()).toBe(false)
  })
})
