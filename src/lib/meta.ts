import type { MetaPageInfo, MetaOAuthTokenResponse } from '@/types'

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0'

export function getMetaOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`,
    scope: [
      'instagram_basic',
      'instagram_manage_messages',
      'pages_show_list',
      'business_management',
    ].join(','),
    response_type: 'code',
    state,
  })
  return `https://www.facebook.com/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<MetaOAuthTokenResponse> {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`,
    code,
  })

  const res = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to exchange code for token')
  }
  return res.json()
}

export async function getLongLivedToken(shortToken: string): Promise<MetaOAuthTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortToken,
  })

  const res = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to get long-lived token')
  }
  return res.json()
}

export async function getUserPages(accessToken: string): Promise<MetaPageInfo[]> {
  const res = await fetch(
    `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to fetch pages')
  }
  const data = await res.json()
  return data.data as MetaPageInfo[]
}

export async function getInstagramAccountInfo(
  igAccountId: string,
  accessToken: string
): Promise<{ id: string; username: string }> {
  const res = await fetch(
    `${GRAPH_API_BASE}/${igAccountId}?fields=id,username&access_token=${accessToken}`
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to fetch Instagram account info')
  }
  return res.json()
}

export async function sendInstagramMessage(
  recipientId: string,
  messageText: string,
  pageAccessToken: string,
  igAccountId: string,
  retries = 3
): Promise<{ message_id: string }> {
  const url = `${GRAPH_API_BASE}/${igAccountId}/messages`

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text: messageText },
        access_token: pageAccessToken,
      }),
    })

    if (res.ok) {
      return res.json()
    }

    const err = await res.json()
    if (attempt === retries) {
      throw new Error(err.error?.message || 'Failed to send message after retries')
    }
    // Exponential backoff
    await new Promise((r) => setTimeout(r, 500 * attempt))
  }

  throw new Error('Unreachable')
}

export async function getSenderInfo(
  senderId: string,
  pageAccessToken: string
): Promise<{ name: string }> {
  try {
    const res = await fetch(
      `${GRAPH_API_BASE}/${senderId}?fields=name&access_token=${pageAccessToken}`
    )
    if (!res.ok) return { name: 'Unknown' }
    return res.json()
  } catch {
    return { name: 'Unknown' }
  }
}

export function verifyWebhookSignature(
  rawBody: Buffer | string,
  signature: string | null
): boolean {
  const secret = process.env.META_APP_SECRET
  if (!secret) {
    // Secret not configured — log warning but allow through (dev/testing mode)
    console.warn('[webhook] META_APP_SECRET not set — skipping signature verification')
    return true
  }
  if (!signature) {
    console.error('[webhook] Missing x-hub-signature-256 header')
    return false
  }
  try {
    const crypto = require('crypto')
    const expected =
      'sha256=' +
      crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex')
    // Log first 20 chars for debugging without exposing full secret
    console.log('[webhook] sig check — got:', signature.slice(0, 20), 'expected:', expected.slice(0, 20))
    if (expected.length !== signature.length) {
      console.error('[webhook] Signature length mismatch:', expected.length, 'vs', signature.length)
      return false
    }
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch (err) {
    console.error('[webhook] Signature verification error:', err)
    return false
  }
}
