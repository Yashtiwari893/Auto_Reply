import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/crypto'
import { sendInstagramMessage, getSenderInfo } from '@/lib/meta'
import { getMayraReply, type ChatMessage } from '@/lib/ai'

// Deduplication: prevent double-processing same message
const processedMessageIds = new Set<string>()

export async function handleIncomingMessage(
  igAccountId: string,
  senderId: string,
  messageText: string,
  messageMid: string
): Promise<void> {
  if (processedMessageIds.has(messageMid)) return
  processedMessageIds.add(messageMid)
  if (processedMessageIds.size > 10_000) {
    const first = processedMessageIds.values().next().value
    if (first) processedMessageIds.delete(first)
  }

  const supabase = createAdminClient()

  // entry.id can be either instagram_id or page_id depending on event type — check both
  const { data: account } = await supabase
    .from('instagram_accounts')
    .select('user_id, access_token, page_id, instagram_id')
    .or(`instagram_id.eq.${igAccountId},page_id.eq.${igAccountId}`)
    .single()

  if (!account) {
    console.error('[auto-reply] No account found for igAccountId:', igAccountId)
    return
  }

  const { user_id, access_token: encryptedToken, instagram_id: resolvedIgId } = account
  console.log('[auto-reply] Processing message from', senderId, 'to account', resolvedIgId)
  const accessToken = decrypt(encryptedToken)

  // Get sender display name
  const senderInfo = await getSenderInfo(senderId, accessToken)

  // Save incoming message to DB
  await supabase.from('incoming_messages').insert({
    user_id,
    sender_id: senderId,
    sender_name: senderInfo.name,
    message_text: messageText,
  })

  // Save this message to conversation history
  await supabase.from('conversation_history').insert({
    user_id,
    sender_id: senderId,
    role: 'user',
    content: messageText,
  })

  // Fetch last 20 messages for context (ordered oldest → newest)
  const { data: historyRows } = await supabase
    .from('conversation_history')
    .select('role, content')
    .eq('user_id', user_id)
    .eq('sender_id', senderId)
    .order('created_at', { ascending: false })
    .limit(20)

  // Reverse so oldest is first (correct order for AI context)
  const history: ChatMessage[] = (historyRows ?? [])
    .reverse()
    .slice(0, -1) // exclude the message we just inserted (it's the current one)
    .map((r) => ({ role: r.role as 'user' | 'assistant', content: r.content }))

  // Generate AI reply
  let replyText = ''
  let status: 'sent' | 'failed' = 'failed'

  try {
    replyText = await getMayraReply(messageText, history)
  } catch (err) {
    console.error('[auto-reply] AI generation failed:', err)
    replyText = "Hey! I'm here for you. Could you tell me more about what's on your mind? 💛"
  }

  // Send the reply via Instagram API
  try {
    // Use page_id for the messages endpoint (Messenger Platform route for Instagram DMs)
    await sendInstagramMessage(senderId, replyText, accessToken, account.page_id)
    status = 'sent'
  } catch (err) {
    console.error('[auto-reply] send failed:', err)
  }

  // Save assistant reply to conversation history
  await supabase.from('conversation_history').insert({
    user_id,
    sender_id: senderId,
    role: 'assistant',
    content: replyText,
  })

  // Log sent message
  await supabase.from('sent_messages').insert({
    user_id,
    recipient_id: senderId,
    message_text: replyText,
    status,
  })
}
