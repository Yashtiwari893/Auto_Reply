import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

const createSchema = z.object({
  trigger_type: z.enum(['keyword', 'default']),
  keyword: z.string().min(1).max(100).nullable().optional(),
  reply_message: z.string().min(1).max(2000),
  is_active: z.boolean().optional().default(true),
})

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('auto_replies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { trigger_type, keyword, reply_message, is_active } = parsed.data

  // Only one default reply per user
  if (trigger_type === 'default') {
    const admin = createAdminClient()
    const { count } = await admin
      .from('auto_replies')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('trigger_type', 'default')

    if (count && count > 0) {
      return NextResponse.json({ error: 'A default reply already exists. Edit the existing one.' }, { status: 409 })
    }
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('auto_replies')
    .insert({ user_id: user.id, trigger_type, keyword: keyword ?? null, reply_message, is_active })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
