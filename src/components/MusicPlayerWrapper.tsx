import { createPortal } from 'react-dom';
import { MusicPlayer } from "@/components/MusicPlayer";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

export const MusicPlayerWrapper = () => {
  const { currentSong, playNext, playPrevious, setCurrentSong } = useMusicPlayer();
  
  if (!currentSong) return null;

  const player = (
    <MusicPlayer 
      currentSong={currentSong} 
      onNext={playNext}
      onPrevious={playPrevious}
      onClose={() => setCurrentSong(null)}
    />
  );

  // Renderiza o player fora da hierarquia principal do React, diretamente no body
  return createPortal(player, document.body);
};