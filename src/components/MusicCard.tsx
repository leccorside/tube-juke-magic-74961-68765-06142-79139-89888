import { useState } from "react";
import { Play, Download, Trash2, Heart, Loader2, ListPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AddToPlaylistDialog } from "./AddToPlaylistDialog";
import { useIsMobile } from "@/hooks/use-mobile";

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
        
        <div className={`absolute inset-0 flex items-center justify-center ${isMobile ? 'flex-wrap gap-1 p-2' : 'gap-2'} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}>
          {/* Search variant: only download button */}
          {variant === "search" && onDownload && !isDownloading && (
            <Button
              size="icon"
              onClick={onDownload}
              className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-full ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} shadow-lg`}
            >
              <Download className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
            </Button>
          )}
          
          {/* Library variant: play, favorite, playlist, and delete buttons */}
          {variant === "library" && (
            <>
              {onPlay && (
                <Button
                  size="icon"
                  onClick={onPlay}
                  className={`bg-primary hover:bg-primary/90 text-primary-foreground rounded-full ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} shadow-lg`}
                >
                  <Play className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} fill-current`} />
                </Button>
              )}
              <Button
                size="icon"
                onClick={() => setIsPlaylistDialogOpen(true)}
                className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-full ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} shadow-lg`}
              >
                <ListPlus className={isMobile ? 'w-4 h-4' : 'w-6 h-6'} />
              </Button>
              {onToggleFavorite && (
                <Button
                  size="icon"
                  onClick={onToggleFavorite}
                  className={`bg-accent hover:bg-accent/90 text-accent-foreground rounded-full ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} shadow-lg`}
                >
                  <Heart className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} ${isFavorite ? "fill-current" : ""}`} />
                </Button>
              )}
              {onDelete && (
                <Button
                  size="icon"
                  onClick={onDelete}
                  variant="destructive"
                  className={`rounded-full ${isMobile ? 'w-10 h-10' : 'w-12 h-12'} shadow-lg`}
                >
                  <Trash2 className={isMobile ? 'w-4 h-4' : 'w-6 h-6'} />
                </Button>
              )}
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