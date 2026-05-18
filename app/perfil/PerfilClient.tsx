'use client'

import { useState } from 'react'
import PerfilView from './PerfilView'
import PerfilEdit from './PerfilEdit'

interface PerfilClientProps {
  profile: any
  especialidades: any[]
}

export default function PerfilClient({ profile, especialidades }: PerfilClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(profile)
  const [currentEspecialidades, setCurrentEspecialidades] = useState(especialidades)

  const handleSave = async (updatedProfile: any, updatedEspecialidades: any[]) => {
    try {
      const response = await fetch('/api/perfil', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updatedProfile,
          especialidades: updatedEspecialidades
        })
      })

      if (response.ok) {
        setCurrentProfile(updatedProfile)
        setCurrentEspecialidades(updatedEspecialidades)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Mi Perfil</h1>
        
        {isEditing ? (
          <PerfilEdit
            profile={currentProfile}
            especialidades={currentEspecialidades}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <PerfilView
            profile={currentProfile}
            especialidades={currentEspecialidades}
            onEdit={() => setIsEditing(true)}
          />
        )}
      </div>
    </div>
  )
}
