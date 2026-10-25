/**
 * Shelf Local Storage & Domain Engine
 * Computes exact duplicate groups, clean-up suggestions, formatted units,
 * and maintains reactive local state with zero cloud sync.
 */

import {
  FileItem,
  IndexedLocation,
  DuplicateGroup,
  CleanupSuggestion,
  SavedSearch,
  AppSettings,
  CleanupCategory,
  SourceType,
} from '../types/shelf';
import { INITIAL_FILES, INITIAL_LOCATIONS, INITIAL_SAVED_SEARCHES } from './initialData';

const STORAGE_KEYS = {
  FILES: 'shelf_files_v1',
  LOCATIONS: 'shelf_locations_v1',
  SETTINGS: 'shelf_settings_v1',
  SAVED_SEARCHES: 'shelf_saved_searches_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'playful',
  platform: navigator.userAgent.toLowerCase().includes('win') ? 'windows' : 'mac',
  searchShortcut: navigator.userAgent.toLowerCase().includes('win') ? 'Ctrl+K' : '⌘K',
  trayEnabled: true,
  ocrEnabled: false, // Opt-in, disabled by default
  autoCleanupEnabled: false, // Strictly non-operational by default
  confirmBeforeTrash: true,
};

export class ShelfStorageEngine {
  private files: FileItem[] = [];
  private locations: IndexedLocation[] = [];
  private settings: AppSettings = DEFAULT_SETTINGS;
  private savedSearches: SavedSearch[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  private loadState() {
    try {
      const savedFiles = localStorage.getItem(STORAGE_KEYS.FILES);
      this.files = savedFiles ? JSON.parse(savedFiles) : [...INITIAL_FILES];

      const savedLocations = localStorage.getItem(STORAGE_KEYS.LOCATIONS);
      this.locations = savedLocations ? JSON.parse(savedLocations) : [...INITIAL_LOCATIONS];

      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      this.settings = savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_SETTINGS;

      const savedSearches = localStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES);
      this.savedSearches = savedSearches ? JSON.parse(savedSearches) : [...INITIAL_SAVED_SEARCHES];
    } catch {
      this.files = [...INITIAL_FILES];
      this.locations = [...INITIAL_LOCATIONS];
      this.settings = DEFAULT_SETTINGS;
      this.savedSearches = [...INITIAL_SAVED_SEARCHES];
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(this.files));
      localStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(this.locations));
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
      localStorage.setItem(STORAGE_KEYS.SAVED_SEARCHES, JSON.stringify(this.savedSearches));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
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

  // --- File Getters ---
  public getFiles(includeTrashed = false): FileItem[] {
    return includeTrashed ? this.files : this.files.filter((f) => !f.isTrashed);
  }

  public getFileById(id: string): FileItem | undefined {
    return this.files.find((f) => f.id === id);
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

  // --- Statistics ---
  public getLibrarySummary() {
    const activeFiles = this.getFiles(false);
    const count = activeFiles.length;
    const totalBytes = activeFiles.reduce((acc, f) => acc + f.size, 0);
    return {
      count,
      totalBytes,
      formattedSize: this.formatBytes(totalBytes),
    };
  }

  // --- Safe File Operations ---
  public moveToTrash(fileIds: string[]): { movedCount: number; totalBytes: number } {
    const idSet = new Set(fileIds);
    let movedCount = 0;
    let totalBytes = 0;

    this.files = this.files.map((file) => {
      if (idSet.has(file.id) && !file.isTrashed) {
        movedCount++;
        totalBytes += file.size;
        return { ...file, isTrashed: true };
      }
      return file;
    });

    this.persist();
    return { movedCount, totalBytes };
  }

  public restoreFromTrash(fileIds: string[]) {
    const idSet = new Set(fileIds);
    this.files = this.files.map((file) => {
      if (idSet.has(file.id)) {
        return { ...file, isTrashed: false };
      }
      return file;
    });
    this.persist();
  }

  // --- Locations Management ---
  public addLocation(path: string, displayName: string): IndexedLocation {
    const newLoc: IndexedLocation = {
      id: `loc-${Date.now()}`,
      displayName,
      fullPath: path,
      status: 'indexed',
      fileCount: 0,
      totalSize: 0,
      addedAt: Date.now(),
    };
    this.locations = [...this.locations, newLoc];
    this.persist();
    return newLoc;
  }

  public removeLocation(locationId: string) {
    this.locations = this.locations.filter((l) => l.id !== locationId);
    // Removing a location from Shelf index removes it from indexing; original files stay safe!
    this.files = this.files.filter((f) => f.locationId !== locationId);
    this.persist();
  }

  // --- Saved Searches ---
  public addSavedSearch(title: string, query: string): SavedSearch {
    const newSearch: SavedSearch = {
      id: `saved-${Date.now()}`,
      title,
      query,
      createdAt: Date.now(),
    };
    this.savedSearches = [newSearch, ...this.savedSearches];
    this.persist();
    return newSearch;
  }

  public removeSavedSearch(searchId: string) {
    this.savedSearches = this.savedSearches.filter((s) => s.id !== searchId);
    this.persist();
  }

  public renameSavedSearch(searchId: string, newTitle: string) {
    this.savedSearches = this.savedSearches.map((s) =>
      s.id === searchId ? { ...s, title: newTitle } : s
    );
    this.persist();
  }

  // --- Settings ---
  public updateSettings(partial: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...partial };
    this.persist();
  }

