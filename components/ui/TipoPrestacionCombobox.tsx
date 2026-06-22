'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Plus, BookOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { searchPrestaciones } from '@/lib/prestaciones-catalog'

interface TipoPropio {
  id: string
  nombre: string
  es_turno: boolean
}

interface Props {
  value: string
  onChange: (value: string, esTurno?: boolean) => void
  placeholder?: string
  disabled?: boolean
}

export default function TipoPrestacionCombobox({
  value,
  onChange,
  placeholder = 'Buscar tipo de prestación…',
  disabled,
}: Props) {
  const supabase = createClient()
  const [query, setQuery] = useState(value)
  const [open, setOpen] = useState(false)
  const [propios, setPropios] = useState<TipoPropio[]>([])
  const [saving, setSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync query when value changes externally (e.g. institution change resets tipo)
  useEffect(() => { setQuery(value) }, [value])

  // Load user's own tipos once on mount
  useEffect(() => {
    supabase
      .from('tipos_prestacion')
      .select('id, nombre, es_turno')
      .order('nombre')
      .then((result: { data: TipoPropio[] | null }) => { if (result.data) setPropios(result.data) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const catalogGroups = searchPrestaciones(query)

  const propiosFiltrados = query.trim()
    ? propios.filter(t => t.nombre.toLowerCase().includes(query.toLowerCase()))
    : propios

  const allNombres = [
    ...catalogGroups.flatMap(g => g.items.map(i => i.nombre.toLowerCase())),
    ...propios.map(t => t.nombre.toLowerCase()),
  ]
  const exactMatch = allNombres.includes(query.toLowerCase().trim())
  const showAgregar = query.trim().length > 0 && !exactMatch

  function select(nombre: string, esTurno?: boolean) {
    setQuery(nombre)
    onChange(nombre, esTurno)
    setOpen(false)
  }

  async function agregarNuevo() {
    const nombre = query.trim()
    if (!nombre || saving) return
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { data, error } = await supabase
      .from('tipos_prestacion')
      .insert({ user_id: user.id, nombre, es_turno: false })
      .select('id, nombre, es_turno')
      .single()

    if (!error && data) {
      setPropios(prev =>
        [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre))
      )
      select(data.nombre, data.es_turno)
    } else {
      // Insert may fail on duplicate — just use the value anyway
      select(nombre)
    }
    setSaving(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
    onChange(e.target.value)
    setOpen(true)
  }

  const hasCatalog = catalogGroups.some(g => g.items.length > 0)
  const hasPropios = propiosFiltrados.length > 0

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => { if (query.trim()) setOpen(true) }}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'w-full pl-9 pr-3 py-2 text-sm rounded-md border border-input bg-background',
            'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:opacity-50 disabled:cursor-not-allowed h-10'
          )}
          autoComplete="off"
        />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-80 overflow-y-auto rounded-md border border-border bg-popover shadow-md">

          {/* User's own tipos */}
          {hasPropios && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 sticky top-0 bg-popover border-b border-border/40">
                <User className="size-3" /> Mis tipos
              </p>
              {propiosFiltrados.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                  onMouseDown={e => { e.preventDefault(); select(t.nombre, t.es_turno) }}
                >
                  <span>{t.nombre}</span>
                  {t.es_turno && (
                    <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 ml-2 shrink-0">turno</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Catalog groups */}
          {hasCatalog && (
            <div>
              {(hasPropios) && (
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1 sticky top-0 bg-popover border-b border-border/40">
                  <BookOpen className="size-3" /> Catálogo
                </p>
              )}
              {catalogGroups.map(group => (
                group.items.length > 0 && (
                  <div key={group.especialidad}>
                    <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide bg-popover">
                      {group.especialidad}
                    </p>
                    {group.items.map(item => (
                      <button
                        key={item.nombre}
                        type="button"
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                        onMouseDown={e => { e.preventDefault(); select(item.nombre, item.esTurno) }}
                      >
                        <span>{item.nombre}</span>
                        {item.esTurno && (
                          <span className="text-[10px] bg-muted text-muted-foreground rounded px-1.5 py-0.5 ml-2 shrink-0">turno</span>
                        )}
                      </button>
                    ))}
                  </div>
                )
              ))}
            </div>
          )}

          {!hasCatalog && !hasPropios && !showAgregar && (
            <p className="px-3 py-4 text-sm text-muted-foreground text-center">Sin resultados</p>
          )}

          {/* Agregar nuevo */}
          {showAgregar && (
            <div className="border-t border-border/60 sticky bottom-0 bg-popover">
              <button
                type="button"
                disabled={saving}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-left hover:bg-accent hover:text-accent-foreground transition-colors"
                onMouseDown={e => { e.preventDefault(); agregarNuevo() }}
              >
                <Plus className="size-3.5 shrink-0 text-primary" />
                <span className="text-muted-foreground">
                  {saving ? 'Agregando…' : <>Agregar <strong className="text-foreground">&ldquo;{query.trim()}&rdquo;</strong></>}
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
