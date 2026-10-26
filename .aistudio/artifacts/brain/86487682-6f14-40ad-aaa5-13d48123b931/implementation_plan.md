# Shelf — Production Readiness & Release Plan

This plan details the final engineering and packaging tasks required to make Shelf 100% production-ready for immediate distribution to real macOS and Windows users.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed for this production release:

- **Brand & Icon Asset**: Modern minimalist layered shelf icon with clean geometric blue accents (`#3478E8` to `#1A54B8`), generated at full 512×512 resolution in `public/icon.png` and `public/favicon.ico` for desktop shortcuts, the dock, taskbar, and installer windows.
- **Package Configuration Hardening**:
  - Rename package from placeholder `react-example` to `shelf`.
  - Bump version from `0.0.0` to `1.0.0`.
  - Add `electron` and `electron-builder` to `devDependencies` so GitHub Actions `npm ci` packages the installers reliably.
- **Initial Release Code-Signing Policy**:
  - Proceed with unsigned production installers for both macOS (`.dmg`) and Windows (`.exe`).
  - Provide concise, professional download bypass guidance for users directly on the release notes and website:
    - **macOS**: Right-click Shelf in Applications $\rightarrow$ Click **Open** $\rightarrow$ Click **Open** once to approve.
    - **Windows**: Click **More info** $\rightarrow$ Click **Run anyway**.
- **First-Launch Experience**:
  - Automatically detect and index the user's real `Downloads` and `Documents` folders on first launch so shelves are immediately populated with their actual files.

---

### 1. Production Gap Audit & Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Shelf Production Audit                          │
│                                                                        │
│  Current State                            Target Production State      │
│  ───────────────────────────────          ───────────────────────────  │
│  • package.json: "react-example"  ───►    • package.json: "shelf"      │
│  • package.json: version "0.0.0"  ───►    • package.json: "1.0.0"      │
│  • Missing public/ icon assets    ───►    • Crisp 512×512 Shelf Icons  │
│  • electron/builder missing in dev───►    • Locked in devDependencies  │
│  • Manual folder scan only        ───►    • First-launch auto-scan     │
│  • No install bypass guidance     ───►    • Clear user release copy    │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 2. Implementation Steps

#### Step 1: Package Configuration Hardening (`package.json`)
- Update metadata:
  - `"name": "shelf"`
  - `"version": "1.0.0"`
  - `"description": "A calm, visual desktop application for finding and safely reviewing local files across macOS and Windows."`
  - `"author": "Shelf Team"`
- Add packaging toolchain dependencies to `devDependencies`:
  - `"electron": "^34.0.0"`
  - `"electron-builder": "^25.1.8"`

#### Step 2: High-Resolution Desktop Icon Assets (`public/`)
- Create `public/` directory with:
  - `public/icon.png` (512×512 high-resolution icon featuring the modern minimalist layered shelf motif in clean geometric blue tones).
  - `public/favicon.ico` (multi-size desktop favicon and tray icon).
  - `public/shelf-mark.svg` (crisp scalable vector asset for high-DPI screens).

#### Step 3: First-Launch Zero-Click Auto-Indexing
- Ensure `checkAndInitNativeIndexing` in `src/services/storage.ts`:
  - Detects native Electron launch.
  - Automatically queries `osAdapter.getDefaultUserFolders()` (real paths to `~/Downloads` and `~/Documents`).
  - Begins background crawl immediately so that when the main window renders, category shelves populate with real user files.

#### Step 4: User-Facing Download & Installation Guide (`INSTALLATION_GUIDE.md`)
- Create a scannable, copy-ready guide to embed on your website or GitHub Release notes explaining:
  - How to install on macOS (drag to Applications + one-time right-click Open).
  - How to install on Windows (run installer + click "More info" $\rightarrow$ "Run anyway").
  - Explanation of privacy and security guarantees (100% on-device, zero telemetry).

#### Step 5: Verification & Build Validation
- Run `compile_applet` and `lint_applet` to confirm 100% clean compilation.
- Verify that `package.json`, `electron-builder.json5`, and GitHub Actions workflows are aligned.
