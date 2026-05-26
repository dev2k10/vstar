"use strict";

const { contextBridge, ipcRenderer } = require("electron");

// Whitelist các kênh IPC hợp lệ để bảo mật
const VALID_CHANNELS = [
    "minimize",
    "maximize",
    "close",
    "toggle-devtools",
    "new-tab",
    "reload",
    "previous",
    "next",
    "close-tab",
    "navigate",
    "go-home",
];

contextBridge.exposeInMainWorld("windowControls", {
    minimize: () => ipcRenderer.send("minimize"),
    maximize: () => ipcRenderer.send("maximize"),
    close: () => ipcRenderer.send("close"),
    toggleDevTools: () => ipcRenderer.send("toggle-devtools"),
    newTab: () => ipcRenderer.send("new-tab"),
    reload: () => ipcRenderer.send("reload"),
    previous: () => ipcRenderer.send("previous"),
    next: () => ipcRenderer.send("next"),
    navigate: (url) => ipcRenderer.send("navigate", url),
    goHome: () => ipcRenderer.send("go-home"),
});

// Lắng nghe sự kiện từ main process → renderer
contextBridge.exposeInMainWorld("electronAPI", {
    onNewTab: (callback) => {
        ipcRenderer.on("new-tab", (_event) => callback());
    },
    onNavigate: (callback) => {
        ipcRenderer.on("did-navigate", (_event, url) => callback(url));
    },
    onTitleUpdate: (callback) => {
        ipcRenderer.on("title-updated", (_event, title) => callback(title));
    },
    removeAllListeners: (channel) => {
        if (VALID_CHANNELS.includes(channel)) {
            ipcRenderer.removeAllListeners(channel);
        }
    },
});
