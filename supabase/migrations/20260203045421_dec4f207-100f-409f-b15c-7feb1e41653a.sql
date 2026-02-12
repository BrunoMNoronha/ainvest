-- Criar tabela roadmap_items para gerenciamento de funcionalidades
CREATE TABLE public.roadmap_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'planned', 'in_progress', 'done')),
  priority INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  archived BOOLEAN NOT NULL DEFAULT false
);

-- Criar tabela business_rules para regras de negócio
CREATE TABLE public.business_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN ('coleta', 'fechamento', 'calendario', 'fallback', 'seguranca', 'consistencia')),
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela development_history para histórico de desenvolvimento
CREATE TABLE public.development_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  files_changed TEXT[] DEFAULT '{}',
  docs_updated TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.roadmap_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_history ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública para documentação
CREATE POLICY "Roadmap items are publicly readable"
ON public.roadmap_items
FOR SELECT
USING (true);

CREATE POLICY "Business rules are publicly readable"
ON public.business_rules
FOR SELECT
USING (true);

CREATE POLICY "Development history is publicly readable"
ON public.development_history
FOR SELECT
USING (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_roadmap_items_updated_at
BEFORE UPDATE ON public.roadmap_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_rules_updated_at
BEFORE UPDATE ON public.business_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_roadmap_items_status ON public.roadmap_items(status);
CREATE INDEX idx_roadmap_items_priority ON public.roadmap_items(priority);
CREATE INDEX idx_business_rules_category ON public.business_rules(category);
CREATE INDEX idx_development_history_date ON public.development_history(date DESC);