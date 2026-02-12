// Formulário para criar/editar item do roadmap
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RoadmapItem, RoadmapStatus, CreateRoadmapItem, UpdateRoadmapItem } from "@/hooks/useRoadmap";

interface RoadmapFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: RoadmapItem | null;
  onSubmit: (data: CreateRoadmapItem | UpdateRoadmapItem) => void;
  isLoading?: boolean;
}

const statusOptions: { value: RoadmapStatus; label: string }[] = [
  { value: "backlog", label: "Backlog" },
  { value: "planned", label: "Planejado" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "done", label: "Concluído" },
];

export function RoadmapForm({
  open,
  onOpenChange,
  item,
  onSubmit,
  isLoading,
}: RoadmapFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<RoadmapStatus>("backlog");
  const [priority, setPriority] = useState("0");
  const [category, setCategory] = useState("");

  // Preencher formulário quando editando
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || "");
      setStatus(item.status);
      setPriority(String(item.priority));
      setCategory(item.category || "");
    } else {
      // Reset para novo item
      setTitle("");
      setDescription("");
      setStatus("backlog");
      setPriority("0");
      setCategory("");
    }
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...(item && { id: item.id }),
      title,
      description: description || undefined,
      status,
      priority: parseInt(priority, 10),
      category: category || undefined,
    };

    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {item ? "Editar Item" : "Novo Item do Roadmap"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da funcionalidade"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a funcionalidade..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as RoadmapStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: MVP, v1.1, Backend..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? "Salvando..." : item ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
