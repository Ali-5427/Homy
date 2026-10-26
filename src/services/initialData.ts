/**
 * Den Initial Authentic Local Data
 * Generates high-fidelity local indexed file fixtures reflecting genuine
 * macOS and Windows environments across the 6 categories, sources, duplicates,
 * and cleanup candidates.
 */

import { FileItem, IndexedLocation, SavedSearch } from '../types/shelf';

const NOW = Date.now();
const ONE_HOUR = 3600 * 1000;
const ONE_DAY = 24 * ONE_HOUR;
const ONE_WEEK = 7 * ONE_DAY;
const ONE_MONTH = 30 * ONE_DAY;

// Standard SVG data URI generators for crisp type previews
export function createSvgPreview(label: string, bg: string, text: string, sub: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280">
    <rect width="400" height="280" fill="${bg}"/>
    <g transform="translate(30, 40)">
      <rect width="56" height="32" rx="6" fill="#FFFFFF" fill-opacity="0.9"/>
      <text x="28" y="21" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="12" font-weight="bold" fill="#202124" text-anchor="middle">${label}</text>
    </g>
    <text x="32" y="150" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="20" font-weight="600" fill="#202124">${text}</text>
    <text x="32" y="180" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif" font-size="13" fill="#747A84">${sub}</text>
    <line x1="32" y1="210" x2="368" y2="210" stroke="#E3E6EA" stroke-width="1"/>
    <text x="32" y="240" font-family="monospace" font-size="11" fill="#9AA0A6">LOCAL FILE PREVIEW · ON-DEVICE ONLY</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_LOCATIONS: IndexedLocation[] = [
  {
    id: 'loc-downloads',
    displayName: 'Downloads',
    fullPath: '~/Downloads',
    status: 'indexed',
    fileCount: 48,
    totalSize: 4280000000, // 4.28 GB
    addedAt: NOW - 60 * ONE_DAY,
    isDefault: true,
  },
  {
    id: 'loc-documents',
    displayName: 'Documents',
    fullPath: '~/Documents',
    status: 'indexed',
    fileCount: 64,
    totalSize: 1850000000, // 1.85 GB
    addedAt: NOW - 50 * ONE_DAY,
    isDefault: true,
  },
  {
    id: 'loc-desktop',
    displayName: 'Desktop',
    fullPath: '~/Desktop',
    status: 'indexed',
    fileCount: 16,
    totalSize: 890000000, // 890 MB
    addedAt: NOW - 30 * ONE_DAY,
    isDefault: true,
  },
];

export const INITIAL_FILES: FileItem[] = [
  // --- DOCUMENTS ---
  {
    id: 'f-doc-1',
    displayName: 'Q3_Financial_Model_Final.xlsx',
    extension: 'xlsx',
    kind: 'document',
    size: 14889779, // ~14.2 MB
    createdAt: NOW - 3 * ONE_DAY,
    modifiedAt: NOW - 2 * ONE_DAY, // Last week
    locationId: 'loc-documents',
    locationPath: '~/Documents/Finance',
    previewUrl: createSvgPreview('XLSX', '#DDF3E9', 'Q3 Financial Model', 'Sheets · 14.2 MB · 4 Worksheets'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Google Drive',
      confidence: 'verified',
      evidence: 'Local Google Drive Sync metadata',
    },
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    extractedTextStatus: 'indexed',
    extractedText: 'Q3 Gross Margin Revenue Projections Operating Expenses EBITA 2026',
  },
  {
    id: 'f-doc-1-dup',
    displayName: 'Q3_Financial_Model_Final.xlsx',
    extension: 'xlsx',
    kind: 'document',
    size: 14889779, // 14.2 MB (EXACT DUPLICATE)
    createdAt: NOW - 2 * ONE_DAY,
    modifiedAt: NOW - 2 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    previewUrl: createSvgPreview('XLSX', '#DDF3E9', 'Q3 Financial Model (Copy)', 'Sheets · 14.2 MB · Duplicate in Downloads'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Gmail',
      confidence: 'verified',
      evidence: 'Downloaded from Gmail attachment notification',
    },
    sha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    extractedTextStatus: 'indexed',
    extractedText: 'Q3 Gross Margin Revenue Projections Operating Expenses EBITA 2026',
  },
  {
    id: 'f-doc-2',
    displayName: 'Master_Services_Agreement_2026.pdf',
    extension: 'pdf',
    kind: 'document',
    size: 6815744, // 6.5 MB (satisfies "pdfs from last week over 5 mb" and "pdfs from gmail")
    createdAt: NOW - 5 * ONE_DAY,
    modifiedAt: NOW - 4 * ONE_DAY, // Last week
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    previewUrl: createSvgPreview('PDF', '#DDF3E9', 'Master Services Agreement', 'Signed Agreement · 6.5 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Gmail',
      confidence: 'verified',
      evidence: 'Downloaded via mail.google.com attachment stream',
    },
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    extractedTextStatus: 'indexed',
    extractedText: 'Master Services Agreement terms liability governance SLA warranty',
  },
  {
    id: 'f-doc-3',
    displayName: 'Architecture_Whitepaper_v4.pdf',
    extension: 'pdf',
    kind: 'document',
    size: 7340032, // 7 MB
    createdAt: NOW - 4 * ONE_DAY,
    modifiedAt: NOW - 3 * ONE_DAY,
    locationId: 'loc-documents',
    locationPath: '~/Documents/Engineering',
    previewUrl: createSvgPreview('PDF', '#DDF3E9', 'Architecture Whitepaper v4', 'Distributed Systems · 7.0 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'GitHub',
      confidence: 'verified',
      evidence: 'Cloned from github.com/organization/specs',
    },
    sha256: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    extractedTextStatus: 'indexed',
    extractedText: 'Zero-latency local architecture distributed verification',
  },
  {
    id: 'f-doc-4',
    displayName: 'Meeting_Notes_Product_Roadmap.pdf',
    extension: 'pdf',
    kind: 'document',
    size: 1250000, // 1.25 MB
    createdAt: NOW - 12 * ONE_DAY,
    modifiedAt: NOW - 10 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    previewUrl: createSvgPreview('PDF', '#DDF3E9', 'Meeting Notes: Roadmap', 'Executive Summary · 1.2 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Slack',
      confidence: 'verified',
      evidence: 'Slack direct file download token',
    },
    extractedTextStatus: 'indexed',
    extractedText: 'Roadmap sprint planning user experience design sprint dates',
  },

  // --- SCREENSHOTS & IMAGES ---
  {
    id: 'f-img-1',
    displayName: 'Screenshot 2026-10-18 at 14.22.05.png',
    extension: 'png',
    kind: 'image',
    size: 2450000, // 2.45 MB
    createdAt: NOW - 6 * ONE_DAY,
    modifiedAt: NOW - 6 * ONE_DAY,
    locationId: 'loc-desktop',
    locationPath: '~/Desktop',
    isScreenshot: true,
    dimensions: { width: 2880, height: 1800 },
    previewUrl: createSvgPreview('PNG', '#EEE9FF', 'Screenshot: Office Router', 'Contains wifi password label · 2.4 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Unknown',
      confidence: 'inferred',
      evidence: 'macOS Screen Capture naming pattern',
    },
    extractedTextStatus: 'indexed',
    extractedText: 'Office Network Guest Wi-Fi password: OrchidSkyline2026! WPA3 Security',
  },
  {
    id: 'f-img-2',
    displayName: 'Screenshot 2026-10-20 at 09.15.33.png',
    extension: 'png',
    kind: 'image',
    size: 1890000,
    createdAt: NOW - 4 * ONE_DAY,
    modifiedAt: NOW - 4 * ONE_DAY,
    locationId: 'loc-desktop',
    locationPath: '~/Desktop',
    isScreenshot: true,
    dimensions: { width: 2560, height: 1440 },
    previewUrl: createSvgPreview('PNG', '#EEE9FF', 'Dashboard Analytics Grab', 'Chart metrics view · 1.8 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Unknown',
      confidence: 'inferred',
    },
    extractedTextStatus: 'none',
  },
  {
    id: 'f-img-3',
    displayName: 'Brand_Hero_Illustration_Export.png',
    extension: 'png',
    kind: 'image',
    size: 4200000,
    createdAt: NOW - 8 * ONE_DAY,
    modifiedAt: NOW - 8 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    dimensions: { width: 3840, height: 2160 },
    previewUrl: createSvgPreview('PNG', '#EEE9FF', 'Brand Hero Illustration', 'Canva Export · 3840x2160 · 4.2 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Canva',
      confidence: 'verified',
      evidence: 'Canva design export header metadata',
    },
    extractedTextStatus: 'none',
  },
  {
    id: 'f-img-4',
    displayName: 'Product_Exploration_ChatGPT.png',
    extension: 'png',
    kind: 'image',
    size: 3100000,
    createdAt: NOW - 2 * ONE_DAY,
    modifiedAt: NOW - 2 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    dimensions: { width: 1920, height: 1080 },
    previewUrl: createSvgPreview('PNG', '#EEE9FF', 'Product Exploration', 'Generated via ChatGPT Web UI · 3.1 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'ChatGPT',
      confidence: 'verified',
      evidence: 'Downloaded from chatgpt.com web response',
    },
    extractedTextStatus: 'none',
  },

  // --- VIDEOS ---
  {
    id: 'f-vid-1',
    displayName: 'Keynote_Demo_from_iPhone.mov',
    extension: 'mov',
    kind: 'video',
    size: 142606336, // ~136 MB (Satisfies "videos from my iphone in august" and "Large Files")
    // Let's set modified date to August of this year
    createdAt: new Date('2026-08-14T15:30:00Z').getTime(),
    modifiedAt: new Date('2026-08-14T15:30:00Z').getTime(),
    locationId: 'loc-documents',
    locationPath: '~/Documents/Recordings',
    duration: 184, // 3 min 4 sec
    dimensions: { width: 3840, height: 2160 },
    previewUrl: createSvgPreview('MOV', '#DDEBFF', 'Keynote Demo from iPhone', '4K 60fps ProRes · 136 MB · 3:04'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Any Website',
      confidence: 'unknown',
      evidence: 'Transferred via AirDrop / Local sync',
    },
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    extractedTextStatus: 'none',
  },
  {
    id: 'f-vid-1-dup',
    displayName: 'Keynote_Demo_from_iPhone.mov',
    extension: 'mov',
    kind: 'video',
    size: 142606336, // EXACT DUPLICATE
    createdAt: new Date('2026-08-14T15:30:00Z').getTime(),
    modifiedAt: new Date('2026-08-14T15:30:00Z').getTime(),
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    duration: 184,
    dimensions: { width: 3840, height: 2160 },
    previewUrl: createSvgPreview('MOV', '#DDEBFF', 'Keynote Demo (Copy in Downloads)', '136 MB · Duplicate Candidate'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Any Website',
      confidence: 'unknown',
    },
    sha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    extractedTextStatus: 'none',
  },
  {
    id: 'f-vid-2',
    displayName: 'Screen_Recording_Bug_Repro.mp4',
    extension: 'mp4',
    kind: 'video',
    size: 45200000, // 45.2 MB
    createdAt: NOW - 5 * ONE_DAY,
    modifiedAt: NOW - 5 * ONE_DAY,
    locationId: 'loc-desktop',
    locationPath: '~/Desktop',
    duration: 48,
    dimensions: { width: 1920, height: 1080 },
    previewUrl: createSvgPreview('MP4', '#DDEBFF', 'Screen Recording Repro', '1080p · 45 MB · 0:48'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Slack',
      confidence: 'verified',
      evidence: 'Downloaded from Slack thread #engineering',
    },
    extractedTextStatus: 'none',
  },
  {
    id: 'f-vid-3',
    displayName: 'Raw_Drone_B-Roll_4K.mov',
    extension: 'mov',
    kind: 'video',
    size: 380000000, // 380 MB (Large old video cleanup candidate)
    createdAt: NOW - 180 * ONE_DAY,
    modifiedAt: NOW - 180 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    duration: 312,
    dimensions: { width: 3840, height: 2160 },
    previewUrl: createSvgPreview('MOV', '#DDEBFF', 'Raw Drone B-Roll 4K', 'Unedited Footage · 380 MB · 5:12'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Any Website',
      confidence: 'unknown',
    },
    extractedTextStatus: 'none',
  },

  // --- MUSIC / AUDIO ---
  {
    id: 'f-aud-1',
    displayName: 'Ambient_Focus_Flow_01.mp3',
    extension: 'mp3',
    kind: 'audio',
    size: 8900000, // 8.9 MB
    createdAt: NOW - 15 * ONE_DAY,
    modifiedAt: NOW - 14 * ONE_DAY,
    locationId: 'loc-documents',
    locationPath: '~/Documents/Audio',
    duration: 218, // 3:38
    previewUrl: createSvgPreview('MP3', '#FFE8DC', 'Ambient Focus Flow 01', 'Stereo 320kbps · 3:38 · 8.9 MB'),
    previewType: 'audio',
    sourceAttribution: {
      source: 'Any Website',
      confidence: 'unknown',
    },
    extractedTextStatus: 'none',
  },
  {
    id: 'f-aud-2',
    displayName: 'Podcast_Voiceover_Track_Draft.wav',
    extension: 'wav',
    kind: 'audio',
    size: 26500000, // 26.5 MB
    createdAt: NOW - 4 * ONE_DAY,
    modifiedAt: NOW - 3 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    duration: 142, // 2:22
    previewUrl: createSvgPreview('WAV', '#FFE8DC', 'Podcast Voiceover Track', '24-bit 48kHz WAV · 26.5 MB'),
    previewType: 'audio',
    sourceAttribution: {
      source: 'WhatsApp',
      confidence: 'verified',
      evidence: 'WhatsApp Voice Note audio export',
    },
    extractedTextStatus: 'none',
  },

  // --- ARCHIVES ---
  {
    id: 'f-arc-1',
    displayName: 'Brand_Identity_Kit_2026.zip',
    extension: 'zip',
    kind: 'archive',
    size: 71728640, // 68.4 MB (Exact Duplicate group)
    createdAt: NOW - 7 * ONE_DAY,
    modifiedAt: NOW - 7 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    previewUrl: createSvgPreview('ZIP', '#FFF0C8', 'Brand Identity Kit 2026', 'Compressed Archive · 68.4 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Google Drive',
      confidence: 'verified',
      evidence: 'Google Drive zip bundle archive',
    },
    sha256: 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
    extractedTextStatus: 'none',
  },
  {
    id: 'f-arc-1-dup',
    displayName: 'Brand_Identity_Kit_2026.zip',
    extension: 'zip',
    kind: 'archive',
    size: 71728640, // 68.4 MB (EXACT DUPLICATE)
    createdAt: NOW - 6 * ONE_DAY,
    modifiedAt: NOW - 6 * ONE_DAY,
    locationId: 'loc-desktop',
    locationPath: '~/Desktop',
    previewUrl: createSvgPreview('ZIP', '#FFF0C8', 'Brand Identity Kit (Copy)', 'Desktop Copy · 68.4 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Google Drive',
      confidence: 'verified',
    },
    sha256: 'c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2',
    extractedTextStatus: 'none',
  },
  {
    id: 'f-arc-2',
    displayName: 'Legacy_Client_Backup_2025.tar.gz',
    extension: 'tar.gz',
    kind: 'archive',
    size: 198000000, // 198 MB (Forgotten download > 120 days)
    createdAt: NOW - 140 * ONE_DAY,
    modifiedAt: NOW - 140 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    previewUrl: createSvgPreview('TAR.GZ', '#FFF0C8', 'Legacy Client Backup', 'GZ Archive · 198 MB · 140 days old'),
    previewType: 'image',
    sourceAttribution: {
      source: 'GitHub',
      confidence: 'verified',
      evidence: 'GitHub repository release asset',
    },
    extractedTextStatus: 'none',
  },

  // --- APPS & INSTALLERS ---
  {
    id: 'f-app-1',
    displayName: 'Docker_Desktop_4.28.dmg',
    extension: 'dmg',
    kind: 'app',
    size: 612000000, // 612 MB (Old installer cleanup candidate)
    createdAt: NOW - 120 * ONE_DAY,
    modifiedAt: NOW - 120 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    previewUrl: createSvgPreview('DMG', '#F8E2EE', 'Docker Desktop Installer', 'Apple Silicon Disk Image · 612 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Any Website',
      confidence: 'unknown',
    },
    extractedTextStatus: 'none',
  },
  {
    id: 'f-app-2',
    displayName: 'VSCodeUserSetup-x64-1.89.exe',
    extension: 'exe',
    kind: 'app',
    size: 104000000, // 104 MB (Old installer cleanup candidate)
    createdAt: NOW - 110 * ONE_DAY,
    modifiedAt: NOW - 110 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    previewUrl: createSvgPreview('EXE', '#F8E2EE', 'VS Code Setup Executable', 'Windows x64 Installer · 104 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Any Website',
      confidence: 'unknown',
    },
    extractedTextStatus: 'none',
  },
  {
    id: 'f-app-3',
    displayName: 'Postman_Old_v10.15.pkg',
    extension: 'pkg',
    kind: 'app',
    size: 145000000, // 145 MB (Unused app installer)
    createdAt: NOW - 95 * ONE_DAY,
    modifiedAt: NOW - 95 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    previewUrl: createSvgPreview('PKG', '#F8E2EE', 'Postman Package Installer', 'macOS Installer · 145 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Any Website',
      confidence: 'unknown',
    },
    extractedTextStatus: 'none',
  },
  {
    id: 'f-app-4',
    displayName: 'Figma_Beta_v116.dmg',
    extension: 'dmg',
    kind: 'app',
    size: 182000000, // 182 MB (Unused app candidate)
    createdAt: NOW - 85 * ONE_DAY,
    modifiedAt: NOW - 85 * ONE_DAY,
    locationId: 'loc-downloads',
    locationPath: '~/Downloads',
    previewUrl: createSvgPreview('DMG', '#F8E2EE', 'Figma Beta Standalone', 'macOS Disk Image · 182 MB'),
    previewType: 'image',
    sourceAttribution: {
      source: 'Any Website',
      confidence: 'unknown',
    },
    extractedTextStatus: 'none',
  },
];

export const INITIAL_SAVED_SEARCHES: SavedSearch[] = [
  {
    id: 'saved-1',
    title: 'PDFs over 5 MB',
    query: 'pdfs over 5 mb',
    createdAt: NOW - 10 * ONE_DAY,
  },
  {
    id: 'saved-2',
    title: 'Recent Screenshots',
    query: 'screenshots',
    createdAt: NOW - 8 * ONE_DAY,
  },
  {
    id: 'saved-3',
    title: 'Videos from August',
    query: 'videos in august',
    createdAt: NOW - 5 * ONE_DAY,
  },
  {
    id: 'saved-4',
    title: 'Google Drive Files',
    query: 'from google drive',
    createdAt: NOW - 2 * ONE_DAY,
  },
];
