'use client'

import { useState } from 'react'

export default function AutoReplyToggle({
  initialEnabled,
  variant = 'default',
}: {
  initialEnabled: boolean
  variant?: 'default' | 'hero'
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const res = await fetch('/api/dashboard/toggle-auto-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !enabled }),
    })
    if (res.ok) setEnabled(!enabled)
    setLoading(false)
  }

  if (variant === 'hero') {
    return (
      <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2.5 border border-white/20">
        <div className="flex flex-col">
          <span className="text-xs text-white/60 font-medium">Auto-Reply</span>
          <span className={`text-sm font-bold ${enabled ? 'text-green-300' : 'text-white/50'}`}>
            {enabled ? 'Active' : 'Paused'}
          </span>
        </div>
        <button
          onClick={toggle}
          disabled={loading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60
            ${enabled ? 'bg-green-400' : 'bg-white/20'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
            ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className={`text-sm font-medium ${enabled ? 'text-green-700' : 'text-gray-500'}`}>
        Auto-Reply {enabled ? 'ON' : 'OFF'}
      </span>
      <button
        onClick={toggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-60
          ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
          ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
