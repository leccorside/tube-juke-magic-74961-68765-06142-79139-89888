import { useNavigate } from "react-router-dom";
import { ArrowLeft, Settings, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Admin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      <header className="border-b border-border bg-gradient-to-r from-background to-card">
        <div className="container mx-auto px-4 py-4 md:py-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Settings className="w-6 h-6 md:w-8 md:h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Painel Administrativo
              </h1>
              <p className="text-muted-foreground text-xs md:text-base">
                Gerenciamento do Leccor Music®
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card 
            className="p-6 bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer"
            onClick={() => navigate("/admin/users")}
          >
            <Users className="w-6 h-6 text-primary mb-3" />
            <h3 className="text-xl font-semibold mb-2">Gerenciar Usuários</h3>
            <p className="text-muted-foreground text-sm">
              Visualize e modere contas de usuários.
            </p>
          </Card>
          <Card 
            className="p-6 bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer"
            onClick={() => navigate("/admin/stats")} // Link atualizado
          >
            <BarChart3 className="w-6 h-6 text-primary mb-3" />
            <h3 className="text-xl font-semibold mb-2">Estatísticas</h3>
            <p className="text-muted-foreground text-sm">
              Acompanhe o uso e desempenho do aplicativo.
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;