import { app, BrowserWindow, Menu, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_NAME = 'Constant';
const APP_ID = 'com.projecthellhound.constant';
const ICON = path.join(__dirname, '../build/icon.png');

// ---- Identity: name, desktop file and window class, so the OS shows Constant's icon (not the stock Electron one) ----
app.setName(APP_NAME);
if (process.platform === 'linux') app.setDesktopName('constant.desktop');
if (process.platform === 'win32') app.setAppUserModelId(APP_ID); // taskbar icon grouping + native notifications

// Keep existing user data after the rename: reuse the folder older builds created ("habit-os") if it exists.
try {
  const legacy = path.join(app.getPath('appData'), 'habit-os');
  const current = path.join(app.getPath('appData'), APP_NAME);
  if (fs.existsSync(legacy) && !fs.existsSync(current)) app.setPath('userData', legacy);
} catch { /* fall back to the default location */ }

// ---- Linux: the proprietary NVIDIA stack makes Chromium print "nv_gbm ... nv_common_gbm_create_device failed" and VA-API errors.
// They are harmless driver noise (the terminal launcher filters them), so we keep normal GPU rendering and only turn off the
// failing hardware-video probes. Escape hatches if a window ever fails to appear:
//   CONSTANT_GPU=off constant        software rendering        CONSTANT_OZONE=x11|wayland constant   force the display backend
// main.js rev 4
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('disable-features', 'VaapiVideoDecoder,VaapiVideoEncoder,VaapiIgnoreDriverChecks');
  if (process.env.CONSTANT_OZONE) app.commandLine.appendSwitch('ozone-platform', process.env.CONSTANT_OZONE);
  if (process.env.CONSTANT_GPU === 'off') app.disableHardwareAcceleration();
}

let mainWindow = null;

function createWindow() {
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null); // no stock Electron File/Edit/View menu

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 680,
    title: APP_NAME,
    icon: ICON,
    show: false, // reveal only after the first paint: no blank default window flash
    autoHideMenuBar: true,
    backgroundColor: '#ecf4e8',
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true },
  });
  // Reveal after first paint, but never leave the user waiting on an invisible window: fall back to a timer and log load failures.
  const reveal = () => { if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) mainWindow.show(); };
  mainWindow.once('ready-to-show', reveal);
  mainWindow.webContents.once('did-finish-load', reveal);
  setTimeout(reveal, 4000);
  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => { console.error(`[constant] failed to load ${url}: ${desc} (${code})`); reveal(); });
  mainWindow.webContents.on('render-process-gone', (_e, d) => console.error('[constant] renderer process gone:', d.reason));
  mainWindow.on('page-title-updated', (e) => e.preventDefault()); // keep the window titled "Constant"

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) mainWindow.loadURL(devServerUrl);
  else mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file:') && !url.startsWith(process.env.VITE_DEV_SERVER_URL || 'file:')) e.preventDefault(); });
  mainWindow.on('closed', () => { mainWindow = null; });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); } });
  app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
  });
}

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
