import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wifi, WifiOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MusicCard } from "@/components/MusicCard";
import { useOfflineMusic } from "@/hooks/useOfflineMusic";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { toast } from "sonner";

const Offline = () => {
  const navigate = useNavigate();
  const { offlineSongs, isOnline, totalCacheSize, removeOffline, clearAllOffline, refreshOfflineSongs } = useOfflineMusic();
  const { setCurrentSong, setPlaylist } = useMusicPlayer();

  useEffect(() => {
    refreshOfflineSongs();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePlay = (song: typeof offlineSongs[0]) => {
    setCurrentSong({
      id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail_url: song.thumbnailUrl,
      audio_url: '', // Not used for offline
      youtube_id: song.youtubeId,
      duration: 0,
    });
    
    const playlist = offlineSongs.map(s => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      thumbnail_url: s.thumbnailUrl,
      audio_url: '',
      youtube_id: s.youtubeId,
      duration: 0,
    }));
    
    setPlaylist(playlist);
  };

  const handleDelete = async (youtubeId: string) => {
    await removeOffline(youtubeId);
  };

  const handleClearAll = async () => {
    if (confirm('Tem certeza que deseja limpar todo o cache offline?')) {
      await clearAllOffline();
    }
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
              <p className="text-muted-foreground">
                {offlineSongs.length} {offlineSongs.length === 1 ? 'música' : 'músicas'} disponíveis
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Espaço usado: {formatBytes(totalCacheSize)}
              </p>
            </div>
            
            {offlineSongs.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleClearAll}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Limpar Cache
              </Button>
            )}
          </div>
        </Card>

        {offlineSongs.length === 0 ? (
          <Card className="p-12 text-center">
            <WifiOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma música offline</h3>
            <p className="text-muted-foreground mb-4">
              Baixe músicas para ouvi-las sem conexão com a internet
            </p>
            <Button onClick={() => navigate("/")}>
              Ir para Biblioteca
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {offlineSongs.map((song) => (
              <MusicCard
                key={song.id}
                id={song.id}
                title={song.title}
                artist={song.artist}
                thumbnail={song.thumbnailUrl}
                duration={0}
                youtubeId={song.youtubeId}
                onPlay={() => handlePlay(song)}
                onDelete={() => handleDelete(song.youtubeId)}
                variant="library"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Offline;
