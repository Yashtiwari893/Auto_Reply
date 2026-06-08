import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/crypto'
import { sendInstagramMessage } from '@/lib/meta'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { recipientIds, message } = await request.json()
  if (!Array.isArray(recipientIds) || recipientIds.length === 0 || !message?.trim()) {
    return NextResponse.json({ error: 'Missing recipients or message' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: account } = await admin
    .from('instagram_accounts')
    .select('page_id, access_token')
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'No Instagram account connected' }, { status: 404 })

  const accessToken = decrypt(account.access_token)
  const results: { senderId: string; success: boolean; error?: string }[] = []

  // Send one by one with 300ms delay to respect Instagram rate limits
  for (const senderId of recipientIds) {
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

      results.push({ senderId, success: true })
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed'
      results.push({ senderId, success: false, error: errMsg })
    }

    // Small delay between sends to avoid rate limiting
    await new Promise(r => setTimeout(r, 300))
  }

  const successCount = results.filter(r => r.success).length
  return NextResponse.json({ results, successCount, total: recipientIds.length })
}
