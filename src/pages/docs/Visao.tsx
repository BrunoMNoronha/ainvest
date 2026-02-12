import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Users, TrendingUp, Shield } from "lucide-react";

/**
 * Página de documentação: Visão Geral do Projeto
 * Exibe missão, público-alvo e proposta de valor do AInvest
 */
const Visao = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground">
            Missão, público-alvo e proposta de valor do AInvest
          </p>
        </div>

        {/* Cards informativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Missão */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Missão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground">
                Democratizar o acesso a análises técnicas avançadas para o mercado 
                brasileiro, utilizando metodologias institucionais como Smart Money 
                Concepts (SMC) e Wyckoff.
              </p>
              <Badge variant="secondary">B3 Focus</Badge>
            </CardContent>
          </Card>

          {/* Público-alvo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Público-alvo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Traders de swing trade (2-20 dias)</li>
                <li>Investidores intermediários a avançados</li>
                <li>Operadores que buscam automação de análises</li>
              </ul>
            </CardContent>
          </Card>

          {/* Proposta de Valor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Proposta de Valor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Sinais baseados em SMC com score de confiança</li>
                <li>Alvos e stops calculados automaticamente</li>
                <li>Monitoramento em tempo real durante pregão</li>
                <li>Alertas personalizados por ativo</li>
              </ul>
            </CardContent>
          </Card>

          {/* Diferenciais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Diferenciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Foco exclusivo no mercado brasileiro (B3)</li>
                <li>Metodologia SMC + Wyckoff combinadas</li>
                <li>Sistema de scoring transparente</li>
                <li>Disclaimers claros sobre riscos</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <Card className="border-amber-500/50 bg-amber-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              <strong>Aviso:</strong> Esta plataforma não fornece recomendações de 
              investimento. Os sinais gerados são baseados em análise técnica e 
              devem ser usados como ferramenta auxiliar na tomada de decisão.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Visao;
