import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import React from "react";

interface HealthCheckResult {
  status: 'OK' | 'ERROR';
  latency: number;
}

const fetchHealthCheck = async (): Promise<HealthCheckResult> => {
  const startTime = Date.now();
  
  const { data, error } = await supabase.functions.invoke("admin-health-check");

  if (error) {
    // Erro de rede ou comunicação
    throw new Error(`Falha na comunicação: ${error.message}`);
  }
  
  if (!data.success) {
    // Erro retornado pela Edge Function (ex: 403 Forbidden)
    throw new Error(data.error || "Falha na Edge Function.");
  }
  
  const endTime = Date.now();
  const totalLatency = endTime - startTime;

  return {
    status: 'OK',
    latency: totalLatency,
  };
};

export const HealthCheckCard: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery<HealthCheckResult, Error>({
    queryKey: ["edgeFunctionHealth"],
    queryFn: fetchHealthCheck,
    // Não refetch automaticamente, apenas manualmente
    staleTime: Infinity,
  });
  
  const isHealthy = data?.status === 'OK' && !error;
  
  const Icon = isHealthy ? CheckCircle2 : XCircle;
  const colorClass = isHealthy ? 'text-green-500' : 'text-destructive';
  const title = isHealthy ? 'Edge Function OK' : 'Edge Function Falhou';
  const description = isHealthy 
    ? `Latência: ${data?.latency}ms` 
    : error?.message || 'Erro desconhecido.';

  return (
    <Card className="bg-secondary/50 border-border transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Saúde do Backend</CardTitle>
        <Zap className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            ) : (
              <Icon className={`w-5 h-5 ${colorClass}`} />
            )}
            <span className={`text-xl font-bold ${colorClass}`}>{title}</span>
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
      </CardContent>
    </Card>
  );
};