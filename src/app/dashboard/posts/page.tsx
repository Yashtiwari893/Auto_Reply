import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { decrypt } from '@/lib/crypto'
import { getInstagramPosts } from '@/lib/meta'
import PostsClient from '@/components/PostsClient'

export default async function PostsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { data: account } = await admin
    .from('instagram_accounts')
    .select('access_token, instagram_id, username')
    .eq('user_id', user!.id)
    .single()

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <p className="text-sm">No Instagram account connected.</p>
      </div>
    )
  }

  const accessToken = decrypt(account.access_token)
  const posts = await getInstagramPosts(account.instagram_id, accessToken)

  return <PostsClient posts={posts} igUsername={account.username} />
}
