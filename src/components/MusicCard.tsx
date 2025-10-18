import { Play, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface MusicCardProps {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  onPlay: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  isDownloading?: boolean;
}

export const MusicCard = ({
  title,
  artist,
  thumbnail,
  duration,
  onPlay,
  onDownload,
  onDelete,
  isDownloading,
}: MusicCardProps) => {
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
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            size="icon"
            onClick={onPlay}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-12 h-12 shadow-lg"
          >
            <Play className="w-6 h-6 fill-current" />
          </Button>
          {onDownload && (
            <Button
              size="icon"
              onClick={onDownload}
              disabled={isDownloading}
              className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full w-12 h-12 shadow-lg"
            >
              <Download className="w-6 h-6" />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon"
              onClick={onDelete}
              variant="destructive"
              className="rounded-full w-12 h-12 shadow-lg"
            >
              <Trash2 className="w-6 h-6" />
            </Button>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate mb-1">{title}</h3>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground truncate">{artist}</p>
          <span className="text-xs text-muted-foreground">{formatDuration(duration)}</span>
        </div>
      </div>
    </Card>
  );
};