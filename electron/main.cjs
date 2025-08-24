// CommonJS entry for Electron main process
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow;

async function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#111827',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    icon: path.join(__dirname, '../public/favicon.ico'),
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
  const isDev = !!process.env.VITE_DEV_SERVER_URL;

  if (isDev) {
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, try multiple paths
    const possiblePaths = [
      path.join(__dirname, '../dist/index.html'),  // Development structure
      path.join(__dirname, 'dist/index.html'),     // App.asar structure
      path.join(process.resourcesPath, 'dist/index.html'), // Resources path
      path.join(app.getAppPath(), 'dist/index.html')       // App path
    ];
    
    let loaded = false;
    for (const indexPath of possiblePaths) {
      try {
        console.log('Trying to load:', indexPath);
        if (require('fs').existsSync(indexPath)) {
          await mainWindow.loadFile(indexPath);
          console.log('Successfully loaded from:', indexPath);
          loaded = true;
          break;
        }
      } catch (error) {
        console.error('Failed to load from', indexPath, ':', error);
      }
    }
    
    if (!loaded) {
      console.error('Could not find index.html in any expected location');
      // Last resort: load from web
      mainWindow.loadURL('https://beam-app-phi.vercel.app');
    }
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});





