import { useState, useEffect } from "react";
import { Play, Trash2, Heart, ListPlus, Download, Loader2, CheckCircle2, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOfflineMusic } from "@/hooks/useOfflineMusic";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext"; // Importando o hook do player

interface MusicCardProps {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  onPlay?: () => void;
  onDownload?: () => void; // Only used for search results (download to library)
  onDelete?: () => void;
  isDownloading?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  variant?: "search" | "library";
  youtubeId?: string;
  audioUrl?: string; // Adicionado para download offline
}

export const MusicCard = ({
  id,
  title,
  artist,
  thumbnail,
  duration,
  onPlay,
  onDownload,
  onDelete,
  isDownloading,
  isFavorite,
  onToggleFavorite,
  variant = "library",
  audioUrl,
  youtubeId,
}: MusicCardProps) => {
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);
  const isMobile = useIsMobile();
  const { downloadForOffline, removeOffline, isAvailableOffline, isOnline } = useOfflineMusic();
  const { addToQueue } = useMusicPlayer(); // Usando a função addToQueue

  useEffect(() => {
    if (variant === 'library') {
      isAvailableOffline(id).then(setIsOfflineAvailable);
    }
  }, [id, variant, isAvailableOffline]);

  const handleToggleOffline = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOfflineAvailable) {
      await removeOffline(id);
      setIsOfflineAvailable(false);
    } else {
      if (!isOnline) {
        // O hook já mostra o toast, mas garantimos que não tentamos
        return;
      }
      setIsDownloadingOffline(true);
      const success = await downloadForOffline({
        id,
        title,
        artist,
        thumbnail_url: thumbnail,
        audio_url: audioUrl || '',
        youtube_id: youtubeId || '',
      });
      setIsDownloadingOffline(false);
      if (success) {
        setIsOfflineAvailable(true);
      }
    }
  };
  
  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue({
      id,
      title,
      artist: artist || 'Artista Desconhecido',
      thumbnail_url: thumbnail,
      audio_url: audioUrl || '',
      duration,
      youtube_id: youtubeId || '',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="group relative overflow-hidden bg-gradient-to-b from-card to-secondary border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
      <div className="relative aspect-square overflow-hidden">
        <img
          src={thumbnail || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Download progress indicator (only for library download) */}
        {(isDownloading || isDownloadingOffline) && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" /> 
            <span className="text-sm text-white">Baixando...</span>
          </div>
        )}
        
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          
          {/* Search variant: download and queue buttons */}
          {variant === "search" && (
            <div className="absolute inset-0 flex items-center justify-center gap-4">
              {onDownload && !isDownloading && (
                <Button
                  size="icon"
                  onClick={onDownload}
                  className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-full ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} shadow-lg`}
                >
                  <Download className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} /> 
                </Button>
              )}
              <Button
                size="icon"
                onClick={handleAddToQueue}
                className={`bg-primary hover:bg-primary/90 text-primary-foreground rounded-full ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} shadow-lg`}
              >
                <ListMusic className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} /> {/* Alterado para ListMusic */}
              </Button>
            </div>
          )}
          
          {/* Library variant: play center, other buttons right */}
          {variant === "library" && (
            <>
              {/* Play button centered */}
              {onPlay && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="icon"
                    onClick={onPlay}
                    className={`bg-primary hover:bg-primary/90 text-primary-foreground rounded-full ${isMobile ? 'w-12 h-12' : 'w-14 h-14'} shadow-lg`}
                  >
                    <Play className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} fill-current`} />
                  </Button>
                </div>
              )}
              
              {/* Other buttons on the right vertically */}
              <div className={`absolute right-2 top-1/2 -translate-y-1/2 flex flex-col ${isMobile ? 'gap-1' : 'gap-2'}`}>
                
                {/* Add to Queue Button */}
                <Button
                  size="icon"
                  onClick={handleAddToQueue}
                  className={`bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} shadow-lg`}
                >
                  <ListMusic className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} /> {/* Alterado para ListMusic */}
                </Button>
                
                {/* Offline Toggle Button */}
                <Button
                  size="icon"
                  onClick={handleToggleOffline}
                  className={`bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-full ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} shadow-lg`}
                  disabled={isDownloadingOffline}
                >
                  {isDownloadingOffline ? (
                    <Loader2 className={isMobile ? 'w-4 h-4 animate-spin' : 'w-5 h-5 animate-spin'} />
                  ) : isOfflineAvailable ? (
                    <CheckCircle2 className={isMobile ? 'w-4 h-4 text-green-400' : 'w-5 h-5 text-green-400'} />
                  ) : (
                    <Download className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                  )}
                </Button>

                {/* Add to Playlist Dialog Button */}
                <Button
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); setIsPlaylistDialogOpen(true); }}
                  className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-full ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} shadow-lg`}
                >
                  <ListPlus className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} /> {/* Mantido ListPlus */}
                </Button>
                {onToggleFavorite && (
                  <Button
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                    className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-full ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} shadow-lg`}
                  >
                    <Heart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    variant="destructive"
                    className={`rounded-full ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} shadow-lg`}
                  >
                    <Trash2 className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className={isMobile ? 'p-3' : 'p-4'}>
        <h3 className={`font-semibold text-foreground truncate mb-1 ${isMobile ? 'text-sm' : ''}`}>{title}</h3>
        <div className="flex items-center justify-between">
          <p className={`text-muted-foreground truncate ${isMobile ? 'text-xs' : 'text-sm'}`}>{artist}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{formatDuration(duration)}</span>
        </div>
      </div>
      
      <AddToPlaylistDialog
        songId={id}
        isOpen={isPlaylistDialogOpen}
        onClose={() => setIsPlaylistDialogOpen(false)}
      />
    </Card>
  );
};