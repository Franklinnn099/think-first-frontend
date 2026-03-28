import { apiClient } from '../background/apiClient'
import { storage } from '../utils/storage'
import type { Cart, CartItem } from '../types/cart'
import type { Product } from '../types/product'

export const cartService = {
  async getCart(): Promise<Cart> {
    try {
      const cart = await apiClient.get<Cart>('/cart')
      await storage.setCart(cart)
      return cart
    } catch {
      return storage.getCart()
    }
  },

  async addItem(product: Product): Promise<Cart> {
    const item: CartItem = {
      id: product.id,
      product,
      addedAt: Date.now(),
      priceAtAdd: product.price,
      currentPrice: product.price,
    }
    try {
      const cart = await apiClient.post<Cart>('/cart/items', item)
      await storage.setCart(cart)
      return cart
    } catch {
      const local = await storage.getCart()
      if (!local.items.some(i => i.id === item.id)) {
        local.items.push(item)
        local.updatedAt = Date.now()
        await storage.setCart(local)
      }
      return local
    }
  },

  async removeItem(id: string): Promise<Cart> {
    try {
      const cart = await apiClient.delete<Cart>(`/cart/items/${id}`)
      await storage.setCart(cart)
      return cart
    } catch {
      const local = await storage.getCart()
      local.items = local.items.filter(i => i.id !== id)
      local.updatedAt = Date.now()
      await storage.setCart(local)
      return local
    }
  },
}
