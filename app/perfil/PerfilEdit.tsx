'use client'

import { useState, useEffect } from 'react'
import FotoUpload from './FotoUpload'
import EspecialidadSelector from './EspecialidadSelector'

interface PerfilEditProps {
  profile: any
  especialidades: any[]
  onSave: (profile: any, especialidades: any[]) => void
  onCancel: () => void
}

export default function PerfilEdit({ profile, especialidades, onSave, onCancel }: PerfilEditProps) {
  const [formData, setFormData] = useState({
    nombre: profile?.nombre || '',
    telefono: profile?.telefono || '',
    email_contacto: profile?.email_contacto || '',
    numero_licencia: profile?.numero_licencia || '',
    bio: profile?.bio || '',
    linkedin_url: profile?.linkedin_url || '',
    instagram_url: profile?.instagram_url || '',
    twitter_url: profile?.twitter_url || ''
  })
  const [selectedEspecialidades, setSelectedEspecialidades] = useState(especialidades)
  const [fotoUrl, setFotoUrl] = useState(profile?.foto_url || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ ...formData, foto_url: fotoUrl }, selectedEspecialidades)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          Guardar Cambios
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Photo and Basic Info */}
        <div className="space-y-6">
          <FotoUpload currentFoto={fotoUrl} onFotoChange={setFotoUrl} />
          
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Número de Licencia</label>
            <input
              type="text"
              name="numero_licencia"
              value={formData.numero_licencia}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
            />
          </div>
        </div>

        {/* Right Column - Contact Info, Bio, Social */}
        <div className="md:col-span-2 space-y-6">
          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+56 9 XXXX XXXX"
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Email de Contacto</label>
              <input
                type="email"
                name="email_contacto"
                value={formData.email_contacto}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Biografía</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
            />
            <p className="text-sm text-muted-foreground mt-1">{formData.bio.length}/500 caracteres</p>
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Especialidades</label>
            <EspecialidadSelector
              selected={selectedEspecialidades}
              onChange={setSelectedEspecialidades}
            />
          </div>

          {/* Social Links */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">LinkedIn</label>
              <input
                type="url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Instagram</label>
              <input
                type="url"
                name="instagram_url"
                value={formData.instagram_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Twitter</label>
              <input
                type="url"
                name="twitter_url"
                value={formData.twitter_url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
