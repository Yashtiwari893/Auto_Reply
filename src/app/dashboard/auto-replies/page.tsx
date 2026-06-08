import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import MayraSettingsClient from '@/components/MayraSettingsClient'

export default async function MayraSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createAdminClient()
  const { data: settings } = await admin
    .from('mayra_settings')
    .select('*')
    .eq('user_id', user!.id)
    .single()

  const initial = settings ?? {
    bot_name: 'Mayra',
    language: 'auto',
    tone: 'casual',
    reply_length: 'short',
    custom_instructions: '',
  }

  return <MayraSettingsClient initial={initial} />
}
