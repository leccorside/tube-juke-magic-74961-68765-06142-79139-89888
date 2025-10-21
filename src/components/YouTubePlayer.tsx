import React, { useRef, useEffect, useState } from 'react';
import YouTube, { YouTubeProps, YouTubePlayer as YouTubePlayerType } from 'react-youtube';

interface YouTubePlayerProps {
  videoId: string;
  onReady: (player: YouTubePlayerType) => void;
  onStateChange: (state: number) => void;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  volume: number;
}

// Intervalo para atualizar o tempo de reprodução (em ms)
const TIME_UPDATE_INTERVAL = 500;

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onReady,
  onStateChange,
  onTimeUpdate,
  onDurationChange,
  volume,
}) => {
  const playerRef = useRef<YouTubePlayerType | null>(null);
  const intervalRef = useRef<number | null>(null);

  const opts: YouTubeProps['opts'] = {
    height: '0',
    width: '0',
    playerVars: {
      autoplay: 1,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0,
      iv_load_policy: 3,
      enablejsapi: 1,
    },
  };

  const handleReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    onReady(event.target);
    
    // Set initial volume
    event.target.setVolume(volume);

    // Start time update interval
    intervalRef.current = setInterval(() => {
      if (playerRef.current) {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        onTimeUpdate(currentTime);
        onDurationChange(duration);
      }
    }, TIME_UPDATE_INTERVAL) as unknown as number;
  };

  const handleStateChange: YouTubeProps['onStateChange'] = (event) => {
    onStateChange(event.data);
  };

  // Sync volume changes from parent
  useEffect(() => {
    if (playerRef.current) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    // Alterado o estilo para usar um tamanho mínimo e posicionamento fora da tela,
    // em vez de opacity: 0 e z-index negativo, para evitar que o navegador pause o iframe.
    <div style={{ position: 'fixed', top: '-1000px', left: '-1000px', width: '1px', height: '1px', overflow: 'hidden' }}>
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={handleReady}
        onStateChange={handleStateChange}
      />
    </div>
  );
};