  // --- Rebuild / Reset Index ---
  public resetIndex() {
    this.files = [...INITIAL_FILES];
    this.locations = [...INITIAL_LOCATIONS];
    this.persist();
  }

  public clearAllIndexData() {
    this.files = [];
    this.persist();
  }

  // --- Duplicate Detection (Exact SHA-256 Hashing) ---
  public computeDuplicates(): { groups: DuplicateGroup[]; totalPotentialSavings: number } {
    const activeFiles = this.getFiles(false);
    const hashGroups = new Map<string, FileItem[]>();

    activeFiles.forEach((file) => {
      if (file.sha256) {
        const existing = hashGroups.get(file.sha256) || [];
        existing.push(file);
        hashGroups.set(file.sha256, existing);
      }
    });

    const groups: DuplicateGroup[] = [];
    let totalPotentialSavings = 0;

    hashGroups.forEach((members, hash) => {
      if (members.length > 1) {
        // Sort by location precedence or modified date (keep the one in Documents or oldest)
        const sorted = [...members].sort((a, b) => {
          if (a.locationPath.includes('Documents') && !b.locationPath.includes('Documents')) return -1;
          if (!a.locationPath.includes('Documents') && b.locationPath.includes('Documents')) return 1;
          return a.createdAt - b.createdAt;
        });

        const proposedKeep = sorted[0];
        const extraCopies = sorted.slice(1);
        const savings = extraCopies.reduce((sum, f) => sum + f.size, 0);
        totalPotentialSavings += savings;

        groups.push({
          id: `dup-${hash}`,
          hash,
          displayName: proposedKeep.displayName,
          kind: proposedKeep.kind,
          sizePerFile: proposedKeep.size,
          memberFiles: sorted,
          proposedKeepId: proposedKeep.id,
          potentialSavings: savings,
        });
      }
    });

    return { groups, totalPotentialSavings };
  }

