# Shelf — Cross-Platform Desktop File Finder & Visual Workspace

> **Shelf** is a calm, visual desktop application for macOS and Windows designed for finding, understanding, and safely reviewing a person's own local files without complex hierarchy navigation, cloud tracking, or irreversible automated actions.

---

## 1. Overview & Core Philosophy

Traditional file managers force users to read long filenames and traverse nested directory trees. Shelf replaces this friction with **visual folder-shaped shelves**, **thumbnail-forward browsing**, **plain-English search interpretation**, and a strict **review-first safety guarantee**.

- **Visual Recognition Over Text**: Files are presented on color-coded, tactile shelves with high-fidelity inset preview stages and aspect-ratio preservation.
- **Single Shared Codebase**: One unified architecture delivering native macOS (`.dmg`) and Windows (`.exe`) applications from identical source code.
- **100% Local-Data Privacy**: Zero cloud sync, zero telemetry, and zero remote LLM dependencies. All search queries, file metadata, hashes, and indexes remain entirely on your device.
- **Review-First Safety**: Shelf will never delete, move, or clean up files autonomously. Every destructive operation requires explicit user confirmation and routes to the OS Trash/Recycle Bin, never permanent erase.

---

## 2. Feature Highlights

### 📁 Home & Six Category Shelves
- Six signature folder-tab shelves: **Images**, **Videos**, **Music**, **Documents**, **Archives**, and **Apps**.
- Dynamic folder-tab silhouettes with soft category tints (`#EEE9FF`, `#DDEBFF`, `#FFE8DC`, `#DDF3E9`, `#FFF0C8`, `#F8E2EE`) and layered thumbnail previews.
- Responsive shelf grid: dynamically adapts across 4, 3, 2, and 1 columns as the window width shifts.

### 🔎 Deterministic Natural-Language Search
- Pure client-side query parser supporting natural phrases:
  - *"pdfs from last week over 5 mb"*
  - *"videos from my iphone in august"*
  - *"screenshots with wifi password"*
  - *"pdfs from gmail"*
- Interactive **"Understood as"** removable filter chips that synchronize with live search results.
- Unrecognized terms fall back gracefully to literal string matching with transparent status notices.
- Bookmark any search query directly into the sidebar via **Save Search**.

### 🔍 File Inspector & Quick Look
- Contextual right-side drawer displaying file metadata, dimensions, media duration, location, and provenance without discarding browsing context.
- Native OS operations: **Open File**, **Show in Finder / File Explorer**, **Copy Path**, and **Move to Trash**.
- Full-screen **Quick Look** overlay triggered instantly via `Space` key or inspection controls.

### ⚡ Quick Search Spotlight Panel (`⌘K` / `Ctrl+K`)
- Compact floating window with instant keyboard navigation (`↑` / `↓`, `↵` to open in default app, `⌘↵` / `Ctrl↵` to inspect in Shelf, `Esc` to dismiss).
- Live substring filtering against authorized index locations.

### 📥 Downloaded From (Source Attribution)
- Groups files by verified local provenance: **Gmail**, **Google Drive**, **ChatGPT**, **Canva**, **Slack**, **WhatsApp**, **GitHub**, **Browser Extensions**, and **Any Website**.
- Honest provenance disclosure: attributes sources strictly when local stream headers or filesystem evidence exists, avoiding fabricated origin claims.

### 👥 Duplicate Finder (SHA-256 Hashing)
- **Exact Copies**: Dual-pass duplicate detection (file size matching followed by SHA-256 chunk hashing) preventing false positives.
- Intelligent **Keep** proposal with one-click override and group-specific move-to-trash confirmation.
- **Similar Photos**: Transparently marked as deactivated until an approved on-device perceptual hash model is validated.

### 🧹 Clean Up Storage (Review-First)
- Exactly five focused suggestion categories:
  1. **Old installers** (`.dmg`, `.pkg`, `.exe` older than 30 days)
  2. **Forgotten downloads** (files in `~/Downloads` untouched for > 60 days)
  3. **Old screenshots** (desktop captures older than 30 days)
  4. **Large old videos** (videos > 100 MB unmodified for > 60 days)
  5. **Unused apps** (application binaries unmodified for > 60 days)
