import { app, BrowserWindow, Menu, ipcMain } from 'electron'
import path from 'path'
import fs from 'node:fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
let mainWindow = null
let offlineDb = null
let offlineDbPath = null
let autoUpdaterRef = null
let updaterInitialized = false
let updaterSupported = false
let updaterCheckInterval = null

const updaterState = {
  status: 'idle',
  currentVersion: app.getVersion(),
  availableVersion: null,
  progress: 0,
  message: ''
}

const toIsoNow = () => new Date().toISOString()

const pushUpdaterState = (patch = {}) => {
  Object.assign(updaterState, patch)
  updaterState.currentVersion = app.getVersion()
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', { ...updaterState })
  }
}

const ensureAutoUpdater = async () => {
  if (updaterInitialized) return autoUpdaterRef
  updaterInitialized = true

  if (!app.isPackaged) {
    pushUpdaterState({
      status: 'disabled',
      message: 'Mise a jour auto desactivee en mode developpement.'
    })
    return null
  }

  try {
    const { autoUpdater } = await import('electron-updater')
    autoUpdaterRef = autoUpdater
    updaterSupported = true

    autoUpdaterRef.autoDownload = true
    autoUpdaterRef.autoInstallOnAppQuit = true

    const explicitFeedUrl = process.env.APP_UPDATE_URL || process.env.ELECTRON_UPDATE_URL
    if (explicitFeedUrl) {
      autoUpdaterRef.setFeedURL({
        provider: 'generic',
        url: explicitFeedUrl
      })
    } else {
      const appUpdateConfigPath = path.join(process.resourcesPath, 'app-update.yml')
      if (!fs.existsSync(appUpdateConfigPath)) {
        updaterSupported = false
        pushUpdaterState({
          status: 'unavailable',
          message: 'Mise a jour indisponible: definir APP_UPDATE_URL ou configurer publish (app-update.yml).'
        })
        return null
      }
    }

    autoUpdaterRef.on('checking-for-update', () => {
      pushUpdaterState({
        status: 'checking',
        message: 'Verification des mises a jour...'
      })
    })

    autoUpdaterRef.on('update-available', (info) => {
      pushUpdaterState({
        status: 'available',
        availableVersion: info?.version || null,
        message: `Nouvelle version disponible: ${info?.version || 'inconnue'}.`
      })
    })

    autoUpdaterRef.on('update-not-available', () => {
      pushUpdaterState({
        status: 'up-to-date',
        availableVersion: null,
        progress: 0,
        message: 'Application deja a jour.'
      })
    })

    autoUpdaterRef.on('download-progress', (progressObj) => {
      pushUpdaterState({
        status: 'downloading',
        progress: Number(progressObj?.percent || 0),
        message: `Telechargement: ${Math.round(Number(progressObj?.percent || 0))}%`
      })
    })

    autoUpdaterRef.on('update-downloaded', (info) => {
      pushUpdaterState({
        status: 'downloaded',
        availableVersion: info?.version || updaterState.availableVersion,
        progress: 100,
        message: 'Mise a jour telechargee. Cliquez pour installer.'
      })
    })

    autoUpdaterRef.on('error', (error) => {
      pushUpdaterState({
        status: 'error',
        message: error?.message || 'Erreur de mise a jour.'
      })
    })

    pushUpdaterState({
      status: 'idle',
      message: 'Mise a jour prete.'
    })

    return autoUpdaterRef
  } catch (error) {
    updaterSupported = false
    pushUpdaterState({
      status: 'unavailable',
      message: `Mise a jour indisponible: ${error?.message || 'module manquant'}`
    })
    return null
  }
}

const ensureOfflineDb = async () => {
  if (offlineDb) return true

  try {
    const sqlite = await import('node:sqlite')
    const { DatabaseSync } = sqlite
    offlineDbPath = path.join(app.getPath('userData'), 'offline-sync.sqlite')
    offlineDb = new DatabaseSync(offlineDbPath)
    offlineDb.exec(`
      CREATE TABLE IF NOT EXISTS offline_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        query_json TEXT,
        data_json TEXT,
        auth_required INTEGER NOT NULL DEFAULT 1,
        target TEXT NOT NULL DEFAULT 'default',
        sync_status TEXT NOT NULL DEFAULT 'pending',
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        conflict_json TEXT,
        response_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        synced_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_offline_actions_status_created
      ON offline_actions(sync_status, created_at);
    `)
    return true
  } catch (error) {
    console.error('Offline SQLite indisponible:', error)
    offlineDb = null
    offlineDbPath = null
    return false
  }
}

