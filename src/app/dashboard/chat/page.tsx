import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/crypto'
import { getSenderInfo } from '@/lib/meta'
import ChatClient from '@/components/ChatClient'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  const [{ data: history }, { data: incoming }, { data: account }] = await Promise.all([
    supabase
      .from('conversation_history')
      .select('sender_id, role, content, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('incoming_messages')
      .select('sender_id, sender_name, sender_username, sender_profile_pic')
      .eq('user_id', user!.id)
      .order('received_at', { ascending: false }),
    admin
      .from('instagram_accounts')
      .select('access_token')
      .eq('user_id', user!.id)
      .single(),
  ])

  // Build sender profile map (most recent per sender)
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
      const p = profileMap[msg.sender_id]
      conversations.push({
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

  // Server-side: silently enrich profiles that are missing data before sending HTML to client
  if (account) {
    const accessToken = decrypt(account.access_token)
    const missing = conversations.filter(c => !c.profilePic || !c.username)

    if (missing.length > 0) {
      await Promise.all(
        missing.slice(0, 10).map(async (conv) => {
          try {
            const info = await getSenderInfo(conv.senderId, accessToken)
            const effectiveName = (info.name && info.name !== 'Unknown')
              ? info.name
              : (conv.name && conv.name !== 'Unknown' && conv.name !== '')
                ? conv.name
                : `User ${conv.senderId.slice(-6)}`

            // Update conversation object in-place (used for initial render)
            conv.name = effectiveName
            if (info.username) conv.username = info.username
            if (info.profile_pic) conv.profilePic = info.profile_pic

            // Persist to DB so next page load is instant (no API call needed)
            await admin
              .from('incoming_messages')
              .update({
                sender_name: effectiveName,
                sender_username: info.username ?? null,
                sender_profile_pic: info.profile_pic ?? null,
              })
              .eq('user_id', user!.id)
              .eq('sender_id', conv.senderId)
          } catch { /* silent — never block page render */ }
        })
      )
    }
  }

  return (
    <div className="-m-6 h-screen">
      <ChatClient initialConversations={conversations} userId={user!.id} />
    </div>
  )
}
