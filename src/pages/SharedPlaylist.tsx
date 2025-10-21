import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Music, Save, Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
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
  songs: Song;
}

export default function SharedPlaylist() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const { setCurrentSong, setPlaylist } = useMusicPlayer();

  const [playlistName, setPlaylistName] = useState("");
  const [playlistOwnerId, setPlaylistOwnerId] = useState<string | null>(null);
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      console.log("Attempting to load shared playlist ID:", id);
      loadPlaylistDetails();
    }
  }, [id]);

  // Redirecionamento após login/cadastro
  useEffect(() => {
    if (!authLoading && user && location.state?.redirectedFromAuth) {
      loadPlaylistDetails();
    }
  }, [user, authLoading]);

  const loadPlaylistDetails = async () => {
    setIsLoading(true);
    try {
      // 1. Load playlist info (Must be accessible via public RLS)
      const { data: playlistData, error: playlistError } = await supabase
        .from("playlists")
        .select("name, user_id")
        .eq("id", id)
        .maybeSingle();

      if (playlistError) {
        console.error("Supabase Playlist Query Error:", playlistError);
        throw new Error("Erro de consulta da playlist.");
      }
      
      if (!playlistData) {
        // Se não houver dados, a playlist não existe ou o ID é inválido.
        throw new Error("Playlist não encontrada ou ID inválido.");
      }
      
      setPlaylistName(playlistData.name);
      setPlaylistOwnerId(playlistData.user_id);

      // 2. Load songs in playlist (Must be accessible via public RLS)
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

      if (songsError) {
        console.error("Supabase Playlist Songs Query Error:", songsError);
        throw new Error("Erro ao carregar músicas da playlist.");
      }
      
      setSongs(songsData || []);
    } catch (error: any) {
      console.error("Error loading shared playlist:", error);
      const errorMessage = error.message || "Erro desconhecido ao carregar playlist.";
      
      toast.error("Erro ao carregar playlist compartilhada: " + errorMessage);
      
      // Redireciona se for um erro de não encontrado
      if (errorMessage.includes("Playlist não encontrada") || errorMessage.includes("Erro de consulta da playlist")) {
        navigate("/", { replace: true }); 
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePlaylist = async () => {
    if (!user) {
      // Redireciona para autenticação, salvando o destino
      navigate("/auth", { state: { from: location.pathname } });
      return;
    }
    
    if (user.id === playlistOwnerId) {
      toast.info("Esta playlist já é sua!");
      return;
    }

    if (songs.length === 0) {
      toast.error("Não é possível salvar uma playlist vazia.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Criar uma nova playlist na conta do usuário
      const { data: newPlaylist, error: createError } = await supabase
        .from("playlists")
        .insert([{ name: `Cópia de ${playlistName}`, user_id: user.id }])
        .select("id")
        .single();

      if (createError) throw createError;
      const newPlaylistId = newPlaylist.id;

      // 2. Inserir todas as músicas na nova playlist
      const songsToInsert = songs.map((ps, index) => ({
        playlist_id: newPlaylistId,
        song_id: ps.songs.id,
        position: index,
      }));

      const { error: insertError } = await supabase
        .from("playlist_songs")
        .insert(songsToInsert);

      if (insertError) throw insertError;

      toast.success(`Playlist "${playlistName}" salva na sua conta!`);
      navigate(`/playlist/${newPlaylistId}`);
    } catch (error: any) {
      toast.error("Erro ao salvar playlist: " + error.message);
    } finally {
      setIsSaving(false);
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

  const renderActionCard = () => {
    if (authLoading) {
      return (
        <Card className="p-4 mb-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Carregando autenticação...
        </Card>
      );
    }
    
    if (!user) {
      return (
        <Card className="p-4 mb-6 bg-primary/10 border-primary/50">
          <CardTitle className="text-lg mb-3 text-primary">Acesso Completo</CardTitle>
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground mb-4">
              Faça login ou crie uma conta para salvar esta playlist na sua biblioteca.
            </p>
            <Button 
              onClick={() => navigate("/auth", { state: { from: location.pathname } })} 
              className="w-full"
            >
              Entrar / Cadastrar
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    if (user.id === playlistOwnerId) {
      return (
        <Card className="p-4 mb-6 bg-secondary/50 border-secondary">
          <CardTitle className="text-lg mb-3">Sua Playlist</CardTitle>
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground">
              Esta playlist já está na sua conta.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="p-4 mb-6 bg-accent/10 border-accent/50">
        <CardTitle className="text-lg mb-3 text-accent">Salvar na Sua Conta</CardTitle>
        <CardContent className="p-0">
          <Button 
            onClick={handleSavePlaylist} 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            disabled={isSaving || songs.length === 0}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Playlist
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-background to-card">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
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
                {playlistName || "Playlist Compartilhada"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {songs.length} {songs.length === 1 ? "música" : "músicas"}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {renderActionCard()}

        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando músicas...</div>
        ) : songs.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Esta playlist está vazia
            </h3>
            <p className="text-muted-foreground">
              O criador ainda não adicionou músicas.
            </p>
          </div>
        ) : (
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-xl font-semibold mb-4">Músicas na Fila</h2>
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
                    <div className={`flex gap-1 md:gap-2 opacity-100`}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => playSong(song)}
                        className={isMobile ? 'h-8 w-8' : ''}
                      >
                        <Play className="w-4 h-4" />
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