import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Trash2, Music } from "lucide-react";
import { toast } from "sonner";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  audio_url: string;
  duration: number;
  youtube_id: string;
}

interface PlaylistSong {
  id: string;
  position: number;
  songs: Song; // Objeto Song
}

// Tipo auxiliar para o retorno da query do Supabase
interface SupabasePlaylistSong {
  id: string;
  position: number;
  songs: Song | Song[] | null; // Supabase pode retornar array ou objeto
}

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setCurrentSong, setPlaylist } = useMusicPlayer();
  const [playlistName, setPlaylistName] = useState("");
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPlaylistDetails();
    }
  }, [id]);

  const loadPlaylistDetails = async () => {
    try {
      // Load playlist info
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("name")
        .eq("id", id)
        .single();

      if (playlistError) throw playlistError;
      setPlaylistName(playlistData.name);

      // Load songs in playlist
      const { data: songsData, error: songsError } = await supabase
        .from("playlist_songs")
        .select(`
          id,
          position,
          songs (
            id,
            title,
            artist,
            thumbnail_url,
            audio_url,
            duration,
            youtube_id
          )
        `)
        .eq("playlist_id", id)
        .order("position", { ascending: true });

      if (songsError) throw songsError;
      
      // Mapeia os dados para garantir que 'songs' seja um objeto Song único
      const mappedSongs: PlaylistSong[] = (songsData as SupabasePlaylistSong[] || [])
        .map(item => {
          // Se songs for um array, pega o primeiro elemento (comportamento comum do Supabase)
          const songDetail = Array.isArray(item.songs) ? item.songs[0] : item.songs;
          
          // Garante que songDetail não é nulo antes de retornar
          if (songDetail) {
            return {
              id: item.id,
              position: item.position,
              songs: songDetail,
            };
          }
          return null;
        })
        .filter((item): item is PlaylistSong => item !== null); // Filtra nulos

      setSongs(mappedSongs);
    } catch (error: any) {
      toast.error("Erro ao carregar playlist: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const playPlaylist = () => {
    if (songs.length === 0) {
      toast.error("Esta playlist está vazia");
      return;
    }

    const playlist = songs.map((ps) => ps.songs);
    setPlaylist(playlist);
    setCurrentSong(playlist[0]);
    toast.success("Tocando playlist!");
  };

  const playSong = (song: Song) => {
    const playlist = songs.map((ps) => ps.songs);
    setPlaylist(playlist);
    setCurrentSong(song);
  };

  const removeSongFromPlaylist = async (playlistSongId: string) => {
    try {
      const { error } = await supabase
        .from("playlist_songs")
        .delete()
        .eq("id", playlistSongId);

      if (error) throw error;

      toast.success("Música removida da playlist!");
      loadPlaylistDetails();
    } catch (error: any) {
      toast.error("Erro ao remover música: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-background to-card">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/playlists")}
              size={isMobile ? "sm" : "default"}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            {songs.length > 0 && (
              <Button onClick={playPlaylist} size={isMobile ? "sm" : "default"}>
                <Play className="w-4 h-4" />
                {!isMobile && <span className="ml-2">Tocar Playlist</span>}
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Music className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-primary-foreground`} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={`${isMobile ? 'text-xl' : 'text-3xl'} font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent truncate`}>
                {playlistName}
              </h1>
              <p className="text-muted-foreground text-sm">
                {songs.length} {songs.length === 1 ? "música" : "músicas"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">

        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando...</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Esta playlist está vazia
            </h3>
            <p className="text-muted-foreground">
              Adicione músicas à playlist através do botão "+" nas suas músicas
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {songs.map((playlistSong, index) => {
              const song = playlistSong.songs;
              return (
                <Card
                  key={playlistSong.id}
                  className="p-3 md:p-4 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-center gap-2 md:gap-4">
                    <span className={`text-muted-foreground font-mono ${isMobile ? 'text-xs w-6' : 'text-sm w-8'}`}>
                      {index + 1}
                    </span>
                    <img
                      src={song.thumbnail_url || "/placeholder.svg"}
                      alt={song.title}
                      className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-lg object-cover`}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold text-foreground truncate ${isMobile ? 'text-sm' : ''}`}>
                        {song.title}
                      </h3>
                      <p className={`text-muted-foreground truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        {song.artist}
                      </p>
                    </div>
                    <div className={`flex gap-1 md:gap-2 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => playSong(song)}
                        className={isMobile ? 'h-8 w-8' : ''}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeSongFromPlaylist(playlistSong.id)}
                        className={isMobile ? 'h-8 w-8' : ''}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}