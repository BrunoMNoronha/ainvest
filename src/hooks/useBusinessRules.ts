// Hook para gerenciar regras de negócio (CRUD)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Tipos para regras de negócio
export type RuleCategory = 
  | "coleta" 
  | "fechamento" 
  | "calendario" 
  | "fallback" 
  | "seguranca" 
  | "consistencia";

export interface BusinessRule {
  id: string;
  category: RuleCategory;
  title: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBusinessRule {
  category: RuleCategory;
  title: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateBusinessRule {
  id: string;
  category?: RuleCategory;
  title?: string;
  description?: string;
  is_active?: boolean;
}

// Labels amigáveis para categorias
export const categoryLabels: Record<RuleCategory, string> = {
  coleta: "Regras de Coleta",
  fechamento: "Regras de Fechamento",
  calendario: "Regras de Calendário",
  fallback: "Regras de Fallback",
  seguranca: "Regras de Segurança",
  consistencia: "Regras de Consistência",
};

// Hook principal
export function useBusinessRules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todas as regras
  const { data: rules = [], isLoading, error } = useQuery({
    queryKey: ["business-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_rules")
        .select("*")
        .order("category", { ascending: true })
        .order("title", { ascending: true });

      if (error) throw error;
      return data as BusinessRule[];
    },
  });

  // Criar nova regra
  const createMutation = useMutation({
    mutationFn: async (rule: CreateBusinessRule) => {
      const { data, error } = await supabase
        .from("business_rules")
        .insert({
          category: rule.category,
          title: rule.title,
          description: rule.description,
          is_active: rule.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-rules"] });
      toast({
        title: "Regra criada",
        description: "A regra foi adicionada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar regra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar regra
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateBusinessRule) => {
      const { data, error } = await supabase
        .from("business_rules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-rules"] });
      toast({
        title: "Regra atualizada",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle ativo/inativo
  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("business_rules")
        .update({ is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-rules"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deletar regra
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["business-rules"] });
      toast({
        title: "Regra removida",
        description: "A regra foi excluída permanentemente.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao remover",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Agrupar regras por categoria
  const rulesByCategory = rules.reduce<Record<RuleCategory, BusinessRule[]>>(
    (acc, rule) => {
      if (!acc[rule.category]) {
        acc[rule.category] = [];
      }
      acc[rule.category].push(rule);
      return acc;
    },
    {
      coleta: [],
      fechamento: [],
      calendario: [],
      fallback: [],
      seguranca: [],
      consistencia: [],
    }
  );

  // Estatísticas
  const stats = {
    total: rules.length,
    active: rules.filter((r) => r.is_active).length,
    inactive: rules.filter((r) => !r.is_active).length,
    byCategory: Object.fromEntries(
      Object.entries(rulesByCategory).map(([cat, arr]) => [cat, arr.length])
    ),
  };

  return {
    rules,
    rulesByCategory,
    stats,
    isLoading,
    error,
    createRule: createMutation.mutate,
    updateRule: updateMutation.mutate,
    toggleRule: toggleMutation.mutate,
    deleteRule: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
