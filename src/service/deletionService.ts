import { apiClient } from './apiClient';

export type DeletedItemRecord = {
  id: string;
  name: string;
  type: string;
  deletedAt: string;
  restored: boolean;
  sourceId?: string;
  originalIndex?: number;
  originalTable?: string;
  originalId?: string;
  data?: Record<string, unknown> | null;
  expiresAt?: string;
  restoredAt?: string | null;
  restoredById?: string | null;
  raw?: Record<string, unknown>;
};

type CreateDeletedItemPayload = {
  name: string;
  type: string;
  sourceId?: string;
  originalIndex?: number;
};

const getNowIso = () => new Date().toISOString();
const RESTORE_POSITIONS_KEY = 'deleted_items_restore_positions_v1';
const LOCAL_DELETED_ITEMS_KEY = 'deleted_items_local_cache_v1';
const DEFAULT_DELETED_ITEMS_LIMIT = 500;

const toValidIndex = (value: unknown): number | undefined => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return undefined;
  }
  return parsed;
};

const toPositionKey = (type: string, sourceId?: string) => `${type}::${sourceId || ''}`;

const readRestorePositions = (): Record<string, number> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(RESTORE_POSITIONS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, number>;
  } catch {
    return {};
  }
};

const writeRestorePositions = (positions: Record<string, number>) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(RESTORE_POSITIONS_KEY, JSON.stringify(positions));
  } catch {
    // ignore storage errors
  }
};

const storeRestorePosition = (type: string, sourceId: string | undefined, index: number | undefined) => {
  const validIndex = toValidIndex(index);
  if (!sourceId || validIndex === undefined) return;
  const positions = readRestorePositions();
  positions[toPositionKey(type, sourceId)] = validIndex;
  writeRestorePositions(positions);
};

const looksLikeOpaqueId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(trimmed)) return true;
  if (/^[0-9a-f]{24,}$/i.test(trimmed)) return true;
  if (/^[A-Za-z0-9_-]{20,}$/.test(trimmed) && !/[ .,:;()]/.test(trimmed)) return true;
  return false;
};

const stripTrailingOpaqueId = (value: string) => {
  return String(value || '')
    .replace(/[\s.:;,-]+[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\s*[.]?\s*$/i, '')
    .replace(/[\s.:;,-]+[A-Za-z0-9_-]{20,}\s*[.]?\s*$/i, '')
    .trim();
};

const toDisplayName = (raw: any) => {
  const data = parseData(raw?.data);
  const candidate = stripTrailingOpaqueId(String(
    raw?.displayName ||
    raw?.name ||
    raw?.itemName ||
    raw?.label ||
    raw?.title ||
    data?.name ||
    data?.title ||
    [data?.firstName, data?.lastName].filter(Boolean).join(' ') ||
    ''
  ).trim());

  if (!candidate) return 'Element supprime';
  if (looksLikeOpaqueId(candidate)) return 'Element supprime';
  return candidate;
};

const parseData = (value: unknown): Record<string, unknown> | null => {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
    } catch {
      return null;
    }
  }
  return null;
};

const mapOriginalTableToType = (table?: string) => {
  const normalized = String(table || '').toLowerCase();
  if (normalized === 'purchase') return 'achat';
  if (normalized === 'sale') return 'vente';
  if (normalized === 'loan') return 'emprunt';
  if (normalized === 'visit' || normalized === 'visitor') return 'visite';
  if (normalized === 'donation') return 'dons-financier';
  if (normalized === 'material') return 'materiel';
  if (normalized === 'person') return 'utilisateur';
  if (normalized === 'journalentry') return 'comptabilite-journal';
  return normalized || '';
};

const normalizeType = (rawType?: string, originalTable?: string) => {
  const mappedRaw = mapOriginalTableToType(rawType);
  if (mappedRaw) return mappedRaw;
  const mappedTable = mapOriginalTableToType(originalTable);
  if (mappedTable) return mappedTable;
  return 'autre';
};

