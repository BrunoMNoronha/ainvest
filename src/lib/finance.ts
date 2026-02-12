type BrapiQuote = {
  symbol: string;
  shortName?: string;
  longName?: string;
  currency?: string;
  regularMarketPrice?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketTime?: string;
  marketCap?: number;
  regularMarketVolume?: number;
  regularMarketPreviousClose?: number;
  regularMarketOpen?: number;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  priceEarnings?: number;
  earningsPerShare?: number;
};

type BrapiQuoteResponse = {
  results?: BrapiQuote[];
  error?: boolean;
  message?: string;
};

type HgFinance = {
  results?: {
    currencies?: {
      USD?: { buy?: number; variation?: number };
    };
    stocks?: {
      IBOVESPA?: { points?: number; variation?: number };
      IFIX?: { points?: number; variation?: number };
    };
    taxes?: Array<{ date?: string; cdi?: number; selic?: number }>;
  };
};

const BRAPI_BASE = "https://brapi.dev/api/quote";
const HG_FINANCE_BASE = "https://api.hgbrasil.com/finance";
const REVALIDATE_SECONDS = 60;

export async function getBrapiQuote(
  symbol: string
): Promise<BrapiQuote | null> {
  const token = process.env.BRAPI_TOKEN;
  if (!token) return null;

  const url = new URL(`${BRAPI_BASE}/${encodeURIComponent(symbol)}`);
  url.searchParams.set("token", token);

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as BrapiQuoteResponse;
    if (data.error) return null;

    return data.results?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function getHgFinance(): Promise<HgFinance | null> {
  const key = process.env.HG_BRASIL_KEY;
  if (!key) return null;

  const url = new URL(HG_FINANCE_BASE);
  url.searchParams.set("key", key);

  try {
    const response = await fetch(url.toString(), {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as HgFinance;
    return data ?? null;
  } catch {
    return null;
  }
}

export type { BrapiQuote, HgFinance };
