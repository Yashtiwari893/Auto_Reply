-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.sender_settings (
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  auto_reply_enabled BOOLEAN NOT NULL DEFAULT true,
  PRIMARY KEY (user_id, sender_id)
);
ALTER TABLE public.sender_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sender_settings: own rows" ON public.sender_settings
  USING (auth.uid() = user_id);
