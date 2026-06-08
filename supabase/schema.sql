-- ============================================================
-- Instagram Auto-Reply SaaS — Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── users ────────────────────────────────────────────────────
-- Mirrors auth.users; populated via trigger on signup
CREATE TABLE IF NOT EXISTS public.users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-populate from auth.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── instagram_accounts ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.instagram_accounts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  instagram_id  TEXT NOT NULL,
  page_id       TEXT NOT NULL,
  username      TEXT NOT NULL,
  access_token  TEXT NOT NULL,        -- encrypted AES value
  token_expiry  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id),                   -- one IG account per user
  UNIQUE (instagram_id)
);

-- ── auto_replies ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.auto_replies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trigger_type  TEXT NOT NULL CHECK (trigger_type IN ('keyword', 'default')),
  keyword       TEXT,                 -- NULL when trigger_type = 'default'
  reply_message TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── incoming_messages ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.incoming_messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id    TEXT NOT NULL,
  sender_name  TEXT,
  message_text TEXT NOT NULL,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── sent_messages ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sent_messages (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id  TEXT NOT NULL,
  message_text  TEXT NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_replies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sent_messages     ENABLE ROW LEVEL SECURITY;

-- users: own row only
CREATE POLICY "users: own row" ON public.users
  USING (auth.uid() = id);

-- instagram_accounts: own rows only
CREATE POLICY "instagram_accounts: own rows" ON public.instagram_accounts
  USING (auth.uid() = user_id);

-- auto_replies: own rows only
CREATE POLICY "auto_replies: own rows" ON public.auto_replies
  USING (auth.uid() = user_id);

-- incoming_messages: own rows only
CREATE POLICY "incoming_messages: own rows" ON public.incoming_messages
  USING (auth.uid() = user_id);

-- sent_messages: own rows only
CREATE POLICY "sent_messages: own rows" ON public.sent_messages
  USING (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_auto_replies_user_active
  ON public.auto_replies (user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_incoming_messages_user
  ON public.incoming_messages (user_id, received_at DESC);

CREATE INDEX IF NOT EXISTS idx_sent_messages_user
  ON public.sent_messages (user_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS idx_instagram_accounts_ig_id
  ON public.instagram_accounts (instagram_id);
