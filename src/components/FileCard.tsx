/**
 * Shelf Visual File Card
 * Clean thumbnail-forward visual card with pale inset preview stage,
 * kind/size badge, filename truncation, and inspector trigger.
 */

import React from 'react';
import { Eye, ExternalLink, Image, Video, Music, FileText, Archive, Layers } from 'lucide-react';
import { FileItem } from '../types/shelf';
import { storageEngine } from '../services/storage';
import { osAdapter } from '../services/osAdapter';

interface FileCardProps {
  file: FileItem;
  isSelected?: boolean;
  onSelect: (file: FileItem) => void;
  onQuickLook: (file: FileItem) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  isSelected,
  onSelect,
  onQuickLook,
}) => {
  const formattedSize = storageEngine.formatBytes(file.size);
  const formattedDate = storageEngine.formatDate(file.modifiedAt);

  const getKindIcon = () => {
    switch (file.kind) {
      case 'image':
        return <Image className="w-3.5 h-3.5 text-indigo-500" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-blue-500" />;
      case 'audio':
        return <Music className="w-3.5 h-3.5 text-amber-500" />;
      case 'document':
        return <FileText className="w-3.5 h-3.5 text-emerald-600" />;
      case 'archive':
        return <Archive className="w-3.5 h-3.5 text-yellow-600" />;
      case 'app':
        return <Layers className="w-3.5 h-3.5 text-pink-500" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(file)}
      className={`group relative bg-white border rounded-xl p-2.5 flex flex-col justify-between cursor-pointer transition-all duration-150 select-none ${
        isSelected
          ? 'border-[#3478E8] ring-2 ring-[#3478E8]/20 shadow-xs'
          : 'border-[#E3E6EA] hover:border-[#CBD0D7] hover:shadow-2xs'
      }`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === ' ' && !e.repeat) {
          e.preventDefault();
          onQuickLook(file);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          osAdapter.openFile(file);
        }
      }}
      role="button"
      aria-label={`${file.displayName}, ${file.kind}, ${formattedSize}`}
    >
      {/* Inset Preview Stage */}
      <div className="relative w-full h-32 bg-[#F5F6F8] dark:bg-[#1F2228] rounded-lg overflow-hidden flex items-center justify-center border border-[#ECEEF1] dark:border-[#282C34]">
        {file.previewUrl ? (
          <img
            src={file.previewUrl}
            alt={file.displayName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-[#747A84]">
            {getKindIcon()}
            <span className="text-[11px] font-mono uppercase font-semibold">{file.extension}</span>
          </div>
        )}

        {/* Hover Quick Action Buttons */}
        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-md shadow-xs border border-[#E3E6EA]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickLook(file);
            }}
            title="Quick Look (Space)"
            className="p-1 hover:bg-[#F5F6F8] rounded text-[#5F6368] hover:text-[#202124] transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              osAdapter.openFile(file);
            }}
            title="Open with default application"
            className="p-1 hover:bg-[#F5F6F8] rounded text-[#5F6368] hover:text-[#202124] transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Kind & Size Badge on bottom of preview */}
        <div className="absolute bottom-1.5 left-1.5 bg-white/95 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[#5F6368] border border-[#E3E6EA]/80 shadow-2xs">
          {formattedSize}
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="pt-2 px-0.5 space-y-1">
        <div className="flex items-center gap-1.5">
          {getKindIcon()}
          <span
            className="text-xs font-medium text-[#202124] truncate flex-1"
            title={file.displayName}
          >
            {file.displayName}
          </span>
        </div>

        {/* Quiet unboxed metadata */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#747A84]">
          <span className="capitalize">{file.kind}</span>
          <span aria-hidden="true">·</span>
          <span>{formattedDate}</span>
          {file.sourceAttribution && file.sourceAttribution.source !== 'Unknown' && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#3478E8] truncate max-w-[80px]" title={file.sourceAttribution.source}>
                {file.sourceAttribution.source}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
