import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Music2, Heart, ArrowLeft, ListMusic } from "lucide-react";
import { MusicCard } from "@/components/MusicCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
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

const Favorites = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setCurrentSong, setPlaylist } = useMusicPlayer();

  // Fetch favorite songs
  const { data: favorites, refetch: refetchFavorites } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("favorites")
        .select(`
          id,
          song:songs (
            id,
            title,
            artist,
            thumbnail_url,
            audio_url,
            duration,
            youtube_id
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data.map((fav: any) => ({ ...fav.song, favoriteId: fav.id }));
    },
    enabled: !!user,
  });

  // Update playlist when favorites change
  useEffect(() => {
    if (favorites) {
      setPlaylist(favorites);
    }
  }, [favorites, setPlaylist]);

  const handleRemoveFavorite = async (favoriteId: string, songId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      await refetchFavorites();
      
      toast({
        title: "Removido dos favoritos",
        description: "A música foi removida dos seus favoritos",
      });
    } catch (error) {
      console.error("Remove favorite error:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover dos favoritos. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handlePlay = (song: Song) => {
    setCurrentSong(song);
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
            <Button
              variant="outline"
              onClick={() => navigate("/playlists")}
              size={isMobile ? "sm" : "default"}
            >
              <ListMusic className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Playlists</span>}
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Heart className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} text-primary-foreground fill-current`} />
            </div>
            <div>
              <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent`}>
                Favoritos
              </h1>
              {!isMobile && (
                <p className="text-muted-foreground">
                  Suas músicas favoritas
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {favorites.map((song: any) => (
              <MusicCard
                key={song.id}
                id={song.id}
                title={song.title}
                artist={song.artist}
                thumbnail={song.thumbnail_url}
                duration={song.duration}
                onPlay={() => handlePlay(song)}
                onDelete={() => handleRemoveFavorite(song.favoriteId, song.id)}
                isFavorite
                youtubeId={song.youtube_id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Music2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Nenhum favorito ainda
            </h3>
            <p className="text-muted-foreground">
              Adicione músicas aos favoritos para vê-las aqui
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Favorites;
