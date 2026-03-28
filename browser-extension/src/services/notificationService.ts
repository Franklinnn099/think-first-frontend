import { formatPrice } from '../utils/formatPrice'

export const notificationService = {
  priceDrop(productName: string, oldPrice: number, newPrice: number, currency = 'USD'): void {
    const drop = Math.round(((oldPrice - newPrice) / oldPrice) * 100)
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Price Drop Alert!',
      message: `${productName} dropped ${drop}% to ${formatPrice(newPrice, currency)}`,
      priority: 2,
    })
  },

  itemSaved(productName: string): void {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Saved to ClearCart',
      message: `${productName} has been added to your cart.`,
    })
  },
}
