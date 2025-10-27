// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Verificar se o usuário que está chamando é o administrador
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: callerUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !callerUser || callerUser.email !== 'leccorside@gmail.com') {
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Only admin can perform this action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    // 2. Buscar contagens
    
    // Total Users (Profiles)
    const { count: totalUsers, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    if (userError) throw userError;

    // Total Songs
    const { count: totalSongs, error: songError } = await supabaseAdmin
      .from('songs')
      .select('*', { count: 'exact', head: true });
      
    if (songError) throw songError;

    // Total Playlists
    const { count: totalPlaylists, error: playlistError } = await supabaseAdmin
      .from('playlists')
      .select('*', { count: 'exact', head: true });
      
    if (playlistError) throw playlistError;
    
    // Songs Added Today (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: songsToday, error: songsTodayError } = await supabaseAdmin
      .from('songs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday);
      
    if (songsTodayError) throw songsTodayError;


    return new Response(
      JSON.stringify({ 
        success: true, 
        stats: {
          totalUsers: totalUsers || 0,
          totalSongs: totalSongs || 0,
          totalPlaylists: totalPlaylists || 0,
          songsToday: songsToday || 0,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});