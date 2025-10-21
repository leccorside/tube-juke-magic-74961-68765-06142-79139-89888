import { MusicPlayer } from "@/components/MusicPlayer";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

export const MusicPlayerWrapper = () => {
  const { currentSong, playNext, playPrevious, setCurrentSong } = useMusicPlayer();
  
  if (!currentSong) return null;

  return (
    <MusicPlayer 
      currentSong={currentSong} 
      onNext={playNext}
      onPrevious={playPrevious}
      onClose={() => setCurrentSong(null)}
    />
  );
};