import { AlertCircle } from "lucide-react";

export function MarketDisclaimer() {
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
      <AlertCircle className="h-4 w-4 flex-shrink-0" />
      <p>
        Dados de cotação com atraso de até 15 minutos. Apenas para fins informativos, 
        não constitui recomendação de investimento. IVVB11 utilizado como proxy do S&P 500.
      </p>
    </div>
  );
}
