const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

async function getAuthHeaders(): Promise<Record<string, string>> {
  const result = await chrome.storage.local.get('clearcart_token')
  const token: string | undefined = result['clearcart_token']
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers as Record<string, string>),
    },
  })

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
