import { useQuery } from "@tanstack/react-query";
import { getMarketStatus } from "@/services/marketApi";
import type { MarketStatus } from "@/types/market";

// B3 Holiday blocklist for 2026
// Lista completa de feriados B3 2026 (sincronizada com market_calendar)
const HOLIDAYS_2026 = [
  '2026-01-01', // Confraternização Universal
  '2026-02-16', '2026-02-17', // Carnaval
  '2026-04-03', // Sexta-feira Santa
  '2026-04-21', // Tiradentes
  '2026-05-01', // Dia do Trabalho
  '2026-06-04', // Corpus Christi
  '2026-09-07', // Independência
  '2026-10-12', // N.S. Aparecida
  '2026-11-02', // Finados
  '2026-11-15', // Proclamação da República
  '2026-11-20', // Consciência Negra
  '2026-12-24', // Véspera de Natal
  '2026-12-25', // Natal
  '2026-12-31', // Último dia do ano
];

function getLocalMarketStatus(): MarketStatus {
  const now = new Date();
  const saoPauloTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const hour = saoPauloTime.getHours();
  const minute = saoPauloTime.getMinutes();
  const dayOfWeek = saoPauloTime.getDay();
  const dateStr = saoPauloTime.toISOString().split('T')[0];

  // Check holiday
  if (HOLIDAYS_2026.includes(dateStr)) {
    return { isOpen: false, phase: 'closed', isHoliday: true, holidayName: 'Feriado B3' };
  }

  // Check weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isOpen: false, phase: 'closed', isHoliday: false };
  }

  // Check trading hours (10:00 - 17:00 BRT)
  const timeInMinutes = hour * 60 + minute;
  const marketOpen = 10 * 60; // 10:00
  const marketClose = 17 * 60; // 17:00

  if (timeInMinutes < marketOpen) {
    return { isOpen: false, phase: 'pre-market', isHoliday: false };
  } else if (timeInMinutes >= marketOpen && timeInMinutes < marketClose) {
    return { isOpen: true, phase: 'open', isHoliday: false };
  } else {
    return { isOpen: false, phase: 'after-hours', isHoliday: false };
  }
}

export function useMarketStatus() {
  const localStatus = getLocalMarketStatus();
  
  const query = useQuery({
    queryKey: ['market-status'],
    queryFn: getMarketStatus,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: localStatus.isOpen ? 5 * 60 * 1000 : false, // Only poll when market is open
    placeholderData: localStatus,
    retry: 1,
  });

  const status = query.data || localStatus;
  
  // Determine if polling should be active
  const shouldPoll = status.isOpen && !status.isHoliday;

  return {
    ...status,
    shouldPoll,
    isLoading: query.isLoading,
    error: query.error,
  };
}
