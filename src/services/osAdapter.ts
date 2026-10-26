/**
 * Shelf Desktop OS Adapter
 * Isolate OS-dependent operations behind an auditable, narrow boundary.
 * Bridges seamlessly with native Electron IPC (window.electronAPI) when running as a packaged
 * macOS / Windows desktop application, while providing clean fallbacks in preview environments.
 */

import { FileItem, OSPlatform, DuplicateGroup } from '../types/shelf';
import {
  CatalogData,
  QueryFilesOptions,
  QueryFilesResult,
  LibrarySummary,
  ScanProgressInfo,
  DuplicateHashProgressInfo,
  TrashResult,
} from '../types/electron';

export interface OSAdapterResult {
  success: boolean;
  message?: string;
  error?: string;
}

class DesktopOSAdapter {
  private platform: OSPlatform = navigator.userAgent.toLowerCase().includes('win')
    ? 'windows'
    : 'mac';

  constructor() {
    this.detectNativePlatform();
  }

  private async detectNativePlatform() {
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        const nativePlatform = await window.electronAPI.getPlatform();
        if (nativePlatform) {
          this.platform = nativePlatform;
        }
      } catch {
        // Safe fallback to user-agent detection
      }
    }
  }

  public getPlatform(): OSPlatform {
    return this.platform;
  }

  public setPlatform(platform: OSPlatform) {
    this.platform = platform;
  }

  public isNativeElectron(): boolean {
    return typeof window !== 'undefined' && Boolean(window.electronAPI?.isElectron);
  }

  public getFileManagerName(): string {
    return this.platform === 'mac' ? 'Finder' : 'File Explorer';
  }

  public getTrashName(): string {
    return this.platform === 'mac' ? 'Trash' : 'Recycle Bin';
  }

  public getModifierKeyLabel(): string {
    return this.platform === 'mac' ? '⌘' : 'Ctrl';
  }

  public getDefaultShortcut(): string {
    return this.platform === 'mac' ? '⌘K' : 'Ctrl+K';
  }

  public async getCatalogData(): Promise<CatalogData | null> {
    if (window.electronAPI?.getCatalogData) {
      return await window.electronAPI.getCatalogData();
    }
    return null;
  }

  public async saveCatalogMeta(meta: Parameters<typeof window.electronAPI.saveCatalogMeta>[0]) {
    if (window.electronAPI?.saveCatalogMeta) {
      return await window.electronAPI.saveCatalogMeta(meta);
    }
    return { success: false };
  }

  public async queryFiles(options: QueryFilesOptions): Promise<QueryFilesResult> {
    if (window.electronAPI?.queryFiles) {
      return await window.electronAPI.queryFiles(options);
    }
    return { total: 0, offset: 0, limit: options.limit || 100, items: [] };
  }

  public async getLibrarySummary(): Promise<LibrarySummary | null> {
    if (window.electronAPI?.getLibrarySummary) {
      return await window.electronAPI.getLibrarySummary();
    }
    return null;
  }

  public async getDefaultUserFolders() {
    if (window.electronAPI?.getDefaultUserFolders) {
      try {
        const folders = await window.electronAPI.getDefaultUserFolders();
        if (folders && folders.length > 0) {
          return folders;
        }
      } catch (err) {
        console.warn('Could not fetch native user folders:', err);
      }
    }
    return [];
  }

  public async startScanLocation(folderPath: string, locationId: string, maxDepth = 6) {
    if (window.electronAPI?.startScanLocation) {
      return await window.electronAPI.startScanLocation(folderPath, locationId, maxDepth);
    }
    return { success: false, filesCount: 0, error: 'Not running in native Electron' };
  }

  public async abortScan(locationId?: string) {
    if (window.electronAPI?.abortScan) {
      return await window.electronAPI.abortScan(locationId);
    }
    return { success: false };
  }

  public async computeDuplicates(): Promise<{ groups: DuplicateGroup[]; totalPotentialSavings: number }> {
    if (window.electronAPI?.computeDuplicates) {
      return await window.electronAPI.computeDuplicates();
    }
    return { groups: [], totalPotentialSavings: 0 };
  }

  public async trashItems(filePaths: string[]): Promise<TrashResult> {
    if (window.electronAPI?.trashItems) {
      return await window.electronAPI.trashItems(filePaths);
    }
    return { success: false, error: 'Not running in native Electron' };
  }

  public async removeLocationIndex(locationId: string) {
    if (window.electronAPI?.removeLocationIndex) {
      return await window.electronAPI.removeLocationIndex(locationId);
    }
    return { success: false };
  }

  public async clearAllIndex() {
    if (window.electronAPI?.clearAllIndex) {
      return await window.electronAPI.clearAllIndex();
    }
    return { success: false };
  }

  public async openFile(file: FileItem): Promise<OSAdapterResult> {
    const fullPath = file.fullPath || `${file.locationPath}/${file.displayName}`;

    if (window.electronAPI) {
      try {
        const res = await window.electronAPI.openPath(fullPath);
        if (res.success) {
          return { success: true, message: `Opened ${file.displayName} with OS default application.` };
        } else {
          return { success: false, error: res.error || 'Failed to launch file with OS application.' };
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return { success: false, error: msg };
      }
    }

    return {
      success: true,
      message: `Simulated OS open for ${file.displayName}.`,
    };
  }

  public async showInFileManager(file: FileItem): Promise<OSAdapterResult> {
    const manager = this.getFileManagerName();
    const fullPath = file.fullPath || `${file.locationPath}/${file.displayName}`;

    if (window.electronAPI) {
      try {
        const res = await window.electronAPI.showItemInFolder(fullPath);
        if (res.success) {
          return { success: true, message: `Revealed ${file.displayName} in ${manager}.` };
        } else {
          return { success: false, error: res.error || `Could not reveal in ${manager}.` };
        }
      } catch (err: unknown) {
        return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
      }
    }

    try {
      await navigator.clipboard.writeText(fullPath);
      return {
        success: true,
        message: `Revealed in ${manager} (${fullPath} copied to clipboard)`,
      };
    } catch {
      return {
        success: true,
        message: `Revealed in ${manager}: ${fullPath}`,
      };
    }
  }

  public async copyPath(file: FileItem): Promise<OSAdapterResult> {
    const fullPath = file.fullPath || `${file.locationPath}/${file.displayName}`;

    if (window.electronAPI) {
      try {
        await window.electronAPI.copyToClipboard(fullPath);
        return { success: true, message: `Copied path to clipboard: ${fullPath}` };
      } catch {
        // Fallback
      }
    }

    try {
      await navigator.clipboard.writeText(fullPath);
      return { success: true, message: `Copied path to clipboard: ${fullPath}` };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Clipboard access denied';
      return { success: false, error: errorMsg };
    }
  }

  public async selectFolder(): Promise<{ path: string; name: string } | null> {
    if (window.electronAPI) {
      try {
        const folder = await window.electronAPI.selectFolder();
        if (folder) return folder;
      } catch (err) {
        console.warn('Native folder selection failed:', err);
      }
    }
    return null;
  }

  public onScanProgress(callback: (info: ScanProgressInfo) => void) {
    if (window.electronAPI?.onScanProgress) {
      return window.electronAPI.onScanProgress(callback);
    }
    return () => {};
  }

  public onDuplicateHashProgress(callback: (info: DuplicateHashProgressInfo) => void) {
    if (window.electronAPI?.onDuplicateHashProgress) {
      return window.electronAPI.onDuplicateHashProgress(callback);
    }
    return () => {};
  }
}

export const osAdapter = new DesktopOSAdapter();
