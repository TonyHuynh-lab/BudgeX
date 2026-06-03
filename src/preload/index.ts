import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  accounts: {
    getAll: () => ipcRenderer.invoke('accounts:getAll'),
    create: (data) => ipcRenderer.invoke('accounts:create', data),
    update: (data) => ipcRenderer.invoke('accounts:update', data),
    delete: (id) => ipcRenderer.invoke('accounts:delete', id)
  },
  transactions: {
    getAll: () => ipcRenderer.invoke('transactions:getAll'),
    create: (data) => ipcRenderer.invoke('transactions:create', data),
    update: (data) => ipcRenderer.invoke('transactions:update', data),
    delete: (id) => ipcRenderer.invoke('transactions:delete', id)
  },
  subscriptions: {
    getAll: () => ipcRenderer.invoke('subscriptions:getAll'),
    create: (data) => ipcRenderer.invoke('subscriptions:create', data),
    update: (data) => ipcRenderer.invoke('subscriptions:update', data),
    delete: (id) => ipcRenderer.invoke('subscriptions:delete', id)
  },
  stockPositions: {
    getAll: () => ipcRenderer.invoke('stockPositions:getAll'),
    create: (data) => ipcRenderer.invoke('stockPositions:create', data),
    update: (data) => ipcRenderer.invoke('stockPositions:update', data),
    delete: (id) => ipcRenderer.invoke('stockPositions:delete', id)
  },
  savingsGoals: {
    getAll: () => ipcRenderer.invoke('savingsGoals:getAll'),
    create: (data) => ipcRenderer.invoke('savingsGoals:create', data),
    update: (data) => ipcRenderer.invoke('savingsGoals:update', data),
    delete: (id) => ipcRenderer.invoke('savingsGoals:delete', id)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.api = api
}


// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
