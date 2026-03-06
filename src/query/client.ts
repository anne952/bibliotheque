import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 24 * 60 * 60 * 1000,
      staleTime: 30 * 1000,
      networkMode: 'offlineFirst',
      retry: 1,
      refetchOnWindowFocus: false
    },
    mutations: {
      networkMode: 'offlineFirst'
    }
  }
});

export const queryPersister =
  typeof window !== 'undefined' && window.localStorage
    ? createSyncStoragePersister({
        storage: window.localStorage,
        key: 'bibliotheque-vgr-react-query-cache'
      })
    : undefined;

