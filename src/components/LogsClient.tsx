'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageCircle, Send, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { IncomingMessage, SentMessage } from '@/types'
import { formatDate, truncate } from '@/lib/utils'

type Tab = 'incoming' | 'sent'

export default function LogsClient() {
  const [tab, setTab] = useState<Tab>('incoming')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<(IncomingMessage | SentMessage)[]>([])
  const [total, setTotal] = useState(0)

  const pageSize = 20

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchData = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      type: tab,
      search: debouncedSearch,
      page: String(page),
    })
    const res = await fetch(`/api/messages?${params.toString()}`)
    if (res.ok) {
      const json = await res.json()
      setData(json.data ?? [])
      setTotal(json.total ?? 0)
    }
    setLoading(false)
  }, [tab, debouncedSearch, page])

  useEffect(() => {
    setPage(1)
  }, [tab, debouncedSearch])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Message Logs</h1>
        <p className="text-gray-500 text-sm mt-1">View all incoming messages and sent auto-replies.</p>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between mb-5 gap-4 flex-wrap">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {([
            { key: 'incoming', label: 'Received', icon: MessageCircle },
            { key: 'sent', label: 'Sent', icon: Send },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition ${
                tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            {debouncedSearch ? 'No results found.' : 'No messages yet.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {tab === 'incoming'
              ? (data as IncomingMessage[]).map((msg) => (
                  <div key={msg.id} className="px-5 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">
                            {msg.sender_name || 'Unknown'}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {msg.sender_id}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{truncate(msg.message_text, 200)}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                        {formatDate(msg.received_at)}
                      </p>
                    </div>
                  </div>
                ))
              : (data as SentMessage[]).map((msg) => (
                  <div key={msg.id} className="px-5 py-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-gray-500">{msg.recipient_id}</span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              msg.status === 'sent'
                                ? 'bg-green-100 text-green-700'
                                : msg.status === 'failed'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {msg.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{truncate(msg.message_text, 200)}</p>
                      </div>
                      <p className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                        {formatDate(msg.sent_at)}
                      </p>
                    </div>
                  </div>
                ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
