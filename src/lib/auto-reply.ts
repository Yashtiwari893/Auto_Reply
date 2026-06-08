import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/crypto'
import { sendInstagramMessage, getSenderInfo } from '@/lib/meta'
import type { AutoReply } from '@/types'

// Prevent duplicate replies: track recently processed message IDs in memory
// In production with multiple instances, use a Redis/Supabase distributed lock
const processedMessageIds = new Set<string>()

export async function handleIncomingMessage(
  igAccountId: string,
  senderId: string,
  messageText: string,
  messageMid: string
): Promise<void> {
  // Deduplication guard
  if (processedMessageIds.has(messageMid)) return
  processedMessageIds.add(messageMid)
  // Evict old entries to prevent unbounded growth
  if (processedMessageIds.size > 10_000) {
    const first = processedMessageIds.values().next().value
    if (first) processedMessageIds.delete(first)
  }

  const supabase = createAdminClient()

  // Look up which user owns this Instagram account
  const { data: account } = await supabase
    .from('instagram_accounts')
    .select('user_id, access_token, page_id')
    .eq('instagram_id', igAccountId)
    .single()

  if (!account) return

  const { user_id, access_token: encryptedToken, page_id } = account
  const accessToken = decrypt(encryptedToken)

  // Fetch sender display name
  const senderInfo = await getSenderInfo(senderId, accessToken)

  // Save incoming message
  await supabase.from('incoming_messages').insert({
    user_id,
    sender_id: senderId,
    sender_name: senderInfo.name,
    message_text: messageText,
  })

  // Find matching auto-reply rule
  const { data: rules } = await supabase
    .from('auto_replies')
    .select('*')
    .eq('user_id', user_id)
    .eq('is_active', true)
    .order('trigger_type', { ascending: false }) // 'keyword' before 'default'

  if (!rules || rules.length === 0) return

  const lowerText = messageText.toLowerCase()
  let matchedReply: AutoReply | null = null

  // Check keyword matches first
  for (const rule of rules as AutoReply[]) {
    if (rule.trigger_type === 'keyword' && rule.keyword) {
      if (lowerText.includes(rule.keyword.toLowerCase())) {
        matchedReply = rule
        break
      }
    }
  }

  // Fall back to default reply
  if (!matchedReply) {
    matchedReply = (rules as AutoReply[]).find((r) => r.trigger_type === 'default') ?? null
  }

  if (!matchedReply) return

  // Send the reply
  let status: 'sent' | 'failed' = 'failed'
  try {
    await sendInstagramMessage(senderId, matchedReply.reply_message, accessToken, igAccountId)
    status = 'sent'
  } catch (err) {
    console.error('[auto-reply] send failed:', err)
  }

  // Log sent message
  await supabase.from('sent_messages').insert({
    user_id,
    recipient_id: senderId,
    message_text: matchedReply.reply_message,
    status,
  })
}
