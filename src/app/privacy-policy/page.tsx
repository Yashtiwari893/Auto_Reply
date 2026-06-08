import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: June 2025</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              InstaReply (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the InstaReply service, which allows
              Instagram Business account owners to set up automated replies to direct messages.
              This Privacy Policy explains how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Account Information:</strong> Email address used to sign up.</li>
              <li><strong>Instagram Data:</strong> Instagram account ID, Page ID, and username obtained through Meta OAuth.</li>
              <li><strong>Message Data:</strong> Text content of incoming Instagram DMs and outgoing auto-replies, stored solely to provide the service.</li>
              <li><strong>Access Tokens:</strong> Meta API access tokens, stored in encrypted form.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>To authenticate your Instagram Business account via Meta OAuth.</li>
              <li>To receive incoming Instagram direct messages via Meta Webhooks.</li>
              <li>To send automated replies on your behalf using the Meta Graph API.</li>
              <li>To display message logs in your dashboard.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Meta Permissions We Use</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>instagram_basic</strong> — To read your Instagram account profile information.</li>
              <li><strong>instagram_manage_messages</strong> — To read incoming DMs and send automated replies.</li>
              <li><strong>pages_show_list</strong> — To list Facebook Pages connected to your account.</li>
              <li><strong>pages_manage_metadata</strong> — To manage webhook subscriptions on your Page.</li>
              <li><strong>business_management</strong> — To access Instagram accounts linked to your business.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Storage & Security</h2>
            <p>
              All data is stored in a secure Supabase (PostgreSQL) database. Access tokens are
              encrypted using AES-256 before storage. We use Row Level Security (RLS) to ensure
              each user can only access their own data. We do not sell or share your data with
              third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Retention</h2>
            <p>
              We retain your data for as long as your account is active. You may delete your
              account and all associated data at any time by disconnecting your Instagram account
              from the dashboard or contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Third-Party Services</h2>
            <p>
              We use the following third-party services to operate InstaReply:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Meta Graph API</strong> — For Instagram messaging.</li>
              <li><strong>Supabase</strong> — For database and authentication.</li>
              <li><strong>Vercel</strong> — For application hosting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request deletion of your data.</li>
              <li>Revoke Meta OAuth permissions at any time via your Facebook settings.</li>
              <li>Disconnect your Instagram account from our platform at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:support@auto-reply-neon.vercel.app" className="text-purple-600 hover:underline">
                support@auto-reply-neon.vercel.app
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
          <a href="/terms" className="text-purple-600 hover:underline">Terms and Conditions</a>
          <Link href="/" className="hover:text-gray-700">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
