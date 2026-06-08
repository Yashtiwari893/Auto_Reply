-- Run this in Supabase SQL Editor to add conversation history support

CREATE TABLE IF NOT EXISTS public.conversation_history (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id  TEXT NOT NULL,   -- Instagram sender's ID
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.conversation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversation_history: own rows" ON public.conversation_history
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conv_history_user_sender
  ON public.conversation_history (user_id, sender_id, created_at DESC);
