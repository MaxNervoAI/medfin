'use server'

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
    const data = JSON.parse(content)
    
    // Normalize prestaciones data - calculate missing values
    if (filename === 'prestaciones.json') {
      return data.map((item: any) => {
        if (item.monto_bruto && item.retencion_pct) {
          const retencionPct = item.retencion_pct || 0
          if (isNaN(item.monto_retencion) || item.monto_retencion === null) {
            item.monto_retencion = Math.round(item.monto_bruto * retencionPct / 100)
          }
          if (isNaN(item.monto_neto) || item.monto_neto === null) {
            item.monto_neto = Math.round(item.monto_bruto * (1 - retencionPct / 100))
          }
        }
        return item
      })
    }
    
    return data
  } catch {
    return []
  }
}

async function writeJsonFile<T>(filename: string, data: T[]): Promise<void> {
  await ensureDir()
  const filepath = path.join(DATA_DIR, filename)
  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8')
}

// Query result that can be awaited or chained
class QueryResult {
  private filename: string
  private userId: string
  private filters: Array<{ column: string; op: string; value: any }>
  private orderColumn: string
  private orderAscending: boolean
  private limitCount: number | null

  constructor(
    filename: string,
    userId: string,
    filters: Array<{ column: string; op: string; value: any }> = [],
    orderColumn = 'created_at',
    orderAscending = true,
    limitCount: number | null = null
  ) {
    this.filename = filename
    this.userId = userId
    this.filters = [...filters]
    this.orderColumn = orderColumn
    this.orderAscending = orderAscending
    this.limitCount = limitCount
  }

  eq(column: string, value: any) {
    const newFilters = [...this.filters, { column, op: 'eq', value }]
    return new QueryResult(this.filename, this.userId, newFilters, this.orderColumn, this.orderAscending, this.limitCount)
  }

  neq(column: string, value: any) {
    const newFilters = [...this.filters, { column, op: 'neq', value }]
    return new QueryResult(this.filename, this.userId, newFilters, this.orderColumn, this.orderAscending, this.limitCount)
  }

  gte(column: string, value: any) {
    const newFilters = [...this.filters, { column, op: 'gte', value }]
    return new QueryResult(this.filename, this.userId, newFilters, this.orderColumn, this.orderAscending, this.limitCount)
  }

  not(column: string, op: string, value: any) {
    const newFilters = [...this.filters, { column, op: 'not', value }]
    return new QueryResult(this.filename, this.userId, newFilters, this.orderColumn, this.orderAscending, this.limitCount)
  }

  or(query: string) {
    const newFilters = [...this.filters, { column: 'or', op: 'or', value: query }]
    return new QueryResult(this.filename, this.userId, newFilters, this.orderColumn, this.orderAscending, this.limitCount)
  }

  order(column: string, opts?: { ascending?: boolean }) {
    return new QueryResult(
      this.filename,
      this.userId,
      this.filters,
      column,
      opts?.ascending ?? true,
      this.limitCount
    )
  }

  limit(n: number) {
    return new QueryResult(this.filename, this.userId, this.filters, this.orderColumn, this.orderAscending, n)
  }

  async single() {
    const result = await this.execute()
    return { data: result[0] || null, error: null }
  }

  private async execute(): Promise<any[]> {
    const data = await readJsonFile<any>(this.filename)
    let result = data.filter((item: any) => item.user_id === this.userId)

    // Apply filters
    for (const f of this.filters) {
      if (f.op === 'eq') result = result.filter((item: any) => item[f.column] === f.value)
      if (f.op === 'neq') result = result.filter((item: any) => item[f.column] !== f.value)
      if (f.op === 'gte') result = result.filter((item: any) => item[f.column] >= f.value)
      if (f.op === 'not') result = result.filter((item: any) => item[f.column] !== null)
    }

    // Sort
    result.sort((a: any, b: any) => {
      return this.orderAscending
        ? (a[this.orderColumn] > b[this.orderColumn] ? 1 : -1)
        : (a[this.orderColumn] < b[this.orderColumn] ? 1 : -1)
    })

    // Apply limit
    if (this.limitCount) {
      result = result.slice(0, this.limitCount)
    }

    return result
  }

  // Make awaitable - returns { data, error }
  async toPromise() {
    const result = await this.execute()
    return { data: result, error: null }
  }

  // Implement Thenable interface so QueryResult can be awaited
  then<TResult1 = { data: any[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: any[]; error: null }) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.toPromise().then(onfulfilled, onrejected)
  }
}

// Create initial query builder
function createQueryBuilder(filename: string, userId: string) {
  return new QueryResult(filename, userId)
}

export async function createJsonDbClient() {
  const userId = MOCK_USER_ID

  return {
    from: (table: string) => {
      const filename = `${table}.json`

      return {
        select: () => createQueryBuilder(filename, userId),
        insert: (data: any) => ({
          select: () => ({
            single: async () => {
              const items = await readJsonFile<any>(filename)
              const newItem = {
                id: randomUUID(),
                user_id: userId,
                created_at: new Date().toISOString(),
                ...data
              }
              items.push(newItem)
              await writeJsonFile(filename, items)
              return { data: newItem, error: null }
            }
          })
        }),
        update: (updates: any) => ({
          eq: async (column: string, value: any) => {
            const items = await readJsonFile<any>(filename)
            const index = items.findIndex((item: any) => item[column] === value)
            if (index !== -1) {
              items[index] = { ...items[index], ...updates }
              await writeJsonFile(filename, items)
            }
            return { error: null }
          }
        }),
        upsert: (data: any, { onConflict }: { onConflict: string }) => ({
          select: () => ({
            single: async () => {
              const items = await readJsonFile<any>(filename)
              const conflictKeys = onConflict.split(',')
              const existingIndex = items.findIndex((item: any) =>
                conflictKeys.every((key: string) => item[key] === data[key])
              )

              if (existingIndex !== -1) {
                items[existingIndex] = { ...items[existingIndex], ...data }
                await writeJsonFile(filename, items)
                return { data: items[existingIndex], error: null }
              } else {
                const newItem = {
                  id: randomUUID(),
                  user_id: userId,
                  created_at: new Date().toISOString(),
                  ...data
                }
                items.push(newItem)
                await writeJsonFile(filename, items)
                return { data: newItem, error: null }
              }
            }
          })
        }),
        delete: () => ({
          eq: async (column: string, value: any) => {
            const items = await readJsonFile<any>(filename)
            const filtered = items.filter((item: any) => item[column] !== value)
            await writeJsonFile(filename, filtered)
            return { error: null }
          }
        })
      }
    },
    auth: {
      getUser: async () => ({ data: { user: { id: userId, email: 'local@medfin.dev' } }, error: null }),
      getSession: async () => ({
        data: {
          session: {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            user: { id: userId, email: 'local@medfin.dev' }
          },
          user: { id: userId, email: 'local@medfin.dev' }
        },
        error: null
      }),
      signOut: async () => ({ error: null }),
      signInWithOAuth: async () => ({ error: null }),
      exchangeCodeForSession: async () => ({ error: null }),
    }
  }
}
