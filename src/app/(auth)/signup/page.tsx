'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #e6f7f1 0%, #ffffff 50%, #e6f7f1 100%)' }}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
          <div className="rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#e6f7f1' }}>
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#09AF72' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ color: '#0D163F' }}>Check your email</h2>
          <p className="text-gray-500 text-sm">We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #e6f7f1 0%, #ffffff 50%, #e6f7f1 100%)' }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <Image src="/11za-logo.svg" alt="11za" width={100} height={40} className="mb-4" priority />
          <h1 className="text-2xl font-bold" style={{ color: '#0D163F' }}>Create account</h1>
          <p className="text-gray-500 mt-1 text-sm">Start automating your Instagram DMs</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2"
              placeholder="Min. 8 characters"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-2 rounded-lg font-medium text-sm hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ backgroundColor: '#09AF72' }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: '#09AF72' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
