'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Send, CheckCircle2, XCircle, Loader2, Search, Users, Radio } from 'lucide-react'

type Sender = {
  senderId: string
  name: string
  username?: string
  profilePic?: string
}

type Result = {
  senderId: string
  success: boolean
  error?: string
}

function Avatar({ sender }: { sender: Sender }) {
  const [imgError, setImgError] = useState(false)
  if (sender.profilePic && !imgError) {
    return (
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
        <Image src={sender.profilePic} alt={sender.name} width={36} height={36} className="w-full h-full object-cover" onError={() => setImgError(true)} unoptimized />
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: '#09AF72' }}>
      {sender.name.charAt(0).toUpperCase()}
    </div>
  )
}

function displayName(s: Sender) {
  if (s.username) return `@${s.username}`
  if (s.name && !s.name.startsWith('User ')) return s.name
  return `User ···${s.senderId.slice(-6)}`
}

export default function BroadcastClient({ senders }: { senders: Sender[] }) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<Result[] | null>(null)
  const [progress, setProgress] = useState(0)

  const filtered = senders.filter(s => {
    const q = search.toLowerCase()
    return !q || s.name.toLowerCase().includes(q) || (s.username?.toLowerCase().includes(q)) || s.senderId.includes(q)
  })

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(s => s.senderId)))
    }
  }

  async function handleSend() {
    if (!message.trim() || selected.size === 0 || sending) return
    if (!confirm(`Send message to ${selected.size} user${selected.size > 1 ? 's' : ''}?`)) return

    setSending(true)
    setResults(null)
    setProgress(0)

    const recipientIds = Array.from(selected)

    // Simulate progress updates (API sends sequentially with 300ms delay)
    const interval = setInterval(() => {
      setProgress(prev => Math.min(prev + Math.floor(100 / recipientIds.length), 95))
    }, 350)

    try {
      const res = await fetch('/api/dashboard/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientIds, message: message.trim() }),
      })
      const data = await res.json()
      clearInterval(interval)
      setProgress(100)
      setResults(data.results)
      if (data.successCount === recipientIds.length) {
        setMessage('')
        setSelected(new Set())
      }
    } catch {
      clearInterval(interval)
      setResults(recipientIds.map(id => ({ senderId: id, success: false, error: 'Network error' })))
    }

    setSending(false)
  }

  const successCount = results?.filter(r => r.success).length ?? 0
  const failCount = results?.filter(r => !r.success).length ?? 0

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#e6f7f1' }}>
            <Radio className="w-5 h-5" style={{ color: '#09AF72' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Broadcast</h1>
            <p className="text-gray-500 text-sm">Send a message to multiple users at once</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-100 rounded-xl px-4 py-2.5 shadow-sm">
          <Users className="w-4 h-4" />
          <span><strong className="text-gray-900">{senders.length}</strong> contacts</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-5">
        {/* Recipients list */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col" style={{ maxHeight: '620px' }}>
          <div className="p-4 border-b border-gray-100">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 rounded-lg text-xs focus:outline-none focus:ring-2 border border-gray-100"
              />
            </div>
            <button
              onClick={toggleAll}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition hover:bg-gray-50"
            >
              <span className="text-gray-600">
                {selected.size === filtered.length && filtered.length > 0 ? 'Deselect all' : 'Select all'} ({filtered.length})
              </span>
              <div
                className="w-4 h-4 rounded border-2 flex items-center justify-center"
                style={selected.size === filtered.length && filtered.length > 0
                  ? { backgroundColor: '#09AF72', borderColor: '#09AF72' }
                  : { borderColor: '#d1d5db' }}
              >
                {selected.size === filtered.length && filtered.length > 0 && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">No contacts found</p>
            ) : (
              filtered.map(sender => {
                const isSelected = selected.has(sender.senderId)
                return (
                  <button
                    key={sender.senderId}
                    onClick={() => toggleOne(sender.senderId)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition hover:bg-gray-50 ${isSelected ? 'bg-green-50' : ''}`}
                  >
                    <div
                      className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0"
                      style={isSelected ? { backgroundColor: '#09AF72', borderColor: '#09AF72' } : { borderColor: '#d1d5db' }}
                    >
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <Avatar sender={sender} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{displayName(sender)}</p>
                      {sender.username && sender.name && !sender.name.startsWith('User ') && (
                        <p className="text-xs text-gray-400 truncate">{sender.name}</p>
                      )}
                    </div>
                    {/* Show result badge */}
                    {results && (() => {
                      const r = results.find(x => x.senderId === sender.senderId)
                      if (!r) return null
                      return r.success
                        ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                        : <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                    })()}
                  </button>
                )
              })
            )}
          </div>

          {selected.size > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-center font-medium" style={{ color: '#09AF72' }}>
              {selected.size} recipient{selected.size > 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        {/* Message composer */}
        <div className="col-span-3 flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex-1">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={10}
              placeholder="Write your broadcast message here...

Hi! 👋 We have an exciting update for you..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
              disabled={sending}
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-400">{message.length}/1000 characters</p>
              <p className="text-xs text-gray-400">Sent as Instagram DM</p>
            </div>
          </div>

          {/* Progress bar while sending */}
          {sending && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Sending messages...</span>
                <span className="text-sm font-bold" style={{ color: '#09AF72' }}>{progress}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, backgroundColor: '#09AF72' }}
                />
              </div>
            </div>
          )}

          {/* Results summary */}
          {results && !sending && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-900 mb-3">Broadcast Complete</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-lg font-bold text-green-700">{successCount}</p>
                    <p className="text-xs text-green-600">Delivered</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-400" />
                  <div>
                    <p className="text-lg font-bold text-red-600">{failCount}</p>
                    <p className="text-xs text-red-500">Failed</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={sending || selected.size === 0 || !message.trim()}
            className="w-full flex items-center justify-center gap-2 text-white py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition disabled:opacity-40"
            style={{ backgroundColor: '#09AF72' }}
          >
            {sending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending to {selected.size} users...</>
              : <><Send className="w-4 h-4" /> Send to {selected.size > 0 ? `${selected.size} user${selected.size > 1 ? 's' : ''}` : 'selected users'}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
