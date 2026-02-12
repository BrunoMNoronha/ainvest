// Página de Histórico do Desenvolvimento
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Plus, ArrowLeft, Search, FileCode, FileText, Calendar } from "lucide-react";
import { useDevHistory, HistoryEntry } from "@/hooks/useDevHistory";
import { HistoryTimeline } from "@/components/docs/HistoryTimeline";
import { HistoryForm } from "@/components/docs/HistoryForm";

export default function HistoryPage() {
  const { isAdmin } = useAuth();
  const {
    entries,
    stats,
    isLoading,
    createEntry,
    updateEntry,
    deleteEntry,
    isCreating,
    isUpdating,
  } = useDevHistory();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filtrar entradas por termo de busca
  const filteredEntries = entries.filter((entry) => {
    const term = searchTerm.toLowerCase();
    return (
      entry.description.toLowerCase().includes(term) ||
      entry.files_changed?.some((f) => f.toLowerCase().includes(term)) ||
      entry.docs_updated?.some((d) => d.toLowerCase().includes(term)) ||
      entry.notes?.toLowerCase().includes(term)
    );
  });

  // Abrir formulário para nova entrada
  const handleNew = () => {
    setEditingEntry(null);
    setFormOpen(true);
  };

  // Abrir formulário para editar entrada
  const handleEdit = (entry: HistoryEntry) => {
    setEditingEntry(entry);
    setFormOpen(true);
  };

  // Submeter formulário
  const handleSubmit = (data: any) => {
    if (data.id) {
      updateEntry(data);
    } else {
      createEntry(data);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
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
              <h1 className="text-2xl font-bold tracking-tight">Histórico do Desenvolvimento</h1>
              <p className="text-muted-foreground">
                {stats.total} entradas • {stats.thisMonth} este mês
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Entrada
            </Button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total de Entradas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.thisMonth}</p>
                  <p className="text-xs text-muted-foreground">Este Mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalFilesChanged}</p>
                  <p className="text-xs text-muted-foreground">Arquivos Alterados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalDocsUpdated}</p>
                  <p className="text-xs text-muted-foreground">Docs Atualizados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no histórico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline de Desenvolvimento</CardTitle>
            <CardDescription>
              Registro cronológico de todas as implementações e alterações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <HistoryTimeline
              entries={filteredEntries}
              onEdit={handleEdit}
              onDelete={deleteEntry}
              isAdmin={isAdmin}
            />
          </CardContent>
        </Card>
      </div>

      {/* Formulário modal */}
      <HistoryForm
        open={formOpen}
        onOpenChange={setFormOpen}
        entry={editingEntry}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />
    </DashboardLayout>
  );
}
