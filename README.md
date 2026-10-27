# Den — Cross-Platform Desktop File Finder & Visual Workspace

> **Den** is a calm, visual desktop application for macOS and Windows designed for finding, understanding, and safely reviewing a person's own local files without complex hierarchy navigation, cloud tracking, or irreversible automated actions.

---

## 1. Overview & Core Philosophy

Traditional file managers force users to read long filenames and traverse nested directory trees. Den replaces this friction with **visual folder-shaped shelves**, **thumbnail-forward browsing**, and a strict **review-first safety guarantee**.

- **Visual Recognition Over Text**: Files are presented on color-coded, tactile shelves with high-fidelity inset preview stages.
- **Single Shared Codebase**: One unified architecture delivering native macOS (`.dmg`) and Windows (`.exe`) applications from identical source code.
- **100% Local-Data Privacy**: Zero cloud sync, zero telemetry, and zero remote LLM dependencies. All search queries, file metadata, hashes, and indexes remain entirely on your device.
- **Review-First Safety**: Den will never delete, move, or clean up files autonomously. Every destructive operation requires explicit user confirmation and routes to the OS Trash/Recycle Bin, never permanent erase.

---

## 2. Feature Highlights

### 📁 Six Visual Categories
- Six signature folder-tab shelves: **Images**, **Videos**, **Music**, **Documents**, **Archives**, and **Apps**.
- Responsive shelf grid adapting dynamically to window width.

### 🔎 Fast Local Search
- Search files by name, extension, date range, or size.
- Bookmark any search query directly into the sidebar via **Save Search**.

### 🔍 File Inspector & Quick Look
- Contextual right-side drawer displaying file metadata without discarding browsing context.
- Native OS operations: **Open File**, **Show in Finder / File Explorer**, **Copy Path**, and **Move to Trash**.
- Full-screen **Quick Look** overlay triggered instantly via `Space` key.

### ⚡ Quick Search Spotlight Panel (`⌘K` / `Ctrl+K`)
- Compact floating window with instant keyboard navigation (`↑` / `↓`, `↵` to open in default app, `Esc` to dismiss).

### 👥 Duplicate Finder (Streaming SHA-256)
- **Exact Copies**: Dual-pass duplicate detection (file size matching followed by streaming SHA-256 hashing) preventing false positives and high RAM usage.
- Intelligent **Keep** proposal with one-click override and group-specific move-to-trash confirmation.

---

## 3. Getting Started

### Development
```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Run in Electron
npx electron .
```

### Packaging
```bash
# Package Windows NSIS installer
npm run desktop:build:win

# Package macOS DMG installer
npm run desktop:build:mac
```
Built installers are saved in the `release/` directory.
