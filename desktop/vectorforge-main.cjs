const { app, BrowserWindow, shell, session } = require("electron");

const APP_URL = process.env.VECTORFORGE_APP_URL || "https://vectorforge-bhaxx6cm.manus.space/#vector";

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 720,
    backgroundColor: "#f4f5f7",
    autoHideMenuBar: true,
    title: "VectorForge",
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  window.loadURL(APP_URL);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_contents, permission, callback) => {
    callback(permission === "clipboard-read" || permission === "clipboard-sanitized-write");
  });
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
