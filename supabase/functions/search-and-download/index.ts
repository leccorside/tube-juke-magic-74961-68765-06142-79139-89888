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

// Function to search YouTube videos using Invidious API
async function searchYouTube(query: string): Promise<SearchResult[]> {
  try {
    console.log('Searching YouTube for:', query);
    
    const invidiousInstances = [
      'https://yewtu.be',
      'https://inv.us.projectsegfau.lt',
      'https://y.com.sb',
      'https://invidious.io.lol',
      'https://iv.ggtyler.dev',
      'https://invidious.epicsite.xyz',
    ];
    
    let results: SearchResult[] = [];
    let lastError: Error | null = null;
    
    for (const instance of invidiousInstances) {
      try {
        console.log(`Trying instance: ${instance}`);
        
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
          console.log(`Success with ${instance}, found ${data.length} results`);
          
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
        } else {
          console.log(`Instance ${instance} returned status: ${response.status}`);
        }
      } catch (err) {
        lastError = err as Error;
        console.log(`Failed with instance ${instance}:`, err instanceof Error ? err.message : 'Unknown error');
        continue;
      }
    }
    
    if (results.length === 0) {
      console.error('All Invidious instances failed. Last error:', lastError);
      throw new Error('Não foi possível buscar músicas no momento. Tente novamente em alguns instantes.');
    }
    
    return results;
  } catch (error) {
    console.error('Error searching YouTube:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Stream endpoint - proxy YouTube audio directly
    if (pathname.includes('/stream')) {
      const videoId = url.searchParams.get('videoId');
      if (!videoId) {
        return new Response(JSON.stringify({ error: 'Missing videoId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      try {
        console.log(`Stream request for video ${videoId}`);
        
        // Build YouTube embed player URL which allows direct streaming
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Return redirect to YouTube (browsers can play this directly)
        return new Response(JSON.stringify({ 
          error: 'Please use the YouTube player URL',
          playbackUrl: youtubeUrl 
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error in /stream:', error);
        return new Response(JSON.stringify({ 
          error: 'Failed to get stream', 
          details: error instanceof Error ? error.message : 'Unknown error' 
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
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
      // Search for videos
      const results = await searchYouTube(query);
      
      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'download') {
      // Check if song already exists for this user
      const { data: existingSong } = await supabase
        .from('songs')
        .select('*')
        .eq('youtube_id', videoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSong) {
        console.log('Song already exists for user:', existingSong);
        return new Response(
          JSON.stringify({ success: true, song: existingSong }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Search to get video info/metadata
      const searchResults = await searchYouTube(videoId);
      
      if (!searchResults || searchResults.length === 0) {
        throw new Error('Vídeo não encontrado');
      }
      
      const videoInfo = searchResults[0];
      
      // Store YouTube video ID - player will use YouTube iframe API
      const playbackUrl = `https://www.youtube.com/watch?v=${videoId}`;
      
      const { data: song, error } = await supabase
        .from('songs')
        .insert({
          title: videoInfo.title,
          artist: videoInfo.artist,
          duration: videoInfo.duration,
          thumbnail_url: videoInfo.thumbnail,
          audio_url: playbackUrl, // Store YouTube URL
          youtube_id: videoId,
          user_id: user.id, // Associate with user
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Song saved successfully:', song);

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
    console.error('Error in function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
