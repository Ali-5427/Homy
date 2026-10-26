/**
 * Shelf Local Storage & Domain Engine
 * Interfaces with Electron's durable JSON catalog store under userData.
 * Never stores full file collections in browser localStorage.
 * Guaranteed zero mock data on native Electron path.
 */

import {
  FileItem,
  IndexedLocation,
  DuplicateGroup,
  CleanupSuggestion,
  SavedSearch,
  AppSettings,
  SourceType,
} from '../types/shelf';
import { INITIAL_FILES, INITIAL_LOCATIONS, INITIAL_SAVED_SEARCHES } from './initialData';
import { osAdapter } from './osAdapter';
import { ScanProgressInfo } from '../types/electron';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'playful',
  platform: navigator.userAgent.toLowerCase().includes('win') ? 'windows' : 'mac',
  searchShortcut: navigator.userAgent.toLowerCase().includes('win') ? 'Ctrl+K' : '⌘K',
  trayEnabled: true,
  ocrEnabled: false,
  autoCleanupEnabled: false,
  confirmBeforeTrash: true,
};

export class ShelfStorageEngine {
  private locations: IndexedLocation[] = [];
  private settings: AppSettings = DEFAULT_SETTINGS;
  private savedSearches: SavedSearch[] = [];
  private listeners: Set<() => void> = new Set();
  private scanProgressMap: Map<string, ScanProgressInfo> = new Map();
  private isScanningLocationId: string | null = null;
  private isNative = false;
  private totalIndexedCount = 0;
  private totalIndexedBytes = 0;

  // Cached files in preview mode ONLY (when not running in Electron)
  private webPreviewFiles: FileItem[] = [];

  constructor() {
    this.isNative = osAdapter.isNativeElectron();
    this.initEngine();
  }

  private async initEngine() {
    if (this.isNative) {
      // Running under native Electron:
      // Pull catalog metadata from the durable store under userData
      try {
        const catalog = await osAdapter.getCatalogData();
        if (catalog) {
          this.locations = catalog.locations || [];
          this.settings = catalog.settings ? { ...DEFAULT_SETTINGS, ...catalog.settings } : DEFAULT_SETTINGS;
          this.savedSearches = catalog.savedSearches || [];
          this.totalIndexedCount = catalog.totalFilesCount || 0;
          this.totalIndexedBytes = catalog.totalBytes || 0;
        }

        // Listen for live scan progress
        osAdapter.onScanProgress((info) => {
          this.scanProgressMap.set(info.locationId, info);
          this.notify();
        });
      } catch (err) {
        console.error('Failed to init catalog from Electron store:', err);
      }
    } else {
      // In web preview / sandbox:
      // Check if user specifically requested demo data
      const useDemo = typeof process !== 'undefined' && process.env?.SHELF_USE_DEMO_DATA === '1';
      if (useDemo) {
        this.webPreviewFiles = [...INITIAL_FILES];
        this.locations = [...INITIAL_LOCATIONS];
        this.savedSearches = [...INITIAL_SAVED_SEARCHES];
      } else {
        this.webPreviewFiles = [];
        this.locations = [];
        this.savedSearches = [];
      }
    }
    this.notify();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public getLocations(): IndexedLocation[] {
    return this.locations;
  }

  public getSettings(): AppSettings {
    return this.settings;
  }

  public getSavedSearches(): SavedSearch[] {
    return this.savedSearches;
  }

  public getActiveScanProgress(locationId: string): ScanProgressInfo | undefined {
    return this.scanProgressMap.get(locationId);
  }

  public getIsScanning(locationId?: string): boolean {
    if (locationId) {
      return this.isScanningLocationId === locationId;
    }
    return Boolean(this.isScanningLocationId);
  }

  /**
   * Synchronous file getter used for views.
   * If running in Electron, returns files from paginated memory or active query cache.
   */
  public getFiles(includeTrashed = false): FileItem[] {
    if (!this.isNative) {
      return includeTrashed ? this.webPreviewFiles : this.webPreviewFiles.filter((f) => !f.isTrashed);
    }
    // In native mode, components request files via async queryFiles
    return [];
  }

  public async queryFiles(options: Parameters<typeof osAdapter.queryFiles>[0]) {
    if (this.isNative) {
      return await osAdapter.queryFiles(options);
    }

    // Web fallback implementation
    let list = this.webPreviewFiles.filter((f) => options.includeTrashed || !f.isTrashed);
    if (options.locationId) list = list.filter((f) => f.locationId === options.locationId);
    if (options.kind && options.kind !== 'all') list = list.filter((f) => f.kind === options.kind);
    if (options.isScreenshot) list = list.filter((f) => f.isScreenshot);
    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase().trim();
      list = list.filter((f) => f.displayName.toLowerCase().includes(q) || f.extension.toLowerCase().includes(q));
    }
    const total = list.length;
    const items = list.slice(options.offset || 0, (options.offset || 0) + (options.limit || 100));
    return { total, offset: options.offset || 0, limit: options.limit || 100, items };
  }