const normalizeDeletedItem = (raw: any): DeletedItemRecord => ({
  id: String(raw?.id || raw?.deletedItemId || raw?.entityId || ''),
  name: toDisplayName(raw),
  type: normalizeType(raw?.type || raw?.entityType, raw?.originalTable),
  deletedAt: String(raw?.deletedAt || raw?.createdAt || getNowIso()),
  restored: Boolean(raw?.restored ?? raw?.restoredAt),
  sourceId: raw?.sourceId ? String(raw.sourceId) : raw?.entityId ? String(raw.entityId) : raw?.originalId ? String(raw.originalId) : undefined,
  originalIndex: toValidIndex(raw?.originalIndex ?? raw?.position ?? raw?.index),
  originalTable: raw?.originalTable ? String(raw.originalTable) : undefined,
  originalId: raw?.originalId ? String(raw.originalId) : raw?.sourceId ? String(raw.sourceId) : raw?.entityId ? String(raw.entityId) : undefined,
  data: parseData(raw?.data),
  expiresAt: raw?.expiresAt ? String(raw.expiresAt) : undefined,
  restoredAt: raw?.restoredAt ? String(raw.restoredAt) : null,
  restoredById: raw?.restoredById ? String(raw.restoredById) : null,
  raw: raw && typeof raw === 'object' ? raw as Record<string, unknown> : undefined
});

const sortByDateDesc = (items: DeletedItemRecord[]) => {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.deletedAt).getTime();
    const rightTime = new Date(right.deletedAt).getTime();
    return rightTime - leftTime;
  });
};

const createLocalDeletedItemId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `local-${crypto.randomUUID()}`;
    }
  } catch {
    // ignore
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const normalizeForStorage = (items: DeletedItemRecord[]) => {
  return items.map((item) => ({
    ...item,
    id: item.id || createLocalDeletedItemId(),
    deletedAt: item.deletedAt || getNowIso(),
    restored: Boolean(item.restored)
  }));
};

const readLocalDeletedItems = (): DeletedItemRecord[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_DELETED_ITEMS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortByDateDesc(parsed.map(normalizeDeletedItem));
  } catch {
    return [];
  }
};

const writeLocalDeletedItems = (items: DeletedItemRecord[]) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_DELETED_ITEMS_KEY, JSON.stringify(normalizeForStorage(items)));
  } catch {
    // ignore storage errors
  }
};

const toMergeKey = (item: DeletedItemRecord) => {
  const normalizedType = normalizeType(item.type, item.originalTable);
  const sourceRef = String(item.sourceId || item.originalId || '').trim();
  if (sourceRef) {
    return `${normalizedType}::${sourceRef}`;
  }

  const fallbackId = String(item.id || '').trim();
  if (fallbackId) {
    return `${normalizedType}::id::${fallbackId}`;
  }

  return `${normalizedType}::${item.deletedAt}`;
};

const mergeById = (preferred: DeletedItemRecord[], secondary: DeletedItemRecord[]) => {
  const map = new Map<string, DeletedItemRecord>();

  for (const item of secondary) {
    const key = toMergeKey(item);
    map.set(key, item);
  }

  for (const item of preferred) {
    const key = toMergeKey(item);
    map.set(key, item);
  }

  return sortByDateDesc(Array.from(map.values()));
};

const API_LIST_ENDPOINTS = ['/deleted-items', '/corbeille', '/deleted-items/recent'];
const API_CREATE_ENDPOINTS = ['/deleted-items', '/corbeille'];
const API_RESTORE_ENDPOINTS = ['/deleted-items', '/corbeille'];
const API_DELETE_ENDPOINTS = ['/deleted-items', '/corbeille'];
const API_PURGE_EXPIRED_ENDPOINTS = ['/deleted-items/purge-expired', '/corbeille/purge-expired'];
const API_PURGE_RECENT_ENDPOINTS = ['/deleted-items/purge-recent', '/corbeille/purge-recent'];
const BACKEND_MISSING_MSG = 'Logique backend manquante: endpoints suppression recente non disponibles (/deleted-items, /corbeille).';

