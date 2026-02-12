// Componente de timeline para exibir histórico de desenvolvimento
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileCode, FileText, Pencil, Trash2, Calendar } from "lucide-react";
import { HistoryEntry } from "@/hooks/useDevHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoryTimelineProps {
  entries: HistoryEntry[];
  onEdit?: (entry: HistoryEntry) => void;
  onDelete?: (id: string) => void;
  isAdmin?: boolean;
}

export function HistoryTimeline({ entries, onEdit, onDelete, isAdmin = false }: HistoryTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Nenhum registro no histórico</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry, index) => (
        <div key={entry.id} className="relative pl-8">
          {/* Linha vertical da timeline */}
          {index < entries.length - 1 && (
            <div className="absolute left-3 top-8 bottom-0 w-0.5 bg-border" />
          )}
          
          {/* Ponto da timeline */}
          <div className="absolute left-1 top-2 w-4 h-4 rounded-full bg-primary border-2 border-background" />
          
          <Card className="group">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Data */}
                  <div className="text-xs text-muted-foreground mb-1">
                    {format(new Date(entry.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </div>
                  
                  {/* Descrição */}
                  <p className="text-sm font-medium mb-2">
                    {entry.description}
                  </p>
                  
                  {/* Arquivos alterados */}
                  {entry.files_changed && entry.files_changed.length > 0 && (
                    <div className="flex items-start gap-2 mb-2">
                      <FileCode className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {entry.files_changed.map((file, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-mono">
                            {file}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Documentação atualizada */}
                  {entry.docs_updated && entry.docs_updated.length > 0 && (
                    <div className="flex items-start gap-2 mb-2">
                      <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex flex-wrap gap-1">
                        {entry.docs_updated.map((doc, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Notas */}
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-2 italic">
                      {entry.notes}
                    </p>
                  )}
                </div>
                
                {/* Ações */}
                {isAdmin && (onEdit || onDelete) && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEdit(entry)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(entry.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
