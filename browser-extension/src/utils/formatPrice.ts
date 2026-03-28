export function formatPrice(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function calcPriceDrop(original: number, current: number): number {
  if (original <= 0 || current >= original) return 0
  return Math.round(((original - current) / original) * 100)
}
