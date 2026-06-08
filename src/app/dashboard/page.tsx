import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, MessageCircle, Send, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: account }, { count: incomingCount }, { count: sentCount }, { count: repliesCount }] =
    await Promise.all([
      supabase
        .from('instagram_accounts')
        .select('username, created_at')
        .eq('user_id', user!.id)
        .maybeSingle(),
      supabase
        .from('incoming_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id),
      supabase
        .from('sent_messages')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id),
      supabase
        .from('auto_replies')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_active', true),
    ])

  const stats = [
    { label: 'Messages Received', value: incomingCount ?? 0, icon: MessageCircle, color: 'bg-blue-500' },
    { label: 'Auto-Replies Sent', value: sentCount ?? 0, icon: Send, color: 'bg-green-500' },
    { label: 'Active Rules', value: repliesCount ?? 0, icon: Zap, color: 'bg-purple-500' },
  ]

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Welcome back{user?.email ? `, ${user.email}` : ''}
        </p>
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
        <Link
          href="/dashboard/connect"
          className="text-sm font-medium text-purple-600 hover:underline"
        >
          {account ? 'Manage' : 'Connect now →'}
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`${stat.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/dashboard/connect', label: 'Manage Connection', icon: LayoutDashboard },
            { href: '/dashboard/auto-replies', label: 'Configure Replies', icon: Zap },
            { href: '/dashboard/logs', label: 'View Message Logs', icon: MessageCircle },
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
