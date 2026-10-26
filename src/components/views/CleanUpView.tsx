/**
 * Den Clean Up View
 * Exactly five suggestion categories computed over real indexed files:
 * 1. Old installers
 * 2. Forgotten downloads
 * 3. Old screenshots
 * 4. Large old videos
 * 5. Unused apps
 * Review-first safety: check selection, inspect, and confirm before moving to OS Trash.
 */

import React, { useState, useEffect } from 'react';
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
  RefreshCw,
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
  const [suggestions, setSuggestions] = useState<CleanupSuggestion[]>([]);
  const [totalReclaimableBytes, setTotalReclaimableBytes] = useState(0);
  const [loading, setLoading] = useState(true);

  const trashName = platform === 'mac' ? 'Trash' : 'Recycle Bin';

  const loadCleanUpData = async () => {
    setLoading(true);
    try {
      const res = await storageEngine.queryFiles({ limit: 3000 });
      const activeFiles = res.items.filter((f) => !f.isTrashed);
      const now = Date.now();
      const DAY = 24 * 3600 * 1000;
      const seenCandidateIds = new Set<string>();

      const installerExts = ['dmg', 'pkg', 'exe', 'msi', 'iso'];
      const installers = activeFiles.filter((f) => {
        const isInstaller = installerExts.includes(f.extension.toLowerCase());
        const isOlderThan30Days = now - f.createdAt > 30 * DAY;
        return isInstaller && isOlderThan30Days;
      });

      const forgottenDownloads = activeFiles.filter((f) => {
        const inDownloads = f.locationPath.toLowerCase().includes('downloads');
        const isOlderThan60Days = now - f.createdAt > 60 * DAY;
        return inDownloads && isOlderThan60Days && !installerExts.includes(f.extension.toLowerCase());
      });

      const oldScreenshots = activeFiles.filter((f) => {
        return f.isScreenshot && now - f.createdAt > 30 * DAY;
      });

      const largeOldVideos = activeFiles.filter((f) => {
        return f.kind === 'video' && f.size > 100 * 1024 * 1024 && now - f.modifiedAt > 60 * DAY;
      });

      const unusedApps = activeFiles.filter((f) => {
        return f.kind === 'app' && now - f.modifiedAt > 60 * DAY;
      });

      const sugList: CleanupSuggestion[] = [
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
          description: 'Video recordings exceeding 100 MB that haven\'t been opened recently.',
          iconName: 'Film',
          eligibleFiles: largeOldVideos,
          totalPotentialSize: largeOldVideos.reduce((sum, f) => sum + f.size, 0),
          criteriaDescription: 'Videos > 100 MB modified > 60 days ago.',
        },
        {
          category: 'apps',
          title: 'Unused apps',
          description: 'Older application binaries taking up space.',
          iconName: 'AppWindow',
          eligibleFiles: unusedApps,
          totalPotentialSize: unusedApps.reduce((sum, f) => sum + f.size, 0),
          criteriaDescription: 'Application binaries unmodified for > 60 days.',
        },
      ];

      let reclaimable = 0;
      sugList.forEach((s) => {
        s.eligibleFiles.forEach((f) => {
          if (!seenCandidateIds.has(f.id)) {
            seenCandidateIds.add(f.id);
            reclaimable += f.size;
          }
        });
      });

      setSuggestions(sugList);
      setTotalReclaimableBytes(reclaimable);
    } catch (err) {
      console.warn('Failed to compute cleanup data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCleanUpData();
    return storageEngine.subscribe(loadCleanUpData);
  }, []);

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
    if (suggestion.eligibleFiles.length === 0) return;

    onRequestTrash(
      suggestion.eligibleFiles,
      `Move all ${suggestion.eligibleFiles.length} ${suggestion.title.toLowerCase()} to ${trashName}?`,
      `Review-first: all ${suggestion.eligibleFiles.length} candidate files will be moved to the OS ${trashName}.`
    );
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Header */}
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
            {activeCategory && currentSuggestion
              ? currentSuggestion.title
              : 'Clean Up Suggestions'}
          </h1>
        </div>

        <p className="text-xs text-[#747A84] mt-1 max-w-xl">
          {activeCategory && currentSuggestion
            ? currentSuggestion.criteriaDescription
            : 'Explore review-first candidates across 5 defined categories. Files are only moved to OS Trash after your explicit confirmation.'}
        </p>
      </div>

      {/* Overview Banner (When on main category list) */}
      {!activeCategory && (
        <div className="bg-white border border-[#E3E6EA] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[#202124]">
                Potential Space Reclaim
              </div>
              <div className="text-xs text-[#747A84]">
                Estimated total:{' '}
                <strong className="text-[#202124] font-mono tabular-nums">
                  {storageEngine.formatBytes(totalReclaimableBytes)}
                </strong>{' '}
                (non-overlapping deduplicated estimate)
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-[#F3FAF6] border border-[#CEEFE0] px-3 py-1 rounded-lg self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4" />
            <span>Review-First Safety Guarantee</span>
          </div>
        </div>
      )}

      {/* Main Grid: 5 Suggestion Categories */}
      {!activeCategory ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestions.map((suggestion) => {
            const hasFiles = suggestion.eligibleFiles.length > 0;
            return (
              <div
                key={suggestion.category}
                onClick={() => hasFiles && setActiveCategory(suggestion.category)}
                className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all shadow-2xs ${
                  hasFiles
                    ? 'border-[#E3E6EA] hover:border-[#3478E8] hover:shadow-xs cursor-pointer'
                    : 'border-[#ECEEF1] opacity-60 cursor-default'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-[#F8F9FB] border border-[#E3E6EA]">
                      {getCategoryIcon(suggestion.category)}
                    </div>
                    <span className="text-xs font-mono font-medium text-[#747A84] bg-[#F8F9FB] border border-[#ECEEF1] px-2 py-0.5 rounded-md">
                      {storageEngine.formatBytes(suggestion.totalPotentialSize)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#202124]">
                      {suggestion.title}
                    </h3>
                    <p className="text-xs text-[#747A84] mt-1 leading-relaxed">
                      {suggestion.description}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-[#ECEEF1] flex items-center justify-between text-xs">
                  <span className="text-[#747A84]">
                    {suggestion.eligibleFiles.length}{' '}
                    {suggestion.eligibleFiles.length === 1 ? 'candidate' : 'candidates'}
                  </span>

                  {hasFiles ? (
                    <span className="text-[#3478E8] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-[#9AA0A6]">Clean</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Detailed Candidate Review View for Single Category */
        currentSuggestion && (
          <div className="space-y-4">
            {/* Category Action Bar */}
            <div className="bg-white border border-[#E3E6EA] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleSelectAll(currentSuggestion.eligibleFiles)}
                  className="flex items-center gap-2 text-xs font-medium text-[#202124] hover:text-[#3478E8] cursor-pointer"
                >
                  {selectedFileIds.size === currentSuggestion.eligibleFiles.length ? (
                    <CheckSquare className="w-4 h-4 text-[#3478E8]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#747A84]" />
                  )}
                  <span>
                    {selectedFileIds.size === currentSuggestion.eligibleFiles.length
                      ? 'Deselect All'
                      : 'Select All'}
                  </span>
                </button>

                <span className="text-xs text-[#747A84]">
                  ({selectedFileIds.size} of {currentSuggestion.eligibleFiles.length} selected)
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
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
                  Move All ({currentSuggestion.eligibleFiles.length})
                </button>
              </div>
            </div>

            {/* Candidate Files List */}
            {currentSuggestion.eligibleFiles.length > 0 ? (
              <div className="divide-y divide-[#ECEEF1] border border-[#ECEEF1] rounded-2xl bg-white overflow-hidden shadow-2xs">
                {currentSuggestion.eligibleFiles.map((file) => {
                  const isChecked = selectedFileIds.has(file.id);

                  return (
                    <div
                      key={file.id}
                      onClick={() => onSelectFile(file)}
                      className={`p-3.5 px-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#FFF8F8]' : 'hover:bg-[#F8F9FB]'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectOne(file.id);
                          }}
                          className="text-[#747A84] hover:text-[#202124] cursor-pointer"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-red-600" />
                          ) : (
                            <Square className="w-4 h-4" />
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
                            {file.locationPath}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-xs font-mono tabular-nums text-[#5F6368]">
                          {storageEngine.formatBytes(file.size)}
                        </span>
                        <span className="text-[11px] text-[#747A84] hidden md:inline">
                          Created {storageEngine.formatDate(file.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center bg-white border border-[#E3E6EA] rounded-2xl space-y-2">
                <p className="text-sm font-semibold text-[#202124]">No candidates found</p>
                <p className="text-xs text-[#747A84]">
                  This category is currently clean based on defined age and criteria thresholds.
                </p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};
