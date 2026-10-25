/**
 * Shelf Native Desktop Application Main Process
 * Handles native OS windowing, file management, system tray,
 * global shortcuts, safe OS Trash routing, and REAL local filesystem indexing.
 */

const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  dialog,
  clipboard,
  globalShortcut,
  Tray,
  Menu,
  protocol,
  nativeImage,
  net,
} = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow = null;
let tray = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const isMac = process.platform === 'darwin';

// Register custom safe protocol for local media playback and thumbnails
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'shelf-local',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#F8F9FB',
    title: 'Shelf',
    show: false,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the web application
  if (isDev && process.env.DEV_URL) {
    mainWindow.loadURL(process.env.DEV_URL);
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      mainWindow.loadFile(indexPath);
    } else {
      mainWindow.loadURL('http://localhost:3000');
    }
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Setup System Tray / Menu Bar Item
function createTray() {
  try {
    const iconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath);
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Open Shelf',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            } else {
              createWindow();
            }
          },
        },
        {
          label: 'Quick Search (⌘K / Ctrl+K)',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.webContents.send('shortcut-trigger', 'quick-search');
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Quit Shelf',
          click: () => {
            app.quit();
          },
        },
      ]);
      tray.setToolTip('Shelf — Visual Desktop File Finder');
      tray.setContextMenu(contextMenu);
    }
  } catch (err) {
    console.warn('Tray initialization skipped:', err.message);
  }
}

// File extension categorizer
function getFileKind(ext) {
  const cleanExt = ext.toLowerCase().replace(/^\./, '');
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'avif', 'tiff', 'ico'];
  const videoExts = ['mp4', 'mov', 'mkv', 'avi', 'webm', 'm4v', 'flv', 'wmv'];
  const audioExts = ['mp3', 'wav', 'm4a', 'flac', 'aac', 'ogg', 'wma', 'aiff'];
  const docExts = ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'txt', 'md', 'csv', 'rtf', 'epub', 'pages', 'numbers', 'key'];
  const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'dmg', 'iso', 'tgz'];
  const appExts = ['app', 'exe', 'dmg', 'pkg', 'msi', 'apk', 'deb', 'rpm'];

  if (imageExts.includes(cleanExt)) return 'image';
  if (videoExts.includes(cleanExt)) return 'video';
  if (audioExts.includes(cleanExt)) return 'audio';
  if (docExts.includes(cleanExt)) return 'document';
  if (archiveExts.includes(cleanExt)) return 'archive';
  if (appExts.includes(cleanExt)) return 'app';
  return 'document';
}

// Generate fast SHA-256 hash for exact duplicate detection
async function computeFastFileHash(filePath, size) {
  try {
    if (size === 0) return null;
    const hash = crypto.createHash('sha256');
    // Read up to first 2MB for ultra-fast matching without freezing disk I/O
    const bufferSize = Math.min(size, 2 * 1024 * 1024);
    const fd = await fs.promises.open(filePath, 'r');
    const buffer = Buffer.alloc(bufferSize);
    await fd.read(buffer, 0, bufferSize, 0);
    await fd.close();
    hash.update(buffer);
    // Combine with file size for uniqueness
    hash.update(size.toString());
    return hash.digest('hex');
  } catch {
    return null;
  }
}

// Real recursive filesystem scanner
async function crawlDirectory(dirPath, locationId, maxDepth = 2, currentDepth = 0) {
  const results = [];
  if (currentDepth > maxDepth) return results;

  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      // Skip hidden files, system directories, node_modules, and cache
      if (entry.name.startsWith('.') || entry.name.startsWith('$') || entry.name === 'node_modules' || entry.name === 'Library') {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await crawlDirectory(fullPath, locationId, maxDepth, currentDepth + 1);
        results.push(...subFiles);
      } else if (entry.isFile()) {
        try {
          const stats = await fs.promises.stat(fullPath);
          const ext = path.extname(entry.name).replace(/^\./, '');
          const kind = getFileKind(ext);
          const isScreenshot = /^(screenshot|screen\s*shot|screen\s*grab)/i.test(entry.name);

          // Fast hash calculation for duplicate scanner
          const hash = await computeFastFileHash(fullPath, stats.size);

          // Construct real FileItem record
          results.push({
            id: `real-${crypto.createHash('md5').update(fullPath).digest('hex').slice(0, 12)}`,
            displayName: entry.name,
            extension: ext.toLowerCase(),
            kind,
            size: stats.size,
            createdAt: stats.birthtimeMs || stats.mtimeMs,
            modifiedAt: stats.mtimeMs,
            locationId,
            locationPath: dirPath,
            isScreenshot,
            sha256: hash,
            previewUrl: kind === 'image' ? `shelf-local://${encodeURIComponent(fullPath)}` : undefined,
            extractedTextStatus: 'none',
          });
        } catch {
          // Skip inaccessible files safely
        }
      }
    }
  } catch (err) {
    console.warn(`Could not read directory ${dirPath}:`, err.message);
  }

  return results;
}

// IPC Handlers
ipcMain.handle('get-platform', () => {
  return isMac ? 'mac' : 'windows';
});

ipcMain.handle('get-default-user-folders', () => {
  try {
    const downloads = app.getPath('downloads');
    const documents = app.getPath('documents');
    const desktop = app.getPath('desktop');

    return [
      { id: 'loc-downloads', displayName: 'Downloads', fullPath: downloads, isDefault: true },
      { id: 'loc-documents', displayName: 'Documents', fullPath: documents, isDefault: true },
      { id: 'loc-desktop', displayName: 'Desktop', fullPath: desktop, isDefault: true },
    ];
  } catch {
    return [];
  }
});

ipcMain.handle('scan-folder', async (_event, folderPath, locationId) => {
  try {
    if (!fs.existsSync(folderPath)) {
      return { success: false, error: 'Folder does not exist', files: [] };
    }
    const files = await crawlDirectory(folderPath, locationId || 'loc-custom', 2);
    return { success: true, files };
  } catch (err) {
    return { success: false, error: err.message, files: [] };
  }
});

ipcMain.handle('trash-item', async (_event, filePath) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Invalid file path' };
    }
    await shell.trashItem(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('show-in-folder', async (_event, filePath) => {
  try {
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-path', async (_event, filePath) => {
  try {
    const errorString = await shell.openPath(filePath);
    if (errorString) {
      return { success: false, error: errorString };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Authorize Folder for Shelf Indexing',
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const folderPath = result.filePaths[0];
    const folderName = path.basename(folderPath);
    return { path: folderPath, name: folderName };
  } catch (err) {
    console.error('Error selecting folder:', err);
    return null;
  }
});

ipcMain.handle('copy-to-clipboard', (_event, text) => {
  clipboard.writeText(text);
  return true;
});

// App Lifecycle
app.whenReady().then(() => {
  // Register custom protocol handler for local images & previews
  protocol.handle('shelf-local', (request) => {
    try {
      const decodedPath = decodeURIComponent(request.url.replace('shelf-local://', ''));
      return net.fetch(`file://${decodedPath}`);
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });

  createWindow();
  createTray();

  const shortcutKey = isMac ? 'Command+K' : 'Control+K';
  try {
    globalShortcut.register(shortcutKey, () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('shortcut-trigger', 'quick-search');
      }
    });
  } catch (e) {
    console.warn('Could not register global shortcut:', e);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});
