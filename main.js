const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1000,
        minHeight: 650,

        frame: false,              // ✅ QUITA barra nativa
        titleBarStyle: "hidden",   // ✅ titlebar personalizada
        backgroundColor: "#1f1f1f",

        webPreferences: {
            preload: path.join(__dirname, "preload.js"), // ✅ seguro
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // 👉 Carga tu login actual
    win.loadFile(path.join(__dirname, "frontend/login/login.html"));

    // Opcional (debug)
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

/* ========= CONTROLES DE VENTANA ========= */
ipcMain.on("win:minimize", () => {
    if (win) win.minimize();
});

ipcMain.on("win:maximize", () => {
    if (!win) return;
    if (win.isMaximized()) win.unmaximize();
    else win.maximize();
});

ipcMain.on("win:close", () => {
    if (win) win.close();
});
