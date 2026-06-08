import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPages,
  getInstagramAccountInfo,
} from '@/lib/meta'
import { encrypt } from '@/lib/crypto'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const stateCookie = request.cookies.get('meta_oauth_state')?.value

  const redirectBase = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/connect`

  if (error) {
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent(error)}`)
  }

  if (!code) {
    return NextResponse.redirect(`${redirectBase}?error=no_code`)
  }

  if (stateCookie && state !== stateCookie) {
    return NextResponse.redirect(`${redirectBase}?error=invalid_state`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/login`)
  }

  try {
    const admin = createAdminClient()

    // Ensure user exists in public.users (trigger may not have fired)
    await admin.from('users').upsert(
      { id: user.id, email: user.email ?? '' },
      { onConflict: 'id' }
    )

    // Exchange code for short-lived token, then get long-lived token
    const shortToken = await exchangeCodeForToken(code)
    const longToken = await getLongLivedToken(shortToken.access_token)

    // Get Facebook Pages connected to this user
    const pages = await getUserPages(longToken.access_token)
    const igPage = pages.find((p) => p.instagram_business_account)

    if (!igPage || !igPage.instagram_business_account) {
      return NextResponse.redirect(
        `${redirectBase}?error=${encodeURIComponent('No Instagram Business Account linked to your Facebook Pages')}`
      )
    }

    const igAccountId = igPage.instagram_business_account.id
    const igInfo = await getInstagramAccountInfo(igAccountId, igPage.access_token)

    const tokenExpiry = longToken.expires_in
      ? new Date(Date.now() + longToken.expires_in * 1000).toISOString()
      : null

    const { error: upsertError } = await admin.from('instagram_accounts').upsert(
      {
        user_id: user.id,
        instagram_id: igAccountId,
        page_id: igPage.id,
        username: igInfo.username,
        access_token: encrypt(igPage.access_token),
        token_expiry: tokenExpiry,
      },
      { onConflict: 'user_id' }
    )

    if (upsertError) {
      console.error('[meta/callback] upsert error:', upsertError)
      return NextResponse.redirect(
        `${redirectBase}?error=${encodeURIComponent(upsertError.message)}`
      )
    }

    const response = NextResponse.redirect(`${redirectBase}?success=true`)
    response.cookies.delete('meta_oauth_state')
    return response
  } catch (err) {
    console.error('[meta/callback]', err)
    const msg = err instanceof Error ? err.message : 'Connection failed'
    return NextResponse.redirect(`${redirectBase}?error=${encodeURIComponent(msg)}`)
  }
}
