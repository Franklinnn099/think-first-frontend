// Centralized config — the backend URL MUST be set via VITE_API_BASE_URL in .env
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? ''

if (!API_BASE_URL) {
  console.error('[ThinkFirst] VITE_API_BASE_URL is not set in .env — detection will not work')
}
