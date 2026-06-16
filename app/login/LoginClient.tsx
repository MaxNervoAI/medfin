'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginClient() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleGoogleLogin() {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión con Google')
      setLoading(false)
    }
  }

  async function handleAuth() {
    if (!email || !password) {
      toast.error('Por favor completa todos los campos')
      return
    }

    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        toast.success('Cuenta creada. Por favor verifica tu email.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        window.location.href = '/dashboard'
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Background gradient */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/4 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center px-4 pt-24">
        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-30 w-full max-w-[400px] rounded-xl bg-card border border-border p-8 shadow-2xl"
        >
          {/* Corner dots */}
          <div className="absolute top-3 left-3 h-1.5 w-1.5 rounded-full bg-border" />
          <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-border" />
          <div className="absolute bottom-3 left-3 h-1.5 w-1.5 rounded-full bg-border" />
          <div className="absolute bottom-3 right-3 h-1.5 w-1.5 rounded-full bg-border" />

          {/* Logo */}
          <div className="mb-6 flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Dr Wallet"
              className="h-8 w-auto object-contain"
            />
          </div>

          <h3 className="mb-2 text-center text-lg font-semibold text-foreground">
            {isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}
          </h3>

          <p className="mb-6 text-center text-sm text-muted-foreground">
            Tu plataforma de cobranzas médicas
          </p>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Email
              </label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="h-9"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                Contraseña
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
                className="h-9"
              />
            </div>

            <Button
              onClick={handleAuth}
              disabled={loading}
              className="h-9 w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...'}
                </>
              ) : (
                isSignUp ? 'Crear cuenta' : 'Continuar'
              )}
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">o</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continuar con Google
            </button>

            {/* Microsoft - Non-functional */}
            <button
              disabled
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-border bg-background text-sm font-medium text-muted-foreground transition-colors opacity-50 cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 23 23" fill="none">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              Continuar con Microsoft (Próximamente)
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {isSignUp
              ? '¿Ya tienes cuenta? '
              : '¿No tienes cuenta? '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-semibold text-foreground hover:underline"
              disabled={loading}
            >
              {isSignUp ? 'Inicia sesión' : 'Regístrate'}
            </button>
          </p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-8 text-center text-sm text-muted-foreground"
        >
          Hecho para profesionales chilenos
        </motion.p>
      </div>
    </section>
  )
}
