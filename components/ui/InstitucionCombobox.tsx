'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Institucion, InstitucionDirectorio } from '@/types'
import { cn } from '@/lib/utils'
import { Search, Plus, ShieldCheck, Users, Building2, Loader2 } from 'lucide-react'

const TIPO_LABELS: Record<string, string> = {
  hospital_publico: 'Hospital público',
  clinica_privada:  'Clínica privada',
  centro_medico:    'Centro médico',
  red_medica:       'Red médica',
  otro:             'Otro',
}

export interface InstitucionComboboxProps {
  value: string | null
  onChange: (institucion: Pick<Institucion, 'id' | 'nombre' | 'directorio_id'>) => void
  userInstituciones: Pick<Institucion, 'id' | 'nombre' | 'directorio_id'>[]
  disabled?: boolean
  placeholder?: string
}

export default function InstitucionCombobox({
  value,
  onChange,
  userInstituciones,
  disabled,
  placeholder = 'Buscar clínica u hospital...',
}: InstitucionComboboxProps) {
  const supabase = createClient()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<InstitucionDirectorio[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedNombre = value
    ? userInstituciones.find(i => i.id === value)?.nombre ?? ''
    : ''

  const search = useCallback(
    async (term: string) => {
      if (!term.trim()) { setResults([]); return }
      setLoading(true)
      const { data, error } = await supabase
        .from('instituciones_directorio')
        .select('*')
        .ilike('nombre', `%${term}%`)
        .order('verificada', { ascending: false })
        .order('nombre')
        .limit(12)
      if (!error) setResults(data ?? [])
      setLoading(false)
    },
    [supabase]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSelectDirectorio(entry: InstitucionDirectorio) {
    setSaving(true)
    try {
      // Check if user already has this institution
      const existing = userInstituciones.find(i => i.directorio_id === entry.id)
      if (existing) {
        onChange(existing)
        setOpen(false)
        setQuery('')
        return
      }

      // Insert into user's instituciones
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('instituciones')
        .insert({
          user_id: user.id,
          nombre: entry.nombre,
          rut: entry.rut ?? null,
          activa: true,
          directorio_id: entry.id,
        })
        .select('id, nombre, directorio_id')
        .single()

      if (error || !data) {
        console.error('Error adding institution:', error)
        return
      }
      onChange(data)
    } finally {
      setSaving(false)
      setOpen(false)
      setQuery('')
    }
  }

  async function handleAddNew() {
    const nombre = query.trim()
    if (!nombre) return
    setSaving(true)
    try {
      // Insert into shared directory as community suggestion
      const { data: dirEntry, error: dirError } = await supabase
        .from('instituciones_directorio')
        .insert({ nombre, verificada: false })
        .select()
        .single()

      if (dirError || !dirEntry) {
        console.error('Error adding to directorio:', dirError)
        return
      }

      // Insert into user's instituciones
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('instituciones')
        .insert({
          user_id: user.id,
          nombre,
          activa: true,
          directorio_id: dirEntry.id,
        })
        .select('id, nombre, directorio_id')
        .single()

      if (error || !data) {
        console.error('Error adding institution:', error)
        return
      }
      onChange(data)
    } finally {
      setSaving(false)
      setOpen(false)
      setQuery('')
    }
  }

  const verified = results.filter(r => r.verificada)
  const community = results.filter(r => !r.verificada)
  const showAddNew = query.trim().length > 0 && !saving

  return (
    <div ref={containerRef} className="relative">
      {/* Input */}
      <div className={cn(
        'flex items-center gap-2 px-3 h-10 rounded-md border border-input bg-background text-sm ring-offset-background',
        'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed'
      )}>
        {saving
          ? <Loader2 className="size-4 text-muted-foreground animate-spin shrink-0" />
          : <Search className="size-4 text-muted-foreground shrink-0" />
        }
        <input
          ref={inputRef}
          type="text"
          value={open ? query : selectedNombre}
          placeholder={placeholder}
          disabled={disabled || saving}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
          onFocus={() => {
            setQuery(selectedNombre)
            if (selectedNombre.trim()) setOpen(true)
          }}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
          }}
          autoComplete="off"
        />
        {loading && <Loader2 className="size-3.5 text-muted-foreground animate-spin shrink-0" />}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {/* Verified group */}
            {verified.length > 0 && (
              <>
                <div className="px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40">
                  <ShieldCheck className="size-3" /> Verificadas
                </div>
                {verified.map(entry => (
                  <DirectorioRow key={entry.id} entry={entry} onSelect={handleSelectDirectorio} />
                ))}
              </>
            )}

            {/* Community group */}
            {community.length > 0 && (
              <>
                <div className="px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/40">
                  <Users className="size-3" /> Sugeridas por la comunidad
                </div>
                {community.map(entry => (
                  <DirectorioRow key={entry.id} entry={entry} onSelect={handleSelectDirectorio} />
                ))}
              </>
            )}

            {/* Empty search state */}
            {!loading && query.trim() && results.length === 0 && (
              <div className="px-3 py-3 text-sm text-muted-foreground flex items-center gap-2">
                <Building2 className="size-4 shrink-0" />
                No se encontraron resultados para &ldquo;{query.trim()}&rdquo;
              </div>
            )}

            {/* Empty query state */}
            {!query.trim() && (
              <div className="px-3 py-3 text-sm text-muted-foreground">
                Escribe el nombre de la clínica u hospital
              </div>
            )}

            {/* Add new option */}
            {showAddNew && (
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-primary font-medium border-t border-border hover:bg-primary/5 transition-colors"
              >
                <Plus className="size-4 shrink-0" />
                Agregar &ldquo;{query.trim()}&rdquo;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function DirectorioRow({
  entry,
  onSelect,
}: {
  entry: InstitucionDirectorio
  onSelect: (e: InstitucionDirectorio) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(entry)}
      className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
    >
      <Building2 className="size-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{entry.nombre}</p>
        {(entry.ciudad || entry.tipo) && (
          <p className="text-xs text-muted-foreground truncate">
            {[entry.ciudad, TIPO_LABELS[entry.tipo]].filter(Boolean).join(' · ')}
          </p>
        )}
      </div>
    </button>
  )
}
