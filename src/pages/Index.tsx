import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Music2, Loader2 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MusicCard } from "@/components/MusicCard";
import { MusicPlayer } from "@/components/MusicPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  // Fetch all songs from database
  const { data: songs, refetch: refetchSongs } = useQuery({
    queryKey: ["songs"],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/songs?select=*&order=created_at.desc`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch songs");
      return (await response.json()) as Song[];
    },
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
        .eq("id", songId);

      if (error) throw error;
      
      // Refetch the songs list
      await refetchSongs();
      
      toast({
        title: "Música removida",
        description: "A música foi removida da sua biblioteca",
      });
      
      if (currentSong?.id === songId) {
        setCurrentSong(null);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a música. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handlePlay = (song: Song) => {
    setCurrentSong(song);
  };

  const handlePlayFromSearch = async (result: SearchResult) => {
    await handleDownload(result.id);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      {/* Header */}
      <header className="border-b border-border bg-gradient-to-r from-background to-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Music2 className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Music Platform
              </h1>
              <p className="text-muted-foreground">
                Busque e ouça suas músicas favoritas do YouTube
              </p>
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
            <h2 className="text-2xl font-bold mb-6 text-foreground">Resultados da Busca</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {searchResults.map((result) => (
                <MusicCard
                  key={result.id}
                  id={result.id}
                  title={result.title}
                  artist={result.artist}
                  thumbnail={result.thumbnail}
                  duration={result.duration}
                  onPlay={() => handlePlayFromSearch(result)}
                  onDownload={() => handleDownload(result.id)}
                  isDownloading={downloadingId === result.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Library */}
        {songs && songs.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">Sua Biblioteca</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
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

      {/* Music Player */}
      <MusicPlayer
        currentSong={currentSong}
        onNext={() => {
          if (songs && currentSong) {
            const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
            if (currentIndex < songs.length - 1) {
              setCurrentSong(songs[currentIndex + 1]);
            }
          }
        }}
        onPrevious={() => {
          if (songs && currentSong) {
            const currentIndex = songs.findIndex((s) => s.id === currentSong.id);
            if (currentIndex > 0) {
              setCurrentSong(songs[currentIndex - 1]);
            }
          }
        }}
      />
    </div>
  );
};

export default Index;