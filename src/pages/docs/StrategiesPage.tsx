// Página de Estratégias de Análise - visualização das estratégias técnicas
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Database, 
  RefreshCw, 
  Shield, 
  Clock,
  ArrowRight,
  ExternalLink
} from "lucide-react";

// Dados das estratégias do projeto
const strategies = [
  {
    id: "coleta",
    title: "Estratégia de Coleta de Dados",
    description: "Obtenção de cotações e indicadores macroeconômicos",
    icon: Database,
    color: "text-blue-500",
    details: [
      "Fonte primária: BRAPI para cotações de ações da B3",
      "Fonte secundária: HG Brasil para indicadores macro (Selic, CDI, USD/BRL)",
      "Processamento sequencial para respeitar limites de API (1 req/s)",
      "20 símbolos principais monitorados automaticamente",
    ],
    code: `// Edge Function: /collect
const symbols = ["PETR4", "VALE3", "ITUB4", ...];
for (const symbol of symbols) {
  await fetch(\`https://brapi.dev/api/quote/\${symbol}\`);
  await sleep(1000); // Respeitar rate limit
}`,
    adr: "ADR-002: Escolha BRAPI + HG Brasil",
  },
  {
    id: "persistencia",
    title: "Estratégia de Persistência",
    description: "Armazenamento e atualização de dados no banco",
    icon: Database,
    color: "text-purple-500",
    details: [
      "UPSERT em quotes_latest para cotações em tempo real",
      "Candles diários gerados no fechamento (após 17h)",
      "Indicadores macro atualizados diariamente",
      "Logs de execução para auditoria e debugging",
    ],
    code: `-- UPSERT para quotes_latest
INSERT INTO quotes_latest (symbol, price, ...)
VALUES ($1, $2, ...)
ON CONFLICT (symbol) DO UPDATE SET
  price = EXCLUDED.price,
  updated_at = now();`,
    adr: "ADR-004: Armazenamento sem Particionamento",
  },
  {
    id: "fallback",
    title: "Estratégia de Fallback",
    description: "Resiliência e fontes alternativas de dados",
    icon: RefreshCw,
    color: "text-orange-500",
    details: [
      "Consulta banco PostgreSQL primeiro (dados recentes)",
      "Fallback para API externa se dados desatualizados",
      "Cache com SWR pattern (stale-while-revalidate)",
      "Timeout de 10s para requisições externas",
    ],
    code: `// Lógica de fallback
const cachedData = await supabase
  .from("quotes_latest")
  .select("*")
  .eq("symbol", symbol);

if (isStale(cachedData)) {
  return await fetchFromExternalAPI(symbol);
}
return cachedData;`,
    adr: "ADR-001: Cache com SWR e Upstash",
  },
  {
    id: "automacao",
    title: "Automação e Scheduling",
    description: "Execução automática de coleta de dados",
    icon: Clock,
    color: "text-green-500",
    details: [
      "pg_cron para agendamento de tarefas",
      "Coleta a cada 30 minutos durante pregão (10h-17h)",
      "Verificação de mercado aberto antes de executar",
      "Dias úteis apenas (segunda a sexta)",
    ],
    code: `-- Cron job configurado
SELECT cron.schedule(
  'collect-market-data',
  '0,30 10-17 * * 1-5',  -- A cada 30min, 10h-17h, seg-sex
  'SELECT collect_market_data()'
);`,
    adr: "ADR-003: Polling Inteligente",
  },
  {
    id: "seguranca",
    title: "Segurança e Consistência",
    description: "Proteção e integridade dos dados",
    icon: Shield,
    color: "text-red-500",
    details: [
      "RLS (Row Level Security) em todas as tabelas",
      "Políticas de leitura pública para dados de mercado",
      "Escrita restrita a funções do sistema",
      "Validação de dados antes de persistir",
    ],
    code: `-- RLS Policy exemplo
CREATE POLICY "Quotes are publicly readable"
ON quotes_latest FOR SELECT
USING (true);

-- Escrita bloqueada para usuários
-- Apenas funções SECURITY DEFINER podem inserir`,
    adr: null,
  },
];

export default function StrategiesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex items-center gap-4">
          <Link to="/docs">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Estratégias de Análise</h1>
            <p className="text-muted-foreground">
              Arquitetura técnica do pipeline de dados do AI Invest
            </p>
          </div>
        </div>

        {/* Diagrama do fluxo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fluxo de Dados</CardTitle>
            <CardDescription>
              Visão geral do pipeline de coleta e processamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 flex-wrap py-4">
              <Badge variant="outline" className="text-sm py-2 px-4">
                BRAPI / HG Brasil
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-sm py-2 px-4">
                Edge Function
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-sm py-2 px-4">
                pg_net (HTTP)
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="outline" className="text-sm py-2 px-4">
                PostgreSQL
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-sm py-2 px-4">
                Frontend React
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lista de estratégias */}
        <div className="grid gap-4">
          {strategies.map((strategy) => (
            <Card key={strategy.id}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg bg-muted`}>
                    <strategy.icon className={`h-5 w-5 ${strategy.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{strategy.title}</CardTitle>
                    <CardDescription>{strategy.description}</CardDescription>
                  </div>
                  {strategy.adr && (
                    <Badge variant="outline" className="text-xs">
                      {strategy.adr}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Lista de detalhes */}
                <ul className="space-y-1">
                  {strategy.details.map((detail, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>

                <Separator />

                {/* Código exemplo */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Exemplo de implementação:</p>
                  <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                    <code>{strategy.code}</code>
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Links para ADRs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Decisões Arquiteturais (ADRs)</CardTitle>
            <CardDescription>
              Documentação das decisões técnicas do projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="cursor-pointer">
                <ExternalLink className="h-3 w-3 mr-1" />
                ADR-001: Cache SWR + Upstash
              </Badge>
              <Badge variant="secondary" className="cursor-pointer">
                <ExternalLink className="h-3 w-3 mr-1" />
                ADR-002: BRAPI + HG Brasil
              </Badge>
              <Badge variant="secondary" className="cursor-pointer">
                <ExternalLink className="h-3 w-3 mr-1" />
                ADR-003: Polling Inteligente
              </Badge>
              <Badge variant="secondary" className="cursor-pointer">
                <ExternalLink className="h-3 w-3 mr-1" />
                ADR-004: Armazenamento sem Particionamento
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
