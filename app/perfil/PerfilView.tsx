'use client'

import { User, Mail, Phone, FileText, Link, Image as ImageIcon, Share2 } from 'lucide-react'

interface PerfilViewProps {
  profile: any
  especialidades: any[]
  onEdit: () => void
}

export default function PerfilView({ profile, especialidades, onEdit }: PerfilViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition"
        >
          Editar Perfil
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Card - Photo and Basic Info */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex flex-col items-center">
            {profile?.foto_url ? (
              <img
                src={profile.foto_url}
                alt="Foto de perfil"
                className="w-32 h-32 rounded-full object-cover mb-4"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-foreground">{profile?.nombre || 'Sin nombre'}</h2>
            
            {especialidades.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {especialidades.map((esp: any) => (
                  <span
                    key={esp.id}
                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {esp.nombre}
                  </span>
                ))}
              </div>
            )}

            {profile?.numero_licencia && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">Licencia</p>
                <p className="font-semibold text-foreground">{profile.numero_licencia}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Card - Contact Info and Bio */}
        <div className="md:col-span-2 bg-card rounded-lg shadow-sm border border-border p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">Información de Contacto</h3>
            <div className="space-y-3">
              {profile?.telefono && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{profile.telefono}</span>
                </div>
              )}
              {profile?.email_contacto && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{profile.email_contacto}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Biografía</h3>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          {/* Social Links */}
          {(profile?.linkedin_url || profile?.instagram_url || profile?.twitter_url) && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Redes Sociales</h3>
              <div className="flex gap-4">
                {profile?.linkedin_url && (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Link className="w-6 h-6" />
                  </a>
                )}
                {profile?.instagram_url && (
                  <a
                    href={profile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-600 hover:text-pink-800"
                  >
                    <ImageIcon className="w-6 h-6" />
                  </a>
                )}
                {profile?.twitter_url && (
                  <a
                    href={profile.twitter_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <Share2 className="w-6 h-6" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
