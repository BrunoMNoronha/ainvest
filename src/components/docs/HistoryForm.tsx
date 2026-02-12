// Formulário para criar/editar entrada do histórico
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HistoryEntry, CreateHistoryEntry, UpdateHistoryEntry } from "@/hooks/useDevHistory";

interface HistoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: HistoryEntry | null;
  onSubmit: (data: CreateHistoryEntry | UpdateHistoryEntry) => void;
  isLoading?: boolean;
}

export function HistoryForm({
  open,
  onOpenChange,
  entry,
  onSubmit,
  isLoading,
}: HistoryFormProps) {
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [filesChanged, setFilesChanged] = useState<string[]>([]);
  const [docsUpdated, setDocsUpdated] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [newFile, setNewFile] = useState("");
  const [newDoc, setNewDoc] = useState("");

  // Preencher formulário quando editando
  useEffect(() => {
    if (entry) {
      setDate(entry.date);
      setDescription(entry.description);
      setFilesChanged(entry.files_changed || []);
      setDocsUpdated(entry.docs_updated || []);
      setNotes(entry.notes || "");
    } else {
      // Reset para nova entrada
      setDate(new Date().toISOString().split("T")[0]);
      setDescription("");
      setFilesChanged([]);
      setDocsUpdated([]);
      setNotes("");
    }
  }, [entry, open]);

  const handleAddFile = () => {
    if (newFile.trim() && !filesChanged.includes(newFile.trim())) {
      setFilesChanged([...filesChanged, newFile.trim()]);
      setNewFile("");
    }
  };

  const handleRemoveFile = (file: string) => {
    setFilesChanged(filesChanged.filter((f) => f !== file));
  };

  const handleAddDoc = () => {
    if (newDoc.trim() && !docsUpdated.includes(newDoc.trim())) {
      setDocsUpdated([...docsUpdated, newDoc.trim()]);
      setNewDoc("");
    }
  };

  const handleRemoveDoc = (doc: string) => {
    setDocsUpdated(docsUpdated.filter((d) => d !== doc));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...(entry && { id: entry.id }),
      date,
      description,
      files_changed: filesChanged,
      docs_updated: docsUpdated,
      notes: notes || undefined,
    };

    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Editar Entrada" : "Nova Entrada no Histórico"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que foi implementado..."
              rows={2}
              required
            />
          </div>

          {/* Arquivos alterados */}
          <div className="space-y-2">
            <Label>Arquivos Alterados</Label>
            <div className="flex gap-2">
              <Input
                value={newFile}
                onChange={(e) => setNewFile(e.target.value)}
                placeholder="src/components/..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddFile())}
              />
              <Button type="button" variant="secondary" onClick={handleAddFile}>
                Adicionar
              </Button>
            </div>
            {filesChanged.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filesChanged.map((file) => (
                  <Badge key={file} variant="secondary" className="text-xs font-mono">
                    {file}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Documentação atualizada */}
          <div className="space-y-2">
            <Label>Documentação Atualizada</Label>
            <div className="flex gap-2">
              <Input
                value={newDoc}
                onChange={(e) => setNewDoc(e.target.value)}
                placeholder="docs/..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDoc())}
              />
              <Button type="button" variant="secondary" onClick={handleAddDoc}>
                Adicionar
              </Button>
            </div>
            {docsUpdated.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {docsUpdated.map((doc) => (
                  <Badge key={doc} variant="outline" className="text-xs">
                    {doc}
                    <button
                      type="button"
                      onClick={() => handleRemoveDoc(doc)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !description.trim()}>
              {isLoading ? "Salvando..." : entry ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
