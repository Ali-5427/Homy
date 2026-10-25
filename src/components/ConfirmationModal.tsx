/**
 * Shelf Safe Confirmation Modal
 * Strict review-first safety before moving items to the OS Trash / Recycle Bin.
 * Displays exact candidate count, filenames, and total reclaimable size.
 */

import React from 'react';
import { AlertCircle, Trash2, X } from 'lucide-react';
import { FileItem, OSPlatform } from '../types/shelf';
import { storageEngine } from '../services/storage';

interface ConfirmationModalProps {
  isOpen: boolean;
  filesToTrash: FileItem[];
  title?: string;
  description?: string;
  platform: OSPlatform;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  filesToTrash,
  title,
  description,
  platform,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || filesToTrash.length === 0) return null;

  const trashName = platform === 'mac' ? 'Trash' : 'Recycle Bin';
  const totalBytes = filesToTrash.reduce((acc, f) => acc + f.size, 0);
  const formattedSize = storageEngine.formatBytes(totalBytes);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-[#E3E6EA] max-w-md w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 pb-3 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="text-sm font-semibold text-[#202124]">
              {title || `Move ${filesToTrash.length} item${filesToTrash.length > 1 ? 's' : ''} to ${trashName}?`}
            </h3>
            <p className="text-xs text-[#747A84] leading-relaxed">
              {description ||
                `These items will be moved to your local OS ${trashName}. Files are not permanently deleted and can be restored anytime.`}
            </p>
          </div>

          <button
            onClick={onCancel}
            className="text-[#747A84] hover:text-[#202124] p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Preview List */}
        <div className="px-5 py-2">
          <div className="bg-[#F8F9FB] border border-[#E3E6EA] rounded-xl p-3 max-h-40 overflow-y-auto space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#5F6368] border-b border-[#ECEEF1] pb-1.5">
              <span>{filesToTrash.length} Selected {filesToTrash.length === 1 ? 'File' : 'Files'}</span>
              <span className="font-mono tabular-nums">{formattedSize}</span>
            </div>

            {filesToTrash.map((file) => (
              <div key={file.id} className="flex items-center justify-between text-xs py-0.5">
                <span className="truncate max-w-[240px] text-[#202124] font-medium" title={file.displayName}>
                  {file.displayName}
                </span>
                <span className="text-[11px] text-[#747A84] font-mono tabular-nums">
                  {storageEngine.formatBytes(file.size)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 pt-3 bg-[#F8F9FB] border-t border-[#ECEEF1] flex items-center justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-[#5F6368] hover:text-[#202124] bg-white border border-[#E3E6EA] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Move to {trashName}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
