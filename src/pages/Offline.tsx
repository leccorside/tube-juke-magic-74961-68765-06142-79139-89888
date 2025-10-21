import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useOfflineMusic } from "@/hooks/useOfflineMusic";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Offline = () => {
  const navigate = useNavigate();
  const { isOnline } = useOfflineMusic();
  const { setCurrentSong, setPlaylist } = useMusicPlayer();

  // Since offline music functionality is disabled, we show a message.

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background pb-24">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-2 text-green-500">
                <Wifi className="w-5 h-5" />
                <span className="text-sm font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-500">
                <WifiOff className="w-5 h-5" />
                <span className="text-sm font-medium">Offline</span>
              </div>
            )}
          </div>
        </div>

        <Card className="mb-6 p-6 bg-gradient-to-br from-card to-secondary border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Músicas Offline</h2>
              <p className="text-muted-foreground">
                Recurso temporariamente indisponível
              </p>
            </div>
          </div>
        </Card>

        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Funcionalidade Desativada</AlertTitle>
          <AlertDescription>
            Devido a um erro de infraestrutura persistente no servidor, o recurso de download e reprodução de músicas offline foi temporariamente desativado.
          </AlertDescription>
        </Alert>

        <Card className="p-12 text-center">
          <WifiOff className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Recurso Offline Indisponível</h3>
          <p className="text-muted-foreground mb-4">
            Aguarde a correção do problema de infraestrutura para reativar o download de músicas.
          </p>
          <Button onClick={() => navigate("/")}>
            Ir para Biblioteca
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Offline;