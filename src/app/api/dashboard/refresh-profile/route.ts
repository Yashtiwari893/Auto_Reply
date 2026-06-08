import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/crypto'
import { getSenderInfo } from '@/lib/meta'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { senderId } = await request.json()
  if (!senderId) return NextResponse.json({ error: 'Missing senderId' }, { status: 400 })

  const admin = createAdminClient()

  const { data: account } = await admin
    .from('instagram_accounts')
    .select('access_token')
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'No account' }, { status: 404 })

  const accessToken = decrypt(account.access_token)
  const info = await getSenderInfo(senderId, accessToken)
  const effectiveName = (info.name && info.name !== 'Unknown')
    ? info.name
    : `User ${senderId.slice(-6)}`

  // Update all incoming_messages rows for this sender with fresh profile data
  await admin
    .from('incoming_messages')
    .update({
      sender_name: effectiveName,
      sender_username: info.username ?? null,
      sender_profile_pic: info.profile_pic ?? null,
    })
    .eq('user_id', user.id)
    .eq('sender_id', senderId)

  return NextResponse.json({
    name: effectiveName,
    username: info.username ?? null,
    profilePic: info.profile_pic ?? null,
  })
}
