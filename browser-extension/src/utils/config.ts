// Centralized config — mockable in tests (import.meta.env isn't available in Jest)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://clearcart-ug-backend.onrender.com'
