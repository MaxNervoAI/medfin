import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createStorageClient } from '@supabase/supabase-js'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    // Check if using JSON DB mode - just return a mock response
    if (process.env.NEXT_PUBLIC_USE_JSON_DB === 'true') {
      return NextResponse.json({ error: 'Descarga no disponible en modo JSON DB (demo)' }, { status: 501 })
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

    // Fetch file metadata
    const { data: fileData, error } = await supabase
      .from('prestaciones_files')
      .select('*')
      .eq('id', params.fileId)
      .eq('prestacion_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !fileData) {
      return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })
    }

    // Download file from Supabase Storage
    const { data: fileDataBlob, error: downloadError } = await storageClient.storage
      .from('prestaciones-files')
      .download(fileData.storage_path)

    if (downloadError || !fileDataBlob) {
      console.error('Supabase Storage download error:', downloadError)
      return NextResponse.json({ error: 'Error al descargar archivo' }, { status: 500 })
    }

    // Convert blob to buffer
    const arrayBuffer = await fileDataBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Return file with proper headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': fileData.file_type,
        'Content-Disposition': `attachment; filename="${fileData.filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ error: 'Error al descargar archivo' }, { status: 500 })
  }
}
