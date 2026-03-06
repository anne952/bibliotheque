import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TabType } from '../../types/biblio';
import { libraryService } from '../../service/libraryService';
import { libraryKeys, accountingKeys } from '../../query/keys';

const tabImpactsAccounting = (tab: TabType) => tab === 'vente' || tab === 'achat' || tab === 'dons-financier';

const invalidateLibraryQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.invalidateQueries({ queryKey: libraryKeys.all });
};

const invalidateAccountingQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.invalidateQueries({ queryKey: accountingKeys.all });
};

export const useLibraryDataQuery = () =>
  useQuery({
    queryKey: libraryKeys.data,
    queryFn: () => libraryService.loadLibraryData(),
    staleTime: 2 * 60 * 1000
  });

export const useLibraryBooksCatalogQuery = () =>
  useQuery({
    queryKey: libraryKeys.booksCatalog,
    queryFn: () => libraryService.getBookCatalog(),
    staleTime: 10 * 60 * 1000
  });

export const useCreateLibraryRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tab, payload }: { tab: TabType; payload: any }) => {
      switch (tab) {
        case 'visite':
          return libraryService.saveVisiteur(payload);
        case 'dons-financier':
          return libraryService.saveDonFinancier(payload);
        case 'dons-materiel':
          return libraryService.saveDonMateriel(payload);
        case 'vente':
          return libraryService.saveVente(payload);
        case 'achat':
          return libraryService.saveAchat(payload);
        case 'emprunt':
        default:
          return libraryService.saveEmprunt(payload);
      }
    },
    onSuccess: async (_result, variables) => {
      await invalidateLibraryQueries(queryClient);
      if (tabImpactsAccounting(variables.tab)) {
        await invalidateAccountingQueries(queryClient);
      }
    }
  });
};

export const useUpdateLibraryRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tab, payload }: { tab: TabType; payload: any }) => libraryService.updateRecord(tab, payload),
    onSuccess: async (_result, variables) => {
      await invalidateLibraryQueries(queryClient);
      if (tabImpactsAccounting(variables.tab)) {
        await invalidateAccountingQueries(queryClient);
      }
    }
  });
};

export const useDeleteLibraryRecordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tab, target }: { tab: TabType; target: any }) => libraryService.deleteRecord(tab, target),
    onSuccess: async (_result, variables) => {
      await invalidateLibraryQueries(queryClient);
      if (tabImpactsAccounting(variables.tab)) {
        await invalidateAccountingQueries(queryClient);
      }
    }
  });
};

export const useImportLibraryPasteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tab, raw }: { tab: TabType; raw: string }) => libraryService.importPaste(tab, raw),
    onSuccess: async (_result, variables) => {
      await invalidateLibraryQueries(queryClient);
      if (tabImpactsAccounting(variables.tab)) {
        await invalidateAccountingQueries(queryClient);
      }
    }
  });
};
