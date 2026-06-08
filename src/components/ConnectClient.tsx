'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, AlertCircle, Loader2, Unlink } from 'lucide-react'
import InstagramIcon from '@/components/InstagramIcon'
import type { InstagramAccount } from '@/types'
import { formatDate } from '@/lib/utils'

export default function ConnectClient({
  initialAccount,
}: {
  initialAccount: InstagramAccount | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [account, setAccount] = useState(initialAccount)
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const successParam = searchParams.get('success')
  const errorParam = searchParams.get('error')

  // On success, force a hard refresh to reload server-side data
  useEffect(() => {
    if (successParam === 'true' && !initialAccount) {
      router.refresh()
    }
  }, [successParam, initialAccount, router])

  async function handleDisconnect() {
    if (!confirm('Are you sure you want to disconnect your Instagram account?')) return
    setDisconnecting(true)
    const res = await fetch('/api/auth/meta/disconnect', { method: 'POST' })
    if (res.ok) {
      setAccount(null)
      router.refresh()
    }
    setDisconnecting(false)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Instagram Connection</h1>
      <p className="text-gray-500 text-sm mb-8">
        Connect your Instagram Business account to enable automated replies.
      </p>

      {successParam && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6 text-green-800 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          Instagram account connected successfully!
        </div>
      )}

      {errorParam && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Error: {decodeURIComponent(errorParam)}</span>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {account ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-tr from-purple-500 to-pink-500 p-3 rounded-2xl">
                <InstagramIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">@{account.username}</p>
                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                    Connected
                  </span>
                </div>
                <p className="text-sm text-gray-500">Instagram ID: {account.instagram_id}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Page ID</p>
                <p className="font-medium text-gray-900 font-mono text-xs mt-1">{account.page_id}</p>
              </div>
              <div>
                <p className="text-gray-500">Connected</p>
                <p className="font-medium text-gray-900 mt-1">{formatDate(account.created_at)}</p>
              </div>
              {account.token_expiry && (
                <div>
                  <p className="text-gray-500">Token Expires</p>
                  <p className="font-medium text-gray-900 mt-1">{formatDate(account.token_expiry)}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <a
                href="/api/auth/meta/connect"
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
              >
                <InstagramIcon className="w-4 h-4" />
                Reconnect Account
              </a>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition disabled:opacity-60"
              >
                {disconnecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Unlink className="w-4 h-4" />
                )}
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <InstagramIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No account connected</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Connect your Instagram Business account linked to a Facebook Page to enable
              automatic replies.
            </p>
            <a
              href="/api/auth/meta/connect"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
            >
              <InstagramIcon className="w-4 h-4" />
              Connect Instagram Account
            </a>
          </div>
        )}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Requirements</p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Instagram Business or Creator account</li>
          <li>Facebook Page linked to the Instagram account</li>
          <li>Admin access to the Facebook Page</li>
        </ul>
      </div>
    </div>
  )
}
