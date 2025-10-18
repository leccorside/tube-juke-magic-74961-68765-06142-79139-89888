import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Music2, Loader2, Heart, LogOut, ListMusic } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MusicCard } from "@/components/MusicCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
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

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
}

const Index = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { setCurrentSong, setPlaylist } = useMusicPlayer();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Fetch user's songs from database
  const { data: songs, refetch: refetchSongs } = useQuery({
    queryKey: ["songs", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("songs")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Song[];
    },
    enabled: !!user,
  });

  // Update playlist when songs change
  useEffect(() => {
    if (songs) {
      setPlaylist(songs);
    }
  }, [songs, setPlaylist]);

  // Fetch user's favorites
  const { data: favorites, refetch: refetchFavorites } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("favorites")
        .select("song_id")
        .eq("user_id", user?.id);

      if (error) throw error;
      return data.map((fav: any) => fav.song_id);
    },
    enabled: !!user,
  });

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("search-and-download", {
        body: { action: "search", query },
      });

      if (error) throw error;

      if (data.success) {
        setSearchResults(data.results);
        toast({
          title: "Busca concluída",
          description: `Encontrados ${data.results.length} resultados`,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Erro na busca",
        description: "Não foi possível buscar as músicas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownload = async (videoId: string) => {
    setDownloadingId(videoId);
    try {
      const { data, error } = await supabase.functions.invoke("search-and-download", {
        body: { action: "download", videoId },
      });

      if (error) throw error;

      if (data.success) {
        await refetchSongs();
        toast({
          title: "Música baixada!",
          description: "A música foi adicionada à sua biblioteca",
        });
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a música. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (songId: string) => {
    try {
      const { error } = await (supabase as any)
        .from("songs")
        .delete()
        .eq("id", songId)
        .eq("user_id", user?.id);

      if (error) throw error;
      
      await refetchSongs();
      
      toast({
        title: "Música removida",
        description: "A música foi removida da sua biblioteca",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a música. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (songId: string) => {
    try {
      const isFavorite = favorites?.includes(songId);
      
      if (isFavorite) {
        const { error } = await (supabase as any)
          .from("favorites")
          .delete()
          .eq("song_id", songId)
          .eq("user_id", user?.id);

        if (error) throw error;
        
        toast({
          title: "Removido dos favoritos",
          description: "A música foi removida dos seus favoritos",
        });
      } else {
        const { error } = await (supabase as any)
          .from("favorites")
          .insert({
            song_id: songId,
            user_id: user?.id,
          });

        if (error) throw error;
        
        toast({
          title: "Adicionado aos favoritos",
          description: "A música foi adicionada aos seus favoritos",
        });
      }
      
      await refetchFavorites();
    } catch (error) {
      console.error("Toggle favorite error:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar os favoritos. Tente novamente.",
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
          <div className="flex flex-col gap-4 md:gap-0 md:flex-row md:items-center md:justify-between mb-4 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
                <Music2 className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
              </div>
              {!isMobile && (
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Music Platform
                  </h1>
                  <p className="text-muted-foreground">
                    Busque e ouça suas músicas favoritas do YouTube
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/playlists")}
                size={isMobile ? "sm" : "default"}
                className="flex-1 md:flex-none"
              >
                <ListMusic className="w-4 h-4" />
                {!isMobile && <span className="ml-2">Playlists</span>}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/favorites")}
                size={isMobile ? "sm" : "default"}
                className="flex-1 md:flex-none"
              >
                <Heart className="w-4 h-4" />
                {!isMobile && <span className="ml-2">Favoritos</span>}
              </Button>
              <Button
                variant="ghost"
                onClick={signOut}
                size={isMobile ? "sm" : "default"}
                className="flex-1 md:flex-none"
              >
                <LogOut className="w-4 h-4" />
                {!isMobile && <span className="ml-2">Sair</span>}
              </Button>
            </div>
          </div>

          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Results */}
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Buscando músicas...</span>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-foreground">Resultados da Busca</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {searchResults.map((result) => (
                <MusicCard
                  key={result.id}
                  id={result.id}
                  title={result.title}
                  artist={result.artist}
                  thumbnail={result.thumbnail}
                  duration={result.duration}
                  onDownload={() => handleDownload(result.id)}
                  isDownloading={downloadingId === result.id}
                  variant="search"
                />
              ))}
            </div>
          </div>
        )}

        {/* Library */}
        {songs && songs.length > 0 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-foreground">Sua Biblioteca</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {songs.map((song) => (
                <MusicCard
                  key={song.id}
                  id={song.id}
                  title={song.title}
                  artist={song.artist}
                  thumbnail={song.thumbnail_url}
                  duration={song.duration}
                  onPlay={() => handlePlay(song)}
                  onDelete={() => handleDelete(song.id)}
                  onToggleFavorite={() => handleToggleFavorite(song.id)}
                  isFavorite={favorites?.includes(song.id)}
                  variant="library"
                />
              ))}
            </div>
          </div>
        )}

        {!isSearching && searchResults.length === 0 && (!songs || songs.length === 0) && (
          <div className="text-center py-12">
            <Music2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Nenhuma música ainda
            </h3>
            <p className="text-muted-foreground">
              Use a barra de pesquisa acima para encontrar e adicionar músicas
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;