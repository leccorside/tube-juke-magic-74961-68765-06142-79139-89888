import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Monitor, Share2, Menu, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("android");

  useEffect(() => {
    // Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setPlatform("ios");
    } else if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Capturar evento de instalação
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Leccor Music
          </h1>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isInstalled ? (
          <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/10 to-accent/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle>App Instalado com Sucesso! 🎉</CardTitle>
                  <CardDescription>
                    O Leccor Music está instalado no seu dispositivo
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Você pode acessar o app diretamente da tela inicial do seu dispositivo.
              </p>
              <Button onClick={() => navigate("/")} className="w-full">
                Começar a Ouvir Músicas
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Instale o Leccor Music
              </h2>
              <p className="text-lg text-muted-foreground">
                Acesse suas músicas como um app nativo no seu dispositivo
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <Card>
                <CardHeader>
                  <Smartphone className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Acesso Rápido</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Ícone na tela inicial, sem precisar abrir o navegador
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Download className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Modo Offline</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Acesse recursos mesmo sem conexão à internet
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Monitor className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Tela Cheia</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Experiência imersiva sem a barra do navegador
                  </p>
                </CardContent>
              </Card>
            </div>

            {platform === "android" && deferredPrompt && (
              <Card className="mb-8 border-primary/20">
                <CardHeader>
                  <CardTitle>Instalação Automática - Android</CardTitle>
                  <CardDescription>
                    Clique no botão abaixo para instalar o app
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleInstallClick} className="w-full" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Instalar App
                  </Button>
                </CardContent>
              </Card>
            )}

            {platform === "ios" && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Share2 className="h-5 w-5" />
                    Instruções para iOS
                  </CardTitle>
                  <CardDescription>
                    Siga os passos abaixo para instalar no iPhone/iPad
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">1.</span>
                      <span>Toque no botão <strong>Compartilhar</strong> <Share2 className="inline h-4 w-4" /> na parte inferior do Safari</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">2.</span>
                      <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">3.</span>
                      <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">4.</span>
                      <span>O ícone do Leccor Music aparecerá na sua tela inicial! 🎉</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}

            {platform === "android" && !deferredPrompt && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Menu className="h-5 w-5" />
                    Instruções para Android
                  </CardTitle>
                  <CardDescription>
                    Siga os passos abaixo para instalar no Android
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">1.</span>
                      <span>Toque no <strong>menu</strong> <Menu className="inline h-4 w-4" /> (três pontos) no canto superior direito do Chrome</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">2.</span>
                      <span>Toque em <strong>"Instalar app"</strong> ou <strong>"Adicionar à tela inicial"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">3.</span>
                      <span>Confirme tocando em <strong>"Instalar"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">4.</span>
                      <span>O ícone do Leccor Music aparecerá na sua tela inicial! 🎉</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}

            {platform === "desktop" && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Instruções para Desktop
                  </CardTitle>
                  <CardDescription>
                    Instale no Chrome, Edge ou outros navegadores compatíveis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">1.</span>
                      <span>Procure o ícone de <strong>instalação</strong> <Download className="inline h-4 w-4" /> na barra de endereços (canto direito)</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">2.</span>
                      <span>Clique no ícone e depois em <strong>"Instalar"</strong></span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">3.</span>
                      <span>O Leccor Music será aberto como um app separado</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="font-bold text-primary min-w-[24px]">4.</span>
                      <span>Você pode fixar o app na barra de tarefas para acesso rápido! 🎉</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
