// Página de Regras de Negócio com CRUD completo
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { 
  useBusinessRules, 
  BusinessRule, 
  RuleCategory, 
  categoryLabels 
} from "@/hooks/useBusinessRules";
import { RuleCard } from "@/components/docs/RuleCard";
import { RuleForm } from "@/components/docs/RuleForm";

export default function RulesPage() {
  const { isAdmin } = useAuth();
  const {
    rulesByCategory,
    stats,
    isLoading,
    createRule,
    updateRule,
    toggleRule,
    deleteRule,
    isCreating,
    isUpdating,
  } = useBusinessRules();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);

  // Abrir formulário para nova regra
  const handleNew = () => {
    setEditingRule(null);
    setFormOpen(true);
  };

  // Abrir formulário para editar regra
  const handleEdit = (rule: BusinessRule) => {
    setEditingRule(rule);
    setFormOpen(true);
  };

  // Submeter formulário
  const handleSubmit = (data: any) => {
    if (data.id) {
      updateRule(data);
    } else {
      createRule(data);
    }
  };

  // Toggle status da regra
  const handleToggle = (id: string, is_active: boolean) => {
    toggleRule({ id, is_active });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-12 w-full" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Categorias disponíveis com contagem
  const categories = Object.entries(categoryLabels) as [RuleCategory, string][];

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
              <h1 className="text-2xl font-bold tracking-tight">Regras de Negócio</h1>
              <p className="text-muted-foreground">
                {stats.total} regras • {stats.active} ativas
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button onClick={handleNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Regra
            </Button>
          )}
        </div>

        {/* Estatísticas rápidas */}
        <div className="flex gap-4">
          <Card className="flex-1">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Regras Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="flex-1">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.inactive}</p>
                  <p className="text-xs text-muted-foreground">Regras Inativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs por categoria */}
        <Tabs defaultValue="coleta" className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
            {categories.map(([key, label]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {label.replace("Regras de ", "")}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {rulesByCategory[key]?.length || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(([key, label]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{label}</CardTitle>
                  <CardDescription>
                    {getDescription(key)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rulesByCategory[key]?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma regra nesta categoria
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {rulesByCategory[key]?.map((rule) => (
                        <RuleCard
                          key={rule.id}
                          rule={rule}
                          onEdit={handleEdit}
                          onDelete={deleteRule}
                          onToggle={handleToggle}
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Formulário modal */}
      <RuleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        rule={editingRule}
        onSubmit={handleSubmit}
        isLoading={isCreating || isUpdating}
      />
    </DashboardLayout>
  );
}

// Descrições para cada categoria
function getDescription(category: RuleCategory): string {
  const descriptions: Record<RuleCategory, string> = {
    coleta: "Regras que governam a obtenção de dados de mercado das APIs externas",
    fechamento: "Regras para o processamento de fechamento diário de candles",
    calendario: "Regras relacionadas ao calendário de dias úteis e feriados",
    fallback: "Regras de comportamento quando fontes primárias falham",
    seguranca: "Regras de proteção de dados e controle de acesso",
    consistencia: "Regras para garantir integridade e consistência dos dados",
  };
  return descriptions[category];
}
