import { getBrapiQuote, getHgFinance } from "@/lib/finance";

const timeframes = ["1D", "1S", "1M", "3M", "1A"];
const activeFrame = "1M";

const news = [
  {
    title: "Petroleo sobe e da suporte ao setor de energia.",
    time: "Ha 2h",
  },
  {
    title: "Empresa anuncia programa de recompra moderado.",
    time: "Ha 6h",
  },
  {
    title: "Analistas revisam preco-alvo para 2026.",
    time: "Ontem",
  },
];

const watchlist = [
  { ticker: "VALE3", price: "R$ 68,40", change: "+1,2%" },
  { ticker: "ITUB4", price: "R$ 33,12", change: "-0,6%" },
  { ticker: "WEGE3", price: "R$ 38,75", change: "+0,3%" },
];

const chartPath =
  "M0 200 C 60 170 120 190 180 175 C 240 160 300 165 360 150 C 420 120 480 130 520 110 C 560 90 600 100 600 95";

const chartArea =
  "M0 240 L0 200 C 60 170 120 190 180 175 C 240 160 300 165 360 150 C 420 120 480 130 520 110 C 560 90 600 100 600 95 L600 240 Z";

const cardBase =
  "rounded-3xl border border-white/10 bg-[var(--panel)] p-6 shadow-[0_24px_60px_rgba(3,7,9,0.45)]";

const fallbackQuote = {
  symbol: "PETR4",
  shortName: "PETR4",
  longName: "Petroleo Brasileiro",
  currency: "BRL",
  regularMarketPrice: 36.95,
  regularMarketDayHigh: 38.05,
  regularMarketDayLow: 36.8,
  regularMarketChange: -1.07,
  regularMarketChangePercent: -2.97,
  regularMarketTime: undefined,
  marketCap: 485_000_000_000,
  regularMarketVolume: 18_400_000,
  regularMarketPreviousClose: 38.07,
  regularMarketOpen: 36.2,
  fiftyTwoWeekLow: 26.4,
  fiftyTwoWeekHigh: 41.8,
  priceEarnings: 7.8,
  earningsPerShare: 4.73,
};

const fallbackHg = {
  results: {
    currencies: {
      USD: { buy: 5.2, variation: 0.42 },
    },
    stocks: {
      IBOVESPA: { points: 187_148.13, variation: -1.34 },
      IFIX: { points: 3_835.11, variation: -0.04 },
    },
    taxes: [{ date: "2026-02-12", cdi: 15, selic: 15 }],
  },
};

const formatCurrency = (value?: number) => {
  if (value == null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumber = (value?: number, maximumFractionDigits = 0) => {
  if (value == null || Number.isNaN(value)) return "--";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
  }).format(value);
};

