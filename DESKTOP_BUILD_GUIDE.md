# Shelf — Native Desktop Packaging & Release Guide

This document explains how Shelf compiles into a native desktop application for **macOS** and **Windows** from this **single shared codebase**, how native OS operations work, and how to distribute the installers.

---

## 1. Architecture: One Codebase, Two Native Apps

Shelf uses a decoupled desktop architecture with **real local filesystem crawling**:

```
┌────────────────────────────────────────────────────────┐
│             Shared React Renderer Process              │
│   (Vite, Tailwind CSS, Shelf Visual UI, Search)        │
└───────────────────────────┬────────────────────────────┘
                            │
              window.electronAPI (Typed IPC)
                            │
┌───────────────────────────▼────────────────────────────┐
│              Preload (electron/preload.cjs)            │
│         Context-isolated, secure bridge                │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│            Electron Main (electron/main.cjs)           │
│   • scanFolder()       -> Real fs.readdir/stat crawl   │
│   • getDefaultFolders()-> Real ~/Downloads, Documents  │
│   • shelf-local://     -> Safe local media protocol    │
│   • shell.trashItem()  -> Native macOS/Win Trash       │
│   • dialog.showOpen()  -> Native Folder Picker         │
│   • shell.openPath()   -> Launch default OS app        │
│   • Tray / Menu Bar    -> System tray integration      │
│   • globalShortcut     -> ⌘K / Ctrl+K spotlight       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Real Local Filesystem Indexing

When packaged and launched as a native desktop application:
1. **Dynamic User Locations**: Shelf auto-detects real user system folders (`app.getPath('downloads')`, `app.getPath('documents')`, `app.getPath('desktop')`).
2. **Real Disk Crawling**: Scans authorized folders recursively, extracting actual file sizes, modified dates, and classifying kinds (Images, Videos, Music, Documents, Archives, Apps).
3. **Real SHA-256 Hashes**: Calculates real content hashes on disk files for true duplicate detection.
4. **Local Image Protocol**: Serves local thumbnails and media through the secure `shelf-local://` protocol.
5. **Real OS Trash**: Moving files to trash sends the actual files on your hard drive to the macOS Trash (`~/.Trash`) or Windows Recycle Bin.

---

## 3. Generating Installers

### Option A: Automated Cloud Release with GitHub Actions (Recommended)

You don't need both a physical Mac and a physical PC to build both installers! The included workflow `.github/workflows/build-desktop.yml` runs in GitHub's cloud:

1. Push your repository to GitHub.
2. Whenever you push a release tag (e.g., `git tag v1.0.0 && git push origin v1.0.0`) or click **Run Workflow** in GitHub Actions:
   - **Job 1 (macOS)** runs on Apple hardware (`macos-latest`) and compiles `Shelf-1.0.0.dmg` and `Shelf-1.0.0-mac.zip` for both Apple Silicon (M1/M2/M3/M4) and Intel.
   - **Job 2 (Windows)** runs on Windows hardware (`windows-latest`) and compiles `Shelf-Setup-1.0.0.exe` (NSIS installer) and `Shelf-1.0.0-win.exe` (portable).
3. Both files are automatically attached to the same **GitHub Release**:
   - Mac users click: `Shelf-1.0.0.dmg`
   - Windows users click: `Shelf-Setup-1.0.0.exe`

### Option B: Local Building on your Computer

```bash
# 1. Install dependencies
npm install

# 2. Build for macOS (Run on Mac)
npm run desktop:build:mac
# Output generated in: release/Shelf-1.0.0.dmg

# 3. Build for Windows (Run on Windows)
npm run desktop:build:win
# Output generated in: release/Shelf-Setup-1.0.0.exe
```

---

## 4. Code-Signing & Notarization (When Ready for Commercial Distribution)

To distribute outside development mode without OS warnings:

- **For macOS Gatekeeper**:
  - Register an Apple Developer account ($99/yr).
  - Add `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `CSC_LINK` to GitHub Secrets.
- **For Windows SmartScreen**:
  - Obtain an EV / standard Authenticode code-signing certificate (from Sectigo, SSL.com, or DigiCert).