- Headline potential savings computed without double-counting cross-category files.
- Multi-select review checklists with **Trash Selected** and **Trash All in Group** behind explicit confirmation modals.

### 🎵 Contextual Music Preview
- Minimalist bottom audio player bar appearing strictly when an audio file is selected.
- Real-time sound synthesis using the HTML5 Web Audio API with working play/pause, seekable track scrubbers, and volume controls.

### ⚙️ Settings & Transparency
- Visual theme switcher: **Playful** (category tinted), **Minimal** (monochrome neutral), and **System** (OS dark/light adaptation).
- Authorized Locations manager: easily add or remove folders from Shelf's index (removing a location never deletes original files).
- Index rebuild and cache clear controls.
- Plain-English local privacy documentation.

---

## 3. System Architecture

Shelf enforces strict separation of concerns across presentation, domain state, and native operating system calls:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Shelf Desktop Application                       │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │               Renderer Process (React 19 + Tailwind CSS)         │  │
│  │   • Visual Shelves, Category Views, Inspector, Search Parser     │  │
│  │   • 100% Client-side state; never invokes raw Node.js directly   │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ window.electronAPI (Typed IPC)   │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                 Preload Bridge (electron/preload.cjs)            │  │
│  │   • Context-isolated secure API exposed via contextBridge        │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ ipcRenderer.invoke(...)          │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Main Process (electron/main.cjs)                │  │
│  │   ├── shell.trashItem()     -> Native macOS Trash / Win Recycle  │  │
│  │   ├── dialog.showOpenDialog() -> Native Folder Selection Dialog  │  │
│  │   ├── shell.showItemInFolder() -> Reveal in Finder / Explorer    │  │
│  │   ├── shell.openPath()        -> Launch in OS default app        │  │
│  │   └── globalShortcut / Tray   -> Menu Bar / System Tray          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Directory Structure

```text
├── .github/
│   └── workflows/
│       └── build-desktop.yml      # Multi-platform CI/CD release workflow (Mac & Win)
├── electron/
│   ├── main.cjs                   # Native Electron main process & IPC handlers
│   ├── preload.cjs                # Context-isolated secure bridge (window.electronAPI)
│   └── entitlements.mac.plist     # macOS hardened runtime entitlements
├── src/
│   ├── components/
│   │   ├── views/
│   │   │   ├── CategoryView.tsx   # Grid & List category file browser
│   │   │   ├── CleanUpView.tsx    # Review-first 5-category storage cleanup
│   │   │   ├── DownloadedFromView.tsx # Provenance & source attribution view
│   │   │   ├── DuplicatesView.tsx # SHA-256 duplicate candidate review
│   │   │   ├── HomeView.tsx       # 6 Folder shelves, recents, cleanup teaser
│   │   │   ├── SearchResultsView.tsx # NL search parser & chip manager
│   │   │   └── SettingsView.tsx   # Authorized locations & privacy controls
│   │   ├── ConfirmationModal.tsx  # Review-first Trash confirmation dialog
│   │   ├── ContextualAudioBar.tsx # Contextual Web Audio playback toolbar
│   │   ├── FileCard.tsx           # Visual card with inset preview stage
│   │   ├── FolderShelf.tsx        # Signature folder-tab shelf component
│   │   ├── Inspector.tsx          # Right-side metadata & actions drawer
│   │   ├── QuickLookModal.tsx     # Space-triggered full preview overlay
│   │   ├── QuickSearchModal.tsx   # ⌘K / Ctrl+K spotlight modal
│   │   ├── RecentDownloadsPopover.tsx # Menu-bar / system tray popover
│   │   ├── Sidebar.tsx            # Left navigation bar
│   │   └── TopBar.tsx             # Search input, library status & tray triggers
│   ├── services/
│   │   ├── initialData.ts         # High-fidelity sample local fixtures
│   │   ├── osAdapter.ts           # Unified OS boundary (Electron IPC + Web fallback)
│   │   ├── searchParser.ts        # Deterministic natural-language parser
│   │   └── storage.ts             # Domain calculations (duplicates, cleanup, stats)
│   ├── types/
│   │   ├── electron.d.ts          # TypeScript declarations for window.electronAPI
│   │   └── shelf.ts               # Core domain models (FileItem, Location, Group)
│   ├── App.tsx                    # Top-level desktop orchestration
│   ├── index.css                  # Native system font stack & design tokens
│   └── main.tsx                   # React root mount
├── electron-builder.json5         # Packaging rules for DMG, ZIP, and NSIS EXE
├── index.html                     # Desktop HTML shell
├── package.json                   # Dependencies and packaging scripts
├── tsconfig.json                  # Strict TypeScript configuration
└── vite.config.ts                 # Vite bundler configuration
```