  public async getLibrarySummary() {
    if (this.isNative) {
      const summary = await osAdapter.getLibrarySummary();
      if (summary) {
        this.totalIndexedCount = summary.count;
        this.totalIndexedBytes = summary.totalBytes;
        return {
          count: summary.count,
          totalBytes: summary.totalBytes,
          formattedSize: this.formatBytes(summary.totalBytes),
          kindCounts: summary.kindCounts,
        };
      }
    }

    const activeFiles = this.webPreviewFiles.filter((f) => !f.isTrashed);
    const count = activeFiles.length;
    const totalBytes = activeFiles.reduce((acc, f) => acc + f.size, 0);
    const kindCounts = {
      image: activeFiles.filter((f) => f.kind === 'image').length,
      video: activeFiles.filter((f) => f.kind === 'video').length,
      audio: activeFiles.filter((f) => f.kind === 'audio').length,
      document: activeFiles.filter((f) => f.kind === 'document').length,
      archive: activeFiles.filter((f) => f.kind === 'archive').length,
      app: activeFiles.filter((f) => f.kind === 'app').length,
    };
    return {
      count,
      totalBytes,
      formattedSize: this.formatBytes(totalBytes),
      kindCounts,
    };
  }

  // --- Location Management & Resilient Scanning ---

  public async addLocation(folderPath: string, displayName: string): Promise<IndexedLocation> {
    const newLocId = `loc-${Date.now()}`;
    const newLoc: IndexedLocation = {
      id: newLocId,
      displayName,
      fullPath: folderPath,
      status: 'indexing',
      fileCount: 0,
      totalSize: 0,
      addedAt: Date.now(),
    };

    this.locations = [...this.locations, newLoc];
    this.notify();

    if (this.isNative) {
      await osAdapter.saveCatalogMeta({ locations: this.locations });
      this.scanAndIndexLocation(newLocId, folderPath);
    }

    return newLoc;
  }

  public async scanAndIndexLocation(locationId: string, folderPath: string) {
    if (!this.isNative) return;

    this.isScanningLocationId = locationId;
    this.locations = this.locations.map((loc) =>
      loc.id === locationId ? { ...loc, status: 'indexing' } : loc
    );
    this.notify();

    try {
      const res = await osAdapter.startScanLocation(folderPath, locationId, 6);
      if (res.success) {
        this.locations = this.locations.map((loc) =>
          loc.id === locationId
            ? { ...loc, status: 'indexed', fileCount: res.filesCount, totalSize: res.totalBytes || 0 }
            : loc
        );
      } else {
        this.locations = this.locations.map((loc) =>
          loc.id === locationId ? { ...loc, status: 'error' } : loc
        );
      }
    } catch (err) {
      console.error(`Error scanning location ${folderPath}:`, err);
      this.locations = this.locations.map((loc) =>
        loc.id === locationId ? { ...loc, status: 'error' } : loc
      );
    } finally {
      this.isScanningLocationId = null;
      this.scanProgressMap.delete(locationId);
      this.notify();
    }
  }

  public async abortCurrentScan(locationId?: string) {
    if (this.isNative) {
      await osAdapter.abortScan(locationId);
      this.isScanningLocationId = null;
      if (locationId) {
        this.scanProgressMap.delete(locationId);
      } else {
        this.scanProgressMap.clear();
      }
      this.notify();
    }
  }

