import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Import Sonner toast

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
      setIsPlaying(false); // Reset playing state when loading new song
      setCurrentTime(0); // Reset time
      setDuration(currentSong.duration || 0); // Use duration from context if available

      let urlToPlay: string | null = null;

      // 1. Check if audio is available offline
      if ('caches' in window) {
        try {
          const cache = await caches.open('music-offline-v1');
          const audioRequest = new Request(`/offline-audio/${currentSong.youtube_id}`);
          const response = await cache.match(audioRequest);
          
          if (response) {
            const blob = await response.blob();
            urlToPlay = URL.createObjectURL(blob);
          }
        } catch (error) {
          console.error('Error checking offline audio:', error);
        }
      }

      // 2. If not offline, fetch the direct stream URL from the existing 'download-audio' Edge Function
      if (!urlToPlay) {
        try {
          console.log('Invoking Edge Function (download-audio) to get stream URL');
          
          // We use fetch here instead of supabase.functions.invoke because download-audio
          // is designed to return the audio stream URL directly, not proxy the stream.
          const { data, error } = await supabase.functions.invoke("download-audio", {
            body: { youtubeId: currentSong.youtube_id },
          });

          if (error) throw error;
          
          if (data.audioUrl) {
            urlToPlay = data.audioUrl;
          } else {
            throw new Error(data.error || 'Resposta inválida da função Edge.');
          }
          
        } catch (error: any) {
          console.error('Error loading audio from Edge:', error);
          toast.error("Erro ao carregar áudio: " + (error.message || "Falha na função Edge."));
          urlToPlay = null;
        }
      }
      
      setAudioUrl(urlToPlay);
      setIsLoadingAudio(false);
    };

    loadAudioUrl();

    // Cleanup blob URLs
    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [currentSong?.youtube_id, currentSong?.duration, currentSong?.audio_url]);

  // Effect to handle playback when audioUrl is ready
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && audioUrl) {
      // Attempt to play immediately when the URL is available
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Autoplay blocked. User interaction required:', err);
        // If play fails, ensure the state reflects paused
        setIsPlaying(false);
      });
    }
  }, [audioUrl]);


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
        // Attempt to play, handling potential autoplay restrictions
        audioRef.current.play().catch(err => {
          console.error('Error playing audio (user interaction required):', err);
          // If play fails (e.g., due to autoplay policy), keep isPlaying false
          setIsPlaying(false);
        });
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
          autoPlay={false} // Relying on useEffect for play attempt
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onDurationChange={(e) => {
            // Only update duration if it wasn't set from context (e.g., for offline songs)
            if (!currentSong.duration) {
              setDuration(e.currentTarget.duration);
            }
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            if (onNext) onNext();
          }}
          onError={(e) => {
            console.error('Audio playback error:', e);
            setIsLoadingAudio(false);
            setIsPlaying(false);
            toast.error("Erro de reprodução de áudio. O link pode estar expirado ou o servidor de streaming está indisponível.");
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
                {isLoadingAudio ? (
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
                disabled={!audioUrl || isLoadingAudio}
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