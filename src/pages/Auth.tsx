import { useState, useEffect } from "react";
import { Music2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { RegisterForm } from "@/components/RegisterForm";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // Novo estado para alternar
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from || "/";

  useEffect(() => {
    if (user) {
      // Redireciona para a rota original (ex: /share/playlist/...)
      if (from !== "/auth") {
        navigate(from, { replace: true, state: { redirectedFromAuth: true } });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate, from]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Erro ao fazer login",
        description: error.message === "Invalid login credentials" 
          ? "Email ou senha incorretos" 
          : error.message,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };
  
  const handleRegistrationSuccess = () => {
    // Após o registro, volta para a tela de login
    setIsLogin(true);
  };

  const LoginForm = (
    <form onSubmit={handleLoginSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          className="bg-background"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-foreground">
          Senha
        </label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
          className="bg-background"
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Entrando...
          </>
        ) : (
          "Entrar"
        )}
      </Button>
      
      <Button
        type="button"
        variant="link"
        onClick={() => setIsLogin(false)}
        className="w-full text-sm text-muted-foreground"
        disabled={isLoading}
      >
        Não tem uma conta? Crie uma agora
      </Button>
    </form>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 bg-gradient-to-b from-card to-secondary border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow mb-4">
            <Music2 className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Leccor Music
          </h1>
          <p className="text-muted-foreground mt-2">
            {isLogin ? "Faça login para continuar" : "Crie sua conta gratuita"}
          </p>
        </div>

        {isLogin ? (
          LoginForm
        ) : (
          <RegisterForm 
            onSuccess={handleRegistrationSuccess} 
            onSwitchToLogin={() => setIsLogin(true)} 
          />
        )}
      </Card>
    </div>
  );
};

export default Auth;