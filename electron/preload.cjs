/**
 * Shelf Desktop Preload Script
 * Securely exposes narrowed native OS capabilities to the renderer process via contextBridge.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,

  getPlatform: async () => {
    return await ipcRenderer.invoke('get-platform');
  },

  getCatalogData: async () => {
    return await ipcRenderer.invoke('get-catalog-data');
  },

  saveCatalogMeta: async (meta) => {
    return await ipcRenderer.invoke('save-catalog-meta', meta);
  },

  queryFiles: async (options) => {
    return await ipcRenderer.invoke('query-files', options);
  },

  getLibrarySummary: async () => {
    return await ipcRenderer.invoke('get-library-summary');
  },

  getDefaultUserFolders: async () => {
    return await ipcRenderer.invoke('get-default-user-folders');
  },

  startScanLocation: async (folderPath, locationId, maxDepth) => {
    return await ipcRenderer.invoke('start-scan-location', folderPath, locationId, maxDepth);
  },

  abortScan: async (locationId) => {
    return await ipcRenderer.invoke('abort-scan', locationId);
  },

  computeDuplicates: async () => {
    return await ipcRenderer.invoke('compute-duplicates');
  },

  trashItems: async (filePaths) => {
    return await ipcRenderer.invoke('trash-items', filePaths);
  },

  removeLocationIndex: async (locationId) => {
    return await ipcRenderer.invoke('remove-location-index', locationId);
  },

  clearAllIndex: async () => {
    return await ipcRenderer.invoke('clear-all-index');
  },

  showItemInFolder: async (filePath) => {
    return await ipcRenderer.invoke('show-in-folder', filePath);
  },

  openPath: async (filePath) => {
    return await ipcRenderer.invoke('open-path', filePath);
  },

  selectFolder: async () => {
    return await ipcRenderer.invoke('select-folder');
  },

  copyToClipboard: async (text) => {
    return await ipcRenderer.invoke('copy-to-clipboard', text);
  },

  onShortcutTrigger: (callback) => {
    const handler = (_event, shortcut) => callback(shortcut);
    ipcRenderer.on('shortcut-trigger', handler);
    return () => ipcRenderer.removeListener('shortcut-trigger', handler);
  },

  onScanProgress: (callback) => {
    const handler = (_event, progress) => callback(progress);
    ipcRenderer.on('scan-progress', handler);
    return () => ipcRenderer.removeListener('scan-progress', handler);
  },

  onDuplicateHashProgress: (callback) => {
    const handler = (_event, progress) => callback(progress);
    ipcRenderer.on('duplicate-hash-progress', handler);
    return () => ipcRenderer.removeListener('duplicate-hash-progress', handler);
  },
});
