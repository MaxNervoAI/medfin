// Mock authentication for local JSON DB development
// Returns a fixed local user without requiring Google OAuth

export const MOCK_USER = {
  id: 'local-user-id',
  email: 'local@medfin.dev',
  user_metadata: {
    name: 'Dr. Local Development'
  }
}

export function getMockUser() {
  return MOCK_USER
}

export async function getMockSession() {
  return {
    data: {
      user: MOCK_USER,
      session: {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: MOCK_USER
      }
    },
    error: null
  }
}
