import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const InstallPrompt = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Verificar se já foi rejeitado pelo usuário
    const wasRejected = localStorage.getItem('pwa-install-rejected');
    if (wasRejected) {
      return;
    }

    // Capturar evento de instalação
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Mostrar prompt após 10 segundos
      setTimeout(() => {
        setShowPrompt(true);
      }, 10000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Se não há prompt automático, redirecionar para página de instruções
      navigate("/install");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      localStorage.removeItem('pwa-install-rejected');
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-rejected', 'true');
  };

  const handleLearnMore = () => {
    navigate("/install");
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-40 animate-in slide-in-from-bottom-5">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Download className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground mb-1">
              Instalar Music Platform
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Acesse suas músicas direto da tela inicial como um app nativo
            </p>
            
            <div className="flex gap-2">
              <Button 
                onClick={handleInstallClick}
                size="sm"
                className="flex-1"
              >
                Instalar
              </Button>
              <Button 
                onClick={handleLearnMore}
                variant="outline"
                size="sm"
              >
                Saiba mais
              </Button>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-8 w-8"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
