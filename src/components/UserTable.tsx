import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, Edit, UserPlus, Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Tables } from "@/integrations/supabase/types";

type Profile = Tables<'profiles'>;

const fetchUsers = async (): Promise<Profile[]> => {
  // Usando busca direta, confiando na nova política de RLS para o administrador
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

const deleteUser = async (userId: string) => {
  // Chamamos a Edge Function para deletar o usuário com privilégios de serviço
  const { error } = await supabase.functions.invoke("admin-delete-user", {
    body: { userId },
  });

  if (error) throw new Error(error.message);
};

const updateUserProfile = async (profile: Partial<Profile>) => {
  const { id, ...updates } = profile;
  
  // A atualização do perfil usa o cliente normal.
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", id!)
    .select();

  if (error) throw error;
};

export const UserTable = () => {
  const queryClient = useQueryClient();
  
  // Tipagem explícita para o retorno da query
  const { data: users, isLoading, error: fetchError } = useQuery<Profile[], Error>({
    queryKey: ["adminUsers"],
    queryFn: fetchUsers,
  });
  
  // Adicionando useEffect para exibir erro de busca (substituindo onError)
  useEffect(() => {
    if (fetchError) {
      console.error("Fetch Users Error:", fetchError);
      toast.error("Erro ao carregar usuários: " + fetchError.message);
    }
  }, [fetchError]);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("Usuário deletado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao deletar usuário: " + error.message);
    },
  });
  
  const updateMutation = useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar perfil: " + error.message);
    },
  });

  const handleEdit = (user: Profile) => {
    setEditingId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
  };
  
  const handleSave = (userId: string) => {
    if (!editName.trim() || !editEmail.trim()) {
      toast.error("Nome e Email não podem ser vazios.");
      return;
    }
    updateMutation.mutate({ id: userId, name: editName, email: editEmail });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Se houver um erro de busca, exibe uma mensagem
  if (fetchError) {
    return (
      <div className="text-center py-12 text-red-500">
        <p>Falha ao carregar dados. Verifique o console para detalhes do erro de RLS.</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-lg overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b border-border">
        <h3 className="text-lg font-semibold">Total de Usuários: {users?.length || 0}</h3>
        {/* Adicionar Usuário (Apenas via Supabase Auth Admin API, que é complexo para o cliente) */}
        <Button variant="outline" disabled>
          <UserPlus className="w-4 h-4 mr-2" />
          Adicionar (WIP)
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Usamos users? para garantir que só mapeamos se users não for undefined */}
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[50px]">{user.id.substring(0, 4)}...</TableCell>
                <TableCell>
                  {editingId === user.id ? (
                    <Input 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)} 
                      className="h-8"
                      disabled={updateMutation.isPending}
                    />
                  ) : (
                    user.name
                  )}
                </TableCell>
                <TableCell>
                  {editingId === user.id ? (
                    <Input 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)} 
                      className="h-8"
                      disabled={updateMutation.isPending}
                    />
                  ) : (
                    user.email
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {editingId === user.id ? (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleSave(user.id)}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-green-500" />}
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => setEditingId(null)}
                        disabled={updateMutation.isPending}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => deleteMutation.mutate(user.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin text-destructive" /> : <Trash2 className="w-4 h-4 text-destructive" />}
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};