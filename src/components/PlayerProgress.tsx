import React from 'react';
import { Slider } from "@/components/ui/slider";

interface PlayerProgressProps {
  currentTime: number;
  duration: number;
  isPlayerReady: boolean;
  handleSeek: (value: number[]) => void;
}

const formatTime = (time: number) => {
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const PlayerProgress: React.FC<PlayerProgressProps> = React.memo(({
  currentTime,
  duration,
  isPlayerReady,
  handleSeek,
}) => {
  return (
    <div className="flex items-center gap-2 w-full">
      <span className="text-xs text-muted-foreground min-w-[30px] md:min-w-[40px] hidden md:block">
        {formatTime(currentTime)}
      </span>
      <Slider
        value={[currentTime]}
        max={duration || 100}
        step={1}
        onValueChange={handleSeek}
        className="flex-1"
        disabled={!isPlayerReady}
        // Parar propagação para evitar conflitos de toque
        onMouseDown={(e) => e.stopPropagation()}
      />
      <span className="text-xs text-muted-foreground min-w-[30px] md:min-w-[40px] hidden md:block">
        {formatTime(duration)}
      </span>
    </div>
  );
});