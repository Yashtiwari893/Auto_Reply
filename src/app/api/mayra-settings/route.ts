import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('mayra_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Return defaults if no row yet
  return NextResponse.json(data ?? {
    bot_name: 'Mayra',
    language: 'auto',
    tone: 'casual',
    reply_length: 'short',
    custom_instructions: '',
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { bot_name, language, tone, reply_length, custom_instructions } = body

  const admin = createAdminClient()
  const { error } = await admin
    .from('mayra_settings')
    .upsert({
      user_id: user.id,
      bot_name: bot_name || 'Mayra',
      language: language || 'auto',
      tone: tone || 'casual',
      reply_length: reply_length || 'short',
      custom_instructions: custom_instructions || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) {
    console.error('[mayra-settings] upsert error:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
