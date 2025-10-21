import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface OfflineAudioPlayerProps {
  audioUrl: string;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onEnded: () => void;
  volume: number;
  isPlaying: boolean; // Novo prop para controle externo
  onLoadingChange: (isLoading: boolean) => void;
}

export const OfflineAudioPlayer = forwardRef<HTMLAudioElement, OfflineAudioPlayerProps>(({
  audioUrl,
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
  onEnded,
  volume,
  isPlaying,
  onLoadingChange,
}, ref) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Expor o ref interno para o ref externo (offlineAudioRef no MusicPlayer)
  useImperativeHandle(ref, () => audioRef.current!, [audioRef.current]);

  // 1. Setup listeners and metadata
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Reset state when audioUrl changes
    setIsReady(false);
    onLoadingChange(true);

    const handleLoadedMetadata = () => {
      setIsReady(true);
      onLoadingChange(false);
      onDurationChange(audio.duration);
      
      // Se o estado externo for 'playing', tente tocar
      if (isPlaying) {
        audio.play().catch(err => console.error('Error playing audio:', err));
      }
    };

    const handleTimeUpdate = () => {
      onTimeUpdate(audio.currentTime);
    };

    const handlePlay = () => {
      onPlayStateChange(true);
    };

    const handlePause = () => {
      onPlayStateChange(false);
    };
    
    const handleWaiting = () => {
      onLoadingChange(true);
    };
    
    const handleCanPlay = () => {
      onLoadingChange(false);
    };

    const handleEnded = () => {
      onPlayStateChange(false);
      onEnded();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);


    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl, onTimeUpdate, onDurationChange, onPlayStateChange, onEnded, onLoadingChange]);

  // 2. Sync volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);
  
  // 3. Sync play/pause state
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && isReady) {
      if (isPlaying) {
        audio.play().catch(err => console.error('Error playing audio:', err));
      } else {
        audio.pause();
      }
    }
  }, [isPlaying, isReady]);


  return (
    <audio
      ref={audioRef}
      src={audioUrl}
      style={{ display: 'none' }}
    />
  );
});