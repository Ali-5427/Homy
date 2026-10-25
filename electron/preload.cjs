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

  trashItem: async (filePath) => {
    return await ipcRenderer.invoke('trash-item', filePath);
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
});
