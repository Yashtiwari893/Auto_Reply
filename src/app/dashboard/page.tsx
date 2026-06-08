import { createClient } from '@/lib/supabase/server'
import { MessageCircle, Send, Users, Clock, TrendingUp, ArrowUpRight, Bot, Wifi } from 'lucide-react'
import Link from 'next/link'
import AutoReplyToggle from '@/components/AutoReplyToggle'
import MiniBarChart from '@/components/MiniBarChart'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

  const [
    { data: account },
    { count: totalIncoming },
    { count: totalSent },
    { data: last7DaysMessages },
    { data: allSenders },
    { count: todayReceived },
    { count: todaySent },
    { data: recentConversations },
  ] = await Promise.all([
    supabase.from('instagram_accounts').select('username, created_at, auto_reply_enabled').eq('user_id', user!.id).maybeSingle(),
    supabase.from('incoming_messages').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase.from('sent_messages').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'sent'),
    supabase.from('incoming_messages').select('created_at').eq('user_id', user!.id).gte('created_at', sevenDaysAgo),
    supabase.from('incoming_messages').select('sender_id').eq('user_id', user!.id),
    supabase.from('incoming_messages').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).gte('created_at', todayStart),
    supabase.from('sent_messages').select('id', { count: 'exact', head: true }).eq('user_id', user!.id).eq('status', 'sent').gte('created_at', todayStart),
    supabase.from('conversation_history').select('sender_id, role, content, created_at').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(40),
  ])

  // Chart data
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayCounts: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    dayCounts[dayLabels[d.getDay()]] = 0
  }
  last7DaysMessages?.forEach((m) => {
    const day = dayLabels[new Date(m.created_at).getDay()]
    if (day in dayCounts) dayCounts[day] = (dayCounts[day] || 0) + 1
  })
  const chartData = Object.entries(dayCounts).map(([day, count]) => ({ day, count }))

  // Peak hour
  const hourCounts: Record<number, number> = {}
  last7DaysMessages?.forEach((m) => {
    const h = new Date(m.created_at).getHours()
    hourCounts[h] = (hourCounts[h] || 0) + 1
  })
  const peakEntry = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
  const peakHour = peakEntry ? `${peakEntry[0]}:00–${Number(peakEntry[0]) + 1}:00` : 'N/A'

  // Unique / returning
  const senderMap: Record<string, number> = {}
  allSenders?.forEach((s) => { senderMap[s.sender_id] = (senderMap[s.sender_id] || 0) + 1 })
  const uniqueUsers = Object.keys(senderMap).length
  const returningUsers = Object.values(senderMap).filter((c) => c > 1).length

  // Recent conversations (deduplicated by sender)
  const seen = new Set<string>()
  const recents: { senderId: string; lastMessage: string; lastTime: string; role: string }[] = []
  recentConversations?.forEach((msg) => {
    if (!seen.has(msg.sender_id) && recents.length < 4) {
      seen.add(msg.sender_id)
      recents.push({ senderId: msg.sender_id, lastMessage: msg.content, lastTime: msg.created_at, role: msg.role })
    }
  })

  const stats = [
    { label: 'Total Received', value: totalIncoming ?? 0, sub: `+${todayReceived ?? 0} today`, icon: MessageCircle, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Total Sent', value: totalSent ?? 0, sub: `+${todaySent ?? 0} today`, icon: Send, color: '#09AF72', bg: '#e6f7f1' },
    { label: 'Unique Users', value: uniqueUsers, sub: `${returningUsers} returning`, icon: Users, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Peak Hour', value: peakHour, sub: 'last 7 days', icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
  ]

  return (
    <div className="max-w-5xl space-y-6">

      {/* ── Hero header ──────────────────────────────────────── */}
      <div
        className="rounded-2xl p-7 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0D163F 0%, #0f2050 55%, #0A8A66 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-10" style={{ background: '#09AF72' }} />
        <div className="absolute -bottom-8 right-32 w-32 h-32 rounded-full opacity-10" style={{ background: '#09AF72' }} />

        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-white/50 text-sm font-medium mb-1">Welcome back</p>
            <h1 className="text-3xl font-extrabold tracking-tight mb-1">
              {account ? `@${account.username}` : 'Dashboard'}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              {account ? (
                <>
                  <span className="flex items-center gap-1.5 text-xs bg-white/10 px-2.5 py-1 rounded-full">
                    <Wifi className="w-3 h-3 text-green-400" />
                    <span className="text-green-300 font-medium">Connected</span>
                  </span>
                  <span className="text-white/40 text-xs">since {new Date(account.created_at).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </>
              ) : (
                <Link href="/dashboard/connect" className="text-xs bg-white/10 px-3 py-1 rounded-full text-white/70 hover:bg-white/20 transition">
                  Connect Instagram →
                </Link>
              )}
            </div>
          </div>

          {account && (
            <AutoReplyToggle initialEnabled={account.auto_reply_enabled ?? true} variant="hero" />
          )}
        </div>

        {/* Mini stats row inside hero */}
        <div className="relative grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-2xl font-bold">{totalIncoming ?? 0}</p>
            <p className="text-white/50 text-xs mt-0.5">Messages received</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalSent ?? 0}</p>
            <p className="text-white/50 text-xs mt-0.5">Replies sent</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{uniqueUsers}</p>
            <p className="text-white/50 text-xs mt-0.5">Unique users</p>
          </div>
        </div>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: stat.bg }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-gray-300" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Chart + Recent conversations ─────────────────────── */}
      <div className="grid grid-cols-5 gap-4">

        {/* Chart */}
        <div className="col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-gray-900 text-sm">Message Activity</h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">Last 7 days</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Incoming messages per day</p>
          <MiniBarChart data={chartData} />
        </div>

        {/* Recent conversations */}
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Chats</h2>
            <Link href="/dashboard/chat" className="text-xs font-medium flex items-center gap-0.5 hover:underline" style={{ color: '#09AF72' }}>
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {recents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Bot className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No conversations yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recents.map((r) => (
                <Link
                  key={r.senderId}
                  href="/dashboard/chat"
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition -mx-1"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ backgroundColor: '#09AF72' }}
                  >
                    {r.senderId.slice(-2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 truncate">User ···{r.senderId.slice(-6)}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {r.role === 'assistant' ? '🤖 ' : ''}{r.lastMessage}
                    </p>
                  </div>
                  <p className="text-xs text-gray-300 shrink-0">
                    {new Date(r.lastTime).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Quick actions ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 text-sm mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/dashboard/connect', label: 'Manage Connection', desc: 'Instagram account settings', icon: Wifi, color: '#3b82f6', bg: '#eff6ff' },
            { href: '/dashboard/auto-replies', label: 'Configure Replies', desc: 'Set up keyword auto-replies', icon: Bot, color: '#09AF72', bg: '#e6f7f1' },
            { href: '/dashboard/logs', label: 'Message Logs', desc: 'View all incoming & sent', icon: MessageCircle, color: '#8b5cf6', bg: '#f5f3ff' },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: action.bg }}>
                <action.icon className="w-5 h-5" style={{ color: action.color }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{action.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
