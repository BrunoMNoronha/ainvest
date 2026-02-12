import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Bell, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Trash2,
  Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  type: "price" | "signal" | "risk" | "indicator";
  ticker: string;
  condition: string;
  value: string;
  active: boolean;
  triggered?: boolean;
  triggeredAt?: string;
}

const alerts: Alert[] = [
  { id: "1", type: "price", ticker: "PETR4", condition: "Preço acima de", value: "R$ 38,00", active: true },
  { id: "2", type: "price", ticker: "VALE3", condition: "Preço abaixo de", value: "R$ 60,00", active: true },
  { id: "3", type: "signal", ticker: "Todos", condition: "Novo sinal com score ≥", value: "7", active: true },
  { id: "4", type: "indicator", ticker: "ITUB4", condition: "RSI acima de", value: "70", active: false },
  { id: "5", type: "risk", ticker: "BBDC4", condition: "Stop Loss atingido", value: "R$ 16,50", active: true, triggered: true, triggeredAt: "Hoje às 14:32" },
  { id: "6", type: "indicator", ticker: "WEGE3", condition: "Cruzamento EMA 8/80", value: "Alta", active: true },
];

const getAlertIcon = (type: Alert["type"]) => {
  switch (type) {
    case "price":
      return <TrendingUp className="h-4 w-4" />;
    case "signal":
      return <Bell className="h-4 w-4" />;
    case "risk":
      return <AlertTriangle className="h-4 w-4" />;
    case "indicator":
      return <Settings className="h-4 w-4" />;
  }
};

const getAlertColor = (type: Alert["type"]) => {
  switch (type) {
    case "price":
      return "bg-info/10 text-info";
    case "signal":
      return "bg-primary/10 text-primary";
    case "risk":
      return "bg-warning/10 text-warning";
    case "indicator":
      return "bg-accent text-accent-foreground";
  }
};

const Alerts = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
            <p className="text-muted-foreground">Gerencie suas notificações e alertas de mercado</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Alerta
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Alertas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-bullish/10 text-bullish">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{alerts.filter(a => a.active).length}</p>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10 text-warning">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{alerts.filter(a => a.triggered).length}</p>
                  <p className="text-sm text-muted-foreground">Disparados Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{alerts.filter(a => !a.active).length}</p>
                  <p className="text-sm text-muted-foreground">Inativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Seus Alertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg transition-colors",
                    alert.triggered ? "bg-warning/5 border border-warning/20" : "bg-background"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("p-2 rounded-lg", getAlertColor(alert.type))}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{alert.ticker}</span>
                        {alert.triggered && (
                          <Badge variant="outline" className="border-warning text-warning text-xs">
                            Disparado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.condition} <span className="font-medium text-foreground">{alert.value}</span>
                      </p>
                      {alert.triggeredAt && (
                        <p className="text-xs text-warning">{alert.triggeredAt}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch checked={alert.active} />
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Alerts;
