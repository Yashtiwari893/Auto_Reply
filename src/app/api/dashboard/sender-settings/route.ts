import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: fetch auto_reply_enabled for a sender
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const senderId = request.nextUrl.searchParams.get('senderId')
  if (!senderId) return NextResponse.json({ error: 'Missing senderId' }, { status: 400 })

  const { data } = await supabase
    .from('sender_settings')
    .select('auto_reply_enabled')
    .eq('user_id', user.id)
    .eq('sender_id', senderId)
    .single()

  // Default true if no row exists
  return NextResponse.json({ enabled: data?.auto_reply_enabled ?? true })
}

// POST: toggle auto_reply_enabled for a sender
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { senderId, enabled } = await request.json()
  if (!senderId || enabled === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  await supabase
    .from('sender_settings')
    .upsert({ user_id: user.id, sender_id: senderId, auto_reply_enabled: enabled })

  return NextResponse.json({ success: true, enabled })
}
