/**
 * Shelf Clean Up View
 * Exactly five suggestion categories:
 * 1. Old installers
 * 2. Forgotten downloads
 * 3. Old screenshots
 * 4. Large old videos
 * 5. Unused apps
 * Review-first safety: check selection, inspect, and confirm before moving to OS Trash.
 */

import React, { useState } from 'react';
import {
  Trash2,
  Package,
  FolderDown,
  Camera,
  Film,
  AppWindow,
  ArrowRight,
  ArrowLeft,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { CleanupCategory, CleanupSuggestion, FileItem, OSPlatform } from '../../types/shelf';
import { storageEngine } from '../../services/storage';

interface CleanUpViewProps {
  initialCategory?: CleanupCategory;
  platform: OSPlatform;
  onRequestTrash: (files: FileItem[], title: string, desc: string) => void;
  onSelectFile: (file: FileItem) => void;
  onQuickLook: (file: FileItem) => void;
}

export const CleanUpView: React.FC<CleanUpViewProps> = ({
  initialCategory,
  platform,
  onRequestTrash,
  onSelectFile,
  onQuickLook,
}) => {
  const [activeCategory, setActiveCategory] = useState<CleanupCategory | null>(
    initialCategory || null
  );
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());

  const { suggestions, totalReclaimableBytes } = storageEngine.computeCleanupSuggestions();
  const trashName = platform === 'mac' ? 'Trash' : 'Recycle Bin';

  const currentSuggestion = activeCategory
    ? suggestions.find((s) => s.category === activeCategory)
    : null;

  const getCategoryIcon = (cat: CleanupCategory) => {
    switch (cat) {
      case 'installers':
        return <Package className="w-5 h-5 text-pink-600" />;
      case 'downloads':
        return <FolderDown className="w-5 h-5 text-blue-600" />;
      case 'screenshots':
        return <Camera className="w-5 h-5 text-indigo-600" />;
      case 'videos':
        return <Film className="w-5 h-5 text-amber-600" />;
      case 'apps':
        return <AppWindow className="w-5 h-5 text-purple-600" />;
    }
  };

  const toggleSelectAll = (files: FileItem[]) => {
    if (selectedFileIds.size === files.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(files.map((f) => f.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedFileIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleTrashSelected = (eligibleFiles: FileItem[]) => {
    const selectedFiles = eligibleFiles.filter((f) => selectedFileIds.has(f.id));
    if (selectedFiles.length === 0) return;

    onRequestTrash(
      selectedFiles,
      `Move ${selectedFiles.length} selected candidate${selectedFiles.length > 1 ? 's' : ''} to ${trashName}?`,
      `These items will be moved to your local OS ${trashName}. You can review and restore them at any time.`
    );
  };

  const handleTrashAllInGroup = (suggestion: CleanupSuggestion) => {
    onRequestTrash(
      suggestion.eligibleFiles,
      `Move all ${suggestion.eligibleFiles.length} items in "${suggestion.title}" to ${trashName}?`,
      `This applies strictly to the ${suggestion.eligibleFiles.length} files reviewed in this category. Files are moved to OS ${trashName}, never permanently deleted.`
    );
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          {activeCategory && (
            <button
              onClick={() => {
                setActiveCategory(null);
                setSelectedFileIds(new Set());
              }}
              className="mr-1 p-1 text-[#747A84] hover:text-[#202124] hover:bg-[#F5F6F8] rounded-md transition-colors cursor-pointer"
              title="Back to all cleanup categories"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Trash2 className="w-5 h-5 text-red-600" />
          <h1 className="text-2xl font-semibold tracking-tight text-[#202124]">
            {activeCategory && currentSuggestion ? currentSuggestion.title : 'Clean Up Storage'}
          </h1>
        </div>

        <p className="text-xs text-[#747A84] mt-1 max-w-2xl">
          {activeCategory && currentSuggestion
            ? currentSuggestion.description
            : 'Review storage candidates across five defined rules. Nothing is ever moved or deleted without your explicit confirmation.'}
        </p>
      </div>

      {/* Main View: 5 Cards Overview OR Category Review List */}
      {!activeCategory ? (
        <div className="space-y-6">
          {/* Summary Metric Banner */}
          <div className="bg-white border border-[#E3E6EA] rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-[#747A84] uppercase tracking-wide">
                Total Potential Reclaimable Storage
              </span>
              <div className="text-3xl font-bold font-mono tracking-tight text-[#202124]">
                ~{storageEngine.formatBytes(totalReclaimableBytes)}
              </div>
              <p className="text-xs text-[#747A84]">
                Calculated across eligible files in your authorized folders without double-counting.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-[#F3FAF6] border border-[#CEEFE0] px-3 py-2 rounded-xl">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Review-first guarantee: No autonomous deletion</span>
            </div>
          </div>

          {/* Exactly 5 Suggestion Category Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.category}
                onClick={() => {
                  setActiveCategory(suggestion.category);
                  setSelectedFileIds(new Set(suggestion.eligibleFiles.map((f) => f.id)));
                }}
                className="bg-white border border-[#E3E6EA] hover:border-[#3478E8] rounded-2xl p-5 cursor-pointer transition-all hover:shadow-2xs space-y-3 group"
              >
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#F8F9FB] border border-[#ECEEF1] flex items-center justify-center">
                    {getCategoryIcon(suggestion.category)}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#747A84] group-hover:translate-x-1 transition-transform" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-[#202124] group-hover:text-[#3478E8] transition-colors">
                    {suggestion.title}
                  </h3>
                  <p className="text-xs text-[#747A84] mt-1 line-clamp-2">
                    {suggestion.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-[#ECEEF1] flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-[#202124]">
                    {storageEngine.formatBytes(suggestion.totalPotentialSize)}
                  </span>
                  <span className="text-[11px] text-[#747A84]">
                    {suggestion.eligibleFiles.length} {suggestion.eligibleFiles.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Detailed Category Review List */
        currentSuggestion && (
          <div className="space-y-4">
            {/* Criteria Banner */}
            <div className="bg-[#F8F9FB] border border-[#E3E6EA] rounded-xl p-3.5 flex items-center justify-between gap-4">
              <div className="text-xs text-[#5F6368]">
                <strong>Rule Criteria:</strong> {currentSuggestion.criteriaDescription}
              </div>
              <span className="text-xs font-mono font-medium text-[#202124] shrink-0">
                {currentSuggestion.eligibleFiles.length} items (
                {storageEngine.formatBytes(currentSuggestion.totalPotentialSize)})
              </span>
            </div>

            {/* Bulk Action Controls */}
            {currentSuggestion.eligibleFiles.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-[#E3E6EA] rounded-xl p-3 px-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSelectAll(currentSuggestion.eligibleFiles)}
                    className="flex items-center gap-1.5 text-xs text-[#5F6368] hover:text-[#202124] font-medium cursor-pointer"
                  >
                    {selectedFileIds.size === currentSuggestion.eligibleFiles.length ? (
                      <CheckSquare className="w-4 h-4 text-[#3478E8]" />
                    ) : (
                      <Square className="w-4 h-4 text-[#9AA0A6]" />
                    )}
                    <span>
                      {selectedFileIds.size === currentSuggestion.eligibleFiles.length
                        ? 'Deselect All'
                        : `Select All (${currentSuggestion.eligibleFiles.length})`}
                    </span>
                  </button>

                  <span className="text-[#ECEEF1]" aria-hidden="true">|</span>

                  <span className="text-xs text-[#747A84]">
                    {selectedFileIds.size} of {currentSuggestion.eligibleFiles.length} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTrashSelected(currentSuggestion.eligibleFiles)}
                    disabled={selectedFileIds.size === 0}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Move Selected to {trashName}</span>
                  </button>

                  <button
                    onClick={() => handleTrashAllInGroup(currentSuggestion)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <span>Move All in Group to {trashName}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Review Candidate Rows */}
            {currentSuggestion.eligibleFiles.length > 0 ? (
              <div className="bg-white border border-[#E3E6EA] rounded-xl overflow-hidden shadow-2xs divide-y divide-[#ECEEF1]">
                {currentSuggestion.eligibleFiles.map((file) => {
                  const isChecked = selectedFileIds.has(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleSelectOne(file.id)}
                      className={`p-3 px-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#FFF9F9]' : 'hover:bg-[#F5F6F8]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate flex-1 mr-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(file.id);
                          }}
                          className="text-[#3478E8] cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-red-600" />
                          ) : (
                            <Square className="w-4 h-4 text-[#9AA0A6]" />
                          )}
                        </button>

                        <div className="w-8 h-8 rounded-lg bg-[#F5F6F8] border border-[#E3E6EA] overflow-hidden flex items-center justify-center shrink-0">
                          {file.previewUrl ? (
                            <img
                              src={file.previewUrl}
                              alt={file.displayName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] font-mono font-bold uppercase text-[#747A84]">
                              {file.extension}
                            </span>
                          )}
                        </div>

                        <div className="truncate">
                          <div className="text-xs font-medium text-[#202124] truncate">
                            {file.displayName}
                          </div>
                          <div className="text-[10px] text-[#747A84] font-mono truncate" title={file.locationPath}>
                            {file.locationPath} · Modified {storageEngine.formatDate(file.modifiedAt)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono tabular-nums text-[#202124] font-medium">
                          {storageEngine.formatBytes(file.size)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFile(file);
                          }}
                          className="text-xs text-[#3478E8] hover:underline cursor-pointer"
                        >
                          Inspect
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white border border-[#E3E6EA] rounded-2xl space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-sm font-semibold text-[#202124]">Category is clean</p>
                <p className="text-xs text-[#747A84]">
                  No items match the cleanup criteria for this category.
                </p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
