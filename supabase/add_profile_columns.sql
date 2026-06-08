-- Run this in Supabase SQL Editor
-- Adds profile columns to incoming_messages table

ALTER TABLE public.incoming_messages
ADD COLUMN IF NOT EXISTS sender_username TEXT,
ADD COLUMN IF NOT EXISTS sender_profile_pic TEXT;