  public async removeLocation(locationId: string) {
    this.locations = this.locations.filter((l) => l.id !== locationId);
    this.notify();

    if (this.isNative) {
      await osAdapter.removeLocationIndex(locationId);
    } else {
      this.webPreviewFiles = this.webPreviewFiles.filter((f) => f.locationId !== locationId);
    }
  }

  public async clearAllIndexData() {
    if (this.isNative) {
      await osAdapter.clearAllIndex();
      this.locations = this.locations.map((l) => ({ ...l, status: 'paused', fileCount: 0, totalSize: 0 }));
    } else {
      this.webPreviewFiles = [];
    }
    this.notify();
  }

  public async resetIndex() {
    if (this.isNative) {
      for (const loc of this.locations) {
        await this.scanAndIndexLocation(loc.id, loc.fullPath);
      }
    }
  }

  // --- Duplicate Detection ---

  public async computeDuplicates(): Promise<{ groups: DuplicateGroup[]; totalPotentialSavings: number }> {
    if (this.isNative) {
      return await osAdapter.computeDuplicates();
    }
    return { groups: [], totalPotentialSavings: 0 };
  }

  // --- Safe Trash Dispatch ---

  public async moveToTrash(files: FileItem[]): Promise<{ success: boolean; movedCount: number; errors?: any[] }> {
    if (files.length === 0) return { success: true, movedCount: 0 };

    const filePaths = files.map((f) => f.fullPath || `${f.locationPath}/${f.displayName}`);

    if (this.isNative) {
      const res = await osAdapter.trashItems(filePaths);
      this.notify();
      return {
        success: res.success,
        movedCount: res.trashedCount || 0,
        errors: res.errors,
      };
    } else {
      const idSet = new Set(files.map((f) => f.id));
      this.webPreviewFiles = this.webPreviewFiles.map((f) => (idSet.has(f.id) ? { ...f, isTrashed: true } : f));
      this.notify();
      return { success: true, movedCount: files.length };
    }
  }

  // --- Saved Searches & Settings ---

  public addSavedSearch(title: string, query: string): SavedSearch {
    const newSearch: SavedSearch = {
      id: `saved-${Date.now()}`,
      title,
      query,
      createdAt: Date.now(),
    };
    this.savedSearches = [newSearch, ...this.savedSearches];
    if (this.isNative) {
      osAdapter.saveCatalogMeta({ savedSearches: this.savedSearches });
    }
    this.notify();
    return newSearch;
  }

  public removeSavedSearch(searchId: string) {
    this.savedSearches = this.savedSearches.filter((s) => s.id !== searchId);
    if (this.isNative) {
      osAdapter.saveCatalogMeta({ savedSearches: this.savedSearches });
    }
    this.notify();
  }

  public renameSavedSearch(searchId: string, newTitle: string) {
    this.savedSearches = this.savedSearches.map((s) => (s.id === searchId ? { ...s, title: newTitle } : s));
    if (this.isNative) {
      osAdapter.saveCatalogMeta({ savedSearches: this.savedSearches });
    }
    this.notify();
  }

  public updateSettings(partial: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...partial };
    if (this.isNative) {
      osAdapter.saveCatalogMeta({ settings: this.settings });
    }
    this.notify();
  }

  // --- Source Attribution (Honest & Non-fabricating) ---

  public getSourceBreakdown(): Array<{
    source: SourceType;
    count: number;
    totalSize: number;
    files: FileItem[];
  }> {
    // Only return categories when genuine provenance data exists; otherwise 'Unknown'
    return [
      {
        source: 'Unknown',
        count: 0,
        totalSize: 0,
        files: [],
      },
    ];
  }

  // --- Formatting Helpers ---

  public formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0 || !bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  public formatDate(epochMs: number): string {
    if (!epochMs) return 'Unknown';
    const date = new Date(epochMs);
    const now = new Date();
    const diffDays = Math.round((now.getTime() - date.getTime()) / (24 * 3600 * 1000));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export const storageEngine = new ShelfStorageEngine();
