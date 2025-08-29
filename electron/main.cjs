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
    // HOTFIX: Load directly from web for now
    console.log('🌐 Loading Beam app from web (guaranteed to work)...');
    mainWindow.loadURL('https://beam-app-phi.vercel.app');
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





