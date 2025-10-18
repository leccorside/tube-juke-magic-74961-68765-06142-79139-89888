import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Play, Trash2, Music } from "lucide-react";
import { toast } from "sonner";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

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
  songs: Song;
}

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      setSongs(songsData || []);
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
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/playlists")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            {songs.length > 0 && (
              <Button onClick={playPlaylist} className="gap-2">
                <Play className="w-5 h-5" />
                Tocar Playlist
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Music className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {playlistName}
              </h1>
              <p className="text-muted-foreground">
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
          <div className="space-y-4">
            {songs.map((playlistSong, index) => {
              const song = playlistSong.songs;
              return (
                <Card
                  key={playlistSong.id}
                  className="p-4 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground font-mono text-sm w-8">
                      {index + 1}
                    </span>
                    <img
                      src={song.thumbnail_url || "/placeholder.svg"}
                      alt={song.title}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">
                        {song.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {song.artist}
                      </p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => playSong(song)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeSongFromPlaylist(playlistSong.id)}
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
