import { useRef, useEffect, useState } from 'react';

interface OfflineAudioPlayerProps {
  audioUrl: string;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  onEnded: () => void;
  volume: number;
  autoPlay?: boolean;
}

export const OfflineAudioPlayer = ({
  audioUrl,
  onTimeUpdate,
  onDurationChange,
  onPlayStateChange,
  onEnded,
  volume,
  autoPlay = true
}: OfflineAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setIsReady(true);
      onDurationChange(audio.duration);
      if (autoPlay) {
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

    const handleEnded = () => {
      onPlayStateChange(false);
      onEnded();
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, autoPlay, onTimeUpdate, onDurationChange, onPlayStateChange, onEnded]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  return (
    <audio
      ref={audioRef}
      src={audioUrl}
      style={{ display: 'none' }}
    />
  );
};
