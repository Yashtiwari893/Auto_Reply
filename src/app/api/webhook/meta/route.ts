import { NextRequest, NextResponse } from 'next/server'
import { handleIncomingMessage } from '@/lib/auto-reply'
import type { MetaWebhookEvent, MetaWebhookMessaging } from '@/types'

// GET: webhook verification challenge from Meta
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'mywebhooktoken2024'
  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[webhook] Verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// POST: incoming webhook events from Meta
export async function POST(request: NextRequest) {
  const rawBody = await request.text()

  let body: MetaWebhookEvent
  try {
    body = JSON.parse(rawBody)
  } catch {
    return new NextResponse('Bad Request', { status: 400 })
  }

  // Must respond 200 quickly; process async
  processWebhookAsync(body).catch((err) =>
    console.error('[webhook] Processing error:', err)
  )

  return new NextResponse('EVENT_RECEIVED', { status: 200 })
}

async function processWebhookAsync(body: MetaWebhookEvent): Promise<void> {
  if (body.object !== 'instagram' && body.object !== 'page') return

  for (const entry of body.entry) {
    // Instagram DMs come via entry.messaging or entry.changes[].value.messaging
    const messagingEvents: MetaWebhookMessaging[] = []

    if (entry.messaging) {
      messagingEvents.push(...entry.messaging)
    }

    if (entry.changes) {
      for (const change of entry.changes) {
        if (change.field === 'messages' && change.value?.messaging) {
          messagingEvents.push(...(change.value.messaging as MetaWebhookMessaging[]))
        }
      }
    }

    for (const event of messagingEvents) {
      if (!event.message?.text) continue

      // entry.id is the Instagram account ID (or page ID acting as IG account)
      const igAccountId = entry.id
      const senderId = event.sender.id
      const messageText = event.message.text
      const messageMid = event.message.mid

      // Skip echo (messages sent by the page itself)
      if (senderId === igAccountId) continue

      await handleIncomingMessage(igAccountId, senderId, messageText, messageMid)
    }
  }
}
