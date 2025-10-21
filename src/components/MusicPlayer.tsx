import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { YouTubePlayer } from "./YouTubePlayer";
import { YouTubePlayer as YouTubePlayerType } from 'react-youtube';

// YouTube Player States
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_ENDED = 0;
const YT_BUFFERING = 3;

interface MusicPlayerProps {
  currentSong: {
    title: string;
    artist: string;
    thumbnail_url: string;
    audio_url: string; // This is the YouTube URL
    youtube_id: string;
    duration?: number;
  } | null;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
}


export const MusicPlayer = ({ currentSong, onNext, onPrevious, onClose }: MusicPlayerProps) => {
  const playerRef = useRef<YouTubePlayerType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset state when song changes
  useEffect(() => {
    if (currentSong) {
      setIsLoadingAudio(true);
      setCurrentTime(0);
      setDuration(currentSong.duration || 0);
      setIsPlaying(false);
      
      if (!isOnline) {
        toast.error("Você está offline. A reprodução de músicas do YouTube requer conexão.");
        setIsLoadingAudio(false);
      }
    }
  }, [currentSong?.youtube_id, currentSong?.duration, isOnline]);

  // Media Session API for background playback and lock screen controls
  useEffect(() => {
    if (!currentSong || typeof navigator.mediaSession === 'undefined') return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      artwork: [
        { src: currentSong.thumbnail_url, sizes: '96x96', type: 'image/jpeg' },
        { src: currentSong.thumbnail_url, sizes: '128x128', type: 'image/jpeg' },
        { src: currentSong.thumbnail_url, sizes: '192x192', type: 'image/jpeg' },
        { src: currentSong.thumbnail_url, sizes: '256x256', type: 'image/jpeg' },
        { src: currentSong.thumbnail_url, sizes: '384x384', type: 'image/jpeg' },
        { src: currentSong.thumbnail_url, sizes: '512x512', type: 'image/jpeg' },
      ],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      playerRef.current?.playVideo();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      playerRef.current?.pauseVideo();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (onPrevious) onPrevious();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (onNext) onNext();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime) {
        playerRef.current?.seekTo(details.seekTime, true);
        setCurrentTime(details.seekTime);
      }
    });

    return () => {
      if (typeof navigator.mediaSession !== 'undefined') {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      }
    };
  }, [currentSong, onNext, onPrevious]);

  // Update playback state for Media Session
  useEffect(() => {
    if (typeof navigator.mediaSession !== 'undefined') {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const handlePlayerReady = (player: YouTubePlayerType) => {
    playerRef.current = player;
    setIsLoadingAudio(false);
    // Autoplay should start here if allowed by browser
  };

  const handleStateChange = (state: number) => {
    switch (state) {
      case YT_PLAYING:
        setIsPlaying(true);
        setIsLoadingAudio(false);
        break;
      case YT_PAUSED:
        setIsPlaying(false);
        break;
      case YT_ENDED:
        setIsPlaying(false);
        if (onNext) onNext();
        break;
      case YT_BUFFERING:
        setIsLoadingAudio(true);
        break;
      default:
        // Other states like unstarted (-1) or cued (5)
        break;
    }
  };

  const togglePlay = () => {
    if (!playerRef.current) return;

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    if (playerRef.current) {
      playerRef.current.seekTo(seekTime, true);
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (playerRef.current) {
      playerRef.current.setVolume(newVolume);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentSong) return null;

  const isPlayerReady = !!playerRef.current && !isLoadingAudio;

  return (
    <Card className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-card to-secondary border-t border-border backdrop-blur-lg shadow-2xl z-50">
      
      {/* YouTube Player Component (Hidden) */}
      {currentSong.youtube_id && isOnline && (
        <YouTubePlayer
          videoId={currentSong.youtube_id}
          onReady={handlePlayerReady}
          onStateChange={handleStateChange}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          volume={volume}
        />
      )}
      
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Close Button */}
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Song Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <img
              src={currentSong.thumbnail_url || "/placeholder.svg"}
              alt={currentSong.title}
              className="w-14 h-14 rounded-lg object-cover shadow-lg"
            />
            <div className="min-w-0">
              <h4 className="font-semibold text-foreground truncate">{currentSong.title}</h4>
              <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={onPrevious}
                className="text-foreground hover:text-primary"
                disabled={!isPlayerReady}
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                onClick={togglePlay}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-10 h-10"
                disabled={!isPlayerReady || !isOnline}
              >
                {isLoadingAudio || !isOnline ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onNext}
                className="text-foreground hover:text-primary"
                disabled={!isPlayerReady}
              >
                <SkipForward className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 w-full max-w-md">
              <span className="text-xs text-muted-foreground min-w-[40px]">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
                disabled={!isPlayerReady}
              />
              <span className="text-xs text-muted-foreground min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Volume2 className="w-5 h-5 text-muted-foreground" />
            <Slider
              value={[volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};