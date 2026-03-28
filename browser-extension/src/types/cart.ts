import type { Product } from './product'

export interface CartItem {
  id: string
  product: Product
  addedAt: number
  priceAtAdd: number
  currentPrice: number
  /** Percentage drop from priceAtAdd to currentPrice */
  priceDrop?: number
}

export interface Cart {
  items: CartItem[]
  updatedAt: number
}
