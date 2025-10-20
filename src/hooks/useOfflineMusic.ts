import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OfflineSong {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  youtubeId: string;
  audioSize?: number;
}

export const useOfflineMusic = () => {
  const [offlineSongs, setOfflineSongs] = useState<OfflineSong[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [totalCacheSize, setTotalCacheSize] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restaurada');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Você está offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadOfflineSongs();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineSongs = async () => {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open('music-offline-v1');
      const keys = await cache.keys();
      
      const songs: OfflineSong[] = [];
      let totalSize = 0;

      for (const request of keys) {
        if (request.url.includes('/offline-metadata/')) {
          const response = await cache.match(request);
          if (response) {
            const metadata = await response.json();
            
            // Check if audio exists
            const audioRequest = new Request(`/offline-audio/${metadata.youtubeId}`);
            const audioResponse = await cache.match(audioRequest);
            
            if (audioResponse) {
              const audioBlob = await audioResponse.blob();
              totalSize += audioBlob.size;
              
              songs.push({
                ...metadata,
                audioSize: audioBlob.size
              });
            }
          }
        }
      }

      setOfflineSongs(songs);
      setTotalCacheSize(totalSize);
    } catch (error) {
      console.error('Error loading offline songs:', error);
    }
  };

  const downloadForOffline = async (song: {
    id: string;
    title: string;
    artist: string;
    thumbnail_url: string;
    youtube_id: string;
  }, onProgress?: (progress: number) => void) => {
    if (!('caches' in window)) {
      toast.error('Seu navegador não suporta cache offline');
      return false;
    }

    try {
      toast.loading('Preparando download...', { id: 'download-progress' });

      // Get audio stream from edge function via proxy
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Use download-audio function which proxies the audio stream
      const audioResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ youtubeId: song.youtube_id })
        }
      );

      if (!audioResponse.ok) {
        const error = await audioResponse.json();
        throw new Error(error.error || 'Failed to download audio');
      }

      const reader = audioResponse.body?.getReader();
      const contentLength = parseInt(audioResponse.headers.get('content-length') || '0');
      
      let receivedLength = 0;
      const chunks: Uint8Array[] = [];

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          receivedLength += value.length;

          const progress = contentLength > 0 ? (receivedLength / contentLength) * 100 : 0;
          if (onProgress) onProgress(progress);
          
          toast.loading(`Baixando áudio: ${Math.round(progress)}%`, { id: 'download-progress' });
        }
      }

      const audioBlob = new Blob(chunks as BlobPart[], { type: 'audio/mpeg' });

      // Save to cache
      const cache = await caches.open('music-offline-v1');

      // Save audio
      const audioRequest = new Request(`/offline-audio/${song.youtube_id}`);
      await cache.put(audioRequest, new Response(audioBlob));

      // Save metadata
      const metadata = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnailUrl: song.thumbnail_url,
        youtubeId: song.youtube_id,
        downloadedAt: new Date().toISOString()
      };

      const metadataRequest = new Request(`/offline-metadata/${song.youtube_id}`);
      await cache.put(metadataRequest, new Response(JSON.stringify(metadata)));

      // Download thumbnail
      try {
        const thumbResponse = await fetch(song.thumbnail_url);
        if (thumbResponse.ok) {
          await cache.put(song.thumbnail_url, thumbResponse.clone());
        }
      } catch (error) {
        console.error('Error caching thumbnail:', error);
      }

      await loadOfflineSongs();
      toast.success('Música baixada para offline!', { id: 'download-progress' });
      return true;
    } catch (error) {
      console.error('Error downloading for offline:', error);
      toast.error('Erro ao baixar música', { id: 'download-progress' });
      return false;
    }
  };

  const removeOffline = async (youtubeId: string) => {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open('music-offline-v1');
      
      await cache.delete(new Request(`/offline-audio/${youtubeId}`));
      await cache.delete(new Request(`/offline-metadata/${youtubeId}`));
      
      await loadOfflineSongs();
      toast.success('Música removida do offline');
      return true;
    } catch (error) {
      console.error('Error removing offline song:', error);
      toast.error('Erro ao remover música');
      return false;
    }
  };

  const clearAllOffline = async () => {
    if (!('caches' in window)) return;

    try {
      await caches.delete('music-offline-v1');
      setOfflineSongs([]);
      setTotalCacheSize(0);
      toast.success('Cache limpo com sucesso');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Erro ao limpar cache');
    }
  };

  const isAvailableOffline = async (youtubeId: string): Promise<boolean> => {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open('music-offline-v1');
      const audioRequest = new Request(`/offline-audio/${youtubeId}`);
      const response = await cache.match(audioRequest);
      return !!response;
    } catch {
      return false;
    }
  };

  const getOfflineAudioUrl = async (youtubeId: string): Promise<string | null> => {
    if (!('caches' in window)) return null;

    try {
      const cache = await caches.open('music-offline-v1');
      const audioRequest = new Request(`/offline-audio/${youtubeId}`);
      const response = await cache.match(audioRequest);
      
      if (response) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      return null;
    } catch (error) {
      console.error('Error getting offline audio:', error);
      return null;
    }
  };

  return {
    offlineSongs,
    isOnline,
    totalCacheSize,
    downloadForOffline,
    removeOffline,
    clearAllOffline,
    isAvailableOffline,
    getOfflineAudioUrl,
    refreshOfflineSongs: loadOfflineSongs
  };
};
