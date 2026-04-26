import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const DATA_DIR = path.join(process.cwd(), '.data')
const MOCK_USER_ID = 'local-user-id'

async function ensureDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch {}
}

async function readJsonFile<T>(filename: string): Promise<T[]> {
  await ensureDir()
  const filepath = path.join(DATA_DIR, filename)
  try {
    const content = await fs.readFile(filepath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return []
  }
}

async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDir()
  const filepath = path.join(DATA_DIR, filename)
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8')
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const table = params.path?.[0]
  if (!table) return NextResponse.json({ error: 'No table specified' }, { status: 400 })

  const searchParams = request.nextUrl.searchParams
  const column = searchParams.get('column')
  const value = searchParams.get('value')
  const neq = searchParams.get('neq') === 'true'
  const gte = searchParams.get('gte') === 'true'
  const all = searchParams.get('all') === 'true'
  const orderColumn = searchParams.get('order') || 'created_at'
  const ascending = searchParams.get('ascending') !== 'false'

  const data = await readJsonFile<any>(`${table}.json`)
  let filtered = data.filter((item: any) => item.user_id === MOCK_USER_ID)

  if (all) {
    // Return all user items
  } else if (column && value !== null) {
    if (neq) {
      filtered = filtered.filter((item: any) => item[column] !== value)
    } else if (gte) {
      filtered = filtered.filter((item: any) => item[column] >= value)
    } else {
      filtered = filtered.filter((item: any) => item[column] === value)
    }
  }

  // Sort
  filtered.sort((a: any, b: any) => {
    if (ascending) {
      return a[orderColumn] > b[orderColumn] ? 1 : -1
    } else {
      return a[orderColumn] < b[orderColumn] ? 1 : -1
    }
  })

  return NextResponse.json(filtered)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const table = params.path?.[0]
  if (!table) return NextResponse.json({ error: 'No table specified' }, { status: 400 })

  const searchParams = request.nextUrl.searchParams
  const upsert = searchParams.get('upsert') === 'true'
  const onConflict = searchParams.get('onConflict')

  const body = await request.json()
  const items = await readJsonFile<any>(`${table}.json`)

  if (upsert && onConflict) {
    const conflictKeys = onConflict.split(',')
    const existingIndex = items.findIndex((item: any) =>
      conflictKeys.every((key: string) => item[key] === body[key])
    )

    if (existingIndex !== -1) {
      items[existingIndex] = { ...items[existingIndex], ...body }
      await writeJsonFile(`${table}.json`, items)
      return NextResponse.json(items[existingIndex])
    }
  }

  const newItem = {
    id: randomUUID(),
    user_id: MOCK_USER_ID,
    created_at: new Date().toISOString(),
    ...body
  }
  items.push(newItem)
  await writeJsonFile(`${table}.json`, items)
  return NextResponse.json(newItem)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const table = params.path?.[0]
  if (!table) return NextResponse.json({ error: 'No table specified' }, { status: 400 })

  const searchParams = request.nextUrl.searchParams
  const column = searchParams.get('column')
  const value = searchParams.get('value')

  if (!column || value === null) {
    return NextResponse.json({ error: 'Missing column or value' }, { status: 400 })
  }

  const body = await request.json()
  const items = await readJsonFile<any>(`${table}.json`)
  const index = items.findIndex((item: any) => item[column] === value)

  if (index !== -1) {
    items[index] = { ...items[index], ...body }
    await writeJsonFile(`${table}.json`, items)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const table = params.path?.[0]
  if (!table) return NextResponse.json({ error: 'No table specified' }, { status: 400 })

  const searchParams = request.nextUrl.searchParams
  const column = searchParams.get('column')
  const value = searchParams.get('value')

  if (!column || value === null) {
    return NextResponse.json({ error: 'Missing column or value' }, { status: 400 })
  }

  const items = await readJsonFile<any>(`${table}.json`)
  const filtered = items.filter((item: any) => item[column] !== value)
  await writeJsonFile(`${table}.json`, filtered)

  return NextResponse.json({ success: true })
}
