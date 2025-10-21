-- Remove the unique constraint on youtube_id alone
ALTER TABLE public.songs DROP CONSTRAINT IF EXISTS songs_youtube_id_key;

-- Create a composite unique constraint on youtube_id and user_id
-- This allows the same song to be in different users' libraries
ALTER TABLE public.songs ADD CONSTRAINT songs_youtube_id_user_id_key UNIQUE (youtube_id, user_id);