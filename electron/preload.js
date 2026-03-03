import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  ping: () => 'Electron pret',
  quit: () => ipcRenderer.invoke('app:quit'),
  updater: {
    getVersion: () => ipcRenderer.invoke('updater:get-version'),
    getState: () => ipcRenderer.invoke('updater:get-state'),
    check: () => ipcRenderer.invoke('updater:check'),
    download: () => ipcRenderer.invoke('updater:download'),
    install: () => ipcRenderer.invoke('updater:install'),
    onStatus: (callback) => {
      if (typeof callback !== 'function') return () => {}
      const listener = (_event, payload) => callback(payload)
      ipcRenderer.on('updater:status', listener)
      return () => ipcRenderer.removeListener('updater:status', listener)
    }
  },
  offlineQueue: {
    init: () => ipcRenderer.invoke('offline:init'),
    enqueue: (action) => ipcRenderer.invoke('offline:enqueue', action),
    list: (filter) => ipcRenderer.invoke('offline:list', filter),
    updateStatus: (payload) => ipcRenderer.invoke('offline:update-status', payload),
    delete: (payload) => ipcRenderer.invoke('offline:delete', payload),
    cleanup: (payload) => ipcRenderer.invoke('offline:cleanup', payload)
  }
})
