/**
 * Type declarations for Electron IPC Bridge exposed via contextBridge in preload.ts
 */

import { FileItem } from './shelf';

export interface DefaultUserFolder {
  id: string;
  displayName: string;
  fullPath: string;
  isDefault: boolean;
}

export interface ElectronAPI {
  getPlatform: () => Promise<'mac' | 'windows'>;
  getDefaultUserFolders: () => Promise<DefaultUserFolder[]>;
  scanFolder: (
    folderPath: string,
    locationId: string
  ) => Promise<{ success: boolean; error?: string; files: FileItem[] }>;
  trashItem: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  showItemInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  selectFolder: () => Promise<{ path: string; name: string } | null>;
  copyToClipboard: (text: string) => Promise<boolean>;
  onShortcutTrigger: (callback: (shortcut: string) => void) => () => void;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
