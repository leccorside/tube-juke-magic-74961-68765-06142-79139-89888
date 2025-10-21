import { createContext, useContext, useState, ReactNode } from "react";

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
  setCurrentSong: (song: Song | null) => void;
  setPlaylist: (songs: Song[]) => void;
  playNext: () => void;
  playPrevious: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const MusicPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [playlist, setPlaylist] = useState<Song[]>([]);

  const playNext = () => {
    if (playlist.length > 0 && currentSong) {
      const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
      if (currentIndex < playlist.length - 1) {
        setCurrentSong(playlist[currentIndex + 1]);
      }
    }
  };

  const playPrevious = () => {
    if (playlist.length > 0 && currentSong) {
      const currentIndex = playlist.findIndex((s) => s.id === currentSong.id);
      if (currentIndex > 0) {
        setCurrentSong(playlist[currentIndex - 1]);
      }
    }
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        playlist,
        setCurrentSong,
        setPlaylist,
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
