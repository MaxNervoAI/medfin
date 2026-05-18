'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Search } from 'lucide-react'

interface EspecialidadSelectorProps {
  selected: any[]
  onChange: (especialidades: any[]) => void
}

export default function EspecialidadSelector({ selected, onChange }: EspecialidadSelectorProps) {
  const [allEspecialidades, setAllEspecialidades] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customEspecialidad, setCustomEspecialidad] = useState('')

  useEffect(() => {
    fetchEspecialidades()
  }, [])

  const fetchEspecialidades = async () => {
    try {
      const response = await fetch('/api/especialidades')
      const data = await response.json()
      setAllEspecialidades(data.especialidades || [])
    } catch (error) {
      console.error('Error fetching especialidades:', error)
    }
  }

  const filteredEspecialidades = allEspecialidades.filter(
    (esp) =>
      esp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !selected.some((s) => s.id === esp.id)
  )

  const handleSelect = (especialidad: any) => {
    if (selected.length >= 10) {
      alert('Máximo 10 especialidades permitidas')
      return
    }
    onChange([...selected, especialidad])
    setShowDropdown(false)
    setSearchTerm('')
  }

  const handleRemove = (especialidadId: string) => {
    onChange(selected.filter((s) => s.id !== especialidadId))
  }

  const handleAddCustom = () => {
    if (!customEspecialidad.trim()) return
    if (selected.length >= 10) {
      alert('Máximo 10 especialidades permitidas')
      return
    }
    
    const newEspecialidad = {
      id: `custom-${Date.now()}`,
      nombre: customEspecialidad,
      tipo: 'personalizada'
    }
    onChange([...selected, newEspecialidad])
    setCustomEspecialidad('')
    setShowCustomInput(false)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {selected.map((esp) => (
          <span
            key={esp.id}
            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-2"
          >
            {esp.nombre}
            <button
              type="button"
              onClick={() => handleRemove(esp.id)}
              className="hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </button>
          </span>
        ))}
        {selected.length < 10 && (
          <button
            type="button"
            onClick={() => setShowDropdown(true)}
            className="px-3 py-1 border border-primary text-primary rounded-full text-sm hover:bg-primary/10"
          >
            <Plus className="w-4 h-4 inline" /> Agregar
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="relative">
          <div className="absolute z-10 w-full bg-card border border-border rounded-lg shadow-lg p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                autoFocus
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredEspecialidades.length > 0 ? (
                filteredEspecialidades.map((esp) => (
                  <button
                    key={esp.id}
                    type="button"
                    onClick={() => handleSelect(esp)}
                    className="w-full text-left px-3 py-2 hover:bg-accent rounded text-foreground"
                  >
                    {esp.nombre}
                    <span className="text-xs text-muted-foreground ml-2">({esp.tipo})</span>
                  </button>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No se encontraron resultados</p>
              )}
            </div>

            <div className="border-t border-border pt-3">
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(true)
                  setShowDropdown(false)
                }}
                className="text-primary hover:text-primary/80 text-sm"
              >
                <Plus className="w-4 h-4 inline" /> Agregar especialidad personalizada
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowDropdown(false)}
              className="w-full py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showCustomInput && (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nombre de la especialidad personalizada"
            value={customEspecialidad}
            onChange={(e) => setCustomEspecialidad(e.target.value)}
            className="flex-1 px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            autoFocus
          />
          <button
            type="button"
            onClick={handleAddCustom}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Agregar
          </button>
          <button
            type="button"
            onClick={() => setShowCustomInput(false)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )
}
