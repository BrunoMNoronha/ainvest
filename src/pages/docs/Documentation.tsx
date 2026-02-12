// Hub central de documentação com acesso aos 4 módulos
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Map, 
  BookOpen, 
  Scale, 
  History, 
  ArrowRight,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { useRoadmap } from "@/hooks/useRoadmap";
import { useBusinessRules } from "@/hooks/useBusinessRules";
import { useDevHistory } from "@/hooks/useDevHistory";

// Configuração dos módulos de documentação
const modules = [
  {
    id: "roadmap",
    title: "Roadmap",
    description: "Gerencie funcionalidades, prioridades e status de desenvolvimento",
    icon: Map,
    href: "/docs/roadmap",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "strategies",
    title: "Estratégias de Análise",
    description: "Visualize estratégias de coleta, persistência e fallback",
    icon: BookOpen,
    href: "/docs/strategies",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    id: "rules",
    title: "Regras de Negócio",
    description: "Gerencie regras do sistema organizadas por categoria",
    icon: Scale,
    href: "/docs/rules",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: "history",
    title: "Histórico do Desenvolvimento",
    description: "Acompanhe a timeline de implementações e alterações",
    icon: History,
    href: "/docs/history",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
];

export default function Documentation() {
  const { stats: roadmapStats, isLoading: roadmapLoading } = useRoadmap();
  const { stats: rulesStats, isLoading: rulesLoading } = useBusinessRules();
  const { stats: historyStats, isLoading: historyLoading } = useDevHistory();

  // Estatísticas rápidas para exibir nos cards
  const getModuleStats = (moduleId: string) => {
    switch (moduleId) {
      case "roadmap":
        if (roadmapLoading) return null;
        return (
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              {roadmapStats.inProgress} em andamento
            </Badge>
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              {roadmapStats.done} concluídos
            </Badge>
          </div>
        );
      case "rules":
        if (rulesLoading) return null;
        return (
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              {rulesStats.active} ativas
            </Badge>
            {rulesStats.inactive > 0 && (
              <Badge variant="outline" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {rulesStats.inactive} inativas
              </Badge>
            )}
          </div>
        );
      case "history":
        if (historyLoading) return null;
        return (
          <div className="flex gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {historyStats.thisMonth} este mês
            </Badge>
            <Badge variant="outline" className="text-xs">
              {historyStats.total} total
            </Badge>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
          <p className="text-muted-foreground mt-2">
            Central de documentação técnica e gerenciamento do projeto AI Invest
          </p>
        </div>

        {/* Grid de módulos */}
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((module) => (
            <Link key={module.id} to={module.href}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className={`p-2 rounded-lg ${module.bgColor}`}>
                      <module.icon className={`h-6 w-6 ${module.color}`} />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="mt-4">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {getModuleStats(module.id)}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Links rápidos para documentação legada */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentação Técnica</CardTitle>
            <CardDescription>
              Acesso rápido aos documentos de referência do projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link to="/docs/visao">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  Visão Geral
                </Badge>
              </Link>
              <Link to="/docs/estrategias">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  Estratégias SMC
                </Badge>
              </Link>
              <Link to="/docs/api">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  API Reference
                </Badge>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
