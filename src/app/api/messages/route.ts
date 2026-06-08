import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'incoming'
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  if (type === 'incoming') {
    let query = supabase
      .from('incoming_messages')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('received_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(
        `sender_name.ilike.%${search}%,message_text.ilike.%${search}%,sender_id.ilike.%${search}%`
      )
    }

    const { data, error, count } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data, total: count })
  }

  // sent messages
  let query = supabase
    .from('sent_messages')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .range(from, to)

  if (search) {
    query = query.or(
      `recipient_id.ilike.%${search}%,message_text.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count })
}
