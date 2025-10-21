import { useState, useEffect } from "react";
import { Play, Trash2, Heart, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";
import { useIsMobile } from "@/hooks/use-mobile";

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
}: MusicCardProps) => {
  const [isPlaylistDialogOpen, setIsPlaylistDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Removed all offline related state and effects (isOfflineAvailable, downloadProgress, isDownloadingOffline)

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
        {isDownloading && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            {/* Loader2 component is not imported, but we keep the logic for library download */}
            <div className="w-8 h-8 text-primary animate-spin mb-2" /> 
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
                {/* Download component is not imported, but we keep the logic for library download */}
                <div className={isMobile ? 'w-6 h-6' : 'w-7 h-7'} /> 
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
                {/* Removed Offline Download Button */}
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