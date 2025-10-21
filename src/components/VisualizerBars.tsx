import React from 'react';
import { cn } from '@/lib/utils';

interface VisualizerBarsProps {
  isPlaying: boolean;
}

// Define as animações CSS no arquivo de estilo global (src/index.css)
// para que o Tailwind possa usá-las.

const VisualizerBars: React.FC<VisualizerBarsProps> = ({ isPlaying }) => {
  const barClasses = "w-1 h-full rounded-full bg-primary/70 transition-colors duration-300";
  
  // Array para criar 10 barras
  const bars = Array.from({ length: 10 });

  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-30 pointer-events-none">
      <div className="flex h-full items-end gap-1 md:gap-2 py-1">
        {bars.map((_, index) => (
          <div
            key={index}
            className={cn(
              barClasses,
              // Define a altura inicial e a animação
              'h-1/4',
              {
                // Aplica a animação apenas se estiver tocando
                'animate-equalizer': isPlaying,
              },
              // Adiciona um delay e duração diferentes para cada barra para um efeito mais orgânico
              `animation-delay-${index}`,
              `animation-duration-${index}`
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default VisualizerBars;