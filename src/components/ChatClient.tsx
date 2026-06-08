'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, RefreshCw } from 'lucide-react'
import Image from 'next/image'

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
  const sizeClass = `w-${size} h-${size}`

  if (profilePic && !imgError) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden shrink-0`}>
        <Image
          src={profilePic}
          alt={name}
          width={size * 4}
          height={size * 4}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      </div>
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-semibold text-sm shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function ChatClient({
  initialConversations,
  userId,
}: {
  initialConversations: Conversation[]
  userId: string
}) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selectedSender, setSelectedSender] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  async function loadMessages(senderId: string) {
    setLoadingMsgs(true)
    const { data } = await supabase
      .from('conversation_history')
      .select('id, role, content, created_at')
      .eq('user_id', userId)
      .eq('sender_id', senderId)
      .order('created_at', { ascending: true })
    setMessages((data as Message[]) ?? [])
    setLoadingMsgs(false)
  }

  async function refreshConversations() {
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
          name: m.sender_name || 'Instagram User',
          username: m.sender_username ?? undefined,
          profilePic: m.sender_profile_pic ?? undefined,
        }
      }
    })

    const seen = new Set<string>()
    const convs: Conversation[] = []
    history?.forEach((msg) => {
      if (!seen.has(msg.sender_id)) {
        seen.add(msg.sender_id)
        const p = profileMap[msg.sender_id]
        convs.push({
          senderId: msg.sender_id,
          name: p?.name || 'Instagram User',
          username: p?.username,
          profilePic: p?.profilePic,
          lastMessage: msg.content,
          lastTime: msg.created_at,
          lastRole: msg.role,
        })
      }
    })
    setConversations(convs)
  }

  async function fetchAndUpdateProfile(senderId: string) {
    const conv = conversations.find(c => c.senderId === senderId)
    if (conv?.profilePic) return // already have it
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
          ? { ...c, name: data.name || c.name, username: data.username ?? c.username, profilePic: data.profilePic ?? c.profilePic }
          : c
      ))
    } catch { /* silent */ }
  }

  function selectSender(senderId: string) {
    setSelectedSender(senderId)
    loadMessages(senderId)
    fetchAndUpdateProfile(senderId)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!selectedSender) return
    const interval = setInterval(() => {
      loadMessages(selectedSender)
      refreshConversations()
    }, 10000)
    return () => clearInterval(interval)
  }, [selectedSender])

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
      await loadMessages(selectedSender)
      await refreshConversations()
    }
    setSending(false)
  }

  const selectedConv = conversations.find((c) => c.senderId === selectedSender)

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

  // Group messages by date
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
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 text-base">Chats</h2>
          <button onClick={refreshConversations} className="p-1.5 hover:bg-gray-100 rounded-lg transition" title="Refresh">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400 mt-8">
              No conversations yet.<br />Messages will appear here.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.senderId}
                onClick={() => selectSender(conv.senderId)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition border-l-4
                  ${selectedSender === conv.senderId ? 'bg-purple-50 border-l-purple-500' : 'border-l-transparent'}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={conv.name} profilePic={conv.profilePic} size={10} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {conv.username ? `@${conv.username}` : conv.name}
                      </p>
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
      <div className="flex-1 flex flex-col min-w-0">
        {selectedConv ? (
          <>
            {/* Header with profile info */}
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-3 bg-white">
              <Avatar name={selectedConv.name} profilePic={selectedConv.profilePic} size={10} />
              <div>
                <p className="font-semibold text-gray-900 text-sm">
                  {selectedConv.username ? `@${selectedConv.username}` : selectedConv.name}
                </p>
                {selectedConv.username && (
                  <p className="text-xs text-gray-400">{selectedConv.name}</p>
                )}
                <p className="text-xs text-gray-400">ID: {selectedSender}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gray-50">
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
                            <Avatar name={selectedConv.name} profilePic={selectedConv.profilePic} size={7} />
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

            {/* Reply box */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2 items-center">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Type a manual reply..."
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
