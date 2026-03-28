export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image?: string
  url: string
  store: string
  currency: string
  detectedAt: number
}
