/**
 * Den Search Results View
 * Renders deterministic natural language parsed results with:
 * - Query title and accurate match count
 * - "Understood as" removable chips
 * - Single compact filter row
 * - Save Search bookmarking
 * - Literal fallback explanations
 */

import React, { useState } from 'react';
import {
  X,
  Bookmark,
  Sparkles,
  Filter,
  Check,
  Search,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { FileItem, SearchInterpretationChip, SearchFilters, FileKind, SourceType } from '../../types/shelf';
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
  isLiteralFallback,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ECEEF1] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-[#3478E8]" />
            <h1 className="text-xl font-semibold text-[#202124]">
              Results for &ldquo;{rawQuery}&rdquo;
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#747A84] mt-1">
            <span className="font-medium text-[#202124] tabular-nums">
              {filteredFiles.length} {filteredFiles.length === 1 ? 'match' : 'matches'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{storageEngine.formatBytes(totalBytes)}</span>
            <span aria-hidden="true">·</span>
            <span>Deterministic on-device matching</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveSearch}
            className="flex items-center gap-1.5 text-xs font-medium text-[#5F6368] hover:text-[#202124] bg-white border border-[#E3E6EA] hover:border-[#3478E8] px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
          >
            {savedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Saved to Sidebar</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-[#747A84]" />
                <span>Save Search</span>
              </>
            )}
          </button>

          <button
            onClick={onClearSearch}
            className="text-xs text-[#747A84] hover:text-[#202124] px-2 py-1.5 cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* "Understood as" Interpretation Strip */}
      <div className="bg-[#F8F9FB] border border-[#E3E6EA] rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-[#5F6368] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#3478E8]" />
            <span>Understood as:</span>
          </div>
          <span className="text-[11px] text-[#9AA0A6]">Click × on any chip to remove constraint</span>
        </div>

        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <span
                key={chip.id}
                className="inline-flex items-center gap-1.5 bg-white text-[#202124] text-xs font-medium px-2.5 py-1 rounded-lg border border-[#E3E6EA] shadow-2xs"
              >
                <span>{chip.label}</span>
                <button
                  onClick={() => onRemoveChip(chip.id)}
                  title={`Remove ${chip.label}`}
                  className="text-[#9AA0A6] hover:text-red-600 transition-colors cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[#747A84] italic">
            Literal text match active for &ldquo;{rawQuery}&rdquo;.
          </div>
        )}

        {/* Quiet Literal Fallback Status Note */}
        {isLiteralFallback && (
          <div className="pt-1 text-[11px] text-[#747A84] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#9AA0A6]" />
            <span>
              Searching literal filename, text, or location matching &ldquo;{rawQuery}&rdquo; without interpretation filters.
            </span>
          </div>
        )}
      </div>

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
        <div className="p-12 text-center bg-white border border-[#E3E6EA] rounded-2xl space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#F5F6F8] flex items-center justify-center mx-auto text-[#747A84]">
            <Search className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-[#202124]">No matching files</p>
          <p className="text-xs text-[#747A84] max-w-md mx-auto">
            Den searched only authorized locations for &ldquo;{rawQuery}&rdquo;. Try removing some chips or checking your authorized folders in Settings.
          </p>
          <button
            onClick={onClearSearch}
            className="px-4 py-2 text-xs font-medium text-[#3478E8] bg-[#F5F6F8] hover:bg-[#ECEEF1] rounded-lg transition-colors cursor-pointer"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};
