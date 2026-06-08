'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, RefreshCw, Info, X, Search } from 'lucide-react'
import Image from 'next/image'
import EmojiPicker from '@/components/EmojiPicker'

type Conversation = {
  senderId: string
  name: string
  username?: string
  profilePic?: string
  lastMessage: string
  lastTime: string
  lastRole: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

function Avatar({ name, profilePic, size = 10 }: { name: string; profilePic?: string; size?: number }) {
  const [imgError, setImgError] = useState(false)
  const px = size * 4

  if (profilePic && !imgError) {
    return (
      <div className={`w-${size} h-${size} rounded-full overflow-hidden shrink-0`}>
        <Image
          src={profilePic}
          alt={name}
          width={px}
          height={px}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    )
  }

  const initials = name === 'Unknown' || name === 'Instagram User'
    ? '?'
    : name.charAt(0).toUpperCase()

  return (
    <div className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
      {initials}
    </div>
  )
}

function displayName(conv: Conversation) {
  if (conv.username) return `@${conv.username}`
  if (conv.name && conv.name !== 'Unknown' && conv.name !== 'Instagram User') return conv.name
  return `User …${conv.senderId.slice(-6)}`
}

export default function ChatClient({
  initialConversations,
  userId,
}: {
  initialConversations: Conversation[]
  userId: string
}) {
  const [conversations, setConversations] = useState(initialConversations)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSender, setSelectedSender] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [senderAutoReply, setSenderAutoReply] = useState(true)
  const [togglingReply, setTogglingReply] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollRef = useRef(false) // only scroll on first open or new outgoing
  const supabase = createClient()

  // ── Load messages (no auto-scroll on periodic refresh) ──────────────────
  const loadMessages = useCallback(async (senderId: string, scrollToBottom = false) => {
    const { data } = await supabase
      .from('conversation_history')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .eq('sender_id', senderId)
      .order('created_at', { ascending: true })
    if (scrollToBottom) shouldAutoScrollRef.current = true
    setMessages((data as Message[]) ?? [])
  }, [supabase, userId])

  // ── Refresh conversation list (preserve cached profile data) ─────────────
  const refreshConversations = useCallback(async () => {
    const [{ data: history }, { data: incoming }] = await Promise.all([
      supabase
        .from('conversation_history')
        .select('sender_id, role, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('incoming_messages')
        .select('sender_id, sender_name, sender_username, sender_profile_pic')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ])

    const profileMap: Record<string, { name: string; username?: string; profilePic?: string }> = {}
    incoming?.forEach((m) => {
      if (!profileMap[m.sender_id]) {
        profileMap[m.sender_id] = {
          name: m.sender_name || '',
          username: m.sender_username ?? undefined,
          profilePic: m.sender_profile_pic ?? undefined,
        }
      }
    })

    const seen = new Set<string>()
    const freshConvs: Conversation[] = []
    history?.forEach((msg) => {
      if (!seen.has(msg.sender_id)) {
        seen.add(msg.sender_id)
        const p = profileMap[msg.sender_id]
        freshConvs.push({
          senderId: msg.sender_id,
          name: p?.name || '',
          username: p?.username,
          profilePic: p?.profilePic,
          lastMessage: msg.content,
          lastTime: msg.created_at,
          lastRole: msg.role,
        })
      }
    })

    // Merge: keep any profile data already fetched in memory (avoid flicker)
    setConversations(prev => {
      const cachedMap: Record<string, Conversation> = {}
      prev.forEach(c => { cachedMap[c.senderId] = c })
      return freshConvs.map(c => ({
        ...c,
        name: c.name || cachedMap[c.senderId]?.name || '',
        username: c.username ?? cachedMap[c.senderId]?.username,
        profilePic: c.profilePic ?? cachedMap[c.senderId]?.profilePic,
      }))
    })
  }, [supabase, userId])

  // ── Fetch real profile from Meta API ────────────────────────────────────
  const fetchAndUpdateProfile = useCallback(async (senderId: string) => {
    try {
      const res = await fetch('/api/dashboard/refresh-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId }),
      })
      if (!res.ok) return
      const data = await res.json()
      setConversations(prev => prev.map(c =>
        c.senderId === senderId
          ? {
              ...c,
              name: data.name && data.name !== 'Unknown' ? data.name : c.name,
              username: data.username ?? c.username,
              profilePic: data.profilePic ?? c.profilePic,
            }
          : c
      ))
    } catch { /* silent */ }
  }, [])


  async function loadSenderAutoReply(senderId: string) {
    const res = await fetch(`/api/dashboard/sender-settings?senderId=${senderId}`)
    if (res.ok) {
      const data = await res.json()
      setSenderAutoReply(data.enabled)
    }
  }

  async function toggleSenderAutoReply() {
    if (!selectedSender || togglingReply) return
    setTogglingReply(true)
    const newVal = !senderAutoReply
    const res = await fetch('/api/dashboard/sender-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: selectedSender, enabled: newVal }),
    })
    if (res.ok) setSenderAutoReply(newVal)
    setTogglingReply(false)
  }

  function selectSender(senderId: string) {
    setSelectedSender(senderId)
    setLoadingMsgs(true)
    loadMessages(senderId, true)
      .finally(() => setLoadingMsgs(false))
    fetchAndUpdateProfile(senderId)
    loadSenderAutoReply(senderId)
  }

  // ── Auto-scroll only when explicitly requested ───────────────────────────
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
      shouldAutoScrollRef.current = false
    }
  }, [messages])

  // ── Periodic refresh — only updates list and messages silently ────────────
  useEffect(() => {
    if (!selectedSender) return
    const interval = setInterval(async () => {
      await refreshConversations()
      // Refresh messages silently (no scroll)
      const { data } = await supabase
        .from('conversation_history')
        .select('id, role, content, created_at')
        .eq('user_id', userId)
        .eq('sender_id', selectedSender)
        .order('created_at', { ascending: true })
      setMessages(prev => {
        const newMsgs = (data as Message[]) ?? []
        // Only auto-scroll if a truly new message arrived
        if (newMsgs.length > prev.length) shouldAutoScrollRef.current = true
        return newMsgs
      })
    }, 10000)
    return () => clearInterval(interval)
  }, [selectedSender, refreshConversations, supabase, userId])

  // ── Send manual reply ─────────────────────────────────────────────────────
  async function sendReply() {
    if (!replyText.trim() || !selectedSender || sending) return
    setSending(true)
    const res = await fetch('/api/dashboard/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId: selectedSender, message: replyText }),
    })
    if (res.ok) {
      setReplyText('')
      shouldAutoScrollRef.current = true
      await loadMessages(selectedSender, true)
      await refreshConversations()
    }
    setSending(false)
  }

  const selectedConv = conversations.find((c) => c.senderId === selectedSender)

  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) => {
        const q = searchQuery.toLowerCase()
        return (
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.username && c.username.toLowerCase().includes(q)) ||
          c.senderId.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
        )
      })
    : conversations

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
  }

  function formatDateLabel(iso: string) {
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return 'Today'
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short' })
  }

  const groupedMessages: { date: string; msgs: Message[] }[] = []
  messages.forEach((msg) => {
    const label = formatDateLabel(msg.created_at)
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === label) last.msgs.push(msg)
    else groupedMessages.push({ date: label, msgs: [msg] })
  })

  return (
    <div className="flex h-screen bg-white">
      {/* Left — conversation list */}
      <div className="w-72 border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-base">Chats</h2>
            <button onClick={refreshConversations} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Refresh">
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-2 bg-gray-100 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400 mt-8">
              {searchQuery ? 'No results found.' : 'No conversations yet.'}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.senderId}
                onClick={() => selectSender(conv.senderId)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition border-l-4
                  ${selectedSender === conv.senderId ? 'bg-purple-50 border-l-purple-500' : 'border-l-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={conv.name || conv.senderId} profilePic={conv.profilePic} size={10} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-medium text-gray-900 text-sm truncate">{displayName(conv)}</p>
                      <p className="text-xs text-gray-400 shrink-0 ml-1">{formatTime(conv.lastTime)}</p>
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.lastRole === 'assistant' ? 'Mayra: ' : ''}{conv.lastMessage}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right — chat view */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {selectedConv ? (
          <>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-3">
                <Avatar name={selectedConv.name || selectedConv.senderId} profilePic={selectedConv.profilePic} size={10} />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{displayName(selectedConv)}</p>
                  {selectedConv.username && selectedConv.name && selectedConv.name !== 'Unknown' && (
                    <p className="text-xs text-gray-500">{selectedConv.name}</p>
                  )}
                  <p className="text-xs text-gray-400">ID: {selectedSender}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Per-sender auto-reply toggle */}
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium ${senderAutoReply ? 'text-green-600' : 'text-gray-400'}`}>
                    Auto-Reply {senderAutoReply ? 'ON' : 'OFF'}
                  </span>
                  <button
                    onClick={toggleSenderAutoReply}
                    disabled={togglingReply}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 disabled:opacity-60
                      ${senderAutoReply ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200
                      ${senderAutoReply ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                </div>

                {/* Info button */}
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-purple-600"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
              {loadingMsgs ? (
                <div className="flex justify-center pt-12">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : groupedMessages.length === 0 ? (
                <div className="text-center text-sm text-gray-400 pt-12">No messages</div>
              ) : (
                groupedMessages.map((group) => (
                  <div key={group.date}>
                    <div className="flex items-center gap-3 my-3">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 px-2">{group.date}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                    <div className="space-y-1.5">
                      {group.msgs.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'assistant' ? 'justify-end' : 'justify-start'}`}>
                          {msg.role === 'user' && (
                            <Avatar name={selectedConv.name || selectedConv.senderId} profilePic={selectedConv.profilePic} size={7} />
                          )}
                          <div className={`max-w-[65%] px-4 py-2.5 rounded-2xl text-sm
                            ${msg.role === 'assistant'
                              ? 'bg-purple-600 text-white rounded-br-sm'
                              : 'bg-white text-gray-900 rounded-bl-sm shadow-sm border border-gray-100'}`}
                          >
                            <p className="leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-1 text-right ${msg.role === 'assistant' ? 'text-purple-300' : 'text-gray-400'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-1 items-center">
              <EmojiPicker onSelect={(emoji) => setReplyText(prev => prev + emoji)} />
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Type a reply..."
                className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button
                onClick={sendReply}
                disabled={sending || !replyText.trim()}
                className="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center hover:bg-purple-700 transition disabled:opacity-40 shrink-0"
              >
                {sending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />}
              </button>
            </div>

            {/* Details sidebar */}
            {showDetails && selectedConv && (
              <div className="absolute right-0 top-0 h-full w-72 bg-white border-l border-gray-200 shadow-xl z-20 flex flex-col">
                <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Details</h3>
                  <button onClick={() => setShowDetails(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5">
                  <div className="flex flex-col items-center text-center mb-6">
                    <Avatar name={selectedConv.name || selectedConv.senderId} profilePic={selectedConv.profilePic} size={20} />
                    <p className="font-semibold text-gray-900 mt-3">{displayName(selectedConv)}</p>
                    {selectedConv.username && selectedConv.name && selectedConv.name !== 'Unknown' && (
                      <p className="text-sm text-gray-500 mt-0.5">{selectedConv.name}</p>
                    )}
                  </div>
                  <div className="space-y-3 text-sm">
                    {selectedConv.username && (
                      <div className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">Username</span>
                        <span className="font-medium text-gray-900">@{selectedConv.username}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-500">Sender ID</span>
                      <span className="font-mono text-xs text-gray-700">{selectedSender}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-500">Auto-Reply</span>
                      <span className={`font-medium ${senderAutoReply ? 'text-green-600' : 'text-red-500'}`}>
                        {senderAutoReply ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-500">Messages</span>
                      <span className="font-medium text-gray-900">{messages.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <Send className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm">Select a conversation to view messages</p>
          </div>
        )}
      </div>
    </div>
  )
}
