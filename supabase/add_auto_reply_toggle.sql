-- Run this in Supabase SQL Editor

ALTER TABLE public.instagram_accounts
ADD COLUMN IF NOT EXISTS auto_reply_enabled BOOLEAN NOT NULL DEFAULT true;
