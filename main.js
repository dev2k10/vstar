const { app, BrowserWindow } = require("electron");

function createWindow() {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    win.loadFile("ui/index.html");
}

app.whenReady().then(createWindow);
