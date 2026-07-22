'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Search, Building2, MapPin } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface InstitucionPublica {
  id: string
  nombre: string
  ciudad: string | null
  region: string | null
  tipo: string
}

const TIPO_LABEL: Record<string, string> = {
  hospital_publico: 'Hospital público',
  clinica_privada: 'Clínica privada',
  centro_medico: 'Centro médico',
  red_medica: 'Red médica',
  laboratorio: 'Laboratorio',
  centro_dialisis: 'Centro de diálisis',
  otro: 'Otro',
}

export default function DirectorioClient({ total }: { total: number }) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<InstitucionPublica[]>([])
  const [buscando, setBuscando] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const q = query.trim()
    abortRef.current?.abort()

    if (q.length < 2) {
      setResultados([])
      setBuscado(false)
      setBuscando(false)
      return
    }

    const controller = new AbortController()
    abortRef.current = controller
    setBuscando(true)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/publico/directorio?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        })
        const json = await res.json()
        setResultados(json.instituciones ?? [])
        setBuscado(true)
      } catch {
        // Petición cancelada o red caída — no ensuciar la UI
      } finally {
        if (!controller.signal.aborted) setBuscando(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  return (
    <div className="mx-auto max-w-[720px] px-5 py-12 sm:py-16">
      {/* Encabezado */}
      <div className="mb-8 text-center">
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-primary">
          Registro oficial DEIS · MINSAL
        </p>
        <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-4xl">
          Directorio de instituciones de salud
        </h1>
        <p className="mx-auto mt-3 max-w-[480px] text-[15px] leading-relaxed text-muted-foreground">
          {total > 0
            ? `${total.toLocaleString('es-CL')} hospitales, clínicas y centros médicos vigentes en Chile.`
            : 'Hospitales, clínicas y centros médicos vigentes en Chile.'}{' '}
          Busca sin acentos, sin mayúsculas, sin registro.
        </p>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ej: clinica alemana, hospital salvador…"
          aria-label="Buscar institución de salud"
          autoComplete="off"
          className="h-14 pl-12 text-base"
        />
      </div>

      {/* Resultados */}
      <div className="mt-6 space-y-3" aria-live="polite">
        {buscando && (
          <p className="text-center text-sm text-muted-foreground">Buscando…</p>
        )}

        {!buscando && buscado && resultados.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No encontramos &ldquo;{query.trim()}&rdquo; en el catálogo verificado.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Dentro de la app puedes agregar cualquier institución manualmente.
              </p>
            </CardContent>
          </Card>
        )}

        {resultados.map(inst => (
          <Card key={inst.id} className="transition-shadow hover:shadow-sm">
            <CardContent className="flex items-start gap-3 py-4">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Building2 className="h-4.5 w-4.5 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">{inst.nombre}</p>
                {(inst.ciudad || inst.region) && (
                  <p className="mt-0.5 flex items-center gap-1 text-[13px] text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {[inst.ciudad, inst.region].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <Badge variant="secondary" className="shrink-0">
                {TIPO_LABEL[inst.tipo] ?? inst.tipo}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="mt-10 border-primary/25 bg-primary/5">
        <CardContent className="space-y-4 pt-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">¿Trabajas en alguna de estas instituciones?</strong>{' '}
            En Dr Wallet configuras los plazos reales de cada una — cuántos días tienes
            para emitir la boleta y cuándo te pagan — y la app te avisa antes de cada
            vencimiento.
          </p>
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center rounded-[10px] bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
          >
            Empezar gratis
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
