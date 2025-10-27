import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Users, Music, ListMusic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";
import { UserGrowthChart } from "@/components/UserGrowthChart";
import { Card } from "@/components/ui/card";

// Dados fictícios para as métricas
const mockStats = {
  totalUsers: 1245,
  totalSongs: 5890,
  totalPlaylists: 345,
  songsToday: 42,
};

const AdminStats = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="border-b border-border bg-gradient-to-r from-background to-card">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Painel
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Estatísticas do Sistema
              </h1>
              <p className="text-muted-foreground text-xs md:text-base">
                Visão geral das métricas de uso.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Métricas Chave</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Usuários Totais"
            value={mockStats.totalUsers.toLocaleString()}
            icon={Users}
            description="Total de contas registradas"
          />
          <StatsCard
            title="Músicas Salvas"
            value={mockStats.totalSongs.toLocaleString()}
            icon={Music}
            description="Músicas na biblioteca dos usuários"
          />
          <StatsCard
            title="Playlists Criadas"
            value={mockStats.totalPlaylists.toLocaleString()}
            icon={ListMusic}
            description="Playlists ativas no sistema"
          />
          <StatsCard
            title="Músicas Adicionadas Hoje"
            value={mockStats.songsToday}
            icon={Music}
            description="Crescimento nas últimas 24h"
          />
        </div>
        
        <UserGrowthChart />
        
        <Card className="mt-8 p-6 bg-secondary/50 border-border">
          <h3 className="text-xl font-semibold mb-2">Nota sobre Dados</h3>
          <p className="text-sm text-muted-foreground">
            Os dados exibidos são fictícios (mockados). A integração com o Supabase para dados em tempo real será implementada em uma próxima etapa.
          </p>
        </Card>
      </main>
    </div>
  );
};

export default AdminStats;