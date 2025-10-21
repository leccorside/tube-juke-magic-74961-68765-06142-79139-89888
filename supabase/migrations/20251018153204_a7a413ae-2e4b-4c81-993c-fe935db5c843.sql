-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public)
VALUES ('music-files', 'music-files', true);

-- Create table for music metadata
CREATE TABLE public.songs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT,
  duration INTEGER,
  thumbnail_url TEXT,
  audio_url TEXT,
  youtube_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (anyone can view songs)
CREATE POLICY "Songs are viewable by everyone" 
ON public.songs 
FOR SELECT 
USING (true);

-- Create policy for public insert (anyone can add songs)
CREATE POLICY "Anyone can add songs" 
ON public.songs 
FOR INSERT 
WITH CHECK (true);

-- Create index for faster searches
CREATE INDEX idx_songs_title ON public.songs(title);
CREATE INDEX idx_songs_youtube_id ON public.songs(youtube_id);

-- Storage policies for music files bucket
CREATE POLICY "Music files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'music-files');

CREATE POLICY "Anyone can upload music files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'music-files');