# Den — Native Desktop Packaging & Release Guide

This document explains how Den compiles into a native desktop application for **macOS** and **Windows** from this **single shared codebase**, how native OS operations work, and how to distribute the installers.

---

## 1. Architecture: One Codebase, Two Native Apps

Den uses a decoupled desktop architecture with **real local filesystem crawling**:

```
┌────────────────────────────────────────────────────────┐
│             Shared React Renderer Process              │
│    (Vite, Tailwind CSS, Den Visual UI, Search)         │
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
│   • den-local://       -> Safe local media protocol    │
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
1. **Dynamic User Locations**: Den auto-detects real user system folders (`app.getPath('downloads')`, `app.getPath('documents')`, `app.getPath('desktop')`).
2. **Real Disk Crawling**: Scans authorized folders recursively, extracting actual file sizes, modified dates, and classifying kinds (Images, Videos, Music, Documents, Archives, Apps).
3. **Real SHA-256 Hashes**: Calculates streaming full-file hashes on disk files for true duplicate detection.
4. **Local Image Protocol**: Serves local thumbnails and media through the secure `den-local://` protocol.
5. **Real OS Trash**: Moving files to trash sends the actual files on your hard drive to the macOS Trash (`~/.Trash`) or Windows Recycle Bin.

---

## 3. Generating Installers

### Automated (GitHub Actions CI)
Pushing a release tag (`v*`) triggers automated matrix packaging:
```bash
git tag v1.0.0
git push origin v1.0.0
```
- macOS builds: `Den-1.0.0.dmg` and `Den-1.0.0-arm64.dmg`
- Windows builds: `Den.Setup.1.0.0.exe` and `Den.1.0.0.exe`

### Local Packaging
```bash
# Windows
npm run desktop:build:win

# macOS
npm run desktop:build:mac
```
Output files are placed in the `release/` folder.
