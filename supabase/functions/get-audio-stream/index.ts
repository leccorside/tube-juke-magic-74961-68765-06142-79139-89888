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
  
  const errors: string[] = [];
  
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`Trying instance: ${instance}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(`${instance}/api/v1/videos/${youtubeId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorMsg = `${instance} returned status: ${response.status}`;
        console.log(errorMsg);
        errors.push(errorMsg);
        continue;
      }

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
        const errorMsg = `No audio formats found on ${instance}`;
        console.log(errorMsg);
        errors.push(errorMsg);
        continue;
      }

      // Sort by bitrate (higher is better)
      audioFormats.sort((a, b) => b.bitrate - a.bitrate);
      
      console.log(`✅ Success with ${instance}, found audio format:`, {
        mimeType: audioFormats[0].mimeType,
        quality: audioFormats[0].quality,
        bitrate: audioFormats[0].bitrate
      });
      
      return audioFormats[0].url;
    } catch (error) {
      const errorMsg = `${instance} error: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      continue;
    }
  }

  console.error('All instances failed:', errors);
  throw new Error(`Could not fetch audio stream. Tried ${INVIDIOUS_INSTANCES.length} instances. Errors: ${errors.join('; ')}`);
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

    console.log('Streaming audio for:', youtubeId);

    const audioUrl = await getAudioStreamUrl(youtubeId);
    
    // Fetch the audio and stream it back
    const audioResponse = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'audio/webm,audio/ogg,audio/*;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': `https://www.youtube.com/watch?v=${youtubeId}`,
        'Origin': 'https://www.youtube.com'
      }
    });

    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.status}`);
    }

    // Stream the audio directly to the client
    return new Response(audioResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': audioResponse.headers.get('content-type') || 'audio/webm',
        'Content-Length': audioResponse.headers.get('content-length') || '',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Error in get-audio-stream:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
