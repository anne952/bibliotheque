import { apiClient, isApiNetworkError } from './apiClient';

type OfflineSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

type QueuedAction = {
  id: number;
  method: 'POST' | 'PUT' | 'DELETE';
  path: string;
  data?: unknown;
  query?: Record<string, string | number | boolean | undefined | null> | null;
  auth: boolean;
  target: 'default' | 'render';
};

let initialized = false;
let syncInProgress = false;
let lastKnownOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

const hasOfflineBridge = () => Boolean(window.api?.offlineQueue);

const safeUpdateStatus = async (
  id: number,
  syncStatus: OfflineSyncStatus,
  extras?: { lastError?: string | null; conflict?: unknown; response?: unknown }
) => {
  if (!hasOfflineBridge()) return;
  try {
    await window.api.offlineQueue?.updateStatus({
      id,
      syncStatus,
      lastError: extras?.lastError ?? null,
      conflict: extras?.conflict,
      response: extras?.response
    });
  } catch {
    // no-op
  }
};

const getPendingActions = async (): Promise<QueuedAction[]> => {
  if (!hasOfflineBridge()) return [];
  const records = await window.api.offlineQueue!.list({ statuses: ['pending', 'failed'] });
  return records
    .filter((item) => ['POST', 'PUT', 'DELETE'].includes(String(item.method).toUpperCase()))
    .map((item) => ({
      id: Number(item.id),
      method: String(item.method).toUpperCase() as QueuedAction['method'],
      path: String(item.path),
      data: item.data,
      query: (item.query || null) as QueuedAction['query'],
      auth: Boolean(item.auth),
      target: item.target === 'render' ? 'render' : 'default'
    }));
};

const isConflictStatus = (status?: number) => status === 409 || status === 412;

export const offlineSyncService = {
  async init() {
    if (initialized || !hasOfflineBridge()) return;

    try {
      const result = await window.api.offlineQueue!.init();
      if (!result?.enabled) {
        return;
      }
    } catch {
      return;
    }

    initialized = true;
    window.addEventListener('online', () => {
      lastKnownOnline = true;
      void this.syncNow();
    });
    window.addEventListener('offline', () => {
      lastKnownOnline = false;
    });

    // Poll de securite: navigator.onLine n'est pas toujours fiable selon l'OS.
    window.setInterval(() => {
      const nowOnline = navigator.onLine;
      const wasOffline = !lastKnownOnline;
      lastKnownOnline = nowOnline;
      if (nowOnline && wasOffline) {
        void this.syncNow();
      }
    }, 15000);

    if (navigator.onLine) {
      void this.syncNow();
    }
  },

  async enqueuePending(action: {
    method: 'POST' | 'PUT' | 'DELETE';
    path: string;
    data?: unknown;
    query?: Record<string, string | number | boolean | undefined | null>;
    auth?: boolean;
    target?: 'default' | 'render';
  }) {
    if (!hasOfflineBridge()) {
      throw new Error('Bridge offline indisponible');
    }

    return window.api.offlineQueue!.enqueue({
      method: action.method,
      path: action.path,
      data: action.data,
      query: action.query,
      auth: action.auth,
      target: action.target
    });
  },

  async syncNow() {
    if (!initialized || !hasOfflineBridge()) return { processed: 0, synced: 0, conflicts: 0, failed: 0 };
    if (syncInProgress || !navigator.onLine) {
      return { processed: 0, synced: 0, conflicts: 0, failed: 0 };
    }

    syncInProgress = true;
    let processed = 0;
    let synced = 0;
    let conflicts = 0;
    let failed = 0;

    try {
      const pendingActions = await getPendingActions();

      for (const action of pendingActions) {
        processed += 1;
        await safeUpdateStatus(action.id, 'syncing');

        try {
          const response = await apiClient.request(action.path, {
            method: action.method,
            data: action.data,
            query: action.query || undefined,
            auth: action.auth,
            target: action.target,
            skipOfflineQueue: true
          });

          await safeUpdateStatus(action.id, 'synced', { response, lastError: null });
          synced += 1;
        } catch (error) {
          const status = (error as { status?: number })?.status;
          const message = error instanceof Error ? error.message : 'Erreur sync inconnue';

          if (isConflictStatus(status)) {
            await safeUpdateStatus(action.id, 'conflict', {
              lastError: message,
              conflict: {
                localAction: action,
                status
              }
            });
            conflicts += 1;
            continue;
          }

          if (isApiNetworkError(error)) {
            await safeUpdateStatus(action.id, 'pending', { lastError: message });
            failed += 1;
            break;
          }

          await safeUpdateStatus(action.id, 'failed', { lastError: message });
          failed += 1;
        }
      }

      return { processed, synced, conflicts, failed };
    } finally {
      syncInProgress = false;
    }
  }
};
