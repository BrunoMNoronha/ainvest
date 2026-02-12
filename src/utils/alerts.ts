import type { Quote } from "@/types/market";

/** Tipos de alerta gerados dinamicamente */
export type AlertType = "price" | "signal" | "risk" | "success";

/** Estrutura de um alerta calculado */
export interface GeneratedAlert {
  id: string;
  type: AlertType;
  ticker: string;
  message: string;
  time: string;
  read: boolean;
}

/**
 * Gera alertas dinâmicos baseados nas cotações reais.
 * Detecta variações significativas, volume elevado e movimentos extremos.
 * @param quotes - Cotações reais da watchlist
 * @returns Array de alertas ordenados por relevância
 */
export function generateAlerts(quotes: Quote[]): GeneratedAlert[] {
  if (!quotes.length) return [];

  const alerts: GeneratedAlert[] = [];
  const avgVolume = quotes.reduce((sum, q) => sum + (q.volume || 0), 0) / quotes.length;

  for (const quote of quotes) {
    const pct = quote.changePercent ?? 0;
    const absPct = Math.abs(pct);

    // Alerta de variação forte positiva (> 3%)
    if (pct > 3) {
      alerts.push({
        id: `price-up-${quote.symbol}`,
        type: "success",
        ticker: quote.symbol,
        message: `Alta expressiva de +${pct.toFixed(2)}% no dia`,
        time: formatAlertTime(quote.updatedAt),
        read: false,
      });
    }

    // Alerta de variação forte negativa (< -3%)
    if (pct < -3) {
      alerts.push({
        id: `price-down-${quote.symbol}`,
        type: "risk",
        ticker: quote.symbol,
        message: `Queda acentuada de ${pct.toFixed(2)}% no dia`,
        time: formatAlertTime(quote.updatedAt),
        read: false,
      });
    }

    // Alerta de volume acima da média (2x)
    if (quote.volume && avgVolume > 0 && quote.volume > avgVolume * 2) {
      alerts.push({
        id: `vol-${quote.symbol}`,
        type: "signal",
        ticker: quote.symbol,
        message: `Volume ${(quote.volume / avgVolume).toFixed(1)}x acima da média da watchlist`,
        time: formatAlertTime(quote.updatedAt),
        read: false,
      });
    }

    // Alerta de variação moderada (entre 2% e 3%)
    if (absPct >= 2 && absPct < 3) {
      alerts.push({
        id: `move-${quote.symbol}`,
        type: "price",
        ticker: quote.symbol,
        message: `Variação de ${pct > 0 ? '+' : ''}${pct.toFixed(2)}% — monitorar`,
        time: formatAlertTime(quote.updatedAt),
        read: true,
      });
    }
  }

  // Ordenar: não lidos primeiro, depois por tipo de urgência
  const priority: Record<AlertType, number> = { risk: 0, signal: 1, success: 2, price: 3 };
  alerts.sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return priority[a.type] - priority[b.type];
  });

  return alerts.slice(0, 8); // Limitar a 8 alertas
}

/**
 * Formata timestamp para exibição relativa no alerta.
 */
function formatAlertTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Agora';
  if (diffMin < 60) return `${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return 'Ontem';
}
