import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

/**
 * Página de documentação: Estratégias SMC
 * Explica a metodologia Smart Money Concepts utilizada no sistema
 */
const Estrategias = () => {
  // Indicadores SMC utilizados no sistema
  const indicadoresSMC = [
    {
      nome: "Break of Structure (BoS)",
      descricao: "Rompimento de estrutura que confirma tendência",
      tipo: "Confirmação"
    },
    {
      nome: "Change of Character (ChoCh)",
      descricao: "Mudança de caráter indicando reversão potencial",
      tipo: "Reversão"
    },
    {
      nome: "Order Block (OB)",
      descricao: "Zonas de acumulação institucional",
      tipo: "Zona"
    },
    {
      nome: "Fair Value Gap (FVG)",
      descricao: "Gaps de preço que tendem a ser preenchidos",
      tipo: "Zona"
    },
    {
      nome: "Fibonacci Retracement",
      descricao: "Níveis 0.618 e 0.786 para entrada",
      tipo: "Nível"
    },
  ];

  // Sistema de scoring
  const criteriosScore = [
    { criterio: "BoS/ChoCh confirmado", pontos: 2 },
    { criterio: "Order Block válido", pontos: 1 },
    { criterio: "FVG presente", pontos: 1 },
    { criterio: "Fibonacci 0.618-0.786", pontos: 1 },
    { criterio: "Volume confirmado", pontos: 1 },
    { criterio: "RSI divergência", pontos: 1 },
    { criterio: "EMA 80 alinhada", pontos: 1 },
    { criterio: "ADX > 25", pontos: 1 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estratégias SMC</h1>
          <p className="text-muted-foreground">
            Smart Money Concepts - Metodologia de análise institucional
          </p>
        </div>

        {/* Visão Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              O que é Smart Money Concepts?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              SMC é uma metodologia de análise técnica que busca identificar o 
              comportamento de grandes instituições ("smart money") no mercado. 
              Combina conceitos de Wyckoff com análise de estrutura de mercado.
            </p>
            <div className="flex gap-2">
              <Badge>Swing Trade</Badge>
              <Badge variant="outline">2-20 dias</Badge>
              <Badge variant="secondary">Diário + H4</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Indicadores SMC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Indicadores Utilizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {indicadoresSMC.map((ind) => (
                <div 
                  key={ind.nome}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <h4 className="font-medium text-foreground">{ind.nome}</h4>
                    <p className="text-sm text-muted-foreground">{ind.descricao}</p>
                  </div>
                  <Badge variant="outline">{ind.tipo}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Score */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Sistema de Scoring (0-9)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {criteriosScore.map((item) => (
                  <div 
                    key={item.criterio}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-muted-foreground">{item.criterio}</span>
                    <Badge variant="secondary">+{item.pontos}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Classificação de Sinais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
                <div>
                  <span className="font-medium text-green-500">Score 7-9</span>
                  <p className="text-sm text-muted-foreground">Alta confiança</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <Target className="h-5 w-5 text-amber-500" />
                <div>
                  <span className="font-medium text-amber-500">Score 5-6</span>
                  <p className="text-sm text-muted-foreground">Média confiança</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
                <div>
                  <span className="font-medium text-red-500">Score 0-4</span>
                  <p className="text-sm text-muted-foreground">Baixa confiança</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Aviso de Risco */}
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <strong>Importante:</strong> O score é uma ferramenta auxiliar baseada 
              em critérios técnicos. Não garante resultados e deve ser usado em 
              conjunto com sua própria análise e gestão de risco.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Estrategias;
