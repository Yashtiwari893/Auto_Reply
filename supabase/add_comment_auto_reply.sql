-- Run in Supabase SQL Editor
ALTER TABLE public.mayra_settings
ADD COLUMN IF NOT EXISTS comment_auto_reply_enabled BOOLEAN NOT NULL DEFAULT true;
