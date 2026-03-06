import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../service/dashboardService';
import { dashboardKeys } from '../../query/keys';

export const useDashboardStatsQuery = (period?: string | null) =>
  useQuery({
    queryKey: dashboardKeys.stats(period),
    queryFn: () => dashboardService.getStats(),
    staleTime: 45 * 1000
  });

export const useMonthlyStatsQuery = (monthCount = 12) =>
  useQuery({
    queryKey: dashboardKeys.monthly(monthCount),
    queryFn: () => dashboardService.getMonthlyStats(monthCount),
    staleTime: 45 * 1000
  });

