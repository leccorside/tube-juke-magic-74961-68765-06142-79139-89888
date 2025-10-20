import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Invidious instances for fallback - updated with more reliable instances
const INVIDIOUS_INSTANCES = [
  'https://iv.nboeck.de',
  'https://invidious.privacyredirect.com',
  'https://inv.tux.pizza',
  'https://invidious.jing.rocks',
  'https://iv.melmac.space',
];

interface AudioFormat {
  url: string;
  mimeType: string;
  quality: string;
  bitrate: number;
}

async function getAudioStreamUrl(youtubeId: string): Promise<string> {
  console.log('Fetching audio stream URL for:', youtubeId);
  
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/videos/${youtubeId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) continue;

      const data = await response.json();
      
      // Find best audio format (prefer opus or m4a)
      const audioFormats: AudioFormat[] = data.adaptiveFormats
        ?.filter((f: any) => f.type?.includes('audio'))
        ?.map((f: any) => ({
          url: f.url,
          mimeType: f.type,
          quality: f.audioQuality || 'MEDIUM',
          bitrate: f.bitrate || 128000
        })) || [];

      if (audioFormats.length === 0) {
        console.log(`No audio formats found on ${instance}`);
        continue;
      }

      // Sort by bitrate (higher is better)
      audioFormats.sort((a, b) => b.bitrate - a.bitrate);
      
      console.log(`Found audio stream on ${instance}:`, audioFormats[0]);
      return audioFormats[0].url;
    } catch (error) {
      console.error(`Error with instance ${instance}:`, error);
      continue;
    }
  }

  throw new Error('Could not fetch audio stream from any Invidious instance');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { youtubeId } = await req.json();

    if (!youtubeId) {
      throw new Error('youtubeId is required');
    }

    const audioUrl = await getAudioStreamUrl(youtubeId);

    return new Response(
      JSON.stringify({ audioUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in get-audio-stream:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
