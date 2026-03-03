import { apiClient } from './apiClient';
import type { Materiel, StockOperation, TypeMateriel, LangueLivre, CategorieLivre, CategorieCarteSD } from '../types/materiel';

const toIsoDate = (value?: string) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
};

const toUiType = (rawType?: string): TypeMateriel => {
  const normalized = (rawType || '').toLowerCase();
  if (normalized.includes('book') || normalized.includes('livre')) return 'livre';
  if (normalized.includes('sd')) return 'carte-sd';
  if (normalized.includes('tablet') || normalized.includes('tablette')) return 'tablette';
  if (normalized.includes('photocop')) return 'photocopieuse';
  return 'autre';
};

const toApiType = (uiType: TypeMateriel) => {
  if (uiType === 'livre') return 'BOOK';
  if (uiType === 'carte-sd') return 'SD_CARD';
  if (uiType === 'tablette') return 'TABLET';
  if (uiType === 'photocopieuse') return 'PHOTOCOPIER';
  return 'OTHER';
};

const mapOperation = (operation: any): StockOperation => {
  const movementType = (operation?.movementType || operation?.type || '').toUpperCase();
  const quantite = Number(operation?.quantity || operation?.quantite || 0);
  const type: StockOperation['type'] = movementType.includes('OUT') ? 'sortie' : 'entrée';

  return {
    id: String(operation?.id || crypto.randomUUID()),
    date: toIsoDate(operation?.date || operation?.createdAt),
    type,
    quantite,
    raison: operation?.reason || operation?.raison || operation?.description || '',
    description: operation?.description || ''
  };
};

const mapMaterial = (item: any, operations: any[] = []): Materiel => {
  const type = toUiType(item?.type);
  const name = item?.name || item?.title || item?.nom || '';
  const stockOps = operations.map(mapOperation);

  const base = {
    id: String(item?.id),
    type,
    nom: name,
    reference: item?.reference || '',
    etat: 'fonctionnel' as const,
    dateAjout: toIsoDate(item?.createdAt || item?.dateAjout),
    stockOperations: stockOps,
    categorie: item?.category || ''
  };

  if (type === 'livre') {
    return {
      ...base,
      type: 'livre',
      titre: name,
      reference: item?.reference || '',
      volume: item?.volume || null,
      langue: (item?.language || 'Français') as LangueLivre,
      categorie: (item?.category || 'livre') as CategorieLivre
    };
  }

  if (type === 'carte-sd') {
    return {
      ...base,
      type: 'carte-sd',
      categorie: (item?.category || 'basique') as CategorieCarteSD
    };
  }

  if (type === 'tablette') {
    return {
      ...base,
      type: 'tablette',
      nom: name || '',
      numeroSerie: item?.serialNumber || ''
    };
  }

  const normalizedType: 'photocopieuse' | 'autre' = type === 'photocopieuse' ? type : 'autre';

  return {
    ...base,
    type: normalizedType,
    nom: name || ''
  };
};

const requestReadWithTargetFallback = async <T>(path: string): Promise<T> => {
  try {
    return await apiClient.request<T>(path);
  } catch {
    return apiClient.request<T>(path, { target: 'render' });
  }
};

const requestReadWithTargetAndQueryFallback = async <T>(path: string, query: Record<string, string | number | boolean>): Promise<T> => {
  try {
    return await apiClient.request<T>(path, { query });
  } catch {
    return apiClient.request<T>(path, { query, target: 'render' });
  }
};

const extractRowsFromCollection = (payload: any): any[] | null => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return null;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.materials)) return payload.materials;
  return null;
};

const extractHasMore = (payload: any) => {
  if (!payload || typeof payload !== 'object') return false;
  return Boolean(
    payload?.pagination?.hasMore ??
    payload?.meta?.hasMore ??
    payload?.hasMore
  );
};

const isReferenceUniqueConstraintError = (error: unknown) => {
  const message = String((error as any)?.message || '').toLowerCase();
  return message.includes('unique constraint failed') && message.includes('reference');
};