const parseMaybeJson = (raw) => {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const normalizeSyncStatus = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (['pending', 'syncing', 'synced', 'failed', 'conflict'].includes(normalized)) {
    return normalized
  }
  return 'pending'
}

const mapActionRow = (row) => ({
  id: Number(row.id),
  method: String(row.method),
  path: String(row.path),
  query: parseMaybeJson(row.query_json),
  data: parseMaybeJson(row.data_json),
  auth: Boolean(row.auth_required),
  target: String(row.target || 'default'),
  syncStatus: String(row.sync_status || 'pending'),
  retryCount: Number(row.retry_count || 0),
  lastError: row.last_error ? String(row.last_error) : null,
  conflict: parseMaybeJson(row.conflict_json),
  response: parseMaybeJson(row.response_json),
  createdAt: String(row.created_at),
  updatedAt: String(row.updated_at),
  syncedAt: row.synced_at ? String(row.synced_at) : null
})

ipcMain.handle('app:quit', () => {
  app.quit()
})

ipcMain.handle('updater:get-version', () => {
  return {
    version: app.getVersion(),
    isPackaged: app.isPackaged
  }
})

ipcMain.handle('updater:get-state', async () => {
  await ensureAutoUpdater()
  return {
    ...updaterState,
    supported: updaterSupported
  }
})

ipcMain.handle('updater:check', async () => {
  const updater = await ensureAutoUpdater()
  if (!updater) return { ok: false, state: { ...updaterState } }

  try {
    const result = await updater.checkForUpdates()
    return {
      ok: true,
      updateInfo: result?.updateInfo || null,
      state: { ...updaterState }
    }
  } catch (error) {
    pushUpdaterState({
      status: 'error',
      message: error?.message || 'Echec verification mise a jour.'
    })
    return { ok: false, state: { ...updaterState } }
  }
})

ipcMain.handle('updater:download', async () => {
  const updater = await ensureAutoUpdater()
  if (!updater) return { ok: false, state: { ...updaterState } }

  try {
    await updater.downloadUpdate()
    return { ok: true, state: { ...updaterState } }
  } catch (error) {
    pushUpdaterState({
      status: 'error',
      message: error?.message || 'Echec telechargement mise a jour.'
    })
    return { ok: false, state: { ...updaterState } }
  }
})

ipcMain.handle('updater:install', async () => {
  const updater = await ensureAutoUpdater()
  if (!updater) return { ok: false, state: { ...updaterState } }

  try {
    updater.quitAndInstall(false, true)
    return { ok: true }
  } catch (error) {
    pushUpdaterState({
      status: 'error',
      message: error?.message || 'Echec installation mise a jour.'
    })
    return { ok: false, state: { ...updaterState } }
  }
})

const scheduleAutoUpdateChecks = (updater) => {
  if (!updater || updaterCheckInterval) return

  const intervalMs = 4 * 60 * 60 * 1000
  updaterCheckInterval = setInterval(() => {
    updater.checkForUpdates().catch((error) => {
      pushUpdaterState({
        status: 'error',
        message: error?.message || 'Echec verification mise a jour.'
      })
    })
  }, intervalMs)
}

ipcMain.handle('offline:init', async () => {
  const enabled = await ensureOfflineDb()
  return {
    enabled,
    storage: enabled ? 'sqlite' : 'none',
    dbPath: offlineDbPath
  }
})

ipcMain.handle('offline:enqueue', async (_event, action) => {
  const ready = await ensureOfflineDb()
  if (!ready || !offlineDb) {
    throw new Error('Offline storage SQLite indisponible')
  }

  const now = toIsoNow()
  const stmt = offlineDb.prepare(`
    INSERT INTO offline_actions (
      method, path, query_json, data_json, auth_required, target, sync_status,
      retry_count, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 0, ?, ?)
  `)

  const method = String(action?.method || 'POST').toUpperCase()
  const routePath = String(action?.path || '')
  if (!routePath) {
    throw new Error('offline:enqueue path manquant')
  }

  const result = stmt.run(
    method,
    routePath,
    action?.query === undefined ? null : JSON.stringify(action.query),
    action?.data === undefined ? null : JSON.stringify(action.data),
    action?.auth === false ? 0 : 1,
    action?.target === 'render' ? 'render' : 'default',
    now,
    now
  )

  const selectStmt = offlineDb.prepare('SELECT * FROM offline_actions WHERE id = ?')
  const row = selectStmt.get(Number(result.lastInsertRowid))
  return mapActionRow(row)
})

