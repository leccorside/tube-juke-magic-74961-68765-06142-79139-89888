import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Type, Content-Range',
};

// Invidious instances for fallback
const INVIDIOUS_INSTANCES = [
  'https://iv.nboeck.de',
  'https://invidious.privacyredirect.com',
  'https://inv.tux.pizza',
  'https://invidious.jing.rocks',
  'https://iv.melmac.space',
  'https://invidious.projectsegfau.lt',
  'https://y.com.sb',
  'https://invidious.epicsite.xyz',
];

interface AudioFormat {
  url: string;
  mimeType: string;
  quality: string;
  bitrate: number;
}

async function getAudioStreamUrl(youtubeId: string): Promise<string> {
  console.log('Fetching audio stream URL for proxy:', youtubeId);
  
  const errors: string[] = [];
  
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`Trying instance: ${instance}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
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

      audioFormats.sort((a, b) => b.bitrate - a.bitrate);
      
      const bestFormat = audioFormats[0];
      
      console.log(`✅ Success with ${instance}, found audio URL`);
      
      return bestFormat.url;
    } catch (error) {
      const errorMsg = `${instance} error: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      continue;
    }
  }

  console.error('All instances failed:', errors);
  throw new Error(`Could not fetch audio stream URL. Errors: ${errors.join('; ')}`);
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
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { youtubeId } = await req.json();

    if (!youtubeId) {
      throw new Error('youtubeId is required');
    }

    const audioUrl = await getAudioStreamUrl(youtubeId);
    
    // Proxy the audio stream
    const audioResponse = await fetch(audioUrl, {
      headers: {
        // Important: Forward Range header for seeking
        ...(req.headers.get('Range') && { 'Range': req.headers.get('Range')! }),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio stream: ${audioResponse.statusText}`);
    }

    // Create headers for streaming response
    const responseHeaders = new Headers(corsHeaders);
    audioResponse.headers.forEach((value, key) => {
      // Copy relevant headers for streaming
      if (['content-type', 'content-length', 'content-range', 'accept-ranges'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    
    // Return the proxied stream
    return new Response(audioResponse.body, {
      status: audioResponse.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Error in stream-audio:', error);
    
    const status = error instanceof Error && error.message.includes('Could not fetch audio stream URL') ? 503 : 400;

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});