export const materialService = {
  async importPaste(
    pastedData: string,
    type: TypeMateriel,
    rows?: Array<Record<string, unknown>>
  ): Promise<any> {
    const payload = rows && rows.length > 0
      ? {
          defaultType: toApiType(type),
          rows
        }
      : {
          pastedData,
          defaultType: toApiType(type)
        };

    const endpoints = ['/materials/import-paste', '/materiel/import-paste', '/bibliotheque/import-paste'];

    for (const endpoint of endpoints) {
      try {
        return await apiClient.request<any>(endpoint, {
          method: 'POST',
          data: payload
        });
      } catch (error) {
        const status = (error as { status?: number } | undefined)?.status;
        if (status === 404 || status === 501) {
          continue;
        }

        // Compatibilite backend: certains environnements gardent une contrainte unique sur reference.
        // Retry automatique sans reference pour ne pas bloquer l'import en lot.
        if (rows && rows.length > 0 && isReferenceUniqueConstraintError(error)) {
          const sanitizedRows = rows.map((row) => {
            const { reference, ...rest } = row as Record<string, unknown>;
            return rest;
          });

          return await apiClient.request<any>(endpoint, {
            method: 'POST',
            data: {
              ...payload,
              rows: sanitizedRows
            }
          });
        }

        throw error;
      }
    }

    throw new Error('Import impossible: endpoint import-paste indisponible');
  },

  async getAllMaterials(): Promise<Materiel[]> {
    // Essayer les endpoints dans l'ordre: principal → alias1 → alias2
    let materials: any[] = [];
    const endpoints = ['/materials', '/materiel', '/bibliotheque'];
    let resolvedEndpoint = endpoints[0];
    
    for (const endpoint of endpoints) {
      try {
        const firstPage = await requestReadWithTargetFallback<any>(endpoint);
        const firstRows = extractRowsFromCollection(firstPage);
        if (firstRows) {
          materials = firstRows;
          resolvedEndpoint = endpoint;

          if (extractHasMore(firstPage)) {
            const pageSize = 500;
            let offset = firstRows.length;
            let hasMore = true;

            while (hasMore) {
              const nextPage = await requestReadWithTargetAndQueryFallback<any>(endpoint, { limit: pageSize, offset });
              const nextRows = extractRowsFromCollection(nextPage);
              if (!nextRows || nextRows.length === 0) {
                break;
              }

              materials = [...materials, ...nextRows];
              offset += nextRows.length;
              hasMore = extractHasMore(nextPage);
            }
          }

          break;
        }
      } catch {
        // Continuer vers le suivant
      }
    }

    const withOps = await Promise.all(
      (materials || []).map(async (item) => {
        try {
          // Prioriser l'endpoint resolu pour eviter des tentatives inutiles par item.
          let operations: any[] = await requestReadWithTargetFallback<any[]>(`${resolvedEndpoint}/${item.id}/transactions`);
          if (!Array.isArray(operations)) {
            operations = [];
          }

          if (operations.length === 0) {
            for (const endpoint of endpoints) {
              if (endpoint === resolvedEndpoint) continue;
              try {
                const fallbackOps = await requestReadWithTargetFallback<any[]>(`${endpoint}/${item.id}/transactions`);
                if (Array.isArray(fallbackOps)) {
                  operations = fallbackOps;
                  break;
                }
              } catch {
                // Continuer vers le suivant
              }
            }
          }

          return mapMaterial(item, operations || []);
        } catch {
          return mapMaterial(item, []);
        }
      })
    );

    return withOps;
  },

  async addMaterial(materiel: Materiel): Promise<Materiel> {
    const rawVolume = (materiel as any).volume;
    const payload = {
      type: toApiType(materiel.type),
      name: (materiel as any).titre || materiel.nom || 'Matériel',
      reference: (materiel as any).reference || null,
      serialNumber: (materiel as any).numeroSerie || null,
      category: materiel.categorie || null,
      language: (materiel as any).langue || null,
      // Backend applique parfois trim() sur volume: forcer une valeur string.
      volume: rawVolume === undefined || rawVolume === null || rawVolume === '' ? null : String(rawVolume),
      description: (materiel as any).description || null
    };

    // Utiliser l'endpoint principal
    const created = await apiClient.request('/materials', {
      method: 'POST',
      data: payload
    });
    return mapMaterial(created, []);
  },

  async updateMaterial(id: string, materiel: Materiel): Promise<Materiel> {
    const rawVolume = (materiel as any).volume;
    const payload = {
      type: toApiType(materiel.type),
      name: (materiel as any).titre || materiel.nom || 'Matériel',
      reference: (materiel as any).reference || null,
      serialNumber: (materiel as any).numeroSerie || null,
      category: materiel.categorie || null,
      language: (materiel as any).langue || null,
      volume: rawVolume === undefined || rawVolume === null || rawVolume === '' ? null : String(rawVolume),
      description: (materiel as any).description || null
    };

    const updated = await apiClient.request(`/materials/${id}`, {
      method: 'PUT',
      data: payload
    });

    return mapMaterial(updated, []);
  },

  async deleteMaterial(id: string) {
    // Utiliser l'endpoint principal
    await apiClient.request(`/materials/${id}`, {
      method: 'DELETE'
    });
  },

  async addStockEntry(materialId: string, operation: StockOperation): Promise<StockOperation> {
    const quantity = Number(operation.quantite || 0);
    const quantityDelta = operation.type === 'sortie'
      ? -Math.abs(quantity)
      : Math.abs(quantity);

    const payload = {
      materialId,
      quantityDelta,
      description: operation.description || operation.raison || 'Ajustement de stock',
      reference: operation.raison || null
    };

    const movement = await apiClient.request('/transactions/adjustment', {
      method: 'POST',
      data: payload
    });

    return mapOperation(movement);
  }
};
