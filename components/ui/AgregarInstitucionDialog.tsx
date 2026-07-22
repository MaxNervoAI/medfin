'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Institucion, InstitucionDirectorioTipo } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const TIPOS_INSTITUCION: { value: InstitucionDirectorioTipo; label: string }[] = [
  { value: 'clinica_privada',  label: 'Clínica privada' },
  { value: 'hospital_publico', label: 'Hospital público' },
  { value: 'centro_medico',    label: 'Centro médico' },
  { value: 'red_medica',       label: 'Red médica' },
  { value: 'laboratorio',      label: 'Laboratorio clínico' },
  { value: 'centro_dialisis',  label: 'Centro de diálisis' },
  { value: 'otro',             label: 'Otro' },
]

const REGIONES = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío',
  'Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes',
]

export type InstitucionCreada = Pick<Institucion, 'id' | 'nombre' | 'directorio_id'>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Prellena el nombre — normalmente lo que el usuario ya escribió en el buscador. */
  nombreInicial?: string
  onCreated: (institucion: InstitucionCreada) => void
}

export default function AgregarInstitucionDialog({
  open,
  onOpenChange,
  nombreInicial = '',
  onCreated,
}: Props) {
  const supabase = createClient()

  const [nombre, setNombre] = useState(nombreInicial)
  const [tipo, setTipo] = useState<InstitucionDirectorioTipo>('clinica_privada')
  const [ciudad, setCiudad] = useState('')
  const [region, setRegion] = useState('')
  const [rut, setRut] = useState('')
  const [saving, setSaving] = useState(false)

  // Resetea el formulario cada vez que se abre
  useEffect(() => {
    if (open) {
      setNombre(nombreInicial)
      setTipo('clinica_privada')
      setCiudad('')
      setRegion('')
      setRut('')
      setSaving(false)
    }
  }, [open, nombreInicial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nombreLimpio = nombre.trim()
    if (!nombreLimpio) {
      toast.error('El nombre es obligatorio')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Tu sesión expiró. Vuelve a iniciar sesión.')
        return
      }

      // 1. Aporta la institución al directorio compartido (sin verificar)
      const { data: dirEntry, error: dirError } = await supabase
        .from('instituciones_directorio')
        .insert({
          nombre: nombreLimpio,
          tipo,
          ciudad: ciudad.trim() || null,
          region: region || null,
          rut: rut.trim() || null,
          // La política RLS exige autoría propia y sin verificar: el aporte
          // solo lo ve su autor hasta que se promueva al catálogo oficial.
          verificada: false,
          created_by: user.id,
        })
        .select()
        .single()

      if (dirError || !dirEntry) {
        console.error('Error al agregar al directorio:', dirError)
        // 23505 = violación del índice único (nombre + ciudad)
        const duplicada = dirError?.code === '23505'
        toast.error(
          duplicada ? 'Esa institución ya existe' : 'No se pudo guardar la institución',
          {
            description: duplicada
              ? 'Búscala por su nombre en el listado.'
              : dirError?.message ?? 'Inténtalo nuevamente.',
          }
        )
        return
      }

      // 2. La agrega a las instituciones del usuario
      const { data, error } = await supabase
        .from('instituciones')
        .insert({
          user_id: user.id,
          nombre: nombreLimpio,
          rut: rut.trim() || null,
          activa: true,
          directorio_id: dirEntry.id,
        })
        .select('id, nombre, directorio_id')
        .single()

      if (error || !data) {
        console.error('Error al agregar institución:', error)
        toast.error('No se pudo agregar a tus lugares de trabajo', {
          description: error?.message ?? 'Inténtalo nuevamente.',
        })
        return
      }

      toast.success(`${data.nombre} agregada`)
      onCreated(data)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar institución</DialogTitle>
          <DialogDescription>
            Agrégala a tus lugares de trabajo. Solo el nombre es obligatorio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inst-nombre">Nombre *</Label>
            <Input
              id="inst-nombre"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Clínica Los Andes"
              autoFocus
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inst-tipo">Tipo</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as InstitucionDirectorioTipo)}>
              <SelectTrigger id="inst-tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_INSTITUCION.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inst-ciudad">Ciudad</Label>
              <Input
                id="inst-ciudad"
                value={ciudad}
                onChange={e => setCiudad(e.target.value)}
                placeholder="Ej: Providencia"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inst-region">Región</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger id="inst-region">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONES.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inst-rut">RUT (opcional)</Label>
            <Input
              id="inst-rut"
              value={rut}
              onChange={e => setRut(e.target.value)}
              placeholder="96.123.456-7"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Tu institución se sumará al directorio compartido para que otros profesionales
            puedan encontrarla.
          </p>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !nombre.trim()}>
              {saving && <Loader2 className="size-3.5 animate-spin" />}
              {saving ? 'Guardando…' : 'Agregar institución'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
