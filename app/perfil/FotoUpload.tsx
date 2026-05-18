'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'

interface FotoUploadProps {
  currentFoto: string
  onFotoChange: (fotoUrl: string) => void
}

export default function FotoUpload({ currentFoto, onFotoChange }: FotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Tipo de archivo no válido. Usa JPEG, PNG o WebP.')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('El archivo es muy grande. Máximo 5MB.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/perfil/foto', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        onFotoChange(data.foto_url)
      } else {
        setError(data.error || 'Error al subir la foto')
      }
    } catch (err) {
      setError('Error al subir la foto')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    onFotoChange('')
  }

  return (
    <div>
      {currentFoto ? (
        <div className="relative">
          <img
            src={currentFoto}
            alt="Foto de perfil"
            className="w-32 h-32 rounded-full object-cover mx-auto"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-0 right-0 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-4">Sube tu foto de perfil</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="foto-upload"
          />
          <label
            htmlFor="foto-upload"
            className={`inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition cursor-pointer ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? 'Subiendo...' : 'Seleccionar Archivo'}
          </label>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}
