import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MonthlyGrowth {
  month_year: string;
  users_count: number;
}

interface ChartData {
  name: string;
  users: number;
}

const fetchUserGrowth = async (): Promise<ChartData[]> => {
  const { data, error } = await supabase.functions.invoke("admin-fetch-user-growth");

  if (error) throw error;
  
  if (!data.success) {
    throw new Error(data.error || "Falha desconhecida ao buscar crescimento de usuários.");
  }
  
  // Mapeia os dados brutos (MonthlyGrowth) para o formato esperado pelo Recharts (ChartData)
  return (data.growth as MonthlyGrowth[]).map(item => ({
    name: item.month_year.substring(0, 3), // Ex: 'Oct 2025' -> 'Oct'
    users: item.users_count,
  }));
};

export const UserGrowthChart = () => {
  // Usando ChartData[] para tipar o retorno da query
  const { data, isLoading, error } = useQuery<ChartData[], Error>({
    queryKey: ["userGrowth"],
    queryFn: fetchUserGrowth,
  });
  
  if (error) {
    toast.error("Erro ao carregar gráfico de crescimento: " + error.message);
  }

  if (isLoading) {
    return (
      <Card className="col-span-full bg-secondary/50 border-border h-[300px] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </Card>
    );
  }
  
  const chartData = data || [];

  return (
    <Card className="col-span-full bg-secondary/50 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Crescimento de Novos Usuários (Últimos 6 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] p-4 md:p-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                border: '1px solid hsl(var(--border))', 
                borderRadius: 'var(--radius)' 
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              itemStyle={{ color: 'hsl(var(--primary))' }}
              formatter={(value, name) => [value, "Usuários"]}
            />
            <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};