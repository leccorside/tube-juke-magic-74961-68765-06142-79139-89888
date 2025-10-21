import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  audio_url: string;
  duration: number;
  youtube_id: string;
}

interface MusicPlayerContextType {
  currentSong: Song | null;
  playlist: Song[];
  isShuffling: boolean;
  setCurrentSong: (song: Song | null) => void;
  setPlaylist: (songs: Song[]) => void;
  toggleShuffle: () => void;
  playNext: () => void;
  playPrevious: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

// Função utilitária para obter um índice aleatório diferente do atual
const getRandomIndex = (currentIndex: number, length: number): number => {
  if (length <= 1) return 0;
  let newIndex;
  do {
    newIndex = Math.floor(Math.random() * length);
  } while (newIndex === currentIndex);
  return newIndex;
};

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);

  const toggleShuffle = useCallback(() => {
    setIsShuffling((prev) => !prev);
  }, []);

  const playNext = useCallback(() => {
    if (playlist.length === 0) return;

    if (isShuffling && currentSong) {
      const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
      const nextIndex = getRandomIndex(currentIndex, playlist.length);
      setCurrentSong(playlist[nextIndex]);
      return;
    }

    if (currentSong) {
      const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
      if (currentIndex < playlist.length - 1) {
        setCurrentSong(playlist[currentIndex + 1]);
      } else {
        // Volta para o início se não estiver em modo aleatório
        setCurrentSong(playlist[0]);
      }
    } else {
      setCurrentSong(playlist[0]);
    }
  }, [playlist, isShuffling, currentSong]);

  const playPrevious = useCallback(() => {
    if (playlist.length === 0) return;

    if (isShuffling && currentSong) {
      const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
      const previousIndex = getRandomIndex(currentIndex, playlist.length);
      setCurrentSong(playlist[previousIndex]);
      return;
    }

    if (currentSong) {
      const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
      if (currentIndex > 0) {
        setCurrentSong(playlist[currentIndex - 1]);
      } else {
        // Volta para o final se não estiver em modo aleatório
        setCurrentSong(playlist[playlist.length - 1]);
      }
    } else {
      setCurrentSong(playlist[playlist.length - 1]);
    }
  }, [playlist, isShuffling, currentSong]);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        playlist,
        isShuffling,
        setCurrentSong,
        setPlaylist,
        toggleShuffle,
        playNext,
        playPrevious,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider");
  }
  return context;
};