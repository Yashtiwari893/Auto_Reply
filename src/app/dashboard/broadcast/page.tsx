import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import BroadcastClient from '@/components/BroadcastClient'

export default async function BroadcastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()

  // Get all unique senders with their latest profile data
  const { data: incoming } = await admin
    .from('incoming_messages')
    .select('sender_id, sender_name, sender_username, sender_profile_pic')
    .eq('user_id', user!.id)
    .order('received_at', { ascending: false })

  // Deduplicate — keep most recent profile per sender
  const seen = new Set<string>()
  const senders: {
    senderId: string
    name: string
    username?: string
    profilePic?: string
  }[] = []

  incoming?.forEach((m) => {
    if (!seen.has(m.sender_id)) {
      seen.add(m.sender_id)
      senders.push({
        senderId: m.sender_id,
        name: m.sender_name || `User ${m.sender_id.slice(-6)}`,
        username: m.sender_username ?? undefined,
        profilePic: m.sender_profile_pic ?? undefined,
      })
    }
  })

  return <BroadcastClient senders={senders} />
}
