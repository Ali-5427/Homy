/**
 * Shelf Native Desktop Application Main Process
 * Handles native OS windowing, durable JSON file catalog under userData,
 * abortable recursive crawling with progress events, full-file streaming SHA-256
 * duplicate detection, safe authorized-path-only custom protocol, and safe OS Trash routing.
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
  net,
} = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let mainWindow = null;
let tray = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const isMac = process.platform === 'darwin';

// Active scan abort controllers: locationId -> boolean abort flag
const activeScanAborts = new Map();

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

// ============================================================
// DURABLE JSON CATALOG STORE (under app.getPath('userData'))
// ============================================================

function getCatalogFilePath() {
  return path.join(app.getPath('userData'), 'shelf-catalog.json');
}

let inMemoryCatalog = {
  version: 1,
  locations: [],
  files: [],
  settings: null,
  savedSearches: [],
};

function loadCatalogFromDisk() {
  try {
    const catalogPath = getCatalogFilePath();
    if (fs.existsSync(catalogPath)) {
      const data = fs.readFileSync(catalogPath, 'utf8');
      const parsed = JSON.parse(data);
      inMemoryCatalog = {
        version: 1,
        locations: Array.isArray(parsed.locations) ? parsed.locations : [],
        files: Array.isArray(parsed.files) ? parsed.files : [],
        settings: parsed.settings || null,
        savedSearches: Array.isArray(parsed.savedSearches) ? parsed.savedSearches : [],
      };
    }
  } catch (err) {
    console.error('Failed to load catalog from disk:', err);
  }
}

function saveCatalogToDisk() {
  try {
    const catalogPath = getCatalogFilePath();
    const tempPath = `${catalogPath}.tmp-${Date.now()}`;
    const serialized = JSON.stringify(inMemoryCatalog, null, 2);
    // Atomic write via temp file swap
    fs.writeFileSync(tempPath, serialized, 'utf8');
    fs.renameSync(tempPath, catalogPath);
  } catch (err) {
    console.error('Failed to write catalog atomically:', err);
  }
}

// ============================================================
// SECURITY: AUTHORIZED PATH VALIDATION
// ============================================================

function isPathAuthorized(targetPath) {
  if (!targetPath || typeof targetPath !== 'string') return false;
  const normalizedTarget = path.resolve(path.normalize(targetPath));

  // Verify against all authorized indexed locations
  for (const loc of inMemoryCatalog.locations) {
    if (!loc.fullPath) continue;
    const normalizedRoot = path.resolve(path.normalize(loc.fullPath));
    if (
      normalizedTarget === normalizedRoot ||
      normalizedTarget.startsWith(normalizedRoot + path.sep)
    ) {
      return true;
    }
  }
  return false;
}

// ============================================================
// FILE CATEGORIZATION & FULL STREAMING HASHING
// ============================================================

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

/**
 * Stream entire file to compute real SHA-256 without loading full file into RAM
 */
