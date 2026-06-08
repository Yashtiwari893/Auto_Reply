import { NextRequest, NextResponse, after } from 'next/server'
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

  // after() keeps the function alive until processing completes, even after response is sent
  after(async () => {
    try {
      await processWebhookAsync(body)
    } catch (err) {
      console.error('[webhook] Processing error:', err)
    }
  })

  return new NextResponse('EVENT_RECEIVED', { status: 200 })
}

async function processWebhookAsync(body: MetaWebhookEvent): Promise<void> {
  console.log('[webhook] object:', body.object, '| entries:', body.entry?.length)

  if (body.object !== 'instagram' && body.object !== 'page') {
    console.log('[webhook] Skipping — unexpected object type:', body.object)
    return
  }

  for (const entry of body.entry) {
    const messagingEvents: MetaWebhookMessaging[] = []

    if (entry.messaging) {
      messagingEvents.push(...entry.messaging)
    }

    if (entry.changes) {
      for (const change of entry.changes) {
        console.log('[webhook] change field:', change.field, '| has messaging:', !!change.value?.messaging)
        if (change.field === 'messages' && change.value?.messaging) {
          messagingEvents.push(...(change.value.messaging as MetaWebhookMessaging[]))
        }
      }
    }

    console.log('[webhook] entry.id:', entry.id, '| messaging events:', messagingEvents.length)

    for (const event of messagingEvents) {
      const senderId = event.sender.id
      const igAccountId = entry.id
      const msgText = event.message?.text

      console.log('[webhook] event — sender:', senderId, '| text:', msgText ?? '(no text)')

      if (!msgText) continue
      if (senderId === igAccountId) {
        console.log('[webhook] Skipping echo from own account')
        continue
      }

      await handleIncomingMessage(igAccountId, senderId, msgText, event.message?.mid ?? '')
    }
  }
}
