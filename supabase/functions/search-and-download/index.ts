// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
}

// Lista de instâncias Invidious mais confiáveis
const invidiousInstances = [
  'https://invidious.projectsegfau.lt',
  'https://vid.puffyan.us',
  'https://yewtu.be',
  'https://iv.ggtyler.dev',
  'https://invidious.snopyta.org',
  'https://invidious.epicsite.xyz',
];

// Function to search YouTube videos using Invidious API
async function searchYouTube(query: string): Promise<SearchResult[]> {
  try {
    let results: SearchResult[] = [];
    
    for (const instance of invidiousInstances) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(
          `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
          { 
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data && data.length > 0) {
            results = data.slice(0, 5).map((video: any) => ({
              id: video.videoId,
              title: video.title,
              artist: video.author || video.authorId || 'Unknown Artist',
              thumbnail: video.videoThumbnails?.[0]?.url || 
                         `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`,
              duration: video.lengthSeconds || 0,
            }));
            
            return results;
          }
        }
      } catch (err) {
        continue;
      }
    }
    
    if (results.length === 0) {
      throw new Error('Não foi possível buscar músicas no momento. Tente novamente em alguns instantes.');
    }
    
    return results;
  } catch (error) {
    throw error;
  }
}

// Function to get the direct audio URL for a video ID
async function getDirectAudioUrl(videoId: string): Promise<string> {
  let lastError: Error | null = null;

  for (const instance of invidiousInstances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch(
        `${instance}/api/v1/videos/${videoId}`,
        { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // Find the best audio stream
        const audioStream = data.adaptiveFormats?.find((format: any) => 
          format.type.startsWith('audio/') && format.qualityLabel === null
        );

        if (audioStream && audioStream.url) {
          return audioStream.url;
        }
      }
    } catch (err) {
      lastError = err as Error;
      continue;
    }
  }

  throw new Error('Não foi possível obter o link de áudio direto para download. Todas as fontes falharam.');
}


Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Handle /stream endpoint (not used for offline download, but kept for completeness)
    if (pathname.includes('/stream')) {
      return new Response(JSON.stringify({ 
        error: 'Please use the YouTube player URL',
        playbackUrl: `https://www.youtube.com/watch?v=${url.searchParams.get('videoId')}`
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { action, query, videoId } = await req.json();

    if (action === 'search') {
      const results = await searchYouTube(query);
      
      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'get_audio_url') {
      if (!videoId) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing videoId' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      try {
        const directAudioUrl = await getDirectAudioUrl(videoId);
        
        return new Response(
          JSON.stringify({ success: true, audioUrl: directAudioUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao buscar link de áudio.';
        return new Response(
          JSON.stringify({ success: false, error: errorMessage }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      
    } else if (action === 'download') {
      // Logic for saving song metadata to DB (already implemented)
      const { data: existingSong } = await supabase
        .from('songs')
        .select('*')
        .eq('youtube_id', videoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSong) {
        return new Response(
          JSON.stringify({ success: true, song: existingSong }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const searchResults = await searchYouTube(videoId);
      
      if (!searchResults || searchResults.length === 0) {
        throw new Error('Vídeo não encontrado');
      }
      
      const videoInfo = searchResults[0];
      const playbackUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      const { data: song, error } = await supabase
        .from('songs')
        .insert({
          title: videoInfo.title,
          artist: videoInfo.artist,
          duration: videoInfo.duration,
          thumbnail_url: videoInfo.thumbnail,
          audio_url: playbackUrl,
          youtube_id: videoId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, song }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});