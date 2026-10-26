/**
 * Type declarations for Electron IPC Bridge exposed via contextBridge in preload.cjs
 */

import { FileItem, IndexedLocation, SavedSearch, AppSettings, DuplicateGroup, FileKind } from './shelf';

export interface DefaultUserFolder {
  id: string;
  displayName: string;
  fullPath: string;
  isDefault: boolean;
}

export interface CatalogData {
  locations: IndexedLocation[];
  savedSearches: SavedSearch[];
  settings: AppSettings | null;
  totalFilesCount: number;
  totalBytes: number;
}

export interface QueryFilesOptions {
  locationId?: string;
  kind?: FileKind | 'all';
  searchQuery?: string;
  isScreenshot?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'displayName' | 'size' | 'modifiedAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  includeTrashed?: boolean;
}

export interface QueryFilesResult {
  total: number;
  offset: number;
  limit: number;
  items: FileItem[];
}

export interface LibrarySummary {
  count: number;
  totalBytes: number;
  kindCounts: Record<FileKind, number>;
  locationsCount: number;
}

export interface ScanProgressInfo {
  locationId: string;
  currentPath: string;
  filesFound: number;
}

export interface DuplicateHashProgressInfo {
  processed: number;
  total: number;
}

export interface TrashResult {
  success: boolean;
  trashedCount?: number;
  errors?: Array<{ filePath: string; error: string }>;
  error?: string;
}

export interface ElectronAPI {
  isElectron: boolean;
  getPlatform: () => Promise<'mac' | 'windows'>;
  getCatalogData: () => Promise<CatalogData>;
  saveCatalogMeta: (meta: {
    locations?: IndexedLocation[];
    settings?: AppSettings;
    savedSearches?: SavedSearch[];
  }) => Promise<{ success: boolean }>;
  queryFiles: (options: QueryFilesOptions) => Promise<QueryFilesResult>;
  getLibrarySummary: () => Promise<LibrarySummary>;
  getDefaultUserFolders: () => Promise<DefaultUserFolder[]>;
  startScanLocation: (
    folderPath: string,
    locationId: string,
    maxDepth?: number
  ) => Promise<{ success: boolean; filesCount: number; totalBytes?: number; error?: string }>;
  abortScan: (locationId?: string) => Promise<{ success: boolean }>;
  computeDuplicates: () => Promise<{ groups: DuplicateGroup[]; totalPotentialSavings: number }>;
  trashItems: (filePaths: string[]) => Promise<TrashResult>;
  removeLocationIndex: (locationId: string) => Promise<{ success: boolean }>;
  clearAllIndex: () => Promise<{ success: boolean }>;
  showItemInFolder: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  openPath: (filePath: string) => Promise<{ success: boolean; error?: string }>;
  selectFolder: () => Promise<{ path: string; name: string } | null>;
  copyToClipboard: (text: string) => Promise<boolean>;
  onShortcutTrigger: (callback: (shortcut: string) => void) => () => void;
  onScanProgress: (callback: (info: ScanProgressInfo) => void) => () => void;
  onDuplicateHashProgress: (callback: (info: DuplicateHashProgressInfo) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
