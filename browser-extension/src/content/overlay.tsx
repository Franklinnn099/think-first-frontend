import React, { useState } from 'react'
import type { Product } from '../types/product'

interface OverlayProps {
  product: Product
  onSave: (product: Product) => Promise<void>
}

export function SaveOverlay({ product, onSave }: OverlayProps) {
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (saved || saving) return
    setSaving(true)
    try {
      await onSave(product)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 2147483647,
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <button
        onClick={handleSave}
        disabled={saving || saved}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 16px',
          backgroundColor: saved ? '#047857' : '#059669',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: saved ? 'default' : 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '0.01em',
          boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
          transition: 'background-color 0.15s ease, transform 0.1s ease',
          opacity: saving ? 0.75 : 1,
          transform: saving ? 'scale(0.97)' : 'scale(1)',
        }}
      >
        <span style={{ fontSize: '16px' }}>{saved ? '✓' : '+'}</span>
        {saved ? 'Saved to ClearCart' : saving ? 'Saving…' : 'Save to ClearCart'}
      </button>
    </div>
  )
}
