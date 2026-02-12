// Componente de card para exibir item do roadmap
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Archive, GripVertical } from "lucide-react";
import { RoadmapItem, RoadmapStatus } from "@/hooks/useRoadmap";

interface RoadmapCardProps {
  item: RoadmapItem;
  onEdit: (item: RoadmapItem) => void;
  onArchive: (id: string) => void;
  isAdmin?: boolean;
}

// Cores e labels para cada status
const statusConfig: Record<RoadmapStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  backlog: { label: "Backlog", variant: "outline" },
  planned: { label: "Planejado", variant: "secondary" },
  in_progress: { label: "Em Andamento", variant: "default" },
  done: { label: "Concluído", variant: "default" },
};

export function RoadmapCard({ item, onEdit, onArchive, isAdmin = false }: RoadmapCardProps) {
  const config = statusConfig[item.status];
  
  return (
    <Card className="group cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardTitle className="text-sm font-medium leading-tight">
              {item.title}
            </CardTitle>
          </div>
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(item)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onArchive(item.id)}
              >
                <Archive className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {item.description && (
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {item.description}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          {item.category && (
            <Badge variant="outline" className="text-xs">
              {item.category}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            #{item.priority}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
