// Hook para gerenciar histórico de desenvolvimento
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Tipos para histórico
export interface HistoryEntry {
  id: string;
  date: string;
  description: string;
  files_changed: string[];
  docs_updated: string[];
  notes: string | null;
  created_at: string;
}

export interface CreateHistoryEntry {
  date?: string;
  description: string;
  files_changed?: string[];
  docs_updated?: string[];
  notes?: string;
}

export interface UpdateHistoryEntry {
  id: string;
  date?: string;
  description?: string;
  files_changed?: string[];
  docs_updated?: string[];
  notes?: string;
}

// Hook principal
export function useDevHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todo o histórico ordenado por data
  const { data: entries = [], isLoading, error } = useQuery({
    queryKey: ["dev-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("development_history")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as HistoryEntry[];
    },
  });

  // Criar nova entrada
  const createMutation = useMutation({
    mutationFn: async (entry: CreateHistoryEntry) => {
      const { data, error } = await supabase
        .from("development_history")
        .insert({
          date: entry.date || new Date().toISOString().split("T")[0],
          description: entry.description,
          files_changed: entry.files_changed || [],
          docs_updated: entry.docs_updated || [],
          notes: entry.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-history"] });
      toast({
        title: "Entrada criada",
        description: "O histórico foi atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar entrada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar entrada existente
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateHistoryEntry) => {
      const { data, error } = await supabase
        .from("development_history")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-history"] });
      toast({
        title: "Entrada atualizada",
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

  // Deletar entrada
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("development_history")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dev-history"] });
      toast({
        title: "Entrada removida",
        description: "A entrada foi excluída do histórico.",
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

  // Agrupar entradas por mês/ano
  const entriesByMonth = entries.reduce<Record<string, HistoryEntry[]>>(
    (acc, entry) => {
      const date = new Date(entry.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    },
    {}
  );

  // Estatísticas
  const stats = {
    total: entries.length,
    thisMonth: entries.filter((e) => {
      const now = new Date();
      const entryDate = new Date(e.date);
      return (
        entryDate.getMonth() === now.getMonth() &&
        entryDate.getFullYear() === now.getFullYear()
      );
    }).length,
    totalFilesChanged: entries.reduce(
      (sum, e) => sum + (e.files_changed?.length || 0),
      0
    ),
    totalDocsUpdated: entries.reduce(
      (sum, e) => sum + (e.docs_updated?.length || 0),
      0
    ),
  };

  return {
    entries,
    entriesByMonth,
    stats,
    isLoading,
    error,
    createEntry: createMutation.mutate,
    updateEntry: updateMutation.mutate,
    deleteEntry: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
