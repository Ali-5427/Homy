/**
 * Shelf Signature Motif: Folder-shaped visual shelf
 * Features an authentic folder tab silhouette, category-tinted surface,
 * layered thumbnail previews, item count, and storage size.
 */

import React from 'react';
import { ArrowRight, FileText, Image, Video, Music, Archive, Layers } from 'lucide-react';
import { FileItem, FileKind, ThemeMode } from '../types/shelf';
import { storageEngine } from '../services/storage';

interface FolderShelfProps {
  kind: FileKind;
  title: string;
  files: FileItem[];
  theme: ThemeMode;
  onSelectCategory: (kind: FileKind) => void;
  onSelectFile: (file: FileItem) => void;
}

export const FolderShelf: React.FC<FolderShelfProps> = ({
  kind,
  title,
  files,
  theme,
  onSelectCategory,
  onSelectFile,
}) => {
  const count = files.length;
  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const formattedSize = storageEngine.formatBytes(totalBytes);

  // Playful Category Palettes vs Minimal Palettes
  const getThemePalette = () => {
    if (theme === 'minimal') {
      return {
        tabBg: 'bg-[#F5F6F8]',
        tabBorder: 'border-[#E3E6EA]',
        shelfBg: 'bg-[#FFFFFF]',
        borderColor: 'border-[#E3E6EA]',
        accent: 'text-[#202124]',
      };
    }

    switch (kind) {
      case 'image':
        return {
          tabBg: 'bg-[#EEE9FF]',
          tabBorder: 'border-[#D9D0FA]',
          shelfBg: 'bg-[#F9F7FF]',
          borderColor: 'border-[#E2DCF7]',
          accent: 'text-indigo-600',
        };
      case 'video':
        return {
          tabBg: 'bg-[#DDEBFF]',
          tabBorder: 'border-[#C2DCFF]',
          shelfBg: 'bg-[#F4F8FF]',
          borderColor: 'border-[#CCE2FF]',
          accent: 'text-blue-600',
        };
      case 'audio':
        return {
          tabBg: 'bg-[#FFE8DC]',
          tabBorder: 'border-[#FED4C0]',
          shelfBg: 'bg-[#FFF7F2]',
          borderColor: 'border-[#FEDECF]',
          accent: 'text-amber-700',
        };
      case 'document':
        return {
          tabBg: 'bg-[#DDF3E9]',
          tabBorder: 'border-[#C2E8D7]',
          shelfBg: 'bg-[#F3FAF6]',
          borderColor: 'border-[#CEEFE0]',
          accent: 'text-emerald-700',
        };
      case 'archive':
        return {
          tabBg: 'bg-[#FFF0C8]',
          tabBorder: 'border-[#FFE39E]',
          shelfBg: 'bg-[#FFFBF2]',
          borderColor: 'border-[#FFE9B7]',
          accent: 'text-yellow-700',
        };
      case 'app':
        return {
          tabBg: 'bg-[#F8E2EE]',
          tabBorder: 'border-[#F1C7E0]',
          shelfBg: 'bg-[#FDF6FA]',
          borderColor: 'border-[#F7D7EB]',
          accent: 'text-pink-700',
        };
    }
  };

  const palette = getThemePalette();

  const getKindIcon = () => {
    switch (kind) {
      case 'image':
        return <Image className="w-4 h-4 text-indigo-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-blue-600" />;
      case 'audio':
        return <Music className="w-4 h-4 text-amber-600" />;
      case 'document':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'archive':
        return <Archive className="w-4 h-4 text-yellow-600" />;
      case 'app':
        return <Layers className="w-4 h-4 text-pink-600" />;
    }
  };

  const previewSlice = files.slice(0, 3);

  return (
    <div className="flex flex-col group transition-transform duration-150">
      {/* Folder Tab Header */}
      <div className="flex items-center justify-between">
        <div
          onClick={() => onSelectCategory(kind)}
          className={`px-3.5 py-1.5 rounded-t-xl border-t border-x ${palette.tabBorder} ${palette.tabBg} flex items-center gap-2 cursor-pointer shadow-2xs select-none`}
        >
          {getKindIcon()}
          <span className="text-xs font-semibold text-[#202124]">{title}</span>
          <span className="text-[11px] text-[#747A84] tabular-nums font-mono">({count})</span>
        </div>

        <button
          onClick={() => onSelectCategory(kind)}
          className="text-[11px] text-[#747A84] hover:text-[#202124] flex items-center gap-1 transition-colors px-2 py-1 cursor-pointer select-none"
        >
          <span>Browse all</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Main Shelf Body with layered file preview stages */}
      <div
        className={`w-full rounded-b-xl rounded-tr-xl border ${palette.borderColor} ${palette.shelfBg} p-3.5 flex flex-col justify-between min-h-[170px] shadow-2xs transition-shadow hover:shadow-xs`}
      >
        {/* Layered Previews Container */}
        {previewSlice.length > 0 ? (
          <div className="relative h-24 w-full flex items-center justify-center my-1">
            {previewSlice.map((file, idx) => {
              // Create subtle tiered stacking offset
              const rotation = idx === 0 ? '-rotate-3' : idx === 1 ? 'rotate-2' : 'rotate-0';
              const zIndex = idx === 0 ? 'z-10' : idx === 1 ? 'z-20' : 'z-30';
              const translateX = idx === 0 ? '-translate-x-6' : idx === 1 ? 'translate-x-6' : 'translate-x-0';

              return (
                <div
                  key={file.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFile(file);
                  }}
                  className={`absolute w-32 h-20 bg-white rounded-lg border border-[#E3E6EA] shadow-xs p-1.5 flex flex-col justify-between cursor-pointer hover:scale-105 hover:z-40 transition-all ${rotation} ${zIndex} ${translateX}`}
                  title={`${file.displayName} · ${storageEngine.formatBytes(file.size)}`}
                >
                  <div className="w-full h-11 bg-[#F5F6F8] rounded flex items-center justify-center overflow-hidden">
                    {file.previewUrl ? (
                      <img
                        src={file.previewUrl}
                        alt={file.displayName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-[#747A84] uppercase">
                        {file.extension}
                      </span>
                    )}
                  </div>

                  <div className="truncate text-[10px] font-medium text-[#202124]">
                    {file.displayName}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-[#9AA0A6] italic py-6">
            No {title.toLowerCase()} indexed
          </div>
        )}

        {/* Shelf Footer: Size Summary */}
        <div className="pt-2 border-t border-[#ECEEF1]/80 flex items-center justify-between text-[11px] text-[#747A84] select-none">
          <span className="font-mono tabular-nums">{formattedSize}</span>
          <span className="text-[10px] text-[#9AA0A6]">
            {count === 1 ? '1 file' : `${count} files`}
          </span>
        </div>
      </div>
    </div>
  );
};
