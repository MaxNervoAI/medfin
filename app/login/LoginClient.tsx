'use client'

import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { Wordmark } from '@/components/brand/Wordmark'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginClient() {
  async function signInWithGoogle() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast.error('No se pudo iniciar sesión. Intenta de nuevo.')
    }
  }

  const features = [
    'Registra prestaciones en segundos',
    'Control de boletas y plazos automáticos',
    'Proyección de ingresos por mes',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-background flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-8 flex flex-col gap-7">
            <div className="flex flex-col items-center text-center gap-2">
              <Wordmark size="lg" />
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px] mt-1">
                Tu plataforma de cobranzas médicas.<br />Simple y transparente.
              </p>
            </div>

            <Separator />

            <ul className="flex flex-col gap-2.5">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="size-4 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              variant="outline"
              onClick={signInWithGoogle}
              className="w-full gap-3 border-border/80 font-medium"
            >
              <Image src="/google.svg" alt="Google" width={18} height={18} />
              Continuar con Google
            </Button>

            <p className="text-center text-xs text-muted-foreground leading-relaxed">
              Al continuar aceptas los{' '}
              <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">Términos</span>
              {' '}y{' '}
              <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">Privacidad</span>.
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60">
          medfin · hecho para médicos chilenos
        </p>
      </div>
    </div>
  )
}
