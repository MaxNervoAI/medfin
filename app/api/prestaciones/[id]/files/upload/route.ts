import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createStorageClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if using JSON DB mode - just mock the upload
    if (process.env.NEXT_PUBLIC_USE_JSON_DB === 'true') {
      const formData = await req.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
      }

      // Mock success - pretend the file was uploaded
      return NextResponse.json({ success: true, filename: file.name, mock: true })
    }

    const supabase = await createClient()
    const storageClient = createStorageClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'El archivo excede el tamaño máximo de 10MB' }, { status: 400 })
    }

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'text/markdown',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
    }

    // Generate storage path: {user_id}/{prestacion_id}/{filename}
    const fileExt = file.name.split('.').pop() || ''
    const fileName = `${randomUUID()}.${fileExt}`
    const storagePath = `${user.id}/${params.id}/${fileName}`

    // Upload file to Supabase Storage
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { data: uploadData, error: uploadError } = await storageClient.storage
      .from('prestaciones-files')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Error al subir archivo a Supabase Storage' }, { status: 500 })
    }

    // Save file metadata to database
    const { data: fileData, error: insertError } = await supabase
      .from('prestaciones_files')
      .insert({
        prestacion_id: params.id,
        user_id: user.id,
        filename: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: storagePath,
      })
      .select()
      .single()

    if (insertError) {
      // Cleanup file from Supabase Storage if database insert fails
      await storageClient.storage.from('prestaciones-files').remove([storagePath]).catch(() => {})
      return NextResponse.json({ error: 'Error al guardar metadatos' }, { status: 500 })
    }

    return NextResponse.json({ success: true, filename: file.name, file: fileData })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}