export const isDeletionBackendMissingError = (error: unknown) => {
  return error instanceof Error && error.message.includes('Logique backend manquante');
};

export const deletionService = {
  async listDeletedItems() {
    const localItems = readLocalDeletedItems();

    for (const endpoint of API_LIST_ENDPOINTS) {
      try {
        const result = await apiClient.request<any>(endpoint, {
          query: {
            includeRestored: true,
            includeExpired: true,
            limit: DEFAULT_DELETED_ITEMS_LIMIT
          }
        });
        const list = Array.isArray(result)
          ? result
          : Array.isArray(result?.items)
            ? result.items
            : Array.isArray(result?.data)
              ? result.data
              : [];

        const remoteItems = sortByDateDesc(list.map(normalizeDeletedItem));
        const merged = mergeById(remoteItems, localItems);
        writeLocalDeletedItems(merged);
        return merged;
      } catch {
        // try next endpoint
      }
    }

    return localItems;
  },

  async recordDeletion(payload: CreateDeletedItemPayload) {
    for (const endpoint of API_CREATE_ENDPOINTS) {
      try {
        const result = await apiClient.request<any>(endpoint, {
          method: 'POST',
          data: {
            itemName: payload.name,
            name: payload.name,
            type: payload.type,
            sourceId: payload.sourceId,
            originalIndex: payload.originalIndex,
            deletedAt: getNowIso()
          }
        });

        const created = normalizeDeletedItem(result || {
          id: payload.sourceId || createLocalDeletedItemId(),
          name: payload.name,
          type: payload.type,
          deletedAt: getNowIso(),
          restored: false,
          sourceId: payload.sourceId,
          originalIndex: payload.originalIndex
        });
        storeRestorePosition(payload.type, payload.sourceId, payload.originalIndex);
        writeLocalDeletedItems(mergeById([created], readLocalDeletedItems()));
        return created;
      } catch {
        // try next endpoint
      }
    }

    const fallback = normalizeDeletedItem({
      id: payload.sourceId || createLocalDeletedItemId(),
      name: payload.name,
      type: payload.type,
      deletedAt: getNowIso(),
      restored: false,
      sourceId: payload.sourceId,
      originalIndex: payload.originalIndex
    });
    storeRestorePosition(payload.type, payload.sourceId, payload.originalIndex);
    writeLocalDeletedItems(mergeById([fallback], readLocalDeletedItems()));
    return fallback;
  },

  async restoreDeletedItem(itemId: string) {
    for (const endpoint of API_RESTORE_ENDPOINTS) {
      try {
        await apiClient.request(`${endpoint}/${itemId}/restore`, { method: 'POST' });
        return this.listDeletedItems();
      } catch {
        // try next endpoint
      }
    }

    const updated = readLocalDeletedItems().map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        restored: true,
        restoredAt: getNowIso()
      };
    });
    writeLocalDeletedItems(updated);
    return sortByDateDesc(updated);
  },

  async permanentlyDeleteItem(itemId: string) {
    for (const endpoint of API_DELETE_ENDPOINTS) {
      try {
        await apiClient.request(`${endpoint}/${itemId}`, { method: 'DELETE' });
        return this.listDeletedItems();
      } catch {
        // try next endpoint
      }
    }

    const updated = readLocalDeletedItems().filter((item) => item.id !== itemId);
    writeLocalDeletedItems(updated);
    return sortByDateDesc(updated);
  },

  async purgeRecent(where?: Record<string, unknown>) {
    const toTable = (value?: string) => {
      const normalized = String(value || '').trim().toLowerCase();
      if (!normalized) return undefined;
      if (normalized === 'materiel' || normalized === 'material') return 'Material';
      if (normalized === 'utilisateur' || normalized === 'person') return 'Person';
      if (normalized === 'comptabilite-journal' || normalized === 'journalentry') return 'JournalEntry';
      return undefined;
    };

    const extract = (input?: Record<string, unknown>) => {
      const nestedWhere = (input?.where && typeof input.where === 'object'
        ? input.where as Record<string, unknown>
        : undefined);
      const root = nestedWhere || input || {};

      const daysRaw = root.days ?? input?.days;
      const parsedDays = Number(daysRaw);
      const days = Number.isFinite(parsedDays) && parsedDays >= 1
        ? Math.min(365, Math.floor(parsedDays))
        : undefined;

      const tableRaw = root.table ?? root.originalTable ?? root.type ?? input?.table ?? input?.type;
      const table = toTable(typeof tableRaw === 'string' ? tableRaw : undefined);

      const onlyNotRestoredRaw = root.onlyNotRestored ?? (root.restored === false ? true : undefined) ?? input?.onlyNotRestored;
      const onlyNotRestored = typeof onlyNotRestoredRaw === 'boolean'
        ? onlyNotRestoredRaw
        : onlyNotRestoredRaw === undefined
          ? undefined
          : String(onlyNotRestoredRaw).toLowerCase() === 'true';

      return { days, table, onlyNotRestored };
    };

    const query = extract(where);
    for (const endpoint of API_PURGE_RECENT_ENDPOINTS) {
      try {
        await apiClient.request(endpoint, {
          method: 'DELETE',
          query
        });
        return this.listDeletedItems();
      } catch {
        // try next endpoint
      }
    }

    const { days, table, onlyNotRestored } = query;
    const now = Date.now();
    const maxAgeMs = days ? days * 24 * 60 * 60 * 1000 : undefined;

    const isTableMatch = (item: DeletedItemRecord) => {
      if (!table) return true;
      const mapped = mapOriginalTableToType(table);
      return item.type === mapped || item.originalTable === table;
    };

    const shouldPurge = (item: DeletedItemRecord) => {
      if (onlyNotRestored === true && item.restored) return false;
      if (!isTableMatch(item)) return false;
      if (!maxAgeMs) return true;
      const deletedAt = new Date(item.deletedAt).getTime();
      return Number.isFinite(deletedAt) && now - deletedAt >= maxAgeMs;
    };

    const updated = readLocalDeletedItems().filter((item) => !shouldPurge(item));
    writeLocalDeletedItems(updated);
    return sortByDateDesc(updated);
  },

  applyRestorePosition<T extends { id: string }>(type: string, items: T[]) {
    if (!Array.isArray(items) || items.length <= 1) return items;

    const positions = readRestorePositions();
    const moves = items
      .map((item, currentIndex) => ({
        currentIndex,
        item,
        targetIndex: positions[toPositionKey(type, String(item.id))]
      }))
      .filter((entry) => toValidIndex(entry.targetIndex) !== undefined)
      .sort((left, right) => {
        const leftTarget = Number(left.targetIndex);
        const rightTarget = Number(right.targetIndex);
        return leftTarget - rightTarget || left.currentIndex - right.currentIndex;
      });

    if (moves.length === 0) return items;

    const ordered = [...items];
    for (const move of moves) {
      const fromIndex = ordered.findIndex((entry) => String(entry.id) === String(move.item.id));
      if (fromIndex === -1) continue;

      const [entry] = ordered.splice(fromIndex, 1);
      const validTarget = Math.max(0, Math.min(Number(move.targetIndex), ordered.length));
      ordered.splice(validTarget, 0, entry);
    }

    return ordered;
  },

  async cleanupExpired(days = 30) {
    for (const endpoint of API_PURGE_EXPIRED_ENDPOINTS) {
      try {
        await apiClient.request(endpoint, { method: 'DELETE' });
        return this.listDeletedItems();
      } catch {
        // try next endpoint
      }
    }

    const now = Date.now();
    const maxAgeMs = days * 24 * 60 * 60 * 1000;
    const updated = readLocalDeletedItems().filter((item) => {
      const deletedAt = new Date(item.deletedAt).getTime();
      if (!Number.isFinite(deletedAt)) return true;
      return now - deletedAt <= maxAgeMs;
    });
    writeLocalDeletedItems(updated);
    return sortByDateDesc(updated);
  }
};
