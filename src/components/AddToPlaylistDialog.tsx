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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Music, Plus, ListMusic, ArrowLeft } from "lucide-react";

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
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
      setIsCreating(false); // Reset view when opening
      setNewPlaylistName("");
    }
  }, [isOpen]);

  const loadPlaylists = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("playlists")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlaylists(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar playlists: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      toast.error("Digite um nome para a playlist");
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: newPlaylist, error } = await supabase
        .from("playlists")
        .insert([{ name: newPlaylistName, user_id: user.id }])
        .select("id, name")
        .single();

      if (error) throw error;

      toast.success(`Playlist "${newPlaylistName}" criada!`);
      
      // Adiciona a música à nova playlist imediatamente
      await addToPlaylist(newPlaylist.id, true); 
      
      setNewPlaylistName("");
      setIsCreating(false);
      loadPlaylists(); // Recarrega a lista para incluir a nova
    } catch (error: any) {
      toast.error("Erro ao criar playlist: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addToPlaylist = async (playlistId: string, isNew: boolean = false) => {
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
        if (!isNew) {
          toast.success("Música adicionada à playlist!");
        }
        onClose();
      }
    } catch (error: any) {
      toast.error("Erro ao adicionar música: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlaylistList = () => {
    if (isLoading) {
      return <div className="text-center py-8 text-muted-foreground">Carregando playlists...</div>;
    }

    if (playlists.length === 0) {
      return (
        <div className="text-center py-8">
          <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            Você ainda não tem playlists.
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeira Playlist
          </Button>
        </div>
      );
    }

    return (
      <>
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            onClick={() => setIsCreating(true)}
            disabled={isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Playlist
          </Button>
        </div>
        
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
                <ListMusic className="w-4 h-4" />
                {playlist.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </>
    );
  };

  const renderCreateForm = () => (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setIsCreating(false)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <h3 className="font-semibold text-lg">Criar Nova</h3>
        <div className="w-16"></div> {/* Placeholder for alignment */}
      </div>
      
      <Input
        placeholder="Nome da nova playlist"
        value={newPlaylistName}
        onChange={(e) => setNewPlaylistName(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && createPlaylist()}
        disabled={isLoading}
      />
      <Button onClick={createPlaylist} className="w-full" disabled={isLoading || !newPlaylistName.trim()}>
        {isLoading ? (
          <>
            <Plus className="w-4 h-4 mr-2 animate-spin" />
            Criando...
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 mr-2" />
            Criar e Adicionar Música
          </>
        )}
      </Button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCreating ? "Criar Nova Playlist" : "Adicionar à Playlist"}
          </DialogTitle>
        </DialogHeader>
        
        {isCreating ? renderCreateForm() : renderPlaylistList()}
        
      </DialogContent>
    </Dialog>
  );
};