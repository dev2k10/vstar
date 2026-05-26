"use strict";

const { app, BrowserWindow, ipcMain, session } = require("electron");
const path = require("path");

let win;

// ─── Tạo cửa sổ chính ───────────────────────────────────────────────────────
function createWindow() {
    win = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        frame: false, // Dùng titlebar tùy chỉnh
        titleBarStyle: "hidden",
        backgroundColor: "#0f0f0f",
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true, // Bảo mật: cách ly context
            nodeIntegration: false, // Không cho renderer dùng Node
            webviewTag: true, // Cho phép thẻ <webview>
            sandbox: false, // Cần false để preload hoạt động
        },
    });

    win.loadFile(path.join(__dirname, "ui", "index.html"));

    // Mở DevTools khi develop (xóa dòng này khi release)
    // win.webContents.openDevTools()

    win.on("closed", () => {
        win = null;
    });
}

// ─── Khởi động app ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
    // Cho phép webview load nội dung bên ngoài
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": [
                    "default-src 'self' 'unsafe-inline' 'unsafe-eval' *",
                ],
            },
        });
    });

    createWindow();

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

// ─── IPC: Điều khiển cửa sổ ─────────────────────────────────────────────────
ipcMain.on("minimize", () => win?.minimize());

ipcMain.on("maximize", () => {
    if (!win) return;
    win.isMaximized() ? win.unmaximize() : win.maximize();
});

ipcMain.on("close", () => win?.close());

// ─── IPC: DevTools ───────────────────────────────────────────────────────────
ipcMain.on("toggle-devtools", () => {
    if (!win) return;
    win.webContents.isDevToolsOpened()
        ? win.webContents.closeDevTools()
        : win.webContents.openDevTools({ mode: "detach" });
});

// ─── IPC: Navigation ─────────────────────────────────────────────────────────
ipcMain.on("reload", () => win?.webContents.reload());
ipcMain.on("previous", () => win?.webContents.goBack());
ipcMain.on("next", () => win?.webContents.goForward());
ipcMain.on("go-home", () =>
    win?.webContents.loadFile(path.join(__dirname, "ui", "index.html")),
);

// ─── IPC: Tab mới ────────────────────────────────────────────────────────────
ipcMain.on("new-tab", () => {
    // Gửi tín hiệu về renderer để tạo tab mới
    win?.webContents.send("new-tab");
});

// ─── IPC: Điều hướng URL từ address bar ─────────────────────────────────────
ipcMain.on("navigate", (_event, url) => {
    win?.webContents.send("did-navigate", url);
});
