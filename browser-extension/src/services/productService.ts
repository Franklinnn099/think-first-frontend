import { apiClient } from '../background/apiClient'
import type { Product } from '../types/product'

export const productService = {
  async getProduct(id: string): Promise<Product | null> {
    try {
      return await apiClient.get<Product>(`/products/${id}`)
    } catch {
      return null
    }
  },

  async checkPrice(productUrl: string): Promise<number | null> {
    try {
      const result = await apiClient.post<{ price: number }>('/products/check-price', {
        url: productUrl,
      })
      return result.price
    } catch {
      return null
    }
  },
}
