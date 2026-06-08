import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/crypto'
import { getPostComments } from '@/lib/meta'

export async function GET(
  _req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: account } = await admin
    .from('instagram_accounts')
    .select('access_token')
    .eq('user_id', user.id)
    .single()

  if (!account) return NextResponse.json({ error: 'No account' }, { status: 404 })

  const accessToken = decrypt(account.access_token)
  const comments = await getPostComments(params.postId, accessToken)

  return NextResponse.json({ comments })
}
