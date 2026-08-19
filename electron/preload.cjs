const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  database: {
    call: (operation, data) => ipcRenderer.invoke("offline-db:call", operation, data),
    backup: () => ipcRenderer.invoke("offline-db:backup"),
    restore: (confirmed) => ipcRenderer.invoke("offline-db:restore", confirmed === true),
    openDataFolder: () => ipcRenderer.invoke("offline-db:open-data-folder"),
  },
});
