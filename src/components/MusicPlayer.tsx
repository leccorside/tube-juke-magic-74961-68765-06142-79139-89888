import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Loader2, Shuffle, Clock } from "lucide-react";
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
import { PlayerProgress } from "./PlayerProgress"; // Importando o novo componente
// import VisualizerBars from "./VisualizerBars"; // Removido

const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_ENDED = 0;
const YT_BUFFERING = 3;

interface MusicPlayerProps {
  currentSong: {
    id: string;
    title: string;
    artist: string;
    thumbnail_url: string;
    audio_url: string;
    youtube_id: string;
    duration?: number;
  } | null;
  onNext?: () => void;
  onPrevious?: () => void;
  onClose?: () => void;
}

export const MusicPlayer = ({ currentSong, onNext, onPrevious, onClose }: MusicPlayerProps) => {
  const { isShuffling, toggleShuffle } = useMusicPlayer();
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

  useEffect(() => {
    const checkOfflineStatus = async () => {
      if (currentSong) {
        const isCached = await isAvailableOffline(currentSong.id);
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

  useEffect(() => {
    if (currentSong) {
      setIsLoadingAudio(true);
      setCurrentTime(0);
      setDuration(currentSong.duration || 0);
      setIsPlaying(false);
      if (!isOnline && !isOfflineMode) {
        toast.error("Você está offline. A reprodução de músicas do YouTube requer conexão.");
        setIsLoadingAudio(false);
      }
      if (isOfflineMode) setIsLoadingAudio(true);
    }
  }, [currentSong?.youtube_id, currentSong?.duration, isOnline, isOfflineMode]);

  useEffect(() => {
    if (!currentSong || typeof navigator.mediaSession === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      artwork: [{ src: currentSong.thumbnail_url, sizes: '512x512', type: 'image/jpeg' }],
    });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => togglePlay()],
      ['pause', () => togglePlay()],
      ['previoustrack', onPrevious],
      ['nexttrack', onNext],
      ['seekto', (details) => details.seekTime && handleSeek([details.seekTime])],
    ];
    for (const [action, handler] of handlers) {
      try { navigator.mediaSession.setActionHandler(action, handler); } catch (e) {}
    }
  }, [currentSong, onNext, onPrevious, isOfflineMode]);

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
    setIsPlaying(state === YT_PLAYING);
    setIsLoadingAudio(state === YT_BUFFERING);
    if (state === YT_ENDED && onNext) onNext();
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isOfflineMode) {
      setIsPlaying(!isPlaying);
    } else if (youtubePlayerRef.current) {
      isPlaying ? youtubePlayerRef.current.pauseVideo() : youtubePlayerRef.current.playVideo();
    }
  };

  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    if (isOfflineMode && offlineAudioRef.current) offlineAudioRef.current.currentTime = seekTime;
    else if (youtubePlayerRef.current) youtubePlayerRef.current.seekTo(seekTime, true);
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (!isOfflineMode && youtubePlayerRef.current) youtubePlayerRef.current.setVolume(newVolume);
  };

  // Função auxiliar para lidar com ações internas e impedir a propagação
  const handleAction = (e: React.MouseEvent, action?: () => void) => {
    e.stopPropagation();
    action?.();
  };

  if (!currentSong) return null;

  const isPlayerReady = !isLoadingAudio;
  const isPlaybackDisabled = !isOnline && !isOfflineMode;

  const PlayerControls = () => (
    <>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={(e) => handleAction(e, toggleShuffle)} 
        className={`
          ${isShuffling ? 'text-primary' : 'text-muted-foreground'} 
          hover:bg-transparent hover:text-primary
        `}
      >
        <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
      </Button>
      <div className="flex items-center z-30"> {/* Z-INDEX AUMENTADO */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => handleAction(e, onPrevious)}
          className="hover:bg-transparent hover:text-primary"
        >
          <SkipBack className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
        <Button size="icon" onClick={(e) => handleAction(e, togglePlay)} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-10 h-10 md:w-12 md:h-12" disabled={isPlaybackDisabled}>
          {isLoadingAudio || isPlaybackDisabled ? <Loader2 className="w-5 h-5 animate-spin" /> : isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => handleAction(e, onNext)}
          className="hover:bg-transparent hover:text-primary"
        >
          <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
        </Button>
      </div>
      
      {/* Volume Control Mobile (Popover) */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            size="icon" 
            variant="ghost" 
            className="md:hidden text-foreground hover:text-primary w-8 h-8 hover:bg-transparent" 
            disabled={!isPlayerReady} 
            onClick={(e) => e.stopPropagation()}
          >
            <Volume2 className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-3 mb-2" side="top" align="end">
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <Slider 
              value={[volume]} 
              max={100} 
              step={1} 
              onValueChange={handleVolumeChange} 
              className="flex-1" 
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Placeholder para manter o alinhamento no mobile */}
      <div className="hidden md:block w-8 h-8" /> 
    </>
  );

  return (
    <>
      {/* Hidden players remain active in the background */}
      <div className="hidden">
        {isOfflineMode && offlinePlaybackUrl ? (
          <OfflineAudioPlayer ref={offlineAudioRef} audioUrl={offlinePlaybackUrl} onTimeUpdate={setCurrentTime} onDurationChange={setDuration} onPlayStateChange={setIsPlaying} onEnded={onNext || (() => {})} volume={volume} isPlaying={isPlaying} onLoadingChange={setIsLoadingAudio} />
        ) : currentSong.youtube_id && isOnline && (
          <YouTubePlayer videoId={currentSong.youtube_id} onReady={handlePlayerReady} onStateChange={handleStateChange} onTimeUpdate={setCurrentTime} onDurationChange={setDuration} volume={volume} />
        )}
      </div>

      <Card className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-card to-secondary border-t border-border backdrop-blur-lg shadow-2xl z-[99] overflow-hidden animate-in slide-in-from-bottom duration-300">
        
        {/* Botão de Fechar (X) - Mantendo z-index alto */}
        <Button size="icon" variant="ghost" onClick={(e) => handleAction(e, onClose)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground shrink-0 w-8 h-8 z-30 hover:bg-transparent hover:text-primary"><X className="w-4 h-4" /></Button>
        
        {/* Conteúdo principal do Mini-Player */}
        <div className="container mx-auto px-4 py-3 md:py-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            
            {/* Song Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-1/4 order-1 md:order-none mt-2 md:mt-0">
              <img src={currentSong.thumbnail_url || "/placeholder.svg"} alt={currentSong.title} className="w-10 h-10 md:w-14 md:h-14 rounded-full object-cover shadow-lg" />
              <div className="min-w-0 text-left">
                <h4 className="font-semibold text-foreground truncate text-sm md:text-base">{currentSong.title}</h4>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {currentSong.artist} 
                  {isOfflineMode && <span className="ml-2 text-primary/80">(Offline)</span>}
                </p>
              </div>
            </div>

            {/* Controls (Middle section) */}
            <div className="flex flex-col items-center gap-1 md:gap-2 flex-1 order-3 md:order-none w-full md:w-1/2">
              
              {/* Control Buttons */}
              <div className="flex items-center gap-2 z-30">
                <PlayerControls />
              </div>
              
              {/* Progress Bar (Movida de volta para baixo dos botões) */}
              <div className="w-full h-2 px-0 pt-1 pb-1 relative z-10">
                <PlayerProgress
                  currentTime={currentTime}
                  duration={duration}
                  isPlayerReady={isPlayerReady}
                  handleSeek={handleSeek}
                />
              </div>
            </div>

            {/* Volume (Desktop only) */}
            <div className="hidden md:flex items-center gap-2 flex-1 justify-end order-2 md:order-none md:w-1/4" onClick={(e) => e.stopPropagation()}>
              <Volume2 className="w-5 h-5 text-muted-foreground" />
              <Slider
                value={[volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-24"
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      </Card>
    </>
  );
};