/**
 * Shelf Domain Types & State Models
 * Clean, typed boundaries for local files, search, indexing, cleanup, and OS adapters.
 */

export type FileKind = 'image' | 'video' | 'audio' | 'document' | 'archive' | 'app';

export type SourceType =
  | 'Gmail'
  | 'Google Drive'
  | 'ChatGPT'
  | 'Canva'
  | 'Slack'
  | 'WhatsApp'
  | 'GitHub'
  | 'Browser Extensions'
  | 'Any Website'
  | 'Unknown';

export interface SourceAttribution {
  source: SourceType;
  confidence: 'verified' | 'inferred' | 'unknown';
  evidence?: string;
  sourceUrl?: string;
}

export interface FileItem {
  id: string;
  displayName: string;
  extension: string;
  kind: FileKind;
  size: number; // in bytes
  createdAt: number; // epoch ms
  modifiedAt: number; // epoch ms
  locationId: string;
  locationPath: string;
  fullPath?: string;
  previewUrl?: string;
  previewType?: 'image' | 'audio' | 'text' | 'generic';
  sourceAttribution?: SourceAttribution;
  dimensions?: { width: number; height: number };
  duration?: number; // seconds (for audio/video)
  isScreenshot?: boolean;
  extractedText?: string;
  extractedTextStatus: 'none' | 'indexed' | 'unsupported';
  sha256?: string; // Content hash for exact duplicates
  isTrashed?: boolean;
}

export interface IndexedLocation {
  id: string;
  displayName: string;
  fullPath: string;
  status: 'indexed' | 'indexing' | 'error' | 'paused';
  fileCount: number;
  totalSize: number;
  addedAt: number;
  isDefault?: boolean;
}

export interface DuplicateGroup {
  id: string;
  hash: string;
  displayName: string;
  kind: FileKind;
  sizePerFile: number;
  memberFiles: FileItem[];
  proposedKeepId: string;
  potentialSavings: number;
}

export type CleanupCategory =
  | 'installers'
  | 'downloads'
  | 'screenshots'
  | 'videos'
  | 'apps';

export interface CleanupSuggestion {
  category: CleanupCategory;
  title: string;
  description: string;
  iconName: string;
  eligibleFiles: FileItem[];
  totalPotentialSize: number;
  criteriaDescription: string;
}

export interface SavedSearch {
  id: string;
  title: string;
  query: string;
  createdAt: number;
}

export type ThemeMode = 'playful' | 'minimal' | 'system';

export type OSPlatform = 'mac' | 'windows';

export interface AppSettings {
  theme: ThemeMode;
  platform: OSPlatform;
  searchShortcut: string; // e.g. 'Cmd+K' on mac or 'Ctrl+K' on windows
  trayEnabled: boolean;
  ocrEnabled: boolean;
  autoCleanupEnabled: boolean; // strictly off by default
  confirmBeforeTrash: boolean;
}

export interface SearchInterpretationChip {
  id: string;
  type: 'kind' | 'date' | 'size' | 'source' | 'screenshot' | 'text';
  label: string;
  value: string;
}

export interface SearchFilters {
  query: string;
  kind?: FileKind | 'all';
  source?: SourceType | 'all';
  dateRange?: 'all' | 'today' | 'last_week' | 'last_month' | 'august' | 'older';
  sizeFilter?: 'all' | 'under_1mb' | '1mb_to_10mb' | 'over_5mb' | 'over_50mb' | 'over_100mb';
  isScreenshot?: boolean;
  sortBy: 'name' | 'date' | 'size' | 'kind';
  sortOrder: 'asc' | 'desc';
}

export type ActiveView =
  | { type: 'home' }
  | { type: 'recents' }
  | { type: 'category'; kind: FileKind }
  | { type: 'smart'; subview: 'large-files' | 'screenshots' }
  | { type: 'sources'; selectedSource?: SourceType }
  | { type: 'duplicates' }
  | { type: 'cleanup'; category?: CleanupCategory }
  | { type: 'search'; query: string }
  | { type: 'saved-search'; searchId: string }
  | { type: 'location'; locationId: string }
  | { type: 'settings' };
