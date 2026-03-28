import type { Product } from '../types/product'

function extractStore(): string {
  return window.location.hostname.replace(/^www\./, '')
}

function extractPrice(text: string): number {
  // Handle formats like $1,299.99 or 1.299,99 (European)
  const normalized = text.replace(/[^\d.,]/g, '')
  // If both comma and dot present, the last one is the decimal separator
  const hasComma = normalized.includes(',')
  const hasDot = normalized.includes('.')
  let cleaned = normalized
  if (hasComma && hasDot) {
    // e.g. 1,299.99 → remove comma; or 1.299,99 → remove dot, swap comma
    const lastComma = normalized.lastIndexOf(',')
    const lastDot = normalized.lastIndexOf('.')
    cleaned =
      lastDot > lastComma
        ? normalized.replace(/,/g, '')
        : normalized.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    cleaned = normalized.replace(',', '.')
  }
  const price = parseFloat(cleaned)
  return isNaN(price) ? 0 : price
}

const NAME_SELECTORS = [
  '[data-testid="product-title"]',
  '#productTitle',
  '.product-title',
  '.product-name',
  'h1[itemprop="name"]',
  'h1',
]

const PRICE_SELECTORS = [
  '[data-testid="price"]',
  '[itemprop="price"]',
  '.a-price-whole',
  '[data-price]',
  '#price',
  '.price',
  '.product-price',
]

const IMAGE_SELECTORS = [
  '[data-testid="product-image"] img',
  '#landingImage',
  '[itemprop="image"]',
  '.product-image img',
  '.product-photo img',
]

function querySelector(selectors: string[]): Element | null {
  for (const selector of selectors) {
    const el = document.querySelector(selector)
    if (el) return el
  }
  return null
}

export function detectProduct(): Product | null {
  const nameEl = querySelector(NAME_SELECTORS)
  const priceEl = querySelector(PRICE_SELECTORS)

  if (!nameEl || !priceEl) return null

  const name = nameEl.textContent?.trim()
  const priceText = priceEl.getAttribute('data-price') ?? priceEl.textContent?.trim() ?? ''
  const price = extractPrice(priceText)
  const imageEl = querySelector(IMAGE_SELECTORS) as HTMLImageElement | null

  if (!name || price <= 0) return null

  return {
    id: btoa(encodeURIComponent(window.location.href)).slice(0, 32),
    name,
    price,
    image: imageEl?.src,
    url: window.location.href,
    store: extractStore(),
    currency: 'USD',
    detectedAt: Date.now(),
  }
}
