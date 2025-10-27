import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { truncateWords } from "@/lib/utils";

interface TopSong {
  song_id: string;
  title: string;
  artist: string;
  thumbnail_url: string;
  favorite_count: number;
}

interface ChartData {
  name: string;
  favorites: number;
}

const fetchTopSongs = async (): Promise<ChartData[]> => {
  const { data, error } = await supabase.functions.invoke("admin-fetch-top-songs");

  if (error) throw error;
  
  if (!data.success) {
    throw new Error(data.error || "Falha desconhecida ao buscar músicas mais favoritadas.");
  }
  
  // Mapeia os dados brutos para o formato esperado pelo Recharts
  return (data.topSongs as TopSong[]).map(item => ({
    // Trunca o título para caber no eixo Y
    name: truncateWords(item.title, 3), 
    favorites: item.favorite_count,
  }));
};

export const TopSongsChart = () => {
  const { data, isLoading, error } = useQuery<ChartData[], Error>({
    queryKey: ["topSongs"],
    queryFn: fetchTopSongs,
  });
  
  if (error) {
    toast.error("Erro ao carregar gráfico de músicas favoritas: " + error.message);
  }

  if (isLoading) {
    return (
      <Card className="col-span-full bg-secondary/50 border-border h-[300px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </Card>
    );
  }
  
  const chartData = data || [];
  
  if (chartData.length === 0) {
    return (
      <Card className="col-span-full bg-secondary/50 border-border p-6 text-center">
        <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Nenhuma música foi favoritada ainda.</p>
      </Card>
    );
  }

  return (
    <Card className="col-span-full bg-secondary/50 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          Top 10 Músicas Mais Favoritadas
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[400px] p-4 md:p-6">
        <ResponsiveContainer width="100%" height="100%">
          {/* Usando BarChart horizontalmente */}
          <BarChart 
            data={chartData} 
            layout="vertical" 
            margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke="hsl(var(--muted-foreground))" 
              width={100}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))', 
                borderRadius: 'var(--radius)' 
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
              formatter={(value, name) => [value, "Favoritos"]}
            />
            <Bar dataKey="favorites" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};