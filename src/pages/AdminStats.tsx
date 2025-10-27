import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Users, Music, ListMusic, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";
import { UserGrowthChart } from "@/components/UserGrowthChart";
import { TopSongsChart } from "@/components/TopSongsChart";
import { HealthCheckCard } from "@/components/HealthCheckCard"; // Importando o novo componente
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SystemStats {
  totalUsers: number;
  totalSongs: number;
  totalPlaylists: number;
  totalFavorites: number;
  songsToday: number;
}

const fetchSystemStats = async (): Promise<SystemStats> => {
  const { data, error } = await supabase.functions.invoke("admin-fetch-stats");

  if (error) throw error;
  
  if (!data.success) {
    throw new Error(data.error || "Falha desconhecida ao buscar estatísticas.");
  }
  
  return data.stats as SystemStats;
};

const AdminStats = () => {
  const navigate = useNavigate();
  
  const { data: stats, isLoading, error } = useQuery<SystemStats, Error>({
    queryKey: ["systemStats"],
    queryFn: fetchSystemStats,
  });
  
  if (error) {
    toast.error("Erro ao carregar métricas: " + error.message);
  }

  const currentStats: SystemStats = stats || { totalUsers: 0, totalSongs: 0, totalPlaylists: 0, totalFavorites: 0, songsToday: 0 };

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
                Visão geral das métricas de uso em tempo real.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Métricas Chave</h2>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard
              title="Usuários Totais"
              value={currentStats.totalUsers.toLocaleString()}
              icon={Users}
              description="Total de contas registradas"
            />
            <StatsCard
              title="Músicas Salvas"
              value={currentStats.totalSongs.toLocaleString()}
              icon={Music}
              description="Músicas na biblioteca dos usuários"
            />
            <StatsCard
              title="Playlists Criadas"
              value={currentStats.totalPlaylists.toLocaleString()}
              icon={ListMusic}
              description="Playlists ativas no sistema"
            />
            <StatsCard
              title="Total de Favoritos"
              value={currentStats.totalFavorites.toLocaleString()}
              icon={Heart}
              description="Músicas marcadas como favoritas"
            />
            <StatsCard
              title="Músicas Adicionadas Hoje"
              value={currentStats.songsToday}
              icon={Music}
              description="Crescimento nas últimas 24h"
            />
            <HealthCheckCard /> {/* Novo Card de Saúde */}
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserGrowthChart />
          <TopSongsChart />
        </div>
        
        <Card className="mt-8 p-6 bg-secondary/50 border-border">
          <h3 className="text-xl font-semibold mb-2">Nota sobre Dados</h3>
          <p className="text-sm text-muted-foreground">
            Os dados são buscados em tempo real usando Edge Functions com privilégios de administrador.
          </p>
        </Card>
      </main>
    </div>
  );
};

export default AdminStats;