ipcMain.handle('offline:list', async (_event, filter) => {
  const ready = await ensureOfflineDb()
  if (!ready || !offlineDb) return []

  const statuses = Array.isArray(filter?.statuses) && filter.statuses.length > 0
    ? filter.statuses.map(normalizeSyncStatus)
    : ['pending', 'failed', 'conflict', 'syncing', 'synced']

  const placeholders = statuses.map(() => '?').join(', ')
  const stmt = offlineDb.prepare(`
    SELECT * FROM offline_actions
    WHERE sync_status IN (${placeholders})
    ORDER BY created_at ASC, id ASC
  `)
  const rows = stmt.all(...statuses)
  return rows.map(mapActionRow)
})

ipcMain.handle('offline:update-status', async (_event, payload) => {
  const ready = await ensureOfflineDb()
  if (!ready || !offlineDb) {
    throw new Error('Offline storage SQLite indisponible')
  }

  const id = Number(payload?.id)
  if (!Number.isFinite(id)) {
    throw new Error('offline:update-status id invalide')
  }

  const syncStatus = normalizeSyncStatus(payload?.syncStatus)
  const now = toIsoNow()
  const isSynced = syncStatus === 'synced'
  const stmt = offlineDb.prepare(`
    UPDATE offline_actions
    SET sync_status = ?,
        updated_at = ?,
        synced_at = ?,
        retry_count = CASE WHEN ? IN ('failed','pending') THEN retry_count + 1 ELSE retry_count END,
        last_error = ?,
        conflict_json = ?,
        response_json = ?
    WHERE id = ?
  `)

  stmt.run(
    syncStatus,
    now,
    isSynced ? now : null,
    syncStatus,
    payload?.lastError ? String(payload.lastError) : null,
    payload?.conflict === undefined ? null : JSON.stringify(payload.conflict),
    payload?.response === undefined ? null : JSON.stringify(payload.response),
    id
  )

  const selectStmt = offlineDb.prepare('SELECT * FROM offline_actions WHERE id = ?')
  const row = selectStmt.get(id)
  return row ? mapActionRow(row) : null
})

ipcMain.handle('offline:delete', async (_event, payload) => {
  const ready = await ensureOfflineDb()
  if (!ready || !offlineDb) return { deleted: 0 }

  const id = Number(payload?.id)
  if (!Number.isFinite(id)) return { deleted: 0 }
  const stmt = offlineDb.prepare('DELETE FROM offline_actions WHERE id = ?')
  const result = stmt.run(id)
  return { deleted: Number(result.changes || 0) }
})

ipcMain.handle('offline:cleanup', async (_event, payload) => {
  const ready = await ensureOfflineDb()
  if (!ready || !offlineDb) return { deleted: 0 }

  const statuses = Array.isArray(payload?.statuses) && payload.statuses.length > 0
    ? payload.statuses.map(normalizeSyncStatus)
    : ['synced']
  const placeholders = statuses.map(() => '?').join(', ')
  const stmt = offlineDb.prepare(`DELETE FROM offline_actions WHERE sync_status IN (${placeholders})`)
  const result = stmt.run(...statuses)
  return { deleted: Number(result.changes || 0) }
})

function createWindow() {
  const iconPath = path.join(__dirname, '..', 'src', 'assets', 'logo.png')
  const isDev = !app.isPackaged

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  Menu.setApplicationMenu(null)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    return
  }

  mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(async () => {
  createWindow()
  const updater = await ensureAutoUpdater()

  if (updater) {
    updater.checkForUpdates().catch((error) => {
      pushUpdaterState({
        status: 'error',
        message: error?.message || 'Echec verification mise a jour.'
      })
    })
    scheduleAutoUpdateChecks(updater)
  }
})

app.on('window-all-closed', () => {
  if (updaterCheckInterval) {
    clearInterval(updaterCheckInterval)
    updaterCheckInterval = null
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