function computeFullFileHash(filePath) {
  return new Promise((resolve) => {
    try {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath, { highWaterMark: 1024 * 1024 }); // 1MB chunk

      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

// ============================================================
// ABORTABLE & SAFE RECURSIVE DIRECTORY CRAWLER
// ============================================================

const SKIP_DIRECTORIES = new Set([
  'node_modules',
  'Library',
  'System32',
  'SysWOW64',
  'Windows',
  '$RECYCLE.BIN',
  'System Volume Information',
  '.git',
  '.svn',
  '.hg',
  '.vscode',
  '.idea',
  'AppData',
  '.Trash',
  '.Spotlight-V100',
  '__pycache__',
]);

async function crawlDirectory(dirPath, locationId, maxDepth = 6, currentDepth = 0, onProgress) {
  const results = [];
  if (currentDepth > maxDepth) return results;
  if (activeScanAborts.get(locationId)) return results;

  let entries;
  try {
    entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch (err) {
    // Inaccessible directory, skip gracefully without crashing
    return results;
  }

  for (const entry of entries) {
    if (activeScanAborts.get(locationId)) break;

    // Filter hidden files/directories and dangerous/system folders
    if (
      entry.name.startsWith('.') ||
      entry.name.startsWith('$') ||
      SKIP_DIRECTORIES.has(entry.name)
    ) {
      continue;
    }

    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const subFiles = await crawlDirectory(
        fullPath,
        locationId,
        maxDepth,
        currentDepth + 1,
        onProgress
      );
      results.push(...subFiles);
    } else if (entry.isFile()) {
      try {
        const stats = await fs.promises.stat(fullPath);
        const ext = path.extname(entry.name).replace(/^\./, '');
        const kind = getFileKind(ext);
        const isScreenshot = /^(screenshot|screen\s*shot|screen\s*grab)/i.test(entry.name);

        const fileRecord = {
          id: `real-${crypto.createHash('md5').update(fullPath).digest('hex').slice(0, 12)}`,
          displayName: entry.name,
          extension: ext.toLowerCase(),
          kind,
          size: stats.size,
          createdAt: stats.birthtimeMs || stats.mtimeMs,
          modifiedAt: stats.mtimeMs,
          locationId,
          locationPath: dirPath,
          fullPath,
          isScreenshot,
          sha256: undefined, // Computed on demand for duplicate candidate sizing
          previewUrl:
            kind === 'image'
              ? `shelf-local://${encodeURIComponent(fullPath.replace(/\\/g, '/'))}`
              : undefined,
          extractedTextStatus: 'none',
        };

        results.push(fileRecord);

        if (onProgress && results.length % 20 === 0) {
          onProgress({
            locationId,
            currentPath: fullPath,
            filesFound: results.length,
          });
        }
      } catch {
        // Individual file stat error, skip
      }
    }
  }

  return results;
}

// ============================================================
// WINDOW & TRAY LIFECYCLE
// ============================================================

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#F8F9FB',
    title: 'Den',
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

function createTray() {
  try {
    const iconPath = path.join(__dirname, '..', 'public', 'favicon.ico');
    if (fs.existsSync(iconPath)) {
      tray = new Tray(iconPath);
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Open Den',
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
          label: 'Quit Den',
          click: () => {
            app.quit();
          },
        },
      ]);
      tray.setToolTip('Den — Visual Desktop File Finder');
      tray.setContextMenu(contextMenu);
    }
  } catch (err) {
    console.warn('Tray initialization skipped:', err.message);
  }
}

// ============================================================
// IPC HANDLERS
// ============================================================

ipcMain.handle('get-platform', () => (isMac ? 'mac' : 'windows'));

ipcMain.handle('get-catalog-data', () => {
  return {
    locations: inMemoryCatalog.locations,
    savedSearches: inMemoryCatalog.savedSearches,
    settings: inMemoryCatalog.settings,
    totalFilesCount: inMemoryCatalog.files.length,
    totalBytes: inMemoryCatalog.files.reduce((acc, f) => acc + f.size, 0),
  };
});

ipcMain.handle('save-catalog-meta', (_event, { locations, settings, savedSearches }) => {
  if (Array.isArray(locations)) inMemoryCatalog.locations = locations;
  if (settings) inMemoryCatalog.settings = settings;
  if (Array.isArray(savedSearches)) inMemoryCatalog.savedSearches = savedSearches;
  saveCatalogToDisk();
  return { success: true };
});

/**
 * Filtered / Paginated Query to prevent dumping 50k items across IPC
 */
