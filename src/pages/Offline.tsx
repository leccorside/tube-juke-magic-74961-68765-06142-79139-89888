import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wifi, WifiOff, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOfflineMusic } from "@/hooks/useOfflineMusic";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MusicCard } from "@/components/MusicCard";
import { formatBytes } from "@/lib/utils";

const Offline = () => {
  const navigate = useNavigate();
  const { 
    isOnline, 
    offlineSongs, 
    totalCacheSize, 
    clearAllOffline, 
    removeOffline,
    refreshOfflineSongs
  } = useOfflineMusic();
  const { setCurrentSong, setPlaylist } = useMusicPlayer();

  const handlePlayOffline = async (song: any) => {
    // Criamos uma playlist temporária apenas com as músicas offline
    const playlist = offlineSongs.map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      thumbnail_url: s.thumbnailUrl,
      audio_url: s.audioUrl, // Este é o URL do cache/placeholder
      duration: 0, // Duração desconhecida no cache
      youtube_id: s.youtubeId,
    }));
    
    setPlaylist(playlist);
    setCurrentSong(playlist.find(s => s.id === song.id) || null);
  };

  const handleRemoveOffline = async (songId: string) => {
    await removeOffline(songId);
    refreshOfflineSongs();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background pb-24">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-2 text-green-500">
                <Wifi className="w-5 h-5" />
                <span className="text-sm font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-500">
                <WifiOff className="w-5 h-5" />
                <span className="text-sm font-medium">Offline</span>
              </div>
            )}
          </div>
        </div>

        <Card className="mb-6 p-6 bg-gradient-to-br from-card to-secondary border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Músicas Offline</h2>
              <p className="text-muted-foreground text-sm">
                {offlineSongs.length} músicas salvas. Tamanho total: {formatBytes(totalCacheSize)}
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={clearAllOffline}
              disabled={offlineSongs.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Cache
            </Button>
          </div>
        </Card>

        {!isOnline && (
          <Alert variant="default" className="mb-8 border-amber-500/50 bg-amber-500/10">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-400">Modo Offline Ativo</AlertTitle>
            <AlertDescription className="text-amber-200">
              Você está sem conexão. Apenas as músicas listadas abaixo podem ser reproduzidas.
            </AlertDescription>
          </Alert>
        )}

        {offlineSongs.length === 0 ? (
          <div className="text-center py-12">
            <WifiOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2 text-foreground">
              Nenhuma música offline
            </h3>
            <p className="text-muted-foreground mb-4">
              Vá para a biblioteca e use o ícone de download para salvar músicas para ouvir sem internet.
            </p>
            <Button onClick={() => navigate("/")}>
              Ir para Biblioteca
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {offlineSongs.map((song) => (
              <div key={song.id} className="relative">
                <MusicCard
                  id={song.id}
                  title={song.title}
                  artist={song.artist}
                  thumbnail={song.thumbnailUrl}
                  duration={0} // Duração desconhecida no cache
                  onPlay={() => handlePlayOffline(song)}
                  onDelete={() => handleRemoveOffline(song.id)}
                  variant="library"
                  isFavorite={true} // Apenas para fins de exibição, pode ser ajustado
                  youtubeId={song.youtubeId}
                  audioUrl={song.audioUrl}
                />
                {song.audioSize && song.audioSize > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/50 text-xs text-muted-foreground text-center rounded-b-lg">
                    {formatBytes(song.audioSize)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Offline;