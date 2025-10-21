import React, { useRef, useEffect, useState } from 'react';
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from '@/lib/utils';

interface VolumePopoverProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (value: number[]) => void;
  onToggleMute: (e: React.MouseEvent) => void;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

export const VolumePopover: React.FC<VolumePopoverProps> = ({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
  isOpen,
  onClose,
  triggerRef,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ bottom: 0, right: 0 });

  // 1. Calcular a posição do popover com base no botão de trigger
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      
      // Posiciona o popover acima e alinhado à direita do botão
      setPosition({
        bottom: window.innerHeight - triggerRect.top + 10, // 10px acima do botão
        right: window.innerWidth - triggerRect.right,
      });
    }
  }, [isOpen, triggerRef]);

  // 2. Lidar com cliques fora do popover para fechar
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Verifica se o clique não foi no popover e nem no botão de trigger
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : Volume2;

  return (
    <div
      ref={popoverRef}
      className={cn(
        "fixed w-40 p-3 mb-2 bg-popover border border-border rounded-lg shadow-xl z-[101] transition-opacity duration-200",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      style={{ bottom: position.bottom, right: position.right }}
      // Clicks inside should NOT close it, handled by the global listener logic
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <Button 
          size="icon" 
          variant="ghost" 
          onClick={onToggleMute} 
          className="text-muted-foreground hover:bg-transparent hover:text-primary h-8 w-8"
        >
          <VolumeIcon className="w-4 h-4" />
        </Button>
        <Slider 
          value={[volume]} 
          max={100} 
          step={1} 
          onValueChange={onVolumeChange} 
          className="flex-1" 
          // Não precisamos de stopPropagation aqui, pois o listener global já lida com isso
        />
      </div>
    </div>
  );
};