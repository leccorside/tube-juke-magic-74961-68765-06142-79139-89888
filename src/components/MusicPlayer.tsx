import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Loader2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { YouTubePlayer } from "./YouTubePlayer";
import { YouTubePlayer as YouTubePlayerType } from 'react-youtube';
import { OfflineAudioPlayer } from "./OfflineAudioPlayer";
import { useOfflineMusic } from "@/hooks/useOfflineMusic";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import VisualizerBars from "./VisualizerBars"; // Importando o novo componente

// YouTube Player States
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_ENDED = 0;
const YT_BUFFERING = 3;

interface MusicPlayerProps {
  currentSong: {
    id: string; // Adicionado ID para verificação offline
    title: string;
    artist: string;
    thumbnail_url: string;
    audio_url: string; // This is the YouTube URL or Cache URL
    youtube_id: string;
    duration?: number;
  } | null;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
}


export const MusicPlayer = ({ currentSong, onNext, onPrevious, onClose }: MusicPlayerProps) => {
  // Context Hooks
  const { isShuffling, toggleShuffle } = useMusicPlayer();
  
  // Ref para o elemento de áudio HTML5 (usado pelo OfflineAudioPlayer)
  const offlineAudioRef = useRef<HTMLAudioElement | null>(null);
  
  const youtubePlayerRef = useRef<YouTubePlayerType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  
  const { isOnline, isAvailableOffline, getOfflineAudioUrl } = useOfflineMusic();
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [offlinePlaybackUrl, setOfflinePlaybackUrl] = useState<string | null>(null);

  // Check if the current song is available offline
  useEffect(() => {
    const checkOfflineStatus = async () => {
      if (currentSong) {
        const isCached = await isAvailableOffline(currentSong.id);
        
        // Se estiver offline E estiver em cache, ative o modo offline
        if (!isOnline && isCached) {
          const url = await getOfflineAudioUrl(currentSong.id);
          if (url) {
            setOfflinePlaybackUrl(url);
            setIsOfflineMode(true);
            return;
          }
        }
      }
      setIsOfflineMode(false);
      setOfflinePlaybackUrl(null);
    };
    checkOfflineStatus();
  }, [currentSong?.id, isOnline, isAvailableOffline, getOfflineAudioUrl]);


  // Reset state when song changes
  useEffect(() => {
    if (currentSong) {
      setIsLoadingAudio(true);
      setCurrentTime(0);
      setDuration(currentSong.duration || 0);
      setIsPlaying(false);
      
      // Se estiver offline e não for modo offline, mostre erro
      if (!isOnline && !isOfflineMode) {
        toast.error("Você está offline. A reprodução de músicas do YouTube requer conexão.");
        setIsLoadingAudio(false);
      }
      
      // Se for modo offline, o OfflineAudioPlayer deve tentar carregar e tocar
      if (isOfflineMode) {
        setIsLoadingAudio(true);
      }
    }
  }, [currentSong?.youtube_id, currentSong?.duration, isOnline, isOfflineMode]);

  // Media Session API setup (updated to handle both modes)
  useEffect(() => {
    if (!currentSong || typeof navigator.mediaSession === 'undefined') return;

    // ... (MediaMetadata setup remains the same) ...
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

    const playHandler = () => {
      if (isOfflineMode) {
        setIsPlaying(true);
      } else {
        youtubePlayerRef.current?.playVideo();
      }
    };

    const pauseHandler = () => {
      if (isOfflineMode) {
        setIsPlaying(false);
      } else {
        youtubePlayerRef.current?.pauseVideo();
      }
    };

    navigator.mediaSession.setActionHandler('play', playHandler);
    navigator.mediaSession.setActionHandler('pause', pauseHandler);

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (onPrevious) onPrevious();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (onNext) onNext();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime) {
        handleSeek([details.seekTime]);
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
  }, [currentSong, onNext, onPrevious, isOfflineMode]);

  // Update playback state for Media Session
  useEffect(() => {
    if (typeof navigator.mediaSession !== 'undefined') {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const handlePlayerReady = (player: YouTubePlayerType) => {
    youtubePlayerRef.current = player;
    setIsLoadingAudio(false);
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
        break;
    }
  };

  const togglePlay = () => {
    if (isOfflineMode) {
      setIsPlaying(!isPlaying);
    } else if (youtubePlayerRef.current) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo();
      } else {
        youtubePlayerRef.current.playVideo();
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    if (isOfflineMode && offlineAudioRef.current) {
      offlineAudioRef.current.currentTime = seekTime;
    } else if (youtubePlayerRef.current) {
      youtubePlayerRef.current.seekTo(seekTime, true);
    }
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (!isOfflineMode && youtubePlayerRef.current) {
      youtubePlayerRef.current.setVolume(newVolume);
    }
    // OfflineAudioPlayer handles volume via props
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentSong) return null;

  const isPlayerReady = !isLoadingAudio;
  const isPlaybackDisabled = !isOnline && !isOfflineMode;

  return (
    <Card className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-card to-secondary border-t border-border backdrop-blur-lg shadow-2xl z-[999] overflow-hidden">
      
      {/* Equalizer Visualizer (Background) */}
      <VisualizerBars isPlaying={isPlaying} />
      
      {/* Player Components */}
      {isOfflineMode && offlinePlaybackUrl ? (
        <OfflineAudioPlayer
          audioUrl={offlinePlaybackUrl}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          onPlayStateChange={setIsPlaying}
          onEnded={onNext || (() => {})}
          volume={volume}
          isPlaying={isPlaying} 
          onLoadingChange={setIsLoadingAudio}
          // Passando o ref para o elemento de áudio HTML5
          ref={offlineAudioRef} 
        />
      ) : currentSong.youtube_id && isOnline && (
        <YouTubePlayer
          videoId={currentSong.youtube_id}
          onReady={handlePlayerReady}
          onStateChange={handleStateChange}
          onTimeUpdate={setCurrentTime}
          onDurationChange={setDuration}
          volume={volume}
        />
      )}
      
      {/* Close Button (Absolute position on mobile, hidden on desktop) */}
      <Button
        size="icon"
        variant="ghost"
        onClick={onClose}
        className="absolute top-2 left-2 md:hidden text-muted-foreground hover:text-foreground shrink-0 w-8 h-8 z-10"
      >
        <X className="w-4 h-4" />
      </Button>

      <div className="container mx-auto px-4 py-3 md:py-4 relative z-10">
        
        {/* Mobile Layout: Song Info (Top) + Controls (Middle) + Progress (Bottom) */}
        <div className="flex flex-col md:flex-row md:items-center md:gap-4">
          
          {/* Song Info (Adjusted padding for mobile close button) */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-1/4 order-1 md:order-none mt-2 md:mt-0 pl-10 md:pl-0">
            <img
              src={currentSong.thumbnail_url || "/placeholder.svg"}
              alt={currentSong.title}
              className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover shadow-lg"
            />
            <div className="min-w-0 text-left">
              <h4 className="font-semibold text-foreground truncate text-sm md:text-base">{currentSong.title}</h4>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {currentSong.artist} 
                {isOfflineMode && <span className="ml-2 text-primary/80">(Offline)</span>}
              </p>
            </div>
          </div>

          {/* Controls & Progress (Middle section) */}
          <div className="flex flex-col items-center gap-1 md:gap-2 flex-1 order-3 md:order-none w-full md:w-1/2">
            
            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              {/* Shuffle Button */}
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleShuffle}
                className={`text-foreground hover:text-primary ${isShuffling ? 'text-primary' : 'text-muted-foreground'} w-8 h-8 md:w-10 md:h-10`}
                disabled={!isPlayerReady}
              >
                <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              
              <Button
                size="icon"
                variant="ghost"
                onClick={onPrevious}
                className="text-foreground hover:text-primary w-8 h-8 md:w-10 md:h-10"
                disabled={!isPlayerReady}
              >
                <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              <Button
                size="icon"
                onClick={togglePlay}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-10 h-10 md:w-12 md:h-12"
                disabled={isPlaybackDisabled}
              >
                {isLoadingAudio || isPlaybackDisabled ? (
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
                className="text-foreground hover:text-primary w-8 h-8 md:w-10 md:h-10"
                disabled={!isPlayerReady}
              >
                <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
              
              {/* Volume Control (Mobile Popover / Desktop Hidden) */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="md:hidden text-foreground hover:text-primary w-8 h-8"
                    disabled={!isPlayerReady}
                  >
                    <Volume2 className="w-4 h-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-3 mb-2" side="top" align="end">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-muted-foreground" />
                    <Slider
                      value={[volume]}
                      max={100}
                      step={1}
                      onValueChange={handleVolumeChange}
                      className="flex-1"
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-2 w-full max-w-md">
              <span className="text-xs text-muted-foreground min-w-[30px] md:min-w-[40px]">
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
              <span className="text-xs text-muted-foreground min-w-[30px] md:min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume (Desktop only) */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-end order-2 md:order-none md:w-1/4">
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