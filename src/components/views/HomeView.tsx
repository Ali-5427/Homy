/**
 * Shelf Home / Library View
 * Exact visual specification:
 * - Quiet greeting & concise indexing scope
 * - Exactly six category shelves with folder-tab silhouettes
 * - Clean Up preview with non-double-counted potential space
 * - Downloaded From source cards
 * - Recently added files
 */

import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Trash2,
  DownloadCloud,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ActiveView, FileItem, FileKind, ThemeMode } from '../../types/shelf';
import { storageEngine } from '../../services/storage';
import { FolderShelf } from '../FolderShelf';
import { FileCard } from '../FileCard';

interface HomeViewProps {
  theme: ThemeMode;
  onNavigate: (view: ActiveView) => void;
  onSelectFile: (file: FileItem) => void;
  onQuickLook: (file: FileItem) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  theme,
  onNavigate,
  onSelectFile,
  onQuickLook,
}) => {
  const allFiles = storageEngine.getFiles(false);
  const summary = storageEngine.getLibrarySummary();
  const cleanupData = storageEngine.computeCleanupSuggestions();
  const sourcesData = storageEngine.getSourceBreakdown();

  const getKindFiles = (kind: FileKind) => allFiles.filter((f) => f.kind === kind);
  const recentFiles = [...allFiles].sort((a, b) => b.modifiedAt - a.modifiedAt).slice(0, 4);

  return (
    <div className="space-y-8 pb-12 select-none">
      {/* Page Title & Quiet Greeting */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[#202124]">
          Library
        </h1>
        <div className="flex items-center gap-2 text-xs text-[#747A84]">
          <span>
            {summary.count} files indexed across authorized locations
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

        {/* Responsive Grid: 4 columns on wide desktop, 2-3 on tablet/medium, 1 on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
          <FolderShelf
            kind="image"
            title="Images"
            files={getKindFiles('image')}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
          <FolderShelf
            kind="video"
            title="Videos"
            files={getKindFiles('video')}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
          <FolderShelf
            kind="audio"
            title="Music"
            files={getKindFiles('audio')}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
          <FolderShelf
            kind="document"
            title="Documents"
            files={getKindFiles('document')}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
          <FolderShelf
            kind="archive"
            title="Archives"
            files={getKindFiles('archive')}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
          <FolderShelf
            kind="app"
            title="Apps"
            files={getKindFiles('app')}
            theme={theme}
            onSelectCategory={(k) => onNavigate({ type: 'category', kind: k })}
            onSelectFile={onSelectFile}
          />
        </div>
      </section>

      {/* Clean Up Teaser Banner */}
      <section className="bg-white border border-[#E3E6EA] rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ECEEF1] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#202124]">
                Clean Up Suggestions
              </h2>
              <p className="text-xs text-[#747A84]">
                Review-first potential savings: ~
                <strong className="text-[#202124] font-mono tabular-nums">
                  {storageEngine.formatBytes(cleanupData.totalReclaimableBytes)}
                </strong>{' '}
                (estimates across 5 defined categories, not guaranteed savings)
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate({ type: 'cleanup' })}
            className="text-xs font-medium text-[#3478E8] hover:text-[#1A54B8] flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <span>Review Clean Up items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Suggestion Group Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {cleanupData.suggestions.map((suggestion) => (
            <div
              key={suggestion.category}
              onClick={() => onNavigate({ type: 'cleanup', category: suggestion.category })}
              className="bg-[#F8F9FB] hover:bg-[#F5F6F8] border border-[#E3E6EA] rounded-xl p-3 cursor-pointer transition-colors space-y-1"
            >
              <div className="text-xs font-semibold text-[#202124] truncate">
                {suggestion.title}
              </div>
              <div className="text-[11px] text-[#747A84] font-mono tabular-nums">
                {storageEngine.formatBytes(suggestion.totalPotentialSize)}
              </div>
              <div className="text-[10px] text-[#9AA0A6]">
                {suggestion.eligibleFiles.length} {suggestion.eligibleFiles.length === 1 ? 'candidate' : 'candidates'}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Downloaded From Source Overview */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DownloadCloud className="w-4 h-4 text-[#3478E8]" />
            <h2 className="text-sm font-semibold text-[#202124] tracking-tight">
              Downloaded From
            </h2>
          </div>
          <button
            onClick={() => onNavigate({ type: 'sources' })}
            className="text-xs text-[#747A84] hover:text-[#202124] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View all sources</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sourcesData.slice(0, 5).map((item) => (
            <div
              key={item.source}
              onClick={() => onNavigate({ type: 'sources', selectedSource: item.source })}
              className="bg-white border border-[#E3E6EA] hover:border-[#3478E8] rounded-xl p-3 cursor-pointer transition-colors shadow-2xs space-y-1"
            >
              <div className="text-xs font-semibold text-[#202124] truncate">
                {item.source}
              </div>
              <div className="text-[11px] text-[#747A84] font-mono tabular-nums">
                {item.count} files · {storageEngine.formatBytes(item.totalSize)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Added Files */}
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
    </div>
  );
};
