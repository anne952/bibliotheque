import { useQuery } from '@tanstack/react-query';
import { authService } from '../../service/authService';
import { authKeys } from '../../query/keys';

export const useAuthProfileQuery = () =>
  useQuery({
    queryKey: authKeys.profile,
    queryFn: () => authService.getProfile(),
    staleTime: 5 * 60 * 1000
  });

