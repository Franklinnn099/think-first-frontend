import { API_BASE_URL } from '../utils/config'

const BASE_URL = API_BASE_URL

async function getAuthHeaders(): Promise<Record<string, string>> {
  const result = await chrome.storage.local.get('clearcart_token')
  const token: string | undefined = result['clearcart_token']
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured in .env')
  }
  const authHeaders = await getAuthHeaders()
  const url = `${BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers as Record<string, string>),
    },
  })

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText} (${url})`)
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