ipcMain.handle('query-files', (_event, options = {}) => {
  const {
    locationId,
    kind,
    searchQuery,
    isScreenshot,
    limit = 200,
    offset = 0,
    sortBy = 'modifiedAt',
    sortOrder = 'desc',
    includeTrashed = false,
  } = options;

  let filtered = inMemoryCatalog.files;

  if (!includeTrashed) {
    filtered = filtered.filter((f) => !f.isTrashed);
  }
  if (locationId) {
    filtered = filtered.filter((f) => f.locationId === locationId);
  }
  if (kind && kind !== 'all') {
    filtered = filtered.filter((f) => f.kind === kind);
  }
  if (isScreenshot) {
    filtered = filtered.filter((f) => f.isScreenshot);
  }
  if (searchQuery && typeof searchQuery === 'string') {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(
        (f) =>
          f.displayName.toLowerCase().includes(q) ||
          f.extension.toLowerCase().includes(q) ||
          (f.locationPath && f.locationPath.toLowerCase().includes(q))
      );
    }
  }

  // Sort
  filtered.sort((a, b) => {
    let valA = a[sortBy] ?? 0;
    let valB = b[sortBy] ?? 0;
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const total = filtered.length;
  const items = filtered.slice(offset, offset + limit);

  return {
    total,
    offset,
    limit,
    items,
  };
});

ipcMain.handle('get-library-summary', () => {
  const activeFiles = inMemoryCatalog.files.filter((f) => !f.isTrashed);
  const count = activeFiles.length;
  const totalBytes = activeFiles.reduce((acc, f) => acc + f.size, 0);

  const kindCounts = {
    image: 0,
    video: 0,
    audio: 0,
    document: 0,
    archive: 0,
    app: 0,
  };

  activeFiles.forEach((f) => {
    if (kindCounts[f.kind] !== undefined) {
      kindCounts[f.kind]++;
    }
  });

  return {
    count,
    totalBytes,
    kindCounts,
    locationsCount: inMemoryCatalog.locations.length,
  };
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

ipcMain.handle('start-scan-location', async (event, folderPath, locationId, maxDepth = 6) => {
  try {
    if (!fs.existsSync(folderPath)) {
      return { success: false, error: 'Folder does not exist', filesCount: 0 };
    }

    activeScanAborts.set(locationId, false);

    const onProgress = (info) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('scan-progress', info);
      }
    };

    const newFiles = await crawlDirectory(folderPath, locationId, maxDepth, 0, onProgress);
    const wasAborted = activeScanAborts.get(locationId);
    activeScanAborts.delete(locationId);

    if (wasAborted) {
      return { success: false, error: 'Scan was stopped by user', filesCount: 0 };
    }

    // Replace files for this location in durable catalog
    inMemoryCatalog.files = inMemoryCatalog.files
      .filter((f) => f.locationId !== locationId)
      .concat(newFiles);

    // Update location stats in catalog
    const count = newFiles.length;
    const totalSize = newFiles.reduce((acc, f) => acc + f.size, 0);

    inMemoryCatalog.locations = inMemoryCatalog.locations.map((loc) =>
      loc.id === locationId
        ? { ...loc, status: 'indexed', fileCount: count, totalSize }
        : loc
    );

    saveCatalogToDisk();

    return {
      success: true,
      filesCount: newFiles.length,
      totalBytes: totalSize,
    };
  } catch (err) {
    activeScanAborts.delete(locationId);
    return { success: false, error: err.message, filesCount: 0 };
  }
});

ipcMain.handle('abort-scan', (_event, locationId) => {
  if (locationId) {
    activeScanAborts.set(locationId, true);
  } else {
    // Abort all
    for (const key of activeScanAborts.keys()) {
      activeScanAborts.set(key, true);
    }
  }
  return { success: true };
});

ipcMain.handle('remove-location-index', (_event, locationId) => {
  inMemoryCatalog.locations = inMemoryCatalog.locations.filter((l) => l.id !== locationId);
  inMemoryCatalog.files = inMemoryCatalog.files.filter((f) => f.locationId !== locationId);
  saveCatalogToDisk();
  return { success: true };
});

ipcMain.handle('clear-all-index', () => {
  inMemoryCatalog.files = [];
  inMemoryCatalog.locations = inMemoryCatalog.locations.map((loc) => ({
    ...loc,
    status: 'paused',
    fileCount: 0,
    totalSize: 0,
  }));
  saveCatalogToDisk();
  return { success: true };
});

/**
 * Full-file SHA-256 Duplicate Detector:
 * Groups files with identical sizes first, streams SHA-256 for size collisions only.
 */
ipcMain.handle('compute-duplicates', async (event) => {
  const activeFiles = inMemoryCatalog.files.filter((f) => !f.isTrashed && f.size > 0);

  // 1. Group by exact size
  const sizeMap = new Map();
  for (const file of activeFiles) {
    const list = sizeMap.get(file.size) || [];
    list.push(file);
    sizeMap.set(file.size, list);
  }

  // Filter sizes with at least 2 files
  const sizeCollisionFiles = [];
  for (const [size, list] of sizeMap.entries()) {
    if (list.length > 1) {
      sizeCollisionFiles.push(...list);
    }
  }

  // 2. Compute full-file SHA-256 for candidate collision files
  let processed = 0;
  for (const file of sizeCollisionFiles) {
    if (!file.sha256) {
      const fullPath = file.fullPath || path.join(file.locationPath, file.displayName);
      file.sha256 = await computeFullFileHash(fullPath);
      processed++;
      if (processed % 10 === 0 && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('duplicate-hash-progress', {
          processed,
          total: sizeCollisionFiles.length,
        });
      }
    }
  }

  saveCatalogToDisk();

  // 3. Group by full SHA-256 hash
  const hashMap = new Map();
  for (const file of sizeCollisionFiles) {
    if (file.sha256) {
      const list = hashMap.get(file.sha256) || [];
      list.push(file);
      hashMap.set(file.sha256, list);
    }
  }

  const groups = [];
  let totalPotentialSavings = 0;

  for (const [hash, members] of hashMap.entries()) {
    if (members.length > 1) {
      // Prioritize keeping Documents, then oldest
      const sorted = [...members].sort((a, b) => {
        if (a.locationPath.includes('Documents') && !b.locationPath.includes('Documents')) return -1;
        if (!a.locationPath.includes('Documents') && b.locationPath.includes('Documents')) return 1;
        return a.createdAt - b.createdAt;
      });

      const proposedKeep = sorted[0];
      const extras = sorted.slice(1);
      const savings = extras.reduce((sum, f) => sum + f.size, 0);
      totalPotentialSavings += savings;

      groups.push({
        id: `dup-${hash}`,
        hash,
        displayName: proposedKeep.displayName,
        kind: proposedKeep.kind,
        sizePerFile: proposedKeep.size,
        memberFiles: sorted,
        proposedKeepId: proposedKeep.id,
        potentialSavings: savings,
      });
    }
  }

  return { groups, totalPotentialSavings };
});

ipcMain.handle('trash-items', async (_event, filePaths) => {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    return { success: false, error: 'No files specified to trash' };
  }

  const errors = [];
  const trashedPaths = [];

  for (const filePath of filePaths) {
    try {
      if (!fs.existsSync(filePath)) {
        errors.push({ filePath, error: 'File does not exist on disk' });
        continue;
      }
      await shell.trashItem(filePath);
      trashedPaths.push(filePath);
    } catch (err) {
      errors.push({ filePath, error: err.message });
    }
  }

  // Update in-memory catalog
  if (trashedPaths.length > 0) {
    const trashedSet = new Set(trashedPaths.map((p) => path.normalize(p).toLowerCase()));
    inMemoryCatalog.files = inMemoryCatalog.files.map((file) => {
      const fullPath = file.fullPath || path.join(file.locationPath, file.displayName);
      if (trashedSet.has(path.normalize(fullPath).toLowerCase())) {
        return { ...file, isTrashed: true };
      }
      return file;
    });
    saveCatalogToDisk();
  }

  return {
    success: errors.length === 0,
    trashedCount: trashedPaths.length,
    errors,
  };
});

