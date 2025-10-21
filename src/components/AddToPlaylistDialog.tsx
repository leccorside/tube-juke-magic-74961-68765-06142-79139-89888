import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Music, Plus } from "lucide-react";

interface Playlist {
  id: string;
  name: string;
}

interface AddToPlaylistDialogProps {
  songId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToPlaylistDialog = ({
  songId,
  isOpen,
  onClose,
}: AddToPlaylistDialogProps) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
    }
  }, [isOpen]);

  const loadPlaylists = async () => {
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar playlists: " + error.message);
    }
  };

  const addToPlaylist = async (playlistId: string) => {
    setIsLoading(true);
    try {
      // Get the current max position
      const { data: positionData } = await supabase
        .from("playlist_songs")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      const newPosition = (positionData?.position || -1) + 1;

      const { error } = await supabase
        .from("playlist_songs")
        .insert([
          {
            playlist_id: playlistId,
            song_id: songId,
            position: newPosition,
          },
        ]);

      if (error) {
        if (error.code === "23505") {
          toast.error("Esta música já está na playlist");
        } else {
          throw error;
        }
      } else {
        toast.success("Música adicionada à playlist!");
        onClose();
      }
    } catch (error: any) {
      toast.error("Erro ao adicionar música: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar à Playlist</DialogTitle>
        </DialogHeader>
        {playlists.length === 0 ? (
          <div className="text-center py-8">
            <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Você ainda não tem playlists
            </p>
            <Button onClick={onClose}>Criar Playlist</Button>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {playlists.map((playlist) => (
                <Button
                  key={playlist.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => addToPlaylist(playlist.id)}
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4" />
                  {playlist.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
