import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Server, 
  Database, 
  Clock, 
  Shield,
  Code,
  FileJson
} from "lucide-react";

/**
 * Página de documentação: API Reference
 * Referência técnica dos endpoints e estruturas de dados
 */
const ApiReference = () => {
  // Endpoints disponíveis
  const endpoints = [
    {
      method: "GET",
      path: "/market-data/quote",
      params: "symbol, range",
      descricao: "Cotação atual de um ativo"
    },
    {
      method: "GET",
      path: "/market-data/overview",
      params: "-",
      descricao: "Visão geral do mercado (IBOV, dólar, etc)"
    },
    {
      method: "POST",
      path: "/market-data/collect",
      params: "-",
      descricao: "Dispara coleta manual de dados"
    },
  ];

  // Tabelas do banco
  const tabelas = [
    {
      nome: "quotes_latest",
      descricao: "Cache de cotações atuais",
      colunas: "symbol, name, price, change, change_percent, volume"
    },
    {
      nome: "market_candles_daily",
      descricao: "Candles diários (OHLCV)",
      colunas: "symbol, date, open, high, low, close, volume"
    },
    {
      nome: "macro_indicators",
      descricao: "Indicadores macroeconômicos",
      colunas: "indicator_name, date, value"
    },
    {
      nome: "market_calendar",
      descricao: "Calendário de feriados B3",
      colunas: "date, is_trading_day, holiday_name"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">API Reference</h1>
          <p className="text-muted-foreground">
            Documentação técnica dos endpoints e estruturas de dados
          </p>
        </div>

        <Tabs defaultValue="endpoints" className="space-y-4">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="schemas">Schemas</TabsTrigger>
          </TabsList>

          {/* Endpoints */}
          <TabsContent value="endpoints" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5 text-primary" />
                  Edge Functions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {endpoints.map((ep) => (
                    <div 
                      key={ep.path}
                      className="p-4 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Badge 
                          variant={ep.method === "GET" ? "secondary" : "default"}
                        >
                          {ep.method}
                        </Badge>
                        <code className="text-sm font-mono text-foreground">
                          {ep.path}
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {ep.descricao}
                      </p>
                      {ep.params !== "-" && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Params:</span>
                          <code className="text-xs bg-muted px-2 py-0.5 rounded">
                            {ep.params}
                          </code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rate Limits */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Rate Limits & Cache
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Cache SWR (Upstash)</span>
                  <Badge variant="outline">30s stale / 60s max</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Polling em pregão</span>
                  <Badge variant="outline">30 segundos</Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Polling fora do pregão</span>
                  <Badge variant="outline">5 minutos</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database */}
          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Tabelas Principais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tabelas.map((tab) => (
                    <div 
                      key={tab.nome}
                      className="p-4 rounded-lg border border-border bg-muted/30"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <code className="font-mono font-medium text-foreground">
                          {tab.nome}
                        </code>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {tab.descricao}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {tab.colunas.split(", ").map((col) => (
                          <Badge key={col} variant="outline" className="text-xs">
                            {col}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Funções SQL */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5 text-primary" />
                  Funções SQL
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded bg-muted/50">
                  <code className="text-sm font-mono">is_market_open()</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Retorna true se o mercado está aberto
                  </p>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <code className="text-sm font-mono">collect_market_data()</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Dispara coleta via pg_net
                  </p>
                </div>
                <div className="p-3 rounded bg-muted/50">
                  <code className="text-sm font-mono">process_collected_data(json)</code>
                  <p className="text-xs text-muted-foreground mt-1">
                    Processa e persiste dados coletados
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schemas */}
          <TabsContent value="schemas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="h-5 w-5 text-primary" />
                  JSON Schemas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Os schemas JSON estão disponíveis em <code>/schemas/</code>:
                </p>
                <div className="space-y-2">
                  {["Quote.json", "Candle.json", "MarketOverview.json", "IndicatorSnapshot.json"].map((schema) => (
                    <div 
                      key={schema}
                      className="flex items-center gap-2 p-2 rounded bg-muted/50"
                    >
                      <FileJson className="h-4 w-4 text-muted-foreground" />
                      <code className="text-sm">{schema}</code>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Segurança */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Segurança
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">RLS habilitado</span>
                  <Badge className="bg-green-500">Sim</Badge>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground">Autenticação</span>
                  <Badge variant="outline">Supabase Auth</Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">API Keys</span>
                  <Badge variant="outline">Secrets gerenciados</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ApiReference;
