# Shelf — Native macOS & Windows Desktop Packaging Architecture

Shelf is transitioning from the validated application core into a single-codebase, installable native desktop application for macOS and Windows using **Electron**, **electron-builder**, and an automated multi-platform **GitHub Actions CI/CD pipeline**.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Based on your confirmed choices, here is the architectural and packaging strategy to deliver a single unified codebase that compiles directly into native Mac (`.dmg`) and Windows (`.exe`) installers:

- **Wrapper Framework**: **Electron** with **electron-builder**.
  - Provides a single codebase where React renders the UI while Node.js/Electron main process handles native OS operations.
  - Generates platform-specific installer bundles:
    - **macOS**: `.dmg` (disk image) and `.zip` supporting both Apple Silicon (arm64) and Intel (x64).
    - **Windows**: `.exe` (NSIS installer) and portable executable.
- **Native OS Boundary & IPC Bridge**:
  - Secure `contextBridge` in `electron/preload.ts` exposing `window.electronAPI`.
  - Main process handlers in `electron/main.ts` for:
    - `shell.trashItem(filePath)`: Real native OS Trash (macOS) and Recycle Bin (Windows).
    - `dialog.showOpenDialog()`: Real native folder and file selection dialogs.
    - `shell.showItemInFolder(filePath)`: Native reveal in Finder (macOS) and File Explorer (Windows).
    - `shell.openPath(filePath)`: Native launch with OS default application.
    - `globalShortcut`: System-wide hotkey registration (`⌘K` / `Ctrl+K`).
    - `Tray`: Native macOS Menu Bar and Windows System Tray icon with quick menu.
- **Automated Multi-Platform Release Pipeline (GitHub Actions)**:
  - Matrix build running on `macos-latest` and `windows-latest` simultaneously.
  - Automatically builds the frontend with Vite, packages both installers via electron-builder, and creates a unified GitHub Release with both download links.

---

### 1. Overview & Core Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Shelf Native Application                        │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Renderer Process (React + Tailwind CSS)             │  │
│  │  • Shelf Visual Shelves, Inspector, Search Parser, Duplicates    │  │
│  │  • Pure UI layer; never accesses raw Node.js directly           │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ window.electronAPI (Typed)       │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Preload Script (contextBridge)                  │  │
│  │  • Secure, context-isolated IPC invocation                       │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │ ipcRenderer.invoke(...)          │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                   Main Process (Node.js + Electron)              │  │
│  │  ┌───────────────────────┬──────────────────────┬─────────────┐  │  │
│  │  │ Native Trash / Bin    │ Native File Dialogs  │ Tray & Menu │  │  │
│  │  │ (shell.trashItem)     │ (dialog.showOpen...) │ (Tray / OS) │  │  │
│  │  ├───────────────────────┼──────────────────────┼─────────────┤  │  │
│  │  │ Reveal in Finder / Exp│ Open with Default App│ Shortcuts   │  │  │
│  │  │ (shell.showItem...)   │ (shell.openPath)     │ (Hotkeys)   │  │  │
│  │  └───────────────────────┴──────────────────────┴─────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Implementation Steps

#### Step 1: Electron Main Process & Preload Bridge
- Create `electron/main.ts`:
  - Browser window creation with native desktop constraints (1024×640 min, frame configuration, titleBarStyle).
  - Native IPC handlers:
    - `trash-item`: calls `shell.trashItem(path)` with true OS Trash/Recycle Bin execution.
    - `select-folder`: calls `dialog.showOpenDialog({ properties: ['openDirectory'] })`.
    - `show-in-folder`: calls `shell.showItemInFolder(path)`.
    - `open-file`: calls `shell.openPath(path)`.
    - `get-platform`: returns `'mac'` or `'windows'`.
  - Native system tray integration for Recent Downloads menu.
  - Global shortcut listener (`⌘K` / `Ctrl+K`) to toggle window visibility or spotlight mode.
- Create `electron/preload.ts`:
  - Safely exposes `window.electronAPI` via `contextBridge.exposeInMainWorld`.

#### Step 2: Bridge `DesktopOSAdapter` to `window.electronAPI`
- Update `/src/services/osAdapter.ts`:
  - Detect `window.electronAPI` presence.
  - When running in native Electron, route `moveToTrash`, `showInFileManager`, `openFile`, and `selectFolder` directly to the IPC bridge.
  - Maintain the existing fallback for browser previews so developers can test in any environment without installing desktop binaries.

#### Step 3: Configure `electron-builder` Packaging
- Update `package.json` with scripts:
  - `"electron:dev"`: Launches Vite + Electron concurrently for local development.
  - `"electron:build:mac"`: Packages macOS universal `.dmg` and `.zip`.
  - `"electron:build:win"`: Packages Windows NSIS `.exe` and portable `.exe`.
  - `"electron:build:all"`: Builds for both targets.
- Create `electron-builder.json5` configuration:
  - App ID: `com.shelf.desktop`
  - Product Name: `Shelf`
  - Targets: Mac (`dmg`, `zip` for arm64 & x64), Windows (`nsis`, `portable` for x64).

#### Step 4: Multi-Platform GitHub Actions CI/CD Pipeline
- Create `.github/workflows/build-desktop.yml`:
  - Matrix configuration with `macos-latest` and `windows-latest`.
  - Automated steps:
    1. Checkout repository.
    2. Set up Node.js.
    3. Install dependencies (`npm ci`).
    4. Build Vite frontend (`npm run build`).
    5. Run `electron-builder` on macOS to produce `.dmg`.
    6. Run `electron-builder` on Windows to produce `.exe`.
    7. Publish both files as release assets under GitHub Releases.

#### Step 5: Verification & Testing
- Compile TypeScript across renderer and main processes.
- Verify IPC boundary and fallback behavior.
- Ensure 100% build compatibility.
