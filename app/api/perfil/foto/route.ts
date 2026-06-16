import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed types: JPEG, PNG, WebP' 
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size: 5MB' 
      }, { status: 400 })
    }

    // Derive extension from validated MIME type (never trust file.name)
    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    }
    const fileExt = mimeToExt[file.type]
    const fileName = `${randomUUID()}${fileExt}`
    const storagePath = path.join(process.cwd(), '.data', 'profile-photos', user.id, fileName)

    // Ensure directory exists
    await fs.mkdir(path.dirname(storagePath), { recursive: true })

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await fs.writeFile(storagePath, buffer)

    // Generate public URL (relative path for serving)
    const publicUrl = `/api/perfil/foto/${user.id}/${fileName}`

    // Update profile with new photo URL
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ foto_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      // If profile update fails, delete the uploaded file
      await fs.unlink(storagePath).catch(() => {})
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      foto_url: publicUrl 
    })
  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
