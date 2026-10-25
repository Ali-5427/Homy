/**
 * Shelf Category & Recents Browser View
 * Supports grid/list switch, sorting (Name, Date, Size, Kind),
 * filter bars, and keyboard accessibility.
 */

import React, { useState } from 'react';
import {
  LayoutGrid,
  List,
  ArrowUpDown,
  Filter,
  Eye,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';
import { FileItem, FileKind } from '../../types/shelf';
import { storageEngine } from '../../services/storage';
import { FileCard } from '../FileCard';
import { osAdapter } from '../../services/osAdapter';

interface CategoryViewProps {
  title: string;
  kind?: FileKind;
  files: FileItem[];
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem) => void;
  onQuickLook: (file: FileItem) => void;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  title,
  kind,
  files,
  selectedFile,
  onSelectFile,
  onQuickLook,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size' | 'kind'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sizeFilter, setSizeFilter] = useState<'all' | 'large' | 'small'>('all');

  // Filter & Sort
  const processedFiles = [...files]
    .filter((f) => {
      if (sizeFilter === 'large') return f.size > 20 * 1024 * 1024;
      if (sizeFilter === 'small') return f.size <= 2 * 1024 * 1024;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.displayName.localeCompare(b.displayName);
      else if (sortBy === 'date') cmp = a.modifiedAt - b.modifiedAt;
      else if (sortBy === 'size') cmp = a.size - b.size;
      else if (sortBy === 'kind') cmp = a.kind.localeCompare(b.kind);

      return sortOrder === 'asc' ? cmp : -cmp;
    });

  const totalBytes = processedFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Header: Title, Counts, and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#ECEEF1] pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#202124]">
            {title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-[#747A84] mt-0.5">
            <span className="tabular-nums font-medium text-[#202124]">
              {processedFiles.length} {processedFiles.length === 1 ? 'file' : 'files'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{storageEngine.formatBytes(totalBytes)}</span>
            <span aria-hidden="true">·</span>
            <span>Local authorized locations</span>
          </div>
        </div>

        {/* Action Controls: Grid/List Toggle & Sort Dropdown */}
        <div className="flex items-center gap-2">
          {/* Size Filter Control */}
          <div className="flex items-center gap-1 p-0.5 bg-[#F5F6F8] rounded-lg border border-[#E3E6EA]">
            <button
              onClick={() => setSizeFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                sizeFilter === 'all'
                  ? 'bg-white text-[#202124] shadow-2xs'
                  : 'text-[#747A84] hover:text-[#202124]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSizeFilter('large')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                sizeFilter === 'large'
                  ? 'bg-white text-[#202124] shadow-2xs'
                  : 'text-[#747A84] hover:text-[#202124]'
              }`}
            >
              &gt; 20 MB
            </button>
            <button
              onClick={() => setSizeFilter('small')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                sizeFilter === 'small'
                  ? 'bg-white text-[#202124] shadow-2xs'
                  : 'text-[#747A84] hover:text-[#202124]'
              }`}
            >
              &le; 2 MB
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-[#F5F6F8] border border-[#E3E6EA] rounded-lg px-2 py-1 text-xs text-[#5F6368]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#747A84]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size' | 'kind')}
              className="bg-transparent text-xs font-medium text-[#202124] outline-none cursor-pointer"
            >
              <option value="date">Date</option>
              <option value="name">Name</option>
              <option value="size">Size</option>
              <option value="kind">Kind</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-1 text-[11px] font-mono hover:text-[#202124] cursor-pointer"
              title="Toggle sort order"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Grid / List Mode */}
          <div className="flex items-center p-0.5 bg-[#F5F6F8] rounded-lg border border-[#E3E6EA]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#202124] shadow-2xs'
                  : 'text-[#747A84] hover:text-[#202124]'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-[#202124] shadow-2xs'
                  : 'text-[#747A84] hover:text-[#202124]'
              }`}
              title="List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {processedFiles.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {processedFiles.map((file) => (
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
          /* List Mode */
          <div className="bg-white border border-[#E3E6EA] rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#ECEEF1] bg-[#F8F9FB] text-[#747A84] font-medium">
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-3">Kind</th>
                  <th className="py-2.5 px-3 text-right">Size</th>
                  <th className="py-2.5 px-3">Date Modified</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF1]">
                {processedFiles.map((file) => {
                  const isSelected = selectedFile?.id === file.id;
                  return (
                    <tr
                      key={file.id}
                      onClick={() => onSelectFile(file)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#EBF3FF] font-medium'
                          : 'hover:bg-[#F5F6F8] text-[#202124]'
                      }`}
                    >
                      <td className="py-2.5 px-4 flex items-center gap-2.5 truncate max-w-xs">
                        <div className="w-6 h-6 rounded bg-[#F5F6F8] border border-[#E3E6EA] flex items-center justify-center shrink-0">
                          {file.previewUrl ? (
                            <img
                              src={file.previewUrl}
                              alt={file.displayName}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <span className="text-[9px] font-mono font-bold uppercase text-[#747A84]">
                              {file.extension}
                            </span>
                          )}
                        </div>
                        <span className="truncate">{file.displayName}</span>
                      </td>
                      <td className="py-2.5 px-3 capitalize text-[#747A84]">{file.kind}</td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#5F6368]">
                        {storageEngine.formatBytes(file.size)}
                      </td>
                      <td className="py-2.5 px-3 text-[#747A84]">
                        {storageEngine.formatDate(file.modifiedAt)}
                      </td>
                      <td className="py-2.5 px-3 text-[#747A84] font-mono text-[11px] truncate max-w-[140px]">
                        {file.locationPath}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickLook(file);
                            }}
                            title="Quick Look (Space)"
                            className="p-1 text-[#747A84] hover:text-[#202124] rounded cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              osAdapter.openFile(file);
                            }}
                            title="Open in default app"
                            className="p-1 text-[#747A84] hover:text-[#202124] rounded cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="p-12 text-center bg-white border border-[#E3E6EA] rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-[#202124]">No files found</p>
          <p className="text-xs text-[#747A84]">
            No files in this category match the current filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};
