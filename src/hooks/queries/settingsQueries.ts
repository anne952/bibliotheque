import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsService } from '../../service/settingsService';
import { settingsKeys } from '../../query/keys';

export const useCompanyProfileQuery = () =>
  useQuery({
    queryKey: settingsKeys.companyProfile,
    queryFn: () => settingsService.getCompanySettings(),
    staleTime: 10 * 60 * 1000
  });

export const useUpdateCompanyProfileMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { companyName?: string; profilePhoto?: string }) =>
      settingsService.updateCompanySettings(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsKeys.companyProfile });
    }
  });
};

