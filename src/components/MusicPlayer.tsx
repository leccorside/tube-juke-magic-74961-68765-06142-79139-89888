import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface MusicPlayerProps {
  currentSong: {
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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

  // Load audio URL when song changes
  useEffect(() => {
    const loadAudioUrl = async () => {
      if (!currentSong) {
        setAudioUrl(null);
        return;
      }

      setIsLoadingAudio(true);

      // First, check if audio is available offline
      if ('caches' in window) {
        try {
          const cache = await caches.open('music-offline-v1');
          const audioRequest = new Request(`/offline-audio/${currentSong.youtube_id}`);
          const response = await cache.match(audioRequest);
          
          if (response) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            setIsLoadingAudio(false);
            return;
          }
        } catch (error) {
          console.error('Error checking offline audio:', error);
        }
      }

      // If not offline, use edge function proxy URL
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No session available');
          setIsLoadingAudio(false);
          return;
        }

        // Create a URL to the edge function that will stream the audio
        const streamUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-audio-stream`;
        
        // Create a blob URL from the streamed response
        const response = await fetch(streamUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ youtubeId: currentSong.youtube_id }),
        });

        if (!response.ok) {
          throw new Error('Failed to get audio stream');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } catch (error) {
        console.error('Error loading audio:', error);
      } finally {
        setIsLoadingAudio(false);
      }
    };

    loadAudioUrl();

    // Cleanup blob URLs
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [currentSong?.youtube_id]);


  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Media Session API for background playback and lock screen controls
  useEffect(() => {
    if (!currentSong || !audioRef.current || typeof navigator.mediaSession === 'undefined') return;

    const audio = audioRef.current;

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
      audio.play();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      audio.pause();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (onPrevious) onPrevious();
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (onNext) onNext();
    });

    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime) {
        audio.currentTime = details.seekTime;
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


  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => console.error('Error playing audio:', err));
      }
    }
  };

  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentSong) return null;

  return (
    <Card className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-card to-secondary border-t border-border backdrop-blur-lg shadow-2xl">
      {/* HTML5 Audio Player */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            if (onNext) onNext();
          }}
          onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
            e.currentTarget.play().catch(err => console.error('Error auto-playing audio:', err));
          }}
          style={{ display: 'none' }}
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
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                onClick={togglePlay}
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full w-10 h-10"
                disabled={isLoadingAudio || !audioUrl}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onNext}
                className="text-foreground hover:text-primary"
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
