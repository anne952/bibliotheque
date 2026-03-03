export {}

type OfflineSyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'

type OfflineActionPayload = {
  method: 'POST' | 'PUT' | 'DELETE'
  path: string
  data?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  auth?: boolean
  target?: 'default' | 'render'
}

type OfflineActionRecord = {
  id: number
  method: string
  path: string
  query: Record<string, unknown> | null
  data: unknown
  auth: boolean
  target: 'default' | 'render'
  syncStatus: OfflineSyncStatus
  retryCount: number
  lastError: string | null
  conflict: unknown
  response: unknown
  createdAt: string
  updatedAt: string
  syncedAt: string | null
}

type UpdaterStatus =
  | 'idle'
  | 'disabled'
  | 'unavailable'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error'

type UpdaterState = {
  status: UpdaterStatus
  currentVersion: string
  availableVersion: string | null
  progress: number
  message: string
  supported?: boolean
}

declare global {
  interface Window {
    api: {
      ping: () => string
      quit: () => Promise<void>
      updater?: {
        getVersion: () => Promise<{ version: string; isPackaged: boolean }>
        getState: () => Promise<UpdaterState>
        check: () => Promise<{ ok: boolean; updateInfo?: unknown; state: UpdaterState }>
        download: () => Promise<{ ok: boolean; state: UpdaterState }>
        install: () => Promise<{ ok: boolean; state?: UpdaterState }>
        onStatus: (callback: (state: UpdaterState) => void) => () => void
      }
      offlineQueue?: {
        init: () => Promise<{ enabled: boolean; storage: 'sqlite' | 'none'; dbPath?: string | null }>
        enqueue: (action: OfflineActionPayload) => Promise<OfflineActionRecord>
        list: (filter?: { statuses?: OfflineSyncStatus[] }) => Promise<OfflineActionRecord[]>
        updateStatus: (payload: {
          id: number
          syncStatus: OfflineSyncStatus
          lastError?: string | null
          conflict?: unknown
          response?: unknown
        }) => Promise<OfflineActionRecord | null>
        delete: (payload: { id: number }) => Promise<{ deleted: number }>
        cleanup: (payload?: { statuses?: OfflineSyncStatus[] }) => Promise<{ deleted: number }>
      }
    }
  }
}
