// Componente de card para exibir regra de negócio
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";
import { BusinessRule, RuleCategory, categoryLabels } from "@/hooks/useBusinessRules";

interface RuleCardProps {
  rule: BusinessRule;
  onEdit: (rule: BusinessRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, is_active: boolean) => void;
  /** Se true, exibe botões de edição/exclusão */
  isAdmin?: boolean;
}

// Cores para cada categoria
const categoryColors: Record<RuleCategory, string> = {
  coleta: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  fechamento: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  calendario: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  fallback: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  seguranca: "bg-red-500/10 text-red-500 border-red-500/20",
  consistencia: "bg-green-500/10 text-green-500 border-green-500/20",
};

export function RuleCard({ rule, onEdit, onDelete, onToggle, isAdmin = false }: RuleCardProps) {
  return (
    <Card className={`group transition-opacity ${!rule.is_active ? "opacity-60" : ""}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-sm font-medium leading-tight flex items-center gap-2">
              <span className={!rule.is_active ? "line-through text-muted-foreground" : ""}>
                {rule.title}
              </span>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Switch
                checked={rule.is_active}
                onCheckedChange={(checked) => onToggle(rule.id, checked)}
                aria-label={rule.is_active ? "Desativar regra" : "Ativar regra"}
              />
            )}
            {isAdmin && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onEdit(rule)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(rule.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {rule.description && (
          <p className="text-xs text-muted-foreground mb-2">
            {rule.description}
          </p>
        )}
        <Badge variant="outline" className={`text-xs ${categoryColors[rule.category]}`}>
          {categoryLabels[rule.category].replace("Regras de ", "")}
        </Badge>
      </CardContent>
    </Card>
  );
}
