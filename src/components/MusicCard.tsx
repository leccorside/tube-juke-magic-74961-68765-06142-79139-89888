import { useState, useEffect } from "react";
import { Play, Download, Trash2, Heart, Loader2, ListPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";

interface MusicCardProps {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  onPlay?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  isDownloading?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  variant?: "search" | "library";
  youtubeId?: string;
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
  youtubeId,
}: MusicCardProps) => {
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const [isOfflineAvailable, setIsOfflineAvailable] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadingOffline, setIsDownloadingOffline] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    checkOfflineStatus();
  }, [youtubeId]);

  const checkOfflineStatus = async () => {
    if (!('caches' in window) || !youtubeId) return;

    try {
      const cache = await caches.open('music-offline-v1');
      const audioRequest = new Request(`/offline-audio/${youtubeId}`);
      const response = await cache.match(audioRequest);
      setIsOfflineAvailable(!!response);
    } catch (error) {
      console.error('Error checking offline status:', error);
    }
  };

  const handleOfflineDownload = async () => {
    if (!('caches' in window) || !youtubeId) {
      toast.error("Seu navegador não suporta armazenamento offline");
      return;
    }

    if (isDownloadingOffline) return;

    try {
      setIsDownloadingOffline(true);
      setDownloadProgress(0);
      toast.loading('Preparando download...', { id: 'download-offline' });

      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Use download-audio function which proxies the audio stream
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ youtubeId })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to download audio');
      }

      const audioResponse = response;

      const reader = audioResponse.body?.getReader();
      const contentLength = parseInt(audioResponse.headers.get('content-length') || '0');
      
      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          const progress = contentLength > 0 ? (receivedLength / contentLength) * 100 : 0;
          setDownloadProgress(progress);
          
          toast.loading(`Baixando: ${Math.round(progress)}%`, { id: 'download-offline' });
        }
      }

      const audioBlob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });

      const cache = await caches.open('music-offline-v1');

      const audioRequest = new Request(`/offline-audio/${youtubeId}`);
      await cache.put(audioRequest, new Response(audioBlob));

      const metadata = {
        id,
        title,
        artist,
        thumbnailUrl: thumbnail,
        youtubeId,
        downloadedAt: new Date().toISOString()
      };

      const metadataRequest = new Request(`/offline-metadata/${youtubeId}`);
      await cache.put(metadataRequest, new Response(JSON.stringify(metadata)));

      try {
        const thumbResponse = await fetch(thumbnail);
        if (thumbResponse.ok) {
          await cache.put(thumbnail, thumbResponse.clone());
        }
      } catch (error) {
        console.error('Error caching thumbnail:', error);
      }

      setIsOfflineAvailable(true);
      toast.success("Música disponível offline!", { id: 'download-offline' });
    } catch (error) {
      console.error('Error making song available offline:', error);
      toast.error("Erro ao baixar música", { id: 'download-offline' });
    } finally {
      setIsDownloadingOffline(false);
      setDownloadProgress(0);
    }
  };

  const handleRemoveOffline = async () => {
    if (!('caches' in window) || !youtubeId) return;

    try {
      const cache = await caches.open('music-offline-v1');
      
      await cache.delete(new Request(`/offline-audio/${youtubeId}`));
      await cache.delete(new Request(`/offline-metadata/${youtubeId}`));
      
      setIsOfflineAvailable(false);
      toast.success("Removido do offline");
    } catch (error) {
      console.error('Error removing from offline:', error);
      toast.error("Erro ao remover do offline");
    }
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
        
        {/* Download progress indicator */}
        {isDownloading && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
            <span className="text-sm text-white">Baixando...</span>
          </div>
        )}
        
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Search variant: only download button */}
          {variant === "search" && onDownload && !isDownloading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="icon"
                onClick={onDownload}
                className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-full ${isMobile ? 'w-12 h-12' : 'w-14 h-14'} shadow-lg`}
              >
                <Download className={isMobile ? 'w-6 h-6' : 'w-7 h-7'} />
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
                <Button
                  size="icon"
                  onClick={() => setIsPlaylistDialogOpen(true)}
                  className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-full ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} shadow-lg`}
                >
                  <ListPlus className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                </Button>
                {onToggleFavorite && (
                  <Button
                    size="icon"
                    onClick={onToggleFavorite}
                    className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-full ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} shadow-lg`}
                  >
                    <Heart className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'} ${isFavorite ? "fill-current" : ""}`} />
                  </Button>
                )}
                {youtubeId && (
                  <Button
                    size="icon"
                    onClick={isOfflineAvailable ? handleRemoveOffline : handleOfflineDownload}
                    disabled={isDownloadingOffline}
                    className={`${isOfflineAvailable ? 'bg-green-600 hover:bg-green-700' : 'bg-accent hover:bg-accent/90'} text-white rounded-full ${isMobile ? 'w-8 h-8' : 'w-10 h-10'} shadow-lg`}
                    title={isDownloadingOffline ? `Baixando ${Math.round(downloadProgress)}%` : (isOfflineAvailable ? 'Disponível offline' : 'Baixar para offline')}
                  >
                    {isDownloadingOffline ? (
                      <span className="text-[10px] font-bold">{Math.round(downloadProgress)}</span>
                    ) : isOfflineAvailable ? (
                      <Check className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                    ) : (
                      <Download className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
                    )}
                  </Button>
                )}
                {onDelete && (
                  <Button
                    size="icon"
                    onClick={onDelete}
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