import { createClient } from '@/lib/supabase/server'
import ChatClient from '@/components/ChatClient'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: history }, { data: incoming }] = await Promise.all([
    supabase
      .from('conversation_history')
      .select('sender_id, role, content, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('incoming_messages')
      .select('sender_id, sender_name, sender_username, sender_profile_pic')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
  ])

  // Build sender profile map (most recent profile data per sender)
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

  // Build conversation list — one entry per sender, most recent first
  const seen = new Set<string>()
  const conversations: {
    senderId: string
    name: string
    username?: string
    profilePic?: string
    lastMessage: string
    lastTime: string
    lastRole: string
  }[] = []

  history?.forEach((msg) => {
    if (!seen.has(msg.sender_id)) {
      seen.add(msg.sender_id)
      const profile = profileMap[msg.sender_id]
      conversations.push({
        senderId: msg.sender_id,
        name: profile?.name || 'Instagram User',
        username: profile?.username,
        profilePic: profile?.profilePic,
        lastMessage: msg.content,
        lastTime: msg.created_at,
        lastRole: msg.role,
      })
    }
  })

  return (
    <div className="-m-6 h-screen">
      <ChatClient initialConversations={conversations} userId={user!.id} />
    </div>
  )
}
