# Den — User Installation & Setup Guide

This guide contains **copy-ready instructions** that you can copy and paste directly onto your website, GitHub README, or release notes so your users can smoothly download, install, and open **Den** on macOS and Windows without getting confused by OS security prompts.

---

## 1. Quick Download Links for Your Website

Add these buttons or links to your website:

| Platform | Download Link | File Type | Compatibility |
| :--- | :--- | :--- | :--- |
| **macOS** (Apple Silicon M1/M2/M3/M4 & Intel) | `https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>/releases/latest/download/Den-1.0.0.dmg` | `.dmg` | macOS 11 Big Sur or newer |
| **Windows** (64-bit Installer) | `https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>/releases/latest/download/Den.Setup.1.0.0.exe` | `.exe` | Windows 10 & 11 (x64) |
| **Windows** (Portable, No install needed) | `https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>/releases/latest/download/Den.1.0.0.exe` | `.exe` | Windows 10 & 11 (x64) |

> Replace `<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>` with your actual GitHub repository URL (e.g. `Ali-5427/Homy`).

---

## 2. macOS Installation Instructions (For Your Users)

Because Den is open-source and released directly via GitHub without a paid Apple Developer certificate, macOS Gatekeeper will show a notice on first launch saying: *"Den cannot be opened because Apple cannot check it for malicious software"*.

Here are the easy 1-minute steps for Mac users:

### Step-by-Step for Mac Users:
1. **Download** `Den-1.0.0.dmg` from the download link.
2. **Double-click** the downloaded `.dmg` file to mount it.
3. **Drag the Den icon** into your **Applications** folder.
4. Go to your **Applications** folder in Finder, **right-click (or Control-click)** on **Den**, and select **Open**.
5. A confirmation dialog will appear. Click **Open**.
6. That's it! Den is now registered on your Mac. You only have to do this once — in the future, you can launch Den normally from Launchpad, Spotlight (`⌘ + Space`), or the Dock.

### Alternative (Terminal):
If preferred, users can also run this single terminal command after moving the app to Applications:
```bash
xattr -cr /Applications/Den.app
```

---

## 3. Windows Installation Instructions (For Your Users)

Because this release is an unsigned indie build, Microsoft Defender SmartScreen will show a blue prompt saying: *"Windows protected your PC — Microsoft Defender SmartScreen prevented an unrecognized app from starting"*.

### Step-by-Step for Windows Users:
1. **Download** `Den.Setup.1.0.0.exe`.
2. **Double-click** the downloaded file to begin installation.
3. When the blue *"Windows protected your PC"* dialog appears:
   - Click the small text link that says **"More info"**.
   - Click the **"Run anyway"** button that appears at the bottom.
4. Follow the brief installer setup. A desktop shortcut and Start Menu item are automatically created.
5. Launch Den from your Start Menu or Desktop!

---

## 4. First-Time Launch & Peace of Mind

When users open Den for the first time:
- **Zero Cloud Uploads**: Den performs 100% on-device indexing with zero cloud tracking.
- **Review-First Safety**: Den will never delete or move files automatically. All duplicate copies or cleanup actions require manual review and explicit user confirmation before moving to the OS Trash/Recycle Bin.
