import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { ListMusic, GripVertical, Play, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';

interface QueueDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  audio_url: string;
  duration: number;
  youtube_id: string;
}

// Componente Sortable Item
const SortableItem = ({ song, index, currentSongId, onPlay, onRemove }: { song: Song, index: number, currentSongId: string | null, onPlay: (song: Song) => void, onRemove: (songId: string) => void }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };
  
  const isCurrent = song.id === currentSongId;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      // Adicionando w-full para garantir que o Card ocupe 100% da largura disponível
      className={`w-full p-3 flex items-center gap-3 cursor-default transition-all duration-200 ${isCurrent ? 'border-primary/50 bg-primary/10 shadow-md' : 'bg-card hover:bg-secondary/50'}`}
    >
      <div 
        className="cursor-grab text-muted-foreground hover:text-foreground p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </div>
      
      <span className={`text-sm font-mono w-4 ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
        {index + 1}
      </span>
      
      <img
        src={song.thumbnail_url || "/placeholder.svg"}
        alt={song.title}
        className="w-10 h-10 rounded-md object-cover flex-shrink-0"
      />
      
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium truncate text-sm ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
          {song.title}
        </h3>
        <p className="text-xs text-muted-foreground truncate">
          {song.artist}
        </p>
      </div>
      
      <div className="flex gap-1 flex-shrink-0">
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onPlay(song)}
          className="text-muted-foreground hover:text-primary h-8 w-8"
        >
          <Play className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => onRemove(song.id)}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};

export const QueueDialog: React.FC<QueueDialogProps> = ({ isOpen, onClose }) => {
  const { playlist, currentSong, setPlaylist, setCurrentSong } = useMusicPlayer();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = playlist.findIndex(song => song.id === active.id);
      const newIndex = playlist.findIndex(song => song.id === over?.id);
      
      if (oldIndex === -1 || newIndex === -1) return;

      // Cria uma nova lista reordenada
      const newPlaylist = [...playlist];
      const [movedSong] = newPlaylist.splice(oldIndex, 1);
      newPlaylist.splice(newIndex, 0, movedSong);

      setPlaylist(newPlaylist);
      toast.success("Fila de reprodução reordenada!");
    }
  };
  
  const handlePlay = (song: Song) => {
    setCurrentSong(song);
    onClose();
  };
  
  const handleRemove = (songId: string) => {
    const newPlaylist = playlist.filter(s => s.id !== songId);
    setPlaylist(newPlaylist);
    
    // Se a música removida for a atual, pula para a próxima
    if (currentSong?.id === songId) {
      const currentIndex = playlist.findIndex(s => s.id === songId);
      if (newPlaylist.length > 0) {
        // Tenta tocar a música no mesmo índice, ou a última se for o final
        setCurrentSong(newPlaylist[Math.min(currentIndex, newPlaylist.length - 1)]);
      } else {
        setCurrentSong(null);
      }
    }
    
    toast.info("Música removida da fila.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* p-0 remove o padding padrão do DialogContent */}
      <DialogContent className="sm:max-w-[425px] h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-primary" />
            Fila de Reprodução
          </DialogTitle>
        </DialogHeader>
        
        {playlist.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center justify-center flex-1">
            <ListMusic className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">A fila está vazia.</p>
          </div>
        ) : (
          <ScrollArea className="flex-1 overflow-y-auto max-h-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={playlist.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {/* Aplicando padding horizontal e inferior aqui */}
                <div className="space-y-2 px-6 pb-6"> 
                  {playlist.map((song, index) => (
                    <SortableItem 
                      key={song.id} 
                      song={song} 
                      index={index}
                      currentSongId={currentSong?.id || null}
                      onPlay={handlePlay}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};