import { useState, useEffect } from 'react';
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

    // Since we removed the caching logic, we initialize with empty state
    setOfflineSongs([]);
    setTotalCacheSize(0);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Stubs for removed functionality
  const downloadForOffline = async () => {
    toast.error('O download offline está temporariamente indisponível.');
    return false;
  };

  const removeOffline = async () => {
    toast.error('O download offline está temporariamente indisponível.');
    return false;
  };

  const clearAllOffline = async () => {
    toast.error('O cache offline está temporariamente indisponível.');
  };

  const isAvailableOffline = async (): Promise<boolean> => {
    return false;
  };

  const getOfflineAudioUrl = async (): Promise<string | null> => {
    return null;
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
    refreshOfflineSongs: () => {} // No-op
  };
};