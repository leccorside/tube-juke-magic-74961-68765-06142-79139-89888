import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Music2, Heart, ArrowLeft } from "lucide-react";
import { MusicCard } from "@/components/MusicCard";
import { MusicPlayer } from "@/components/MusicPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

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

      if (currentSong?.id === songId) {
        setCurrentSong(null);
      }
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
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Heart className="w-8 h-8 text-primary-foreground fill-current" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Favoritos
              </h1>
              <p className="text-muted-foreground">
                Suas músicas favoritas
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {favorites && favorites.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

      {/* Music Player */}
      <MusicPlayer
        currentSong={currentSong}
        onNext={() => {
          if (favorites && currentSong) {
            const currentIndex = favorites.findIndex((s: any) => s.id === currentSong.id);
            if (currentIndex < favorites.length - 1) {
              setCurrentSong(favorites[currentIndex + 1]);
            }
          }
        }}
        onPrevious={() => {
          if (favorites && currentSong) {
            const currentIndex = favorites.findIndex((s: any) => s.id === currentSong.id);
            if (currentIndex > 0) {
              setCurrentSong(favorites[currentIndex - 1]);
            }
          }
        }}
      />
    </div>
  );
};

export default Favorites;