  // --- Clean Up Engine (Exactly 5 categories) ---
  public computeCleanupSuggestions(): {
    suggestions: CleanupSuggestion[];
    totalReclaimableBytes: number;
  } {
    const activeFiles = this.getFiles(false);
    const now = Date.now();
    const DAY = 24 * 3600 * 1000;

    // Set to avoid double-counting candidates in the headline total
    const seenCandidateIds = new Set<string>();

    // 1. Old installers
    const installerExts = ['dmg', 'pkg', 'exe', 'msi', 'iso'];
    const installers = activeFiles.filter((f) => {
      const isInstaller = installerExts.includes(f.extension.toLowerCase());
      const isOlderThan30Days = now - f.createdAt > 30 * DAY;
      return isInstaller && isOlderThan30Days;
    });

    // 2. Forgotten downloads (in Downloads location, created > 60 days ago)
    const forgottenDownloads = activeFiles.filter((f) => {
      const inDownloads = f.locationPath.toLowerCase().includes('downloads');
      const isOlderThan60Days = now - f.createdAt > 60 * DAY;
      return inDownloads && isOlderThan60Days && !installerExts.includes(f.extension.toLowerCase());
    });

    // 3. Old screenshots (> 30 days old)
    const oldScreenshots = activeFiles.filter((f) => {
      return f.isScreenshot && now - f.createdAt > 30 * DAY;
    });

    // 4. Large old videos (> 100 MB and > 60 days old)
    const largeOldVideos = activeFiles.filter((f) => {
      return f.kind === 'video' && f.size > 100 * 1024 * 1024 && now - f.modifiedAt > 60 * DAY;
    });

    // 5. Unused apps / legacy packages
    const unusedApps = activeFiles.filter((f) => {
      return f.kind === 'app' && now - f.modifiedAt > 60 * DAY;
    });

    const suggestions: CleanupSuggestion[] = [
      {
        category: 'installers',
        title: 'Old installers',
        description: 'Installers and setup packages downloaded over 30 days ago.',
        iconName: 'Package',
        eligibleFiles: installers,
        totalPotentialSize: installers.reduce((sum, f) => sum + f.size, 0),
        criteriaDescription: 'Package extensions (.dmg, .pkg, .exe) downloaded > 30 days ago.',
      },
      {
        category: 'downloads',
        title: 'Forgotten downloads',
        description: 'Files in your Downloads folder left untouched for over 60 days.',
        iconName: 'FolderDown',
        eligibleFiles: forgottenDownloads,
        totalPotentialSize: forgottenDownloads.reduce((sum, f) => sum + f.size, 0),
        criteriaDescription: 'Files in ~/Downloads created > 60 days ago.',
      },
      {
        category: 'screenshots',
        title: 'Old screenshots',
        description: 'Desktop and screen captures older than 30 days.',
        iconName: 'Camera',
        eligibleFiles: oldScreenshots,
        totalPotentialSize: oldScreenshots.reduce((sum, f) => sum + f.size, 0),
        criteriaDescription: 'Screen grabs older than 30 days.',
      },
      {
        category: 'videos',
        title: 'Large old videos',
        description: 'Video recordings exceeding 100 MB that haven’t been opened recently.',
        iconName: 'Film',
        eligibleFiles: largeOldVideos,
        totalPotentialSize: largeOldVideos.reduce((sum, f) => sum + f.size, 0),
        criteriaDescription: 'Videos > 100 MB modified > 60 days ago.',
      },
      {
        category: 'apps',
        title: 'Unused apps',
        description: 'Older application bundles and betas taking up space.',
        iconName: 'AppWindow',
        eligibleFiles: unusedApps,
        totalPotentialSize: unusedApps.reduce((sum, f) => sum + f.size, 0),
        criteriaDescription: 'Application binaries unmodified for > 60 days.',
      },
    ];

    // Compute headline total avoiding double counting
    let totalReclaimableBytes = 0;
    suggestions.forEach((s) => {
      s.eligibleFiles.forEach((f) => {
        if (!seenCandidateIds.has(f.id)) {
          seenCandidateIds.add(f.id);
          totalReclaimableBytes += f.size;
        }
      });
    });

    return { suggestions, totalReclaimableBytes };
  }

  // --- Source Attribution Breakdown ---
  public getSourceBreakdown(): Array<{
    source: SourceType;
    count: number;
    totalSize: number;
    files: FileItem[];
  }> {
    const activeFiles = this.getFiles(false);
    const sourceTypes: SourceType[] = [
      'Gmail',
      'Google Drive',
      'ChatGPT',
      'Canva',
      'Slack',
      'WhatsApp',
      'GitHub',
      'Browser Extensions',
      'Any Website',
    ];

    return sourceTypes.map((source) => {
      const files = activeFiles.filter((f) => f.sourceAttribution?.source === source);
      const totalSize = files.reduce((acc, f) => acc + f.size, 0);
      return {
        source,
        count: files.length,
        totalSize,
        files,
      };
    });
  }

  // --- Formatting Helpers ---
  public formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  }

  public formatDate(epochMs: number): string {
    const date = new Date(epochMs);
    const now = new Date();
    const diffDays = Math.round((now.getTime() - date.getTime()) / (24 * 3600 * 1000));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  public formatDuration(seconds?: number): string {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
}

export const storageEngine = new ShelfStorageEngine();
