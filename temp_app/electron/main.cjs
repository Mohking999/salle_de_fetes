const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Allow forcing production behavior locally by setting FORCE_PROD=1
  const isDev = process.env.FORCE_PROD === '1' ? false : (process.env.NODE_ENV === "development" || !app.isPackaged);

  if (isDev) {
    win.loadURL("http://localhost:3000");
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    // In production the app is rendered by the Nitro server in `.output/server`.
    // Spawn the server and wait for it to be available, then load the URL.
    const { spawn } = require("child_process");
    const http = require("http");

    const port = process.env.PORT || 3000;
    const serverEntry = path.join(__dirname, "../.output/server/index.mjs");

    try {
      const child = spawn(process.execPath, [serverEntry], {
        env: Object.assign({}, process.env, { PORT: String(port) }),
        detached: true,
        stdio: "ignore",
      });
      child.unref();
    } catch (e) {
      // fallback: continue — loadFile will fail if no index.html exists
      console.error("Failed to spawn Nitro server:", e && e.message);
    }

    const url = `http://127.0.0.1:${port}`;

    const waitFor = (ms) => new Promise((r) => setTimeout(r, ms));

    (async function waitAndLoad() {
      for (let i = 0; i < 40; i++) {
        try {
          await new Promise((resolve, reject) => {
            const req = http.get(url, (res) => {
              res.resume();
              if (res.statusCode && res.statusCode < 400) resolve();
              else reject(new Error(`status ${res.statusCode}`));
            });
            req.on("error", reject);
            req.setTimeout(2000, () => {
              req.destroy(new Error("timeout"));
            });
          });
          win.loadURL(url);
          return;
        } catch (err) {
          await waitFor(250);
        }
      }
      // final fallback: attempt to load a static file if present
      try {
        win.loadFile(path.join(__dirname, "../.output/public/index.html"));
      } catch (e) {
        console.error("Could not load renderer content:", e && e.message);
      }
    })();
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
