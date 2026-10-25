/**
 * Shelf Native Desktop Application Main Process
 * Handles native OS windowing, file management, system tray,
 * global shortcuts, and safe OS Trash routing.
 */

const { app, BrowserWindow, ipcMain, shell, dialog, clipboard, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let tray = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const isMac = process.platform === 'darwin';

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
    // In production build, load static dist/index.html
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
    // 16x16 or 22x22 template icon
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

// IPC Handlers: Narrow, auditable native OS boundary
ipcMain.handle('get-platform', () => {
  return isMac ? 'mac' : 'windows';
});

ipcMain.handle('trash-item', async (_event, filePath) => {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { success: false, error: 'Invalid file path' };
    }
    // Real native OS Trash / Recycle Bin dispatch
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
  createWindow();
  createTray();

  // Register Global Shortcut (Cmd+K on macOS, Ctrl+K on Windows)
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
