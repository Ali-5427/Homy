/**
 * Den Search Results View
 * Clean, modern search view with:
 * - Query title and accurate match count
 * - Removable interpretation chips
 * - Compact filter row & save search
 */

import React, { useState } from 'react';
import {
  Bookmark,
  Check,
  Search,
} from 'lucide-react';
import { FileItem, SearchInterpretationChip, SearchFilters } from '../../types/shelf';
import { storageEngine } from '../../services/storage';
import { FileCard } from '../FileCard';

interface SearchResultsViewProps {
  rawQuery: string;
  chips: SearchInterpretationChip[];
  filters: SearchFilters;
  filteredFiles: FileItem[];
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem) => void;
  onQuickLook: (file: FileItem) => void;
  onRemoveChip: (chipId: string) => void;
  onSaveSearch: (title: string, query: string) => void;
  onClearSearch: () => void;
  isLiteralFallback: boolean;
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  rawQuery,
  chips,
  filters,
  filteredFiles,
  selectedFile,
  onSelectFile,
  onQuickLook,
  onRemoveChip,
  onSaveSearch,
  onClearSearch,
}) => {
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveSearch = () => {
    const title = rawQuery.length > 28 ? `${rawQuery.slice(0, 25)}...` : rawQuery;
    onSaveSearch(title, rawQuery);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const totalBytes = filteredFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEEF1] dark:border-[#282C34] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#3478E8]" />
            <h1 className="text-xl font-semibold text-[#202124] dark:text-[#F3F4F6]">
              Results for &ldquo;{rawQuery}&rdquo;
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#747A84] dark:text-[#9CA3AF] mt-1">
            <span className="font-medium text-[#202124] dark:text-[#F3F4F6] tabular-nums">
              {filteredFiles.length} {filteredFiles.length === 1 ? 'match' : 'matches'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{storageEngine.formatBytes(totalBytes)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveSearch}
            className="flex items-center gap-1.5 text-xs font-medium text-[#5F6368] dark:text-[#9CA3AF] hover:text-[#202124] dark:hover:text-[#F3F4F6] bg-white dark:bg-[#1F2228] border border-[#E3E6EA] dark:border-[#282C34] hover:border-[#3478E8] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 dark:text-emerald-400">Saved to Sidebar</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-[#747A84]" />
                <span>Save Search</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Understood As Chips Row */}
      {chips.length > 0 && (
        <div className="flex items-center flex-wrap gap-2 pt-1">
          <span className="text-xs text-[#747A84] dark:text-[#9CA3AF]">Filters:</span>
          {chips.map((chip) => (
            <span
              key={chip.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#1F2228] border border-[#E3E6EA] dark:border-[#282C34] text-xs font-medium text-[#202124] dark:text-[#F3F4F6] rounded-md shadow-2xs"
            >
              <span>{chip.label}</span>
              <button
                onClick={() => onRemoveChip(chip.id)}
                className="text-[#9AA0A6] hover:text-[#202124] dark:hover:text-[#F3F4F6] cursor-pointer"
                title="Remove filter"
              >
                &times;
              </button>
            </span>
          ))}
          <button
            onClick={onClearSearch}
            className="text-xs text-[#3478E8] hover:underline cursor-pointer ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Results Grid */}
      {filteredFiles.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              isSelected={selectedFile?.id === file.id}
              onSelect={onSelectFile}
              onQuickLook={onQuickLook}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#17191E] border border-[#E3E6EA] dark:border-[#282C34] rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-[#202124] dark:text-[#F3F4F6]">No matching files</p>
          <p className="text-xs text-[#747A84] dark:text-[#9CA3AF]">
            Try searching with a different filename, extension, or date range.
          </p>
        </div>
      )}
    </div>
  );
};
