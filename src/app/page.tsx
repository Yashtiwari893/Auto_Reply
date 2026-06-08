import Link from 'next/link'
import Image from 'next/image'
import { Zap, MessageCircle, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Nav */}
      <nav className="border-b border-gray-100 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Image src="/11za-logo.svg" alt="11za" width={72} height={29} priority />
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
              style={{ backgroundColor: '#09AF72' }}
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div
          className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full mb-6"
          style={{ backgroundColor: '#e6f7f1', color: '#09AF72' }}
        >
          <Zap className="w-3.5 h-3.5" />
          Powered by Meta Graph API
        </div>
        <h1 className="text-5xl font-extrabold leading-tight mb-6" style={{ color: '#0D163F' }}>
          Auto-Reply to Instagram DMs
          <br />
          <span style={{ color: '#09AF72' }}>on autopilot</span>
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
          Connect your Instagram Business account and set keyword-based auto-replies. Never miss a
          customer message again — respond instantly, 24/7.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/signup"
            className="text-white px-8 py-3 rounded-xl text-sm font-semibold hover:opacity-90 transition shadow-lg"
            style={{ backgroundColor: '#09AF72', boxShadow: '0 8px 24px rgba(9,175,114,0.25)' }}
          >
            Start for free →
          </Link>
          <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition">
            Sign in to dashboard
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-2 gap-6 md:grid-cols-4">
        {[
          {
            icon: MessageCircle,
            title: 'Official Meta API',
            desc: 'Built exclusively on Meta Graph API & Instagram Messaging API. No third-party providers.',
          },
          {
            icon: Zap,
            title: 'Smart Keyword Rules',
            desc: 'Match incoming messages against keywords and send personalized auto-replies instantly.',
          },
          {
            icon: MessageCircle,
            title: 'Full Message Logs',
            desc: 'Track every incoming DM and outgoing reply with searchable, paginated logs.',
          },
          {
            icon: Shield,
            title: 'Secure by Design',
            desc: 'Webhook signature validation, encrypted token storage, and per-user Row Level Security.',
          },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#e6f7f1' }}>
              <f.icon className="w-5 h-5" style={{ color: '#09AF72' }} />
            </div>
            <h3 className="font-semibold mb-2" style={{ color: '#0D163F' }}>{f.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
