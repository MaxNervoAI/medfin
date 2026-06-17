import { createClient } from '@/lib/supabase/server'
import { createClient as createStorageClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Allowed types: JPEG, PNG, WebP'
      }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'File too large. Maximum size: 5MB'
      }, { status: 400 })
    }

    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
    }
    const fileExt = mimeToExt[file.type]
    const fileName = `${randomUUID()}${fileExt}`
    const storagePath = `${user.id}/${fileName}`

    const storageClient = createStorageClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await storageClient.storage
      .from('profile-photos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Error uploading photo' }, { status: 500 })
    }

    const { data: { publicUrl } } = storageClient.storage
      .from('profile-photos')
      .getPublicUrl(storagePath)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ foto_url: publicUrl })
      .eq('id', user.id)

    if (updateError) {
      await storageClient.storage.from('profile-photos').remove([storagePath]).catch(() => {})
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
