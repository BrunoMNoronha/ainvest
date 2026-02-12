// Página de Roadmap com visualização Kanban e CRUD completo
import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useRoadmap, RoadmapItem, RoadmapStatus } from "@/hooks/useRoadmap";
import { RoadmapCard } from "@/components/docs/RoadmapCard";
import { RoadmapForm } from "@/components/docs/RoadmapForm";

// Configuração das colunas Kanban
const columns: { status: RoadmapStatus; title: string; color: string }[] = [
  { status: "backlog", title: "Backlog", color: "bg-muted" },
  { status: "planned", title: "Planejado", color: "bg-blue-500/20" },
  { status: "in_progress", title: "Em Andamento", color: "bg-yellow-500/20" },
  { status: "done", title: "Concluído", color: "bg-green-500/20" },
];

export default function Roadmap() {
  const { isAdmin } = useAuth();
  const {
    itemsByStatus,
    stats,
    isLoading,
    createItem,
    updateItem,
    archiveItem,
    isCreating,
    isUpdating,
  } = useRoadmap();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);

  // Abrir formulário para novo item
  const handleNew = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  // Abrir formulário para editar item
  const handleEdit = (item: RoadmapItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  // Submeter formulário (criar ou atualizar)
  const handleSubmit = (data: any) => {
    if (data.id) {
      updateItem(data);
    } else {
      createItem(data);
    }
  };

  // Mover item para outro status (drag simplificado com clique)
  const handleMoveItem = (item: RoadmapItem, newStatus: RoadmapStatus) => {
    if (item.status !== newStatus) {
      updateItem({ id: item.id, status: newStatus });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/docs">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Roadmap</h1>
              <p className="text-muted-foreground">
                {stats.total} itens • {stats.inProgress} em andamento
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Item
            </Button>
          )}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => (
            <div key={column.status} className="space-y-3">
              {/* Header da coluna */}
              <div className={`p-3 rounded-lg ${column.color}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{column.title}</h3>
                  <Badge variant="secondary">
                    {itemsByStatus[column.status].length}
                  </Badge>
                </div>
              </div>

              {/* Cards da coluna */}
              <div className="space-y-2 min-h-[200px]">
                {itemsByStatus[column.status].map((item) => (
                  <RoadmapCard
                    key={item.id}
                    item={item}
                    onEdit={handleEdit}
                    onArchive={archiveItem}
                    isAdmin={isAdmin}
                  />
                ))}

                {itemsByStatus[column.status].length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum item
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Dica de uso */}
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> Clique no ícone de lápis para editar um item e alterar seu status. 
              Use o ícone de arquivo para arquivar itens concluídos.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Formulário modal */}
      <RoadmapForm
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />
    </DashboardLayout>
  );
}
