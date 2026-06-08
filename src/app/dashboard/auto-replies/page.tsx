import { createClient } from '@/lib/supabase/server'
import AutoRepliesClient from '@/components/AutoRepliesClient'

export default async function AutoRepliesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rules } = await supabase
    .from('auto_replies')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  return <AutoRepliesClient initialRules={rules ?? []} />
}
