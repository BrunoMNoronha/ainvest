// Formulário para criar/editar regra de negócio
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { BusinessRule, RuleCategory, CreateBusinessRule, UpdateBusinessRule, categoryLabels } from "@/hooks/useBusinessRules";

interface RuleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rule?: BusinessRule | null;
  onSubmit: (data: CreateBusinessRule | UpdateBusinessRule) => void;
  isLoading?: boolean;
}

const categoryOptions: { value: RuleCategory; label: string }[] = Object.entries(categoryLabels).map(
  ([value, label]) => ({ value: value as RuleCategory, label })
);

export function RuleForm({
  open,
  onOpenChange,
  rule,
  onSubmit,
  isLoading,
}: RuleFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<RuleCategory>("coleta");
  const [isActive, setIsActive] = useState(true);

  // Preencher formulário quando editando
  useEffect(() => {
    if (rule) {
      setTitle(rule.title);
      setDescription(rule.description || "");
      setCategory(rule.category);
      setIsActive(rule.is_active);
    } else {
      // Reset para nova regra
      setTitle("");
      setDescription("");
      setCategory("coleta");
      setIsActive(true);
    }
  }, [rule, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...(rule && { id: rule.id }),
      title,
      description: description || undefined,
      category,
      is_active: isActive,
    };

    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {rule ? "Editar Regra" : "Nova Regra de Negócio"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da regra"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a regra..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as RuleCategory)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Regra ativa</Label>
            <Switch
              id="is_active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? "Salvando..." : rule ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
