# Shelf — User Installation & Bypass Guide

This guide contains **copy-ready instructions** that you can copy and paste directly onto your website, GitHub README, or release notes so your users can smoothly download, install, and open **Shelf** on macOS and Windows without getting confused by OS security prompts.

---

## 1. Quick Download Links for Your Website

Add these buttons or links to your website:

| Platform | Download Link | File Type | Compatibility |
| :--- | :--- | :--- | :--- |
| **macOS** (Apple Silicon M1/M2/M3/M4 & Intel) | `https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>/releases/latest/download/Shelf-1.0.0.dmg` | `.dmg` | macOS 11 Big Sur or newer |
| **Windows** (64-bit Installer) | `https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>/releases/latest/download/Shelf-Setup-1.0.0.exe` | `.exe` | Windows 10 & 11 (x64) |
| **Windows** (Portable, No install needed) | `https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>/releases/latest/download/Shelf-1.0.0-win.exe` | `.exe` | Windows 10 & 11 (x64) |

> Replace `<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>` with your actual GitHub repository URL (e.g. `john/shelf`).

---

## 2. macOS Installation Instructions (For Your Users)

Because Shelf is open-source and released directly via GitHub without a $99/yr Apple Developer certificate, macOS Gatekeeper will show a notice on first launch saying: *"Shelf cannot be opened because Apple cannot check it for malicious software"*.

Here are the easy 1-minute steps for Mac users:

### Step-by-Step for Mac Users:
1. **Download** `Shelf-1.0.0.dmg` from the download link.
2. **Double-click** the downloaded `.dmg` file to mount it.
3. **Drag the Shelf icon** into your **Applications** folder.
4. Go to your **Applications** folder in Finder, **right-click (or Control-click)** on **Shelf**, and select **Open**.
5. A confirmation dialog will appear. Click **Open**.
6. That's it! Shelf is now registered on your Mac. You only have to do this once — in the future, you can launch Shelf normally from Launchpad, Spotlight (`⌘ + Space`), or the Dock.

### Alternative (Terminal):
If preferred, users can also run this single terminal command after moving the app to Applications:
```bash
xattr -cr /Applications/Shelf.app
```

---

## 3. Windows Installation Instructions (For Your Users)

Because this release is an unsigned community build, Microsoft Defender SmartScreen will show a blue prompt saying: *"Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting"*.

### Step-by-Step for Windows Users:
1. **Download** `Shelf-Setup-1.0.0.exe`.
2. **Double-click** the downloaded file to begin installation.
3. When the blue *"Windows protected your PC"* dialog appears:
   - Click the underlined text **"More info"**.
   - Click the **"Run anyway"** button that appears at the bottom.
4. Follow the brief installer setup. A desktop shortcut and Start Menu entry for Shelf will be created automatically.
5. Launch Shelf from your Start Menu or Desktop!

---

## 4. First Launch & Privacy Guarantee

When users open Shelf for the first time:
- **Instant Indexing**: Shelf automatically discovers their local `Downloads` and `Documents` folders and organizes items into visual category cards (Images, Videos, Music, Documents, Archives, Apps).
- **100% On-Device & Private**: Shelf performs zero telemetry, zero analytics, zero cloud syncing, and zero remote API calls. All file classification and duplicate detection (SHA-256) run entirely on their local CPU.
- **Review-First Safety**: Shelf will never delete, move, or modify files without explicit confirmation. Sending files to trash always routes safely to the native macOS Trash or Windows Recycle Bin.
