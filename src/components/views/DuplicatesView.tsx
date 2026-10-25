/**
 * Shelf Duplicates Review View
 * Detects exact duplicate files by SHA-256 content hash.
 * Provides transparent "Keep" selection, review-first candidate lists,
 * and honest unavailable state for Similar Photos.
 */

import React, { useState } from 'react';
import {
  Copy,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { DuplicateGroup, FileItem, OSPlatform } from '../../types/shelf';
import { storageEngine } from '../../services/storage';

interface DuplicatesViewProps {
  platform: OSPlatform;
  onRequestTrash: (files: FileItem[], title: string, desc: string) => void;
  onSelectFile: (file: FileItem) => void;
  onQuickLook: (file: FileItem) => void;
}

export const DuplicatesView: React.FC<DuplicatesViewProps> = ({
  platform,
  onRequestTrash,
  onSelectFile,
  onQuickLook,
}) => {
  const [activeTab, setActiveTab] = useState<'exact' | 'similar'>('exact');
  const [customKeepMap, setCustomKeepMap] = useState<Record<string, string>>({}); // groupId -> fileId to keep

  const { groups, totalPotentialSavings } = storageEngine.computeDuplicates();
  const trashName = platform === 'mac' ? 'Trash' : 'Recycle Bin';

  const handleSetKeep = (groupId: string, fileId: string) => {
    setCustomKeepMap((prev) => ({ ...prev, [groupId]: fileId }));
  };

  const handleTrashGroupDuplicates = (group: DuplicateGroup) => {
    const keepId = customKeepMap[group.id] || group.proposedKeepId;
    const candidatesToTrash = group.memberFiles.filter((f) => f.id !== keepId);

    onRequestTrash(
      candidatesToTrash,
      `Move ${candidatesToTrash.length} duplicate copy to ${trashName}?`,
      `The retained copy will remain safe in its location. Only duplicate copies are moved to the OS ${trashName}.`
    );
  };

  return (
    <div className="space-y-6 pb-12 select-none">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2">
          <Copy className="w-5 h-5 text-[#3478E8]" />
          <h1 className="text-2xl font-semibold tracking-tight text-[#202124]">
            Duplicate Files
          </h1>
        </div>
        <p className="text-xs text-[#747A84] mt-1 max-w-xl">
          Identify identical file copies verified by SHA-256 content hashing. Review before moving copies to {trashName}.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#ECEEF1] pb-2">
        <button
          onClick={() => setActiveTab('exact')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'exact'
              ? 'bg-[#3478E8] text-white shadow-2xs'
              : 'text-[#747A84] hover:text-[#202124]'
          }`}
        >
          Exact Copies ({groups.length} groups)
        </button>

        <div className="relative group">
          <button
            onClick={() => setActiveTab('similar')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'similar'
                ? 'bg-[#3478E8] text-white'
                : 'text-[#9AA0A6] hover:text-[#747A84]'
            }`}
          >
            <span>Similar Photos</span>
            <span className="text-[10px] bg-neutral-200/70 text-[#5F6368] px-1.5 py-0.2 rounded font-mono">
              Disabled
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'similar' ? (
        /* Disabled Similar Photos tab with honest explanation */
        <div className="p-8 bg-white border border-[#E3E6EA] rounded-2xl max-w-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="w-5 h-5" />
            <h3 className="text-sm font-semibold">Similar Photos Feature Status</h3>
          </div>
          <p className="text-xs text-[#5F6368] leading-relaxed">
            Per Shelf&rsquo;s trust guidelines, similar photo grouping requires a validated local perceptual hashing algorithm. To avoid inaccurate clustering or fake AI heuristics, this tab is explicitly deactivated until an approved on-device perceptual model is integrated.
          </p>
          <div className="text-xs text-[#747A84] font-medium">
            Exact copies remain 100% verified via SHA-256 in the Exact Copies tab.
          </div>
        </div>
      ) : (
        /* Exact Copies Tab */
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="bg-white border border-[#E3E6EA] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#EBF3FF] border border-[#CCE2FF] flex items-center justify-center text-[#3478E8]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#202124]">
                  {groups.length} Duplicate Groups Found
                </div>
                <div className="text-xs text-[#747A84]">
                  Potential recoverable storage:{' '}
                  <strong className="text-[#202124] font-mono tabular-nums">
                    {storageEngine.formatBytes(totalPotentialSavings)}
                  </strong>
                </div>
              </div>
            </div>

            <span className="text-[11px] text-[#747A84] font-mono bg-[#F8F9FB] px-2.5 py-1 rounded-md border border-[#ECEEF1] self-start sm:self-auto">
              SHA-256 Hash Verified
            </span>
          </div>

          {/* Duplicate Groups List */}
          {groups.length > 0 ? (
            <div className="space-y-4">
              {groups.map((group) => {
                const currentKeepId = customKeepMap[group.id] || group.proposedKeepId;
                const candidatesToTrash = group.memberFiles.filter((f) => f.id !== currentKeepId);

                return (
                  <div
                    key={group.id}
                    className="bg-white border border-[#E3E6EA] rounded-2xl p-5 shadow-2xs space-y-4"
                  >
                    {/* Group Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#ECEEF1] pb-3">
                      <div>
                        <div className="text-sm font-semibold text-[#202124] break-all">
                          {group.displayName}
                        </div>
                        <div className="text-xs text-[#747A84] font-mono mt-0.5">
                          {group.memberFiles.length} copies · {storageEngine.formatBytes(group.sizePerFile)} each · Potential savings:{' '}
                          <span className="font-semibold text-emerald-700">
                            {storageEngine.formatBytes(group.potentialSavings)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleTrashGroupDuplicates(group)}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Move {candidatesToTrash.length} {candidatesToTrash.length === 1 ? 'Duplicate' : 'Duplicates'} to {trashName}</span>
                      </button>
                    </div>

                    {/* Member Copies Rows */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold text-[#747A84] uppercase tracking-wide">
                        Choose which copy to keep:
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {group.memberFiles.map((file) => {
                          const isKeep = file.id === currentKeepId;

                          return (
                            <div
                              key={file.id}
                              onClick={() => handleSetKeep(group.id, file.id)}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                isKeep
                                  ? 'bg-[#F3FAF6] border-[#34A853] ring-1 ring-[#34A853]/20 shadow-2xs'
                                  : 'bg-[#F8F9FB] border-[#E3E6EA] hover:border-[#CBD0D7]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                <div className="w-8 h-8 rounded-lg bg-white border border-[#E3E6EA] overflow-hidden flex items-center justify-center shrink-0">
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
                                  <div className="text-[10px] text-[#9AA0A6]">
                                    Modified {storageEngine.formatDate(file.modifiedAt)}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-1.5">
                                {isKeep ? (
                                  <span className="text-xs font-semibold text-emerald-700 bg-white border border-emerald-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Keep</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">
                                    Candidate
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-[#E3E6EA] rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-semibold text-[#202124]">No exact duplicates found</p>
              <p className="text-xs text-[#747A84]">
                All files in your authorized folders currently have unique SHA-256 hashes.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
