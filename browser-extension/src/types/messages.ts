import type { Product } from './product'
import type { Cart } from './cart'
import type { User } from './user'

export type MessageRequest =
  | { type: 'GET_CART' }
  | { type: 'ADD_TO_CART'; payload: Product }
  | { type: 'REMOVE_FROM_CART'; payload: { id: string } }
  | { type: 'GET_USER' }
  | { type: 'LOGOUT' }
  | { type: 'PRODUCT_DETECTED'; payload: Product }
  | { type: 'CHECK_PRICES' }

export type MessageResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string }

export type CartResponse = MessageResponse<Cart>
export type UserResponse = MessageResponse<User | null>
