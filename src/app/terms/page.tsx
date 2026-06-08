import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: June 2025</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using InstaReply (&quot;the Service&quot;), you agree to be bound by
              these Terms and Conditions. If you do not agree to these terms, please do not use
              the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              InstaReply is an automated Instagram direct message reply service. It allows
              Instagram Business account owners to configure keyword-based automatic responses
              to incoming DMs using the official Meta Graph API and Instagram Messaging API.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Eligibility</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>You must be at least 18 years old to use this Service.</li>
              <li>You must own or have admin access to the Instagram Business account you connect.</li>
              <li>You must comply with Meta&apos;s Terms of Service and Platform Policies.</li>
              <li>You must comply with Instagram&apos;s Community Guidelines.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. User Responsibilities</h2>
            <p>You agree that you will NOT use the Service to:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Send spam, unsolicited messages, or bulk promotional content.</li>
              <li>Harass, abuse, or harm other users.</li>
              <li>Violate any applicable laws or regulations.</li>
              <li>Impersonate any person or entity.</li>
              <li>Send content that is illegal, offensive, or violates Meta&apos;s policies.</li>
              <li>Attempt to reverse engineer or misuse the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Meta Platform Compliance</h2>
            <p>
              Our Service operates exclusively through the official Meta Graph API and Instagram
              Messaging API. By using our Service, you also agree to comply with:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>
                <a href="https://www.facebook.com/terms.php" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Meta Terms of Service
                </a>
              </li>
              <li>
                <a href="https://developers.facebook.com/terms/" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Meta Platform Terms
                </a>
              </li>
              <li>
                <a href="https://help.instagram.com/581066165581870" className="text-purple-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Instagram Community Guidelines
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Account & Access Tokens</h2>
            <p>
              When you connect your Instagram account, you authorize InstaReply to receive
              and respond to messages on your behalf. You can revoke this access at any time by:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Disconnecting your account from the InstaReply dashboard.</li>
              <li>Revoking app permissions from your Facebook account settings.</li>
            </ul>
            <p className="mt-2">
              You are responsible for maintaining the security of your InstaReply account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Automated Messaging</h2>
            <p>
              You acknowledge that auto-reply messages are sent on your behalf. You are solely
              responsible for the content of the auto-reply messages you configure. InstaReply
              is not liable for any replies sent through your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p>
              InstaReply is provided &quot;as is&quot; without warranties of any kind. We are not liable for:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Service interruptions or downtime.</li>
              <li>Loss of data or messages.</li>
              <li>Actions taken by Meta that affect the Service (API changes, account restrictions).</li>
              <li>Any indirect, incidental, or consequential damages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these
              Terms. You may terminate your account at any time by deleting it from the dashboard.
              Upon termination, all your data will be permanently deleted.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify users of significant
              changes by updating the &quot;Last updated&quot; date at the top of this page. Continued
              use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable laws.
              Any disputes arising from these Terms shall be resolved through mutual agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Contact Us</h2>
            <p>
              For any questions regarding these Terms, please contact us at:{' '}
              <a href="mailto:support@auto-reply-neon.vercel.app" className="text-purple-600 hover:underline">
                support@auto-reply-neon.vercel.app
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6 text-sm text-gray-500">
          <Link href="/privacy-policy" className="text-purple-600 hover:underline">Privacy Policy</Link>
          <Link href="/" className="hover:text-gray-700">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
