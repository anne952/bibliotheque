import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Materiel, StockOperation } from '../../types/materiel';
import { materialService } from '../../service/materialService';
import { materialsKeys } from '../../query/keys';

export const useMaterialsQuery = (filters?: Record<string, unknown>) =>
  useQuery({
    queryKey: materialsKeys.list(filters),
    queryFn: () => materialService.getAllMaterials(),
    staleTime: 5 * 60 * 1000
  });

export const useAddMaterialMutation = (filters?: Record<string, unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Materiel) => materialService.addMaterial(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialsKeys.list(filters) });
    }
  });
};

export const useDeleteMaterialMutation = (filters?: Record<string, unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => materialService.deleteMaterial(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialsKeys.list(filters) });
    }
  });
};

export const useUpdateMaterialMutation = (filters?: Record<string, unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Materiel }) => materialService.updateMaterial(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialsKeys.list(filters) });
    }
  });
};

export const useAddMaterialStockMutation = (filters?: Record<string, unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ materialId, operation }: { materialId: string; operation: StockOperation }) =>
      materialService.addStockEntry(materialId, operation),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialsKeys.list(filters) });
    }
  });
};

export const useImportMaterialsMutation = (type: any, filters?: Record<string, unknown>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ raw, rows }: { raw: string; rows?: Array<Record<string, unknown>> }) =>
      materialService.importPaste(raw, type, rows),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialsKeys.list(filters) });
    }
  });
};
