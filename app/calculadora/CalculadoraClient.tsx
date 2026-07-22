'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Money } from '@/components/ui/Money'
import { formatMonto } from '@/lib/utils'

type Modo = 'bruto' | 'liquido'

function parseMonto(raw: string): number {
  const digits = raw.replace(/\D/g, '')
  return digits ? parseInt(digits, 10) : 0
}

function formatPct(rate: number): string {
  return (rate * 100).toLocaleString('es-CL', { maximumFractionDigits: 2 })
}

export default function CalculadoraClient({ taxRate }: { taxRate: number }) {
  const [modo, setModo] = useState<Modo>('bruto')
  const [montoStr, setMontoStr] = useState('')
  // Tasa editable: por defecto la vigente, pero se puede simular otra
  // (años anteriores, o la trayectoria al alza fijada por ley).
  const [tasaStr, setTasaStr] = useState(() => formatPct(taxRate))

  const tasaCustom = parseFloat(tasaStr.replace(',', '.'))
  const rate = Number.isFinite(tasaCustom) && tasaCustom > 0 && tasaCustom < 100
    ? tasaCustom / 100
    : taxRate
  const esTasaVigente = Math.abs(rate - taxRate) < 1e-9

  const monto = parseMonto(montoStr)
  const tasaPct = formatPct(rate)

  const { bruto, retencion, liquido } = useMemo(() => {
    if (modo === 'bruto') {
      const retencion = Math.round(monto * rate)
      return { bruto: monto, retencion, liquido: monto - retencion }
    }
    // Inverso: qué bruto debo boletear para recibir este líquido
    const bruto = Math.round(monto / (1 - rate))
    return { bruto, retencion: bruto - monto, liquido: monto }
  }, [modo, monto, rate])

  const handleChange = (value: string) => {
    const n = parseMonto(value)
    setMontoStr(n ? formatMonto(n).replace('$', '') : '')
  }

  return (
    <div className="mx-auto max-w-[720px] px-5 py-12 sm:py-16">
      {/* Encabezado */}
      <div className="mb-8 text-center">
        <p className="mb-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-primary">
          Herramienta gratuita
        </p>
        <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-4xl">
          Calculadora de boleta de honorarios
        </h1>
        <p className="mx-auto mt-3 max-w-[480px] text-[15px] leading-relaxed text-muted-foreground">
          Con la retención vigente del {formatPct(taxRate)}% — o prueba con otra tasa.
          Sin registro, sin letra chica.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <Tabs value={modo} onValueChange={v => setModo(v as Modo)}>
            <TabsList className="grid h-auto w-full grid-cols-2 p-1">
              <TabsTrigger value="bruto" className="min-h-[42px] whitespace-normal text-[13px] sm:text-sm">
                Sé el monto bruto
              </TabsTrigger>
              <TabsTrigger value="liquido" className="min-h-[42px] whitespace-normal text-[13px] sm:text-sm">
                Quiero recibir un líquido
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="monto">
              {modo === 'bruto' ? 'Monto bruto de la boleta' : 'Monto líquido que quieres recibir'}
            </Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                $
              </span>
              <Input
                id="monto"
                inputMode="numeric"
                pattern="[0-9.]*"
                autoComplete="off"
                placeholder="1.500.000"
                value={montoStr}
                onChange={e => handleChange(e.target.value)}
                className="h-14 pl-8 text-xl font-semibold tabular-nums"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="tasa" className="text-sm text-muted-foreground">
              Tasa de retención
            </Label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Input
                  id="tasa"
                  inputMode="decimal"
                  autoComplete="off"
                  value={tasaStr}
                  onChange={e => setTasaStr(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="h-10 w-24 pr-7 text-right font-semibold tabular-nums"
                  aria-label="Tasa de retención en porcentaje"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              {esTasaVigente ? (
                <span className="text-[12px] text-muted-foreground">vigente</span>
              ) : (
                <button
                  type="button"
                  onClick={() => setTasaStr(formatPct(taxRate))}
                  className="text-[12px] font-medium text-primary underline-offset-2 hover:underline"
                >
                  usar vigente ({formatPct(taxRate)}%)
                </button>
              )}
            </div>
          </div>

          <Separator />

          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="text-sm text-muted-foreground">Monto bruto</dt>
              <dd><Money value={bruto} size="lg" /></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-sm text-muted-foreground">
                Retención SII ({tasaPct}%)
              </dt>
              <dd className="text-destructive">
                &minus;<Money value={retencion} size="lg" className="text-destructive" />
              </dd>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <dt className="text-base font-medium text-foreground">Recibes líquido</dt>
              <dd><Money value={liquido} size="2xl" /></dd>
            </div>
          </dl>

          {modo === 'liquido' && monto > 0 && (
            <p className="rounded-lg bg-secondary px-4 py-3 text-sm leading-relaxed text-secondary-foreground">
              Para recibir <strong>{formatMonto(liquido)}</strong> líquidos, tu boleta debe ser por{' '}
              <strong>{formatMonto(bruto)}</strong> brutos.
            </p>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-center text-[13px] leading-relaxed text-muted-foreground">
        La retención es un pago provisorio de tu impuesto anual: se descuenta hoy y se
        ajusta en la Operación Renta de abril.
      </p>

      {/* CTA */}
      <Card className="mt-10 border-primary/25 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-xl font-normal">
            ¿Emites varias boletas al mes?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Dr Wallet registra cada prestación, calcula el líquido automáticamente y te
            avisa antes de que venza cada boleta — con los plazos reales de cada clínica
            u hospital donde trabajas.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center rounded-[10px] bg-primary px-5 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-px hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
            >
              Empezar gratis
            </Link>
            <Link
              href="/directorio"
              className="inline-flex min-h-[44px] items-center rounded-[10px] border border-border px-5 text-sm font-semibold text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            >
              Ver directorio de instituciones
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