ipcMain.handle('show-in-folder', async (_event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'File does not exist' };
    }
    shell.showItemInFolder(filePath);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('open-path', async (_event, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: 'File does not exist on disk' };
    }
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
      title: 'Authorize Folder for Den Indexing',
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

// ============================================================
// APP LIFECYCLE & PROTOCOL SECURITY
// ============================================================

app.whenReady().then(() => {
  loadCatalogFromDisk();

  // Custom protocol: STRICT AUTHORIZED-PATH-ONLY VALIDATION
  protocol.handle('shelf-local', (request) => {
    try {
      const rawUrl = request.url.replace(/^shelf-local:\/\//, '');
      const decodedPath = decodeURIComponent(rawUrl);

      // Verify the requested path is inside an authorized folder
      if (!isPathAuthorized(decodedPath)) {
        console.warn('Blocked unauthorized shelf-local access to:', decodedPath);
        return new Response('Forbidden: Path is outside authorized Shelf locations', {
          status: 403,
        });
      }

      if (!fs.existsSync(decodedPath)) {
        return new Response('File Not Found', { status: 404 });
      }

      return net.fetch(`file://${encodeURI(decodedPath.replace(/\\/g, '/'))}`);
    } catch (err) {
      return new Response('Error loading file', { status: 500 });
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
