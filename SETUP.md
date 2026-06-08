# InstaReply — Complete Setup Guide

## Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Meta Developer App](https://developers.facebook.com)
- An Instagram Business or Creator account linked to a Facebook Page
- A [Vercel](https://vercel.com) account

---

## Step 1 — Clone & Install

```bash
git clone <your-repo>
cd instagram_reply
npm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

---

## Step 2 — Supabase Setup

1. Create a new project at https://supabase.com
2. Go to **SQL Editor → New Query**
3. Paste the contents of `supabase/schema.sql` and click **Run**
4. Go to **Project Settings → API**
5. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 3 — Meta Developer App

### 3a. Create the App

1. Go to https://developers.facebook.com/apps
2. Click **Create App** → choose **Business** type
3. Fill in App Name (e.g. "InstaReply") and contact email

### 3b. Add Instagram Product

1. In the app dashboard, click **Add Product** → find **Instagram** → **Set Up**
2. Also add **Messenger** product (required for Instagram messaging webhooks)

### 3c. Get App Credentials

1. Go to **App Settings → Basic**
2. Copy **App ID** → `META_APP_ID`
3. Click **Show** next to App Secret → `META_APP_SECRET`

### 3d. Configure OAuth Redirect

1. Go to **Facebook Login → Settings**
2. Add to **Valid OAuth Redirect URIs**:
   ```
   https://your-app.vercel.app/api/auth/meta/callback
   ```
   (Also add `http://localhost:3000/api/auth/meta/callback` for local dev)

### 3e. Required Permissions

In **App Review → Permissions and Features**, request:
- `instagram_basic`
- `instagram_manage_messages`
- `pages_show_list`
- `pages_manage_metadata`
- `business_management`

> For development/testing, add your test accounts to **Roles → Test Users** or **Instagram Test Users** — permissions work without App Review for accounts added as testers.

---

## Step 4 — Instagram Business Account Setup

1. You need an **Instagram Business** or **Creator** account
2. Link it to a **Facebook Page**:
   - Go to your Facebook Page → **Settings → Instagram** → Connect Account
3. Make sure you are an **Admin** of the Facebook Page

---

## Step 5 — Environment Variables

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

META_APP_ID=1234567890
META_APP_SECRET=abcdef1234567890abcdef1234567890

# Generate a random string (openssl rand -hex 20)
META_WEBHOOK_VERIFY_TOKEN=my_random_verify_token_here

NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Exactly 32 characters (openssl rand -hex 16)
TOKEN_ENCRYPTION_KEY=abcdef1234567890abcdef1234567890
```

---

## Step 6 — Deploy to Vercel

```bash
npm install -g vercel
vercel login
vercel --prod
```

Or connect your GitHub repo in the Vercel dashboard.

Add all environment variables from `.env.local` in **Vercel → Project → Settings → Environment Variables**.

---

## Step 7 — Configure Meta Webhook

1. Deploy the app to Vercel first (you need the live URL)
2. Go to Meta App Dashboard → **Webhooks**
3. Click **Add Subscription** for **Instagram**
4. Set:
   - **Callback URL**: `https://your-app.vercel.app/api/webhook/meta`
   - **Verify Token**: the value you set in `META_WEBHOOK_VERIFY_TOKEN`
5. Subscribe to the **messages** field
6. Click **Verify and Save**

---

## Step 8 — Local Development

```bash
npm run dev
```

For local webhook testing, use [ngrok](https://ngrok.com):

```bash
ngrok http 3000
```

Use the ngrok HTTPS URL as your webhook callback and in `NEXT_PUBLIC_APP_URL`.

---

## Step 9 — First Use

1. Open `http://localhost:3000` (or your Vercel URL)
2. **Sign up** for an account
3. Go to **Dashboard → Instagram** → click **Connect Instagram Account**
4. Authorize the Meta OAuth flow
5. Go to **Auto Replies** → create keyword and default rules
6. Send a DM to your Instagram account — the auto-reply fires within seconds!

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── api/
│   │   ├── auth/meta/
│   │   │   ├── connect/route.ts    ← Initiates Meta OAuth
│   │   │   ├── callback/route.ts   ← Handles OAuth callback
│   │   │   └── disconnect/route.ts ← Removes Instagram account
│   │   ├── auto-replies/
│   │   │   ├── route.ts            ← GET list, POST create
│   │   │   └── [id]/route.ts       ← PATCH update, DELETE
│   │   ├── messages/route.ts       ← GET logs
│   │   └── webhook/meta/route.ts   ← Meta webhook endpoint
│   ├── dashboard/
│   │   ├── layout.tsx
│   │   ├── page.tsx                ← Overview
│   │   ├── connect/page.tsx        ← Instagram connection
│   │   ├── auto-replies/page.tsx   ← Rule management
│   │   └── logs/page.tsx           ← Message logs
│   ├── layout.tsx
│   └── page.tsx                    ← Landing page
├── components/
│   ├── Sidebar.tsx
│   ├── ConnectClient.tsx
│   ├── AutoRepliesClient.tsx
│   └── LogsClient.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               ← Browser client
│   │   ├── server.ts               ← Server component client
│   │   └── admin.ts                ← Service role client
│   ├── meta.ts                     ← Meta Graph API helpers
│   ├── crypto.ts                   ← Token encryption/decryption
│   ├── auto-reply.ts               ← Auto-reply engine
│   └── utils.ts
├── types/index.ts
├── middleware.ts                   ← Auth guard
supabase/
└── schema.sql                      ← Full DB schema + RLS
```

---

## Security Notes

- Access tokens are encrypted with AES before storing in Supabase
- All webhook POST requests are verified via HMAC-SHA256 signature
- Duplicate messages are filtered by message ID in-process
- All database tables use Row Level Security (RLS)
- The service role key is never exposed to the browser
- OAuth state parameter prevents CSRF attacks

---

## Auto-Reply Logic

```
Incoming DM
    │
    ▼
Save to incoming_messages
    │
    ▼
Load active auto_reply rules for this user
    │
    ├─ Keyword match? ──► Send keyword reply
    │
    └─ No match? ───────► Send default reply
                                │
                                ▼
                     Save to sent_messages
```
