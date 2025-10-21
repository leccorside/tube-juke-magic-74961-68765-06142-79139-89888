import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Music, Trash2, Play } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { SharePopover } from "@/components/SharePopover"; // Importando o SharePopover

interface Playlist {
  id: string;
  name: string;
  created_at: string;
  song_count?: number;
}

export default function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setCurrentSong, setPlaylist } = useMusicPlayer();

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const { data: playlistsData, error } = await supabase
        .from("playlists")
        .select(`
          id,
          name,
          created_at,
          playlist_songs(count)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedPlaylists = playlistsData?.map((p: any) => ({
        id: p.id,
        name: p.name,
        created_at: p.created_at,
        song_count: p.playlist_songs?.[0]?.count || 0,
      })) || [];

      setPlaylists(formattedPlaylists);
    } catch (error: any) {
      toast.error("Erro ao carregar playlists: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error("Digite um nome para a playlist");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase
        .from("playlists")
        .insert([{ name: newPlaylistName, user_id: user.id }]);

      if (error) throw error;

      toast.success("Playlist criada com sucesso!");
      setNewPlaylistName("");
      setIsDialogOpen(false);
      loadPlaylists();
    } catch (error: any) {
      toast.error("Erro ao criar playlist: " + error.message);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlistId);

      if (error) throw error;

      toast.success("Playlist excluída!");
      loadPlaylists();
    } catch (error: any) {
      toast.error("Erro ao excluir playlist: " + error.message);
    }
  };

  const playPlaylist = async (playlistId: string) => {
    try {
      const { data: songsData, error } = await supabase
        .from("playlist_songs")
        .select(`
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
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true });

      if (error) throw error;

      if (!songsData || songsData.length === 0) {
        toast.error("Esta playlist está vazia");
        return;
      }

      const songs = songsData.map((ps: any) => ps.songs);
      setPlaylist(songs);
      setCurrentSong(songs[0]);
      toast.success("Tocando playlist!");
    } catch (error: any) {
      toast.error("Erro ao tocar playlist: " + error.message);
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
              onClick={() => navigate("/")}
              size={isMobile ? "sm" : "default"}
            >
              <Music className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size={isMobile ? "sm" : "default"}>
                  <Plus className="w-4 h-4" />
                  {!isMobile && <span className="ml-2">Nova Playlist</span>}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Playlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input
                    placeholder="Nome da playlist"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && createPlaylist()}
                  />
                  <Button onClick={createPlaylist} className="w-full">
                    Criar Playlist
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Music className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-primary-foreground`} />
            </div>
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`}>
                Minhas Playlists
              </h1>
              {!isMobile && (
                <p className="text-muted-foreground">
                  Crie e organize suas playlists
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">

        {isLoading ? (
          <div className="text-center text-muted-foreground">Carregando...</div>
        ) : playlists.length === 0 ? (
          <div className="text-center py-12">
            <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Nenhuma playlist ainda
            </h3>
            <p className="text-muted-foreground">
              Crie sua primeira playlist para começar!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {playlists.map((playlist) => (
              <Card
                key={playlist.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/playlist/${playlist.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-primary/10 p-4 rounded-lg">
                    <Music className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex gap-2">
                    {/* Botão de Compartilhar (Sempre visível) */}
                    <SharePopover playlistId={playlist.id} />
                    
                    <Button
                      size="icon"
                      variant="ghost"
                      // Removendo classes de hover para manter visível
                      onClick={(e) => {
                        e.stopPropagation();
                        playPlaylist(playlist.id);
                      }}
                    >
                      <Play className="w-4 h-4 text-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      // Removendo classes de hover para manter visível
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlaylist(playlist.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{playlist.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {playlist.song_count} {playlist.song_count === 1 ? "música" : "músicas"}
                </p>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}