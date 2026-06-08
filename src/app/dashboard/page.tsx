import { createClient } from '@/lib/supabase/server'
import { MessageCircle, Send, Users, Clock } from 'lucide-react'
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
  ] = await Promise.all([
    supabase
      .from('instagram_accounts')
      .select('username, created_at, auto_reply_enabled')
      .eq('user_id', user!.id)
      .maybeSingle(),
    supabase
      .from('incoming_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id),
    supabase
      .from('sent_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('status', 'sent'),
    supabase
      .from('incoming_messages')
      .select('created_at')
      .eq('user_id', user!.id)
      .gte('created_at', sevenDaysAgo),
    supabase
      .from('incoming_messages')
      .select('sender_id')
      .eq('user_id', user!.id),
    supabase
      .from('incoming_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .gte('created_at', todayStart),
    supabase
      .from('sent_messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user!.id)
      .eq('status', 'sent')
      .gte('created_at', todayStart),
  ])

  // Last 7 days chart data
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

  // Most active hour
  const hourCounts: Record<number, number> = {}
  last7DaysMessages?.forEach((m) => {
    const h = new Date(m.created_at).getHours()
    hourCounts[h] = (hourCounts[h] || 0) + 1
  })
  const peakEntry = Object.entries(hourCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0]
  const peakHour = peakEntry
    ? `${peakEntry[0]}:00 – ${Number(peakEntry[0]) + 1}:00`
    : 'N/A'

  // Retention: unique senders vs returning senders
  const senderMap: Record<string, number> = {}
  allSenders?.forEach((s) => { senderMap[s.sender_id] = (senderMap[s.sender_id] || 0) + 1 })
  const uniqueUsers = Object.keys(senderMap).length
  const returningUsers = Object.values(senderMap).filter((c) => c > 1).length

  return (
    <div className="max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Welcome back{user?.email ? `, ${user.email}` : ''}
          </p>
        </div>
        {account && (
          <AutoReplyToggle initialEnabled={account.auto_reply_enabled ?? true} />
        )}
      </div>

      {/* Instagram connection status */}
      <div className={`rounded-xl p-5 mb-8 flex items-center justify-between ${account ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${account ? 'bg-green-500' : 'bg-yellow-500'}`} />
          <div>
            <p className="font-medium text-gray-900 text-sm">
              {account ? `@${account.username}` : 'No Instagram account connected'}
            </p>
            <p className="text-xs text-gray-500">
              {account
                ? `Connected on ${new Date(account.created_at).toLocaleDateString()}`
                : 'Connect your Instagram Business account to start auto-replying'}
            </p>
          </div>
        </div>
        <Link href="/dashboard/connect" className="text-sm font-medium text-purple-600 hover:underline">
          {account ? 'Manage' : 'Connect now →'}
        </Link>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Received', value: totalIncoming ?? 0, sub: `+${todayReceived ?? 0} today`, icon: MessageCircle, color: 'bg-blue-500' },
          { label: 'Total Sent', value: totalSent ?? 0, sub: `+${todaySent ?? 0} today`, icon: Send, color: 'bg-green-500' },
          { label: 'Unique Users', value: uniqueUsers, sub: `${returningUsers} returning`, icon: Users, color: 'bg-purple-500' },
          { label: 'Peak Hour', value: peakHour, sub: 'last 7 days', icon: Clock, color: 'bg-orange-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`${stat.color} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Last 7 days chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4 text-sm">Messages Last 7 Days</h2>
        <MiniBarChart data={chartData} />
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4 text-sm">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/dashboard/connect', label: 'Manage Connection', icon: MessageCircle },
            { href: '/dashboard/auto-replies', label: 'Configure Replies', icon: Send },
            { href: '/dashboard/logs', label: 'View Message Logs', icon: Users },
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
            >
              <action.icon className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
