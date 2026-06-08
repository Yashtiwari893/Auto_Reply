-- Run in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.mayra_settings (
  user_id            UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  bot_name           TEXT NOT NULL DEFAULT 'Mayra',
  language           TEXT NOT NULL DEFAULT 'auto',
  tone               TEXT NOT NULL DEFAULT 'casual',
  reply_length       TEXT NOT NULL DEFAULT 'short',
  custom_instructions TEXT DEFAULT NULL,
  updated_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.mayra_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mayra_settings: own row" ON public.mayra_settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