const formatCompactNumber = (value?: number) => {
  if (value == null || Number.isNaN(value)) return "--";
  const abs = Math.abs(value);
  const formatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  });

  if (abs >= 1_000_000_000) return `${formatter.format(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `${formatter.format(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${formatter.format(value / 1_000)}K`;
  return formatNumber(value);
};

const formatCompactCurrency = (value?: number) => {
  if (value == null || Number.isNaN(value)) return "--";
  return `R$ ${formatCompactNumber(value)}`;
};

const formatPercent = (value?: number, showSign = false) => {
  if (value == null || Number.isNaN(value)) return "--";
  const formatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    signDisplay: showSign ? "always" : "auto",
  });
  return `${formatter.format(value)}%`;
};

const formatRatio = (value?: number) => {
  if (value == null || Number.isNaN(value)) return "--";
  const formatted = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value);
  return `${formatted}x`;
};

const formatUpdatedAt = (iso?: string) => {
  if (!iso) return "Atualizado agora";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Atualizado agora";

  const parts = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).formatToParts(date);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const day = lookup.day;
  const month = lookup.month;
  const hour = lookup.hour;
  const minute = lookup.minute;

  if (!day || !month || !hour || !minute) return "Atualizado agora";
  return `Atualizado ${day}/${month} ${hour}:${minute}`;
};

const formatIndex = (points?: number, variation?: number) => {
  if (points == null || Number.isNaN(points)) return "--";
  const pointsLabel = formatNumber(points, 0);
  const variationLabel =
    variation == null || Number.isNaN(variation)
      ? ""
      : ` (${formatPercent(variation, true)})`;
  return `${pointsLabel}${variationLabel}`;
};

const formatUsd = (buy?: number, variation?: number) => {
  if (buy == null || Number.isNaN(buy)) return "--";
  const base = formatCurrency(buy);
  const variationLabel =
    variation == null || Number.isNaN(variation)
      ? ""
      : ` (${formatPercent(variation, true)})`;
  return `${base}${variationLabel}`;
};

const toneFromVariation = (value?: number) => {
  if (value == null || Number.isNaN(value)) return "text-[var(--muted)]";
  return value >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]";
};

export default async function Home() {
  const symbol = "PETR4";
  const [brapiQuote, hgFinance] = await Promise.all([
    getBrapiQuote(symbol),
    getHgFinance(),
  ]);

  const quote = brapiQuote ?? fallbackQuote;
  const hg = hgFinance ?? fallbackHg;

  const changePercent = quote.regularMarketChangePercent;
  const changeLabel = formatPercent(changePercent, true);
  const changePositive =
    changePercent == null || Number.isNaN(changePercent)
      ? true
      : changePercent >= 0;
  const changeClass =
    changePercent == null || Number.isNaN(changePercent)
      ? "bg-white/10 text-[var(--muted)]"
      : changePositive
        ? "bg-[var(--positive)]/15 text-[var(--positive)]"
        : "bg-[var(--negative)]/15 text-[var(--negative)]";

  const chartLine = changePositive ? "var(--accent)" : "var(--negative)";
  const chartLineStrong = changePositive ? "var(--accent-strong)" : "#ff9b9b";
  const chartFill = changePositive
    ? "rgba(99, 211, 255, 0.35)"
    : "rgba(255, 107, 107, 0.35)";
  const chartFillEnd = changePositive
    ? "rgba(99, 211, 255, 0)"
    : "rgba(255, 107, 107, 0)";

  const ibov = hg.results?.stocks?.IBOVESPA;
  const ifix = hg.results?.stocks?.IFIX;
  const usd = hg.results?.currencies?.USD;
  const taxes = hg.results?.taxes?.[0];

  const stats = [
    { label: "Abertura", value: formatCurrency(quote.regularMarketOpen) },
    {
      label: "Fechamento ant.",
      value: formatCurrency(quote.regularMarketPreviousClose),
    },
    { label: "Max. 52s", value: formatCurrency(quote.fiftyTwoWeekHigh) },
    { label: "Min. 52s", value: formatCurrency(quote.fiftyTwoWeekLow) },
  ];

  const summary = [
    { label: "Volume (dia)", value: formatCompactNumber(quote.regularMarketVolume) },
    { label: "Valor de mercado", value: formatCompactCurrency(quote.marketCap) },
    {
      label: "Ibovespa",
      value: formatIndex(ibov?.points, ibov?.variation),
    },
    { label: "USD/BRL", value: formatUsd(usd?.buy, usd?.variation) },
  ];

  const indicators = [
    { label: "P/L", value: formatRatio(quote.priceEarnings) },
    { label: "LPA", value: formatCurrency(quote.earningsPerShare) },
    { label: "Max. dia", value: formatCurrency(quote.regularMarketDayHigh) },
    { label: "Min. dia", value: formatCurrency(quote.regularMarketDayLow) },
  ];

  const riskSignals = [
    { label: "Volatilidade", value: "Moderada", level: 62, tone: "warning" },
    {
      label: "Momento",
      value: changePositive ? "Positivo" : "Negativo",
      level: 74,
      tone: changePositive ? "positive" : "warning",
    },
    { label: "Liquidez", value: "Alta", level: 88, tone: "accent" },
  ];

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
              Painel
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--foreground)]">
              Analise de acoes
            </h1>
            <p className="mt-3 max-w-md text-sm text-[var(--muted)]">
              Visao rapida para decisao com foco em tendencia, liquidez e
              indicadores-chave.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-3 rounded-full border border-white/15 bg-[var(--panel-2)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:border-white/25">
              <span className="font-mono">{symbol}</span>
              <span className="text-xs text-[var(--muted)]">B3</span>
              <span className="text-xs text-[var(--muted)]">v</span>
            </button>
            <div className="rounded-full border border-white/10 bg-[var(--panel-2)] px-4 py-2 text-xs text-[var(--muted)]">
              {formatUpdatedAt(quote.regularMarketTime)}
            </div>
            <button className="rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-[var(--panel)] transition hover:brightness-110">
              Comparar
            </button>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <section className={cardBase}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold">
                      {symbol}
                    </span>
                    <span>Energia</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <h2 className="text-4xl font-semibold text-[var(--foreground)]">
                      {formatCurrency(quote.regularMarketPrice)}
                    </h2>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${changeClass}`}
                    >
                      {changeLabel}
                    </span>
                    <span className="text-sm text-[var(--muted)]">
                      Desde ontem
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    Fonte: BRAPI + HG Brasil
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-white/10 bg-[var(--panel-2)] p-1">
                  {timeframes.map((frame) => (
                    <button
                      key={frame}
                      aria-pressed={frame === activeFrame}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        frame === activeFrame
                          ? "bg-[var(--accent)] text-[var(--panel)]"
                          : "text-[var(--muted)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      {frame}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative h-64 overflow-hidden rounded-2xl border border-white/10 bg-[var(--panel-2)] p-4">
                <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_top,_rgba(99,211,255,0.12),_transparent_55%)]" />
                <svg
                  viewBox="0 0 600 240"
                  className="relative z-10 h-full w-full"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={chartLine} />
                      <stop offset="100%" stopColor={chartLineStrong} />
                    </linearGradient>
                    <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartFill} />
                      <stop offset="100%" stopColor={chartFillEnd} />
                    </linearGradient>
                  </defs>
                  <g stroke="var(--grid)" strokeDasharray="6 6" strokeWidth="1">
                    <line x1="0" y1="40" x2="600" y2="40" />
                    <line x1="0" y1="90" x2="600" y2="90" />
                    <line x1="0" y1="140" x2="600" y2="140" />
                    <line x1="0" y1="190" x2="600" y2="190" />
                    <line x1="60" y1="0" x2="60" y2="240" />
                    <line x1="140" y1="0" x2="140" y2="240" />
                    <line x1="220" y1="0" x2="220" y2="240" />
                    <line x1="300" y1="0" x2="300" y2="240" />
                    <line x1="380" y1="0" x2="380" y2="240" />
                    <line x1="460" y1="0" x2="460" y2="240" />
                    <line x1="540" y1="0" x2="540" y2="240" />
                  </g>
                  <path d={chartArea} fill="url(#chartFill)" />
                  <path
                    d={chartPath}
                    fill="none"
                    stroke="url(#chartLine)"
                    strokeWidth="3"
                  />
                  <circle cx="520" cy="110" r="4" fill={chartLine} />
                </svg>
                <div className="absolute left-4 top-4 z-20 flex h-[calc(100%-2rem)] flex-col justify-between text-xs text-[var(--muted)]">
                  <span>R$ 39</span>
                  <span>R$ 36</span>
                  <span>R$ 33</span>
                  <span>R$ 30</span>
                </div>
                <div className="absolute bottom-3 left-12 right-4 z-20 grid grid-cols-5 text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                  <span>01/13</span>
                  <span>01/17</span>
                  <span>01/21</span>
                  <span>01/25</span>
                  <span>01/30</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {stats.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-[var(--panel-2)] px-4 py-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-6">
            <section className={cardBase}>
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  Resumo
                </h3>
                <span className="rounded-full bg-[var(--positive)]/15 px-3 py-1 text-xs font-semibold text-[var(--positive)]">
                  Recomendacao neutra
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {summary.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--panel-2)] px-4 py-3 text-sm"
                  >
                    <span className="text-[var(--muted)]">{item.label}</span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-2xl border border-white/10 bg-[var(--panel-2)] px-4 py-4 text-sm text-[var(--muted)]">
                Tendencia de alta no mes, com correcao curta e suporte proximo
                a R$ 35,80.
              </div>
            </section>

            <section className={cardBase}>
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Indicadores chave
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {indicators.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-white/10 bg-[var(--panel-2)] px-4 py-3"
                  >
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3">
                {riskSignals.map((signal) => {
                  const toneClass =
                    signal.tone === "warning"
                      ? "bg-[var(--warning)]"
                      : signal.tone === "positive"
                        ? "bg-[var(--positive)]"
                        : "bg-[var(--accent)]";
                  return (
                    <div key={signal.label} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--muted)]">
                          {signal.label}
                        </span>
                        <span className="font-semibold text-[var(--foreground)]">
                          {signal.value}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5">
                        <div
                          className={`h-2 rounded-full ${toneClass}`}
                          style={{ width: `${signal.level}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <section className={cardBase}>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Noticias
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {news.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-white/10 bg-[var(--panel-2)] px-4 py-3 text-sm"
                >
                  <p className="text-[var(--foreground)]">{item.title}</p>
                  <p className="mt-2 text-xs text-[var(--muted)]">{item.time}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={cardBase}>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Watchlist
            </h3>
            <div className="mt-4 flex flex-col gap-3">
              {watchlist.map((item) => {
                const tone =
                  item.change.startsWith("-")
                    ? "text-[var(--negative)]"
                    : "text-[var(--positive)]";
                return (
                  <div
                    key={item.ticker}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-[var(--panel-2)] px-4 py-3 text-sm"
                  >
                    <div className="flex flex-col">
                      <span className="font-mono text-[var(--foreground)]">
                        {item.ticker}
                      </span>
                      <span className="text-xs text-[var(--muted)]">
                        {item.price}
                      </span>
                    </div>
                    <span className={`text-sm font-semibold ${tone}`}>
                      {item.change}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={cardBase}>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Fluxo do dia
            </h3>
            <div className="mt-4 flex flex-col gap-4">
              <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] px-4 py-4 text-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Taxas referencia
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-2xl font-semibold text-[var(--foreground)]">
                    {formatPercent(taxes?.selic, false)}
                  </span>
                  <span className="text-xs text-[var(--muted)]">Selic</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted)]">
                  <span>CDI</span>
                  <span className="font-semibold text-[var(--foreground)]">
                    {formatPercent(taxes?.cdi, false)}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[var(--panel-2)] px-4 py-4 text-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  Indice IFIX
                </p>
                <div className="mt-3 flex items-end justify-between">
                  <span className="text-2xl font-semibold text-[var(--foreground)]">
                    {formatNumber(ifix?.points, 0)}
                  </span>
                  <span
                    className={`text-xs font-semibold ${toneFromVariation(
                      ifix?.variation
                    )}`}
                  >
                    {formatPercent(ifix?.variation, true)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Fundos imobiliarios em destaque.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
