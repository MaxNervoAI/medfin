// Client-side JSON DB adapter using fetch API
// This runs in the browser and calls server API routes

const API_BASE = '/api/json-db'
const MOCK_USER_ID = 'local-user-id'

// Client-side database adapter that mimics Supabase's API
export function createJsonDbClient() {
  const userId = MOCK_USER_ID
  
  return {
    from: (table: string) => {
      return {
        select: () => {
          return {
            eq: (column: string, value: any) => {
              return {
                order: (orderColumn: string, { ascending }: { ascending: boolean }) => {
                  return {
                    single: async () => {
                      const res = await fetch(`${API_BASE}/${table}?column=${column}&value=${value}&order=${orderColumn}&ascending=${ascending}`)
                      const data = await res.json()
                      return { data: data[0] || null, error: null }
                    }
                  }
                }
              }
            },
            neq: (column2: string, value2: any) => {
              return {
                order: (orderColumn: string, { ascending }: { ascending: boolean }) => {
                  return {
                    single: async () => {
                      const res = await fetch(`${API_BASE}/${table}?neq=true&column=${column2}&value=${value2}&order=${orderColumn}&ascending=${ascending}`)
                      const data = await res.json()
                      return { data: data[0] || null, error: null }
                    }
                  }
                }
              }
            },
            gte: (column: string, value: any) => {
              return {
                order: (orderColumn: string, { ascending }: { ascending: boolean }) => {
                  return {
                    single: async () => {
                      const res = await fetch(`${API_BASE}/${table}?gte=true&column=${column}&value=${value}&order=${orderColumn}&ascending=${ascending}`)
                      const data = await res.json()
                      return { data: data[0] || null, error: null }
                    }
                  }
                }
              }
            },
            or: (query: string) => {
              return {
                order: (orderColumn: string, { ascending }: { ascending: boolean }) => {
                  return {
                    limit: (n: number) => {
                      return {
                        single: async () => {
                          const res = await fetch(`${API_BASE}/${table}?all=true&limit=${n}&order=${orderColumn}&ascending=${ascending}`)
                          const data = await res.json()
                          return { data: data[0] || null, error: null }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        insert: (data: any) => {
          return {
            select: () => {
              return {
                single: async () => {
                  const res = await fetch(`${API_BASE}/${table}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  })
                  const result = await res.json()
                  return { data: result, error: null }
                }
              }
            }
          }
        },
        update: (updates: any) => {
          return {
            eq: async (column: string, value: any) => {
              await fetch(`${API_BASE}/${table}?column=${column}&value=${value}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
              })
              return { error: null }
            }
          }
        },
        upsert: (data: any, { onConflict }: { onConflict: string }) => {
          return {
            select: () => {
              return {
                single: async () => {
                  const res = await fetch(`${API_BASE}/${table}?upsert=true&onConflict=${onConflict}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                  })
                  const result = await res.json()
                  return { data: result, error: null }
                }
              }
            }
          }
        },
        delete: () => {
          return {
            eq: async (column: string, value: any) => {
              await fetch(`${API_BASE}/${table}?column=${column}&value=${value}`, {
                method: 'DELETE'
              })
              return { error: null }
            }
          }
        }
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
