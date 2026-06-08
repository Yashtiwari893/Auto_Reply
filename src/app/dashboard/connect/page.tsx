import { createClient } from '@/lib/supabase/server'
import ConnectClient from '@/components/ConnectClient'

export default async function ConnectPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: account } = await supabase
    .from('instagram_accounts')
    .select('*')
    .eq('user_id', user!.id)
    .maybeSingle()

  return <ConnectClient initialAccount={account} />
}
