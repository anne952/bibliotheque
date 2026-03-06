import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../../service/reportService';
import { reportsKeys } from '../../query/keys';

export const useReportsQuery = () =>
  useQuery({
    queryKey: reportsKeys.list,
    queryFn: () => reportService.getRecentReports(7),
    staleTime: 5 * 60 * 1000
  });

export const useDeleteReportMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reportService.deleteReport(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportsKeys.list });
    }
  });
};

