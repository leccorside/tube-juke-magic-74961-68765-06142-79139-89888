import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { formatBytes } from "@/lib/utils";

interface OfflineSong {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  youtubeId: string;
  audioUrl: string;
  audioSize?: number;
}

const CACHE_NAME = 'leccor-music-audio-cache';

export const useOfflineMusic = () => {
  const [offlineSongs, setOfflineSongs] = useState<OfflineSong[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [totalCacheSize, setTotalCacheSize] = useState(0);

  const refreshOfflineSongs = useCallback(async () => {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      
      const cachedSongs: OfflineSong[] = [];
      let totalSize = 0;

      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const url = new URL(request.url);
          const metadata = JSON.parse(url.searchParams.get('metadata') || '{}');
          
          // Tentativa de obter o tamanho real do arquivo cacheado
          const size = response.headers.get('content-length') ? parseInt(response.headers.get('content-length')!) : 0;
          totalSize += size;

          if (metadata.id) {
            cachedSongs.push({
              id: metadata.id,
              title: metadata.title || 'Música Offline',
              artist: metadata.artist || 'Artista Desconhecido',
              thumbnailUrl: metadata.thumbnailUrl || '/placeholder.svg',
              youtubeId: metadata.youtubeId,
              audioUrl: metadata.audioUrl,
              audioSize: size,
            });
          }
        }
      }
      
      setOfflineSongs(cachedSongs);
      setTotalCacheSize(totalSize);
    } catch (error) {
      console.error('Error refreshing offline songs:', error);
    }
  }, []);

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

    refreshOfflineSongs();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshOfflineSongs]);

  const isAvailableOffline = useCallback(async (songId: string): Promise<boolean> => {
    return offlineSongs.some(s => s.id === songId);
  }, [offlineSongs]);

  const getOfflineAudioUrl = useCallback(async (songId: string): Promise<string | null> => {
    if (!('caches' in window)) return null;
    
    const song = offlineSongs.find(s => s.id === songId);
    if (!song) return null;

    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      
      // Encontra a Request que corresponde ao songId
      const matchingRequest = keys.find(req => {
        const url = new URL(req.url);
        const metadata = JSON.parse(url.searchParams.get('metadata') || '{}');
        return metadata.id === songId;
      });

      if (matchingRequest) {
        // Retorna o URL de cache que contém o URL de áudio real nos metadados
        return matchingRequest.url;
      }
      return null;
    } catch (error) {
      console.error('Error getting offline audio URL:', error);
      return null;
    }
  }, [offlineSongs]);

  const downloadForOffline = async (song: { id: string, title: string, artist: string, thumbnail_url: string, audio_url: string, youtube_id: string }) => {
    if (!('caches' in window)) {
      toast.error('Seu navegador não suporta o recurso de cache offline.');
      return false;
    }
    
    if (await isAvailableOffline(song.id)) {
      toast.info('Música já está disponível offline.');
      return true;
    }

    if (!isOnline) {
      toast.error('Você precisa estar online para baixar músicas.');
      return false;
    }

    const downloadToastId = toast.loading(`Preparando download de ${song.title}...`);

    try {
      // 1. Obter o token de sessão mais recente
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Usuário não autenticado. Faça login novamente.");
      }
      
      // 2. Chamar Edge Function para obter o URL de áudio direto, passando o token explicitamente
      const { data: audioData, error: audioError } = await supabase.functions.invoke("search-and-download", {
        body: { action: "get_audio_url", videoId: song.youtube_id },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      
      if (audioError) {
        // Se for um erro de rede ou status não-2xx, o objeto error do invoke é preenchido.
        // Se o erro for 401, a mensagem será 'Falha na comunicação...'.
        // Se for 500, a mensagem de erro do Edge Function deve ser propagada no corpo.
        
        // Tentativa de extrair a mensagem de erro do corpo da resposta, se disponível.
        // Como o invoke não expõe o corpo da resposta em caso de erro, confiamos na mensagem de erro do Edge Function.
        
        // Se o Edge Function retornou um erro 500 com a mensagem de erro no corpo:
        if (audioData && audioData.error) {
          throw new Error(audioData.error);
        }
        
        // Caso contrário, use a mensagem genérica de falha de comunicação
        const errorMessage = audioError.message.includes('non-2xx status code') 
          ? 'Falha na comunicação com o servidor. Verifique se você está logado.'
          : audioError.message;
        throw new Error(errorMessage);
      }
      
      if (!audioData.success || !audioData.audioUrl) {
        throw new Error(audioData.error || 'Falha ao obter link de áudio.');
      }
      
      const directAudioUrl = audioData.audioUrl;
      
      toast.loading(`Baixando ${song.title}...`, { id: downloadToastId });

      // 3. Fazer o fetch do áudio real
      const response = await fetch(directAudioUrl);
      
      if (!response.ok) {
        throw new Error(`Falha ao buscar áudio: ${response.statusText}. O link de áudio pode ter expirado.`);
      }
      
      // 4. Criar URL de cache com metadados
      const metadata = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        thumbnailUrl: song.thumbnail_url,
        youtubeId: song.youtube_id,
        audioUrl: directAudioUrl, // Armazenamos o URL de áudio direto
      };
      
      // Usamos um URL de cache único que contém os metadados
      const cacheUrl = `/offline-audio-cache/${song.id}?metadata=${encodeURIComponent(JSON.stringify(metadata))}`;

      // 5. Armazenar no Cache API
      const cache = await caches.open(CACHE_NAME);
      
      // Clonamos a resposta para poder usá-la no cache
      await cache.put(cacheUrl, response.clone());

      // 6. Atualizar o tamanho do cache (se Content-Length estiver disponível)
      const size = response.headers.get('content-length') ? parseInt(response.headers.get('content-length')!) : 0;
      
      toast.success(`${song.title} baixada para offline! (${size > 0 ? formatBytes(size) : 'Tamanho desconhecido'})`, { id: downloadToastId });
      refreshOfflineSongs();
      return true;
    } catch (error) {
      console.error('Download offline failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Falha ao baixar música para offline: ${errorMessage}`, { id: downloadToastId });
      return false;
    }
  };

  const removeOffline = async (songId: string) => {
    if (!('caches' in window)) return false;

    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      
      // Encontra a Request que corresponde ao songId
      const matchingRequest = keys.find(req => {
        const url = new URL(req.url);
        const metadata = JSON.parse(url.searchParams.get('metadata') || '{}');
        return metadata.id === songId;
      });

      if (matchingRequest) {
        await cache.delete(matchingRequest);
        toast.success('Música removida do cache offline.');
        refreshOfflineSongs();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing offline song:', error);
      toast.error('Erro ao remover música do cache.');
      return false;
    }
  };

  const clearAllOffline = async () => {
    if (!('caches' in window)) return;
    try {
      await caches.delete(CACHE_NAME);
      toast.success('Todo o cache offline foi limpo.');
      refreshOfflineSongs();
    } catch (error) {
      console.error('Error clearing all offline cache:', error);
      toast.error('Erro ao limpar cache offline.');
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
    refreshOfflineSongs,
  };
};