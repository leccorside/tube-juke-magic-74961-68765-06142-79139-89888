import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users } from "lucide-react";

// Dados fictícios para demonstração
const data = [
  { name: 'Jan', users: 400 },
  { name: 'Fev', users: 300 },
  { name: 'Mar', users: 200 },
  { name: 'Abr', users: 278 },
  { name: 'Mai', users: 189 },
  { name: 'Jun', users: 239 },
  { name: 'Jul', users: 349 },
];

export const UserGrowthChart = () => {
  return (
    <Card className="col-span-full bg-secondary/50 border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Crescimento de Novos Usuários (Últimos 7 Meses)
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] p-4 md:p-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
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
            />
            <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};