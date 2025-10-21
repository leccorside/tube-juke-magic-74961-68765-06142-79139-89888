import { createPortal } from 'react-dom';
import { MusicPlayer } from "@/components/MusicPlayer";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

export const MusicPlayerWrapper = () => {
  const { currentSong, playNext, playPrevious, setCurrentSong } = useMusicPlayer();
  const playerRoot = document.getElementById('player-root');

  if (!currentSong || !playerRoot) {
    return null;
  }

  const player = (
    <MusicPlayer 
      currentSong={currentSong} 
      onNext={playNext}
      onPrevious={playPrevious}
      onClose={() => setCurrentSong(null)}
    />
  );

  // Renderiza o player no container dedicado, fora da hierarquia do #root
  return createPortal(player, playerRoot);
};