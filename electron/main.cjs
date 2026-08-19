const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { LocalDatabase } = require("./database.cjs");

let mainWindow;
let database;

function appDataPath() {
  // Keep mutable data out of the install directory and source project.
  return path.join(process.env.LOCALAPPDATA || app.getPath("userData"), "Salle des Fêtes");
}

function registerIpc() {
  const operations = {
    getManagerMonth: (data) => database.month(data),
    getRevenue: (data) => database.revenue(data),
    createSalle: (data) => database.createSalle(data),
    saveReservation: (data) => database.saveReservation(data),
    setReservationStatus: (data) => database.setStatus(data),
    updateIdCardStatus: (data) => database.updateIdCardStatus(data),
    deleteReservation: (data) => database.deleteReservation(data),
    addVersement: (data) => database.addVersement(data),
    deleteVersement: (data) => database.deleteVersement(data),
    addRemise: (data) => database.addRemise(data),
  };
  ipcMain.handle("offline-db:call", (_event, operation, data) => {
    if (!Object.hasOwn(operations, operation)) throw new Error("Opération locale non autorisée.");
    return operations[operation](data || {});
  });
  ipcMain.handle("offline-db:backup", async () => {
    const fallback = path.join(database.paths.backups, `salle-des-fetes-${new Date().toISOString().slice(0, 10)}.db`);
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Enregistrer la sauvegarde",
      defaultPath: fallback,
      filters: [{ name: "Base de données SQLite", extensions: ["db", "sqlite"] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    database.backup(result.filePath);
    return { canceled: false, filePath: result.filePath };
  });
  ipcMain.handle("offline-db:restore", async (_event, confirmed) => {
    if (!confirmed) throw new Error("La restauration doit être confirmée.");
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choisir une sauvegarde à restaurer",
      properties: ["openFile"],
      filters: [{ name: "Base de données SQLite", extensions: ["db", "sqlite"] }],
    });
    if (result.canceled || !result.filePaths[0]) return { canceled: true };
    const source = result.filePaths[0];
    if (!fs.statSync(source).isFile()) throw new Error("Fichier de sauvegarde invalide.");
    database.restore(source);
    return { canceled: false };
  });
  ipcMain.handle("offline-db:open-data-folder", () => shell.openPath(database.paths.root));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 900, minWidth: 1024, minHeight: 768,
    title: "Salle des Fêtes",
    icon: path.join(__dirname, "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });
  if (!app.isPackaged && process.env.NODE_ENV === "development") {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../build/renderer/index.html"));
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.salle-des-fetes.app");
  database = new LocalDatabase(appDataPath());
  registerIpc();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
app.on("before-quit", () => database?.close());