---

## 5. Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) `>= 20.x`
- `npm` `>= 10.x`

### Installation
```bash
git clone https://github.com/your-username/shelf.git
cd shelf
npm install
```

### Run in Development
```bash
# Starts the Vite development server on port 3000
npm run dev
```

### Type Checking & Linting
```bash
# Validates TypeScript types across the entire codebase
npm run lint

# Verifies production build compilation
npm run build
```

---

## 6. Packaging & Releasing

### Option A: Automated Multi-Platform CI/CD (GitHub Actions)
The included `.github/workflows/build-desktop.yml` workflow automatically builds both macOS and Windows installers in GitHub's cloud on official Apple and Windows runners:

1. Push a release tag to your repository:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. GitHub Actions will run parallel jobs:
   - **macOS Runner (`macos-latest`)**: Compiles `Shelf-1.0.0.dmg` and `Shelf-1.0.0-mac.zip` (Universal: Apple Silicon & Intel).
   - **Windows Runner (`windows-latest`)**: Compiles `Shelf-Setup-1.0.0.exe` (NSIS Installer) and `Shelf-1.0.0-win.exe` (Portable).
3. Both installer packages are automatically attached to the resulting **GitHub Release**, ready for download.

### Option B: Local Packaging

#### On macOS:
```bash
npm run desktop:build:mac
# Generated artifacts: release/Shelf-1.0.0.dmg, release/Shelf-1.0.0-mac.zip
```

#### On Windows:
```bash
npm run desktop:build:win
# Generated artifacts: release/Shelf-Setup-1.0.0.exe, release/Shelf-1.0.0-win.exe
```

---

## 7. Connecting Downloads to Your Website

To distribute Shelf from your existing product website:
1. Add a **Shelf** card or product page to your existing website.
2. Direct the download buttons to the latest GitHub Release assets:
   - **Mac Button**: `https://github.com/<owner>/<repo>/releases/latest/download/Shelf-1.0.0.dmg`
   - **Windows Button**: `https://github.com/<owner>/<repo>/releases/latest/download/Shelf-Setup-1.0.0.exe`
3. Optional JavaScript detection for a single smart button:
   ```javascript
   const isMac = navigator.userAgent.toLowerCase().includes('mac');
   const downloadUrl = isMac
     ? 'https://github.com/<owner>/<repo>/releases/latest/download/Shelf-1.0.0.dmg'
     : 'https://github.com/<owner>/<repo>/releases/latest/download/Shelf-Setup-1.0.0.exe';
   ```

---

## 8. Code Signing & Distribution Credentials

When preparing for commercial release without operating system security alerts:

| Platform | Certificate Required | Configuration in `electron-builder.json5` |
| :--- | :--- | :--- |
| **macOS** | Apple Developer ID Application (`.p12`) | Set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `CSC_LINK` in CI secrets |
| **Windows** | Microsoft Authenticode Code-Signing (EV / Standard) | Set `CSC_LINK` and `CSC_KEY_PASSWORD` in CI secrets |

---

## 9. Security & Local Data Policy

- **No Network Egress**: File contents, hashes, paths, extracted text, and search terms are never transmitted over the network.
- **Least Privilege**: Shelf exclusively indexes folders authorized by the user. System and protected OS directories are never touched.
- **Soft Deletion Only**: Destructive actions route strictly to the operating system's native Trash (`~/.Trash`) or Recycle Bin (`Recycle Bin`). Files can be restored at any time.

---

## 10. License

Proprietary — Copyright © 2026 Shelf. All rights reserved.
