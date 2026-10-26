/**
 * Den Downloaded From Source Attribution View
 * Groups files by verified local provenance: Gmail, Google Drive, ChatGPT,
 * Canva, Slack, WhatsApp, GitHub, Browser Extensions, and Any Website.
 * Contains honest transparency notice regarding local evidence limits.
 */

import React, { useState } from 'react';
import {
  DownloadCloud,
  Mail,
  HardDrive,
  MessageSquare,
  Palette,
  Github,
  Globe,
  Puzzle,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { FileItem, SourceType } from '../../types/shelf';
import { storageEngine } from '../../services/storage';
import { FileCard } from '../FileCard';

interface DownloadedFromViewProps {
  initialSource?: SourceType;
  selectedFile: FileItem | null;
  onSelectFile: (file: FileItem) => void;
  onQuickLook: (file: FileItem) => void;
}

export const DownloadedFromView: React.FC<DownloadedFromViewProps> = ({
  initialSource,
  selectedFile,
  onSelectFile,
  onQuickLook,
}) => {
  const [activeSource, setActiveSource] = useState<SourceType | null>(initialSource || null);
  const sourcesData = storageEngine.getSourceBreakdown();

  const getSourceIcon = (source: SourceType) => {
    switch (source) {
      case 'Gmail':
        return <Mail className="w-5 h-5 text-red-500" />;
      case 'Google Drive':
        return <HardDrive className="w-5 h-5 text-blue-500" />;
      case 'ChatGPT':
        return <MessageSquare className="w-5 h-5 text-emerald-600" />;
      case 'Canva':
        return <Palette className="w-5 h-5 text-cyan-600" />;
      case 'Slack':
        return <MessageSquare className="w-5 h-5 text-purple-600" />;
      case 'WhatsApp':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'GitHub':
        return <Github className="w-5 h-5 text-neutral-800" />;
      case 'Browser Extensions':
        return <Puzzle className="w-5 h-5 text-amber-600" />;
      case 'Any Website':
        return <Globe className="w-5 h-5 text-blue-600" />;
      default:
        return <Globe className="w-5 h-5 text-neutral-500" />;
    }
  };

  const selectedSourceGroup = activeSource
    ? sourcesData.find((s) => s.source === activeSource)
    : null;

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          {activeSource && (
            <button
              onClick={() => setActiveSource(null)}
              className="mr-1 p-1 text-[#747A84] hover:text-[#202124] hover:bg-[#F5F6F8] rounded-md transition-colors cursor-pointer"
              title="Back to all sources"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <DownloadCloud className="w-5 h-5 text-[#3478E8]" />
          <h1 className="text-2xl font-semibold tracking-tight text-[#202124]">
            {activeSource ? `Downloaded from ${activeSource}` : 'Downloaded From'}
          </h1>
        </div>

        <p className="text-xs text-[#747A84] mt-1 max-w-2xl">
          {activeSource
            ? `Viewing local files verified from ${activeSource}.`
            : 'Explore local files categorized by where they originated based on local download stream metadata, headers, or clone paths.'}
        </p>
      </div>

      {/* Trust Notice */}
      {!activeSource && (
        <div className="bg-[#F8F9FB] border border-[#E3E6EA] rounded-xl p-3.5 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-[#747A84] shrink-0 mt-0.5" />
          <div className="text-xs text-[#747A84] leading-relaxed">
            <strong className="text-[#202124]">Source Attribution Transparency:</strong>{' '}
            Den attributes sources strictly when local filesystem records or verified application metadata exist. Files without verified provenance are placed in &ldquo;Any Website&rdquo; or &ldquo;Unknown source&rdquo;. Den never fabricates origins.
          </div>
        </div>
      )}

      {/* Grid of Sources or Filtered File List */}
      {!activeSource ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sourcesData.map((group) => (
            <div
              key={group.source}
              onClick={() => setActiveSource(group.source)}
              className="bg-white border border-[#E3E6EA] hover:border-[#3478E8] rounded-2xl p-4 cursor-pointer transition-all hover:shadow-2xs space-y-3 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#F8F9FB] border border-[#ECEEF1] flex items-center justify-center">
                    {getSourceIcon(group.source)}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-[#202124] group-hover:text-[#3478E8] transition-colors">
                      {group.source}
                    </h3>
                    <span className="text-[11px] text-[#747A84] font-mono tabular-nums">
                      {group.count} {group.count === 1 ? 'file' : 'files'}
                    </span>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-[#747A84] group-hover:translate-x-1 transition-transform" />
              </div>

              {/* Sample Mini Previews */}
              <div className="pt-2 border-t border-[#ECEEF1] flex items-center justify-between text-xs text-[#747A84]">
                <span className="font-mono tabular-nums">
                  {storageEngine.formatBytes(group.totalSize)}
                </span>
                <span className="text-[11px] text-[#9AA0A6]">
                  {group.count > 0 ? 'Verified' : 'No items'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Single Source File List */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-[#747A84]">
            <span>
              Showing {selectedSourceGroup?.files.length || 0} files attributed to {activeSource}
            </span>
            <span className="font-mono tabular-nums">
              Total: {storageEngine.formatBytes(selectedSourceGroup?.totalSize || 0)}
            </span>
          </div>

          {selectedSourceGroup && selectedSourceGroup.files.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {selectedSourceGroup.files.map((file) => (
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
            <div className="p-12 text-center bg-white border border-[#E3E6EA] rounded-2xl space-y-2">
              <p className="text-sm font-semibold text-[#202124]">No files from this source</p>
              <p className="text-xs text-[#747A84]">
                No files in authorized folders currently match local provenance for {activeSource}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
