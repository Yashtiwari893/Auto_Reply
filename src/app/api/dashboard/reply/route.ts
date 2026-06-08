import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/crypto'
import { sendInstagramMessage } from '@/lib/meta'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { senderId, message } = await request.json()
  if (!senderId || !message?.trim()) {
    return NextResponse.json({ error: 'Missing senderId or message' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: account } = await admin
    .from('instagram_accounts')
    .select('page_id, access_token')
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'No Instagram account connected' }, { status: 404 })

  const accessToken = decrypt(account.access_token)

  try {
    await sendInstagramMessage(senderId, message.trim(), accessToken, account.page_id)

    await Promise.all([
      admin.from('conversation_history').insert({
        user_id: user.id,
        sender_id: senderId,
        role: 'assistant',
        content: message.trim(),
      }),
      admin.from('sent_messages').insert({
        user_id: user.id,
        recipient_id: senderId,
        message_text: message.trim(),
        status: 'sent',
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to send'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
