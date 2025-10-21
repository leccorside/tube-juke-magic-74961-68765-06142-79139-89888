import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Invidious instances for fallback
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

async function getAudioStreamUrl(youtubeId: string): Promise<{ url: string; mimeType: string }> {
  console.log('Fetching audio stream URL for download:', youtubeId);
  
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

      // Sort by bitrate descending to get the highest quality audio
      audioFormats.sort((a, b) => b.bitrate - a.bitrate);
      
      console.log(`✅ Success with ${instance}, found audio format: ${audioFormats[0].quality} (${audioFormats[0].bitrate})`);
      
      return {
        url: audioFormats[0].url,
        mimeType: audioFormats[0].mimeType
      };
    } catch (error) {
      const errorMsg = `${instance} error: ${error instanceof Error ? error.message : String(error)}`;
      console.error(errorMsg);
      errors.push(errorMsg);
      continue;
    }
  }

  console.error('All instances failed:', errors);
  // Throw a detailed error message including all collected errors
  throw new Error(`Falha ao obter stream de áudio. Detalhes: ${errors.join(' | ')}`);
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
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    const body = await req.json();
    const { youtubeId } = body;

    if (!youtubeId) {
      return new Response(
        JSON.stringify({ error: 'youtubeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Getting download URL for:', youtubeId);

    // Get audio stream URL and return it directly
    const { url: audioUrl, mimeType } = await getAudioStreamUrl(youtubeId);

    // Return the URL and mimeType to the client
    return new Response(
      JSON.stringify({ audioUrl, mimeType }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in download-audio:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Return the detailed error message in the 500 response
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});