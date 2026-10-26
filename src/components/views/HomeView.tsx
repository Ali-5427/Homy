/**
 * Den Home / Library View
 * Clean visual specification:
 * - Quiet greeting & real indexing scope
 * - First-run onboarding CTA if no folders are indexed
 * - Six category shelves with folder-tab silhouettes
 * - Clean Up preview
 * - Recently added files from real indexed disk
 */

import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Trash2,
  FolderPlus,
  Clock,
  Layers,
} from 'lucide-react';
import { ActiveView, FileItem, FileKind, ThemeMode } from '../../types/shelf';
import { storageEngine } from '../../services/storage';
import { FolderDen } from '../FolderDen';
import { FileCard } from '../FileCard';

interface HomeViewProps {
  theme: ThemeMode;
  onNavigate: (view: ActiveView) => void;
  onSelectFile: (file: FileItem) => void;
  onQuickLook: (file: FileItem) => void;
  onAddFolder: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  theme,
  onNavigate,
  onSelectFile,
  onQuickLook,
  onAddFolder,
}) => {
  const [summary, setSummary] = useState({
    count: 0,
    totalBytes: 0,
    formattedSize: '0 B',
    kindCounts: { image: 0, video: 0, audio: 0, document: 0, archive: 0, app: 0 },
  });
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [kindSamples, setKindSamples] = useState<Record<FileKind, FileItem[]>>({
    image: [],
    video: [],
    audio: [],
    document: [],
    archive: [],
    app: [],
  });
  const [loading, setLoading] = useState(true);

  const locations = storageEngine.getLocations();

  const loadData = async () => {
    try {
      const sum = await storageEngine.getLibrarySummary();
      setSummary(sum);

      // Load 4 recent files
      const recentRes = await storageEngine.queryFiles({
        limit: 4,
        sortBy: 'modifiedAt',
        sortOrder: 'desc',
      });
      setRecentFiles(recentRes.items);

      // Load up to 4 sample items per kind for the shelves
      const kinds: FileKind[] = ['image', 'video', 'audio', 'document', 'archive', 'app'];
      const samples: Record<FileKind, FileItem[]> = {
        image: [],
        video: [],
        audio: [],
        document: [],
        archive: [],
        app: [],
      };

      for (const k of kinds) {
        const res = await storageEngine.queryFiles({ kind: k, limit: 4 });
        samples[k] = res.items;
      }
      setKindSamples(samples);
    } catch (e) {
      console.warn('Failed to load library home data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    return storageEngine.subscribe(loadData);
  }, []);

  const isLibraryEmpty = summary.count === 0 && locations.length === 0;

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Page Title & Quiet Greeting */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#202124]">
          Library
        </h1>
        <div className="flex items-center gap-2 text-xs text-[#747A84]">
          <span>
            {summary.count} files indexed across {locations.length} authorized locations
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">{summary.formattedSize}</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-700 flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            100% On-Device
          </span>
        </div>
      </div>

      {/* First Run Clean Onboarding CTA if library is empty */}
      {isLibraryEmpty && !loading && (
        <section className="bg-white border border-[#E3E6EA] rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-sm my-6">
          <div className="w-12 h-12 bg-[#EBF3FF] text-[#3478E8] rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[#202124]">
              Start by indexing your first local folder
            </h2>
            <p className="text-xs text-[#747A84] max-w-md mx-auto">
              Den never uploads your files or content. Select a folder (like Downloads or Documents) to build a fast, private, on-device catalog.
            </p>
          </div>
          <div>
            <button
              onClick={onAddFolder}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3478E8] hover:bg-[#2563EB] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Authorize &amp; Index Folder</span>
            </button>
          </div>
        </section>
      )}

      {/* Six Category Shelves Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#202124] tracking-tight">
            Category Shelves
          </h2>
          <span className="text-xs text-[#747A84]">
            Visual recognition across 6 file kinds
          </span>
        </div>

        {/* Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          <FolderDen
            kind="image"
            title="Images"
            files={kindSamples.image}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
          <FolderDen
            kind="video"
            title="Videos"
            files={kindSamples.video}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
          <FolderDen
            kind="audio"
            title="Music"
            files={kindSamples.audio}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
          <FolderDen
            kind="document"
            title="Documents"
            files={kindSamples.document}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
          <FolderDen
            kind="archive"
            title="Archives"
            files={kindSamples.archive}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
          <FolderDen
            kind="app"
            title="Apps"
            files={kindSamples.app}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
        </div>
      </section>

      {/* Recently Added Files */}
      {recentFiles.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#5F6368]" />
              <h2 className="text-sm font-semibold text-[#202124] tracking-tight">
                Recently Added Files
              </h2>
            </div>
            <button
              onClick={() => onNavigate({ type: 'recents' })}
              className="text-xs text-[#747A84] hover:text-[#202124] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Browse Recents</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onSelect={onSelectFile}
                onQuickLook={onQuickLook}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
