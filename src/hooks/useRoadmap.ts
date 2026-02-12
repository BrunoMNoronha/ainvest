// Hook para gerenciar itens do roadmap (CRUD)
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Tipos para o roadmap
export type RoadmapStatus = "backlog" | "planned" | "in_progress" | "done";

export interface RoadmapItem {
  id: string;
  title: string;
  description: string | null;
  status: RoadmapStatus;
  priority: number;
  category: string | null;
  created_at: string;
  updated_at: string;
  archived: boolean;
}

export interface CreateRoadmapItem {
  title: string;
  description?: string;
  status?: RoadmapStatus;
  priority?: number;
  category?: string;
}

export interface UpdateRoadmapItem {
  id: string;
  title?: string;
  description?: string;
  status?: RoadmapStatus;
  priority?: number;
  category?: string;
  archived?: boolean;
}

// Hook principal
export function useRoadmap() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar todos os itens do roadmap (não arquivados)
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["roadmap-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roadmap_items")
        .select("*")
        .eq("archived", false)
        .order("priority", { ascending: true });

      if (error) throw error;
      return data as RoadmapItem[];
    },
  });

  // Criar novo item
  const createMutation = useMutation({
    mutationFn: async (item: CreateRoadmapItem) => {
      const { data, error } = await supabase
        .from("roadmap_items")
        .insert({
          title: item.title,
          description: item.description,
          status: item.status || "backlog",
          priority: item.priority || 0,
          category: item.category,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-items"] });
      toast({
        title: "Item criado",
        description: "O item foi adicionado ao roadmap.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar item existente
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: UpdateRoadmapItem) => {
      const { data, error } = await supabase
        .from("roadmap_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-items"] });
      toast({
        title: "Item atualizado",
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

  // Arquivar item (soft delete)
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("roadmap_items")
        .update({ archived: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-items"] });
      toast({
        title: "Item arquivado",
        description: "O item foi movido para o arquivo.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao arquivar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Deletar item permanentemente
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("roadmap_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roadmap-items"] });
      toast({
        title: "Item removido",
        description: "O item foi permanentemente excluído.",
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

  // Agrupar itens por status (para visualização Kanban)
  const itemsByStatus = {
    backlog: items.filter((i) => i.status === "backlog"),
    planned: items.filter((i) => i.status === "planned"),
    in_progress: items.filter((i) => i.status === "in_progress"),
    done: items.filter((i) => i.status === "done"),
  };

  // Estatísticas
  const stats = {
    total: items.length,
    backlog: itemsByStatus.backlog.length,
    planned: itemsByStatus.planned.length,
    inProgress: itemsByStatus.in_progress.length,
    done: itemsByStatus.done.length,
  };

  return {
    items,
    itemsByStatus,
    stats,
    isLoading,
    error,
    createItem: createMutation.mutate,
    updateItem: updateMutation.mutate,
    archiveItem: archiveMutation.mutate,
    deleteItem: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
