"use strict";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ─── DOM refs ────────────────────────────────────────────────────────────────
const tabBar = $("tabBar");
const newTabBtn = $("newTab");
const urlInput = $("url");
const backBtn = $("back");
const forwardBtn = $("forward");
const reloadBtn = $("reload");
const homeBtn = $("home");
const devtoolsBtn = $("devtools");
const menuBtn = $("menu");
const webview = $("webview");
const newTabPage = $("newTabPage");
const statusText = $("statusText");
const searchInput = $("searchInput");
const searchBtn = $("searchBtn");

// ─── Tab state ───────────────────────────────────────────────────────────────
let tabs = [{ id: 1, title: "New Tab", url: "", active: true, favicon: null }];
let nextTabId = 2;

// ─── Utilities ───────────────────────────────────────────────────────────────

/** Chuẩn hóa URL: thêm https:// nếu cần, hoặc tạo URL tìm kiếm Google */
function normalizeUrl(input) {
    const trimmed = input.trim();
    if (!trimmed) return "";

    // Đã là URL hợp lệ
    if (/^(https?|file|ftp):\/\//i.test(trimmed)) return trimmed;

    // Trông giống domain (có dấu chấm, không có khoảng trắng)
    if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(trimmed)) {
        return "https://" + trimmed;
    }

    // Còn lại: tìm kiếm Google
    return `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
}

/** Rút ngắn URL để hiển thị trên address bar */
function displayUrl(url) {
    try {
        const u = new URL(url);
        return u.hostname + (u.pathname !== "/" ? u.pathname : "");
    } catch {
        return url;
    }
}

/** Lấy tab đang active */
function activeTab() {
    return tabs.find((t) => t.active) || tabs[0];
}

// ─── Render tab bar ───────────────────────────────────────────────────────────
function renderTabs() {
    // Xóa tất cả tab cũ (giữ lại nút +)
    const existingTabs = tabBar.querySelectorAll(".tab");
    existingTabs.forEach((el) => el.remove());

    tabs.forEach((tab) => {
        const el = document.createElement("div");
        el.className = "tab" + (tab.active ? " active" : "");
        el.dataset.tabId = tab.id;
        el.innerHTML = `
      <div class="tab-favicon"></div>
      <span class="tab-title">${escapeHtml(tab.title)}</span>
      <button class="tab-close" title="Đóng tab">×</button>
    `;

        // Click chọn tab
        el.addEventListener("click", (e) => {
            if (e.target.classList.contains("tab-close")) return;
            switchTab(tab.id);
        });

        // Nút đóng tab
        el.querySelector(".tab-close").addEventListener("click", (e) => {
            e.stopPropagation();
            closeTab(tab.id);
        });

        tabBar.insertBefore(el, newTabBtn);
    });
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// ─── Tab operations ───────────────────────────────────────────────────────────
function openNewTab(url = "") {
    tabs.forEach((t) => (t.active = false));
    const newTab = {
        id: nextTabId++,
        title: "New Tab",
        url,
        active: true,
        favicon: null,
    };
    tabs.push(newTab);
    renderTabs();
    navigateTo(url);
}

function switchTab(id) {
    tabs.forEach((t) => (t.active = t.id === id));
    renderTabs();
    const tab = activeTab();
    navigateTo(tab.url, false); // false = không push lịch sử
}

function closeTab(id) {
    if (tabs.length === 1) {
        // Tab cuối: xóa và mở tab mới trống
        tabs = [];
        openNewTab();
        return;
    }

    const idx = tabs.findIndex((t) => t.id === id);
    const wasActive = tabs[idx].active;
    tabs.splice(idx, 1);

    if (wasActive) {
        // Chuyển sang tab kề
        const newIdx = Math.min(idx, tabs.length - 1);
        tabs[newIdx].active = true;
        navigateTo(tabs[newIdx].url, false);
    }

    renderTabs();
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function showWebview() {
    newTabPage.classList.remove("visible");
    webview.classList.add("visible");
}

function showNewTabPage() {
    webview.classList.remove("visible");
    newTabPage.classList.add("visible");
    urlInput.value = "";
    statusText.textContent = "";
}

function navigateTo(url, push = true) {
    const normalized = normalizeUrl(url);

    if (!normalized) {
        showNewTabPage();
        activeTab().url = "";
        return;
    }

    showWebview();
    if (push || webview.src !== normalized) {
        webview.src = normalized;
    }
    activeTab().url = normalized;
    urlInput.value = displayUrl(normalized);
}

// ─── Window controls ──────────────────────────────────────────────────────────
$("min").addEventListener("click", () => window.windowControls.minimize());
$("max").addEventListener("click", () => window.windowControls.maximize());
$("close").addEventListener("click", () => window.windowControls.close());

// ─── Toolbar buttons ──────────────────────────────────────────────────────────
backBtn.addEventListener("click", () => {
    if (webview.canGoBack()) webview.goBack();
    else window.windowControls.previous();
});

forwardBtn.addEventListener("click", () => {
    if (webview.canGoForward()) webview.goForward();
    else window.windowControls.next();
});

reloadBtn.addEventListener("click", () => {
    reloadBtn.classList.add("spinning");
    reloadBtn.addEventListener(
        "animationend",
        () => {
            reloadBtn.classList.remove("spinning");
        },
        { once: true },
    );

    if (webview.classList.contains("visible")) {
        webview.reload();
    } else {
        window.windowControls.reload();
    }
});

homeBtn.addEventListener("click", () => {
    showNewTabPage();
});

devtoolsBtn.addEventListener("click", () => {
    window.windowControls.toggleDevTools();
});

menuBtn.addEventListener("click", () => {
    // Placeholder: có thể mở context menu sau
    window.windowControls.toggleDevTools();
});

// ─── New tab button ───────────────────────────────────────────────────────────
newTabBtn.addEventListener("click", () => openNewTab());

// ─── Address bar ──────────────────────────────────────────────────────────────
urlInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        navigateTo(urlInput.value);
        urlInput.blur();
    }
    if (e.key === "Escape") urlInput.blur();
});

urlInput.addEventListener("focus", () => {
    urlInput.select();
});

// ─── New tab page search ───────────────────────────────────────────────────────
function doSearch() {
    const q = searchInput.value.trim();
    if (!q) return;
    navigateTo(q);
    searchInput.value = "";
}

searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
});

searchBtn.addEventListener("click", doSearch);

// Shortcut clicks
document.querySelectorAll(".shortcut").forEach((link) => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(link.dataset.url);
    });
});

// ─── WebView events ───────────────────────────────────────────────────────────
webview.addEventListener("did-start-loading", () => {
    statusText.textContent = "Đang tải…";
    reloadBtn.title = "Dừng tải";
    backBtn.disabled = !webview.canGoBack();
    forwardBtn.disabled = !webview.canGoForward();
});

webview.addEventListener("did-stop-loading", () => {
    statusText.textContent = "";
    reloadBtn.title = "Tải lại";
    backBtn.disabled = !webview.canGoBack();
    forwardBtn.disabled = !webview.canGoForward();
});

webview.addEventListener("did-navigate", (e) => {
    const url = e.url;
    activeTab().url = url;
    urlInput.value = displayUrl(url);
    backBtn.disabled = !webview.canGoBack();
    forwardBtn.disabled = !webview.canGoForward();
});

webview.addEventListener("did-navigate-in-page", (e) => {
    if (e.isMainFrame) {
        activeTab().url = e.url;
        urlInput.value = displayUrl(e.url);
    }
});

webview.addEventListener("page-title-updated", (e) => {
    activeTab().title = e.title || "Untitled";
    renderTabs();
    document.title = e.title ? `${e.title} — VStar Browser` : "VStar Browser";
});

webview.addEventListener("page-favicon-updated", (e) => {
    if (e.favicons && e.favicons.length > 0) {
        activeTab().favicon = e.favicons[0];
        // Cập nhật favicon trong tab element
        const tabEl = tabBar.querySelector(
            `.tab[data-tab-id="${activeTab().id}"] .tab-favicon`,
        );
        if (tabEl) {
            tabEl.style.backgroundImage = `url(${e.favicons[0]})`;
            tabEl.style.backgroundSize = "contain";
            tabEl.style.backgroundRepeat = "no-repeat";
            tabEl.style.backgroundPosition = "center";
            tabEl.style.backgroundColor = "transparent";
        }
    }
});

webview.addEventListener("update-target-url", (e) => {
    statusText.textContent = e.url || "";
});

webview.addEventListener("new-window", (e) => {
    // Mở new-window request trong tab mới
    openNewTab(e.url);
});

webview.addEventListener("did-fail-load", (e) => {
    if (e.errorCode === -3) return; // Bị hủy (thường do điều hướng mới)
    statusText.textContent = `Lỗi: ${e.errorDescription}`;
});

// ─── IPC từ main process ──────────────────────────────────────────────────────
if (window.electronAPI) {
    // Tạo tab mới từ main (vd: Ctrl+T)
    window.electronAPI.onNewTab(() => {
        openNewTab();
    });

    // Cập nhật tiêu đề từ main
    window.electronAPI.onTitleUpdate((title) => {
        document.title = title;
    });
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────
document.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && e.key === "t") {
        e.preventDefault();
        openNewTab();
    }
    if (ctrl && e.key === "w") {
        e.preventDefault();
        closeTab(activeTab().id);
    }
    if (ctrl && e.key === "r") {
        e.preventDefault();
        reloadBtn.click();
    }
    if (ctrl && e.key === "l") {
        e.preventDefault();
        urlInput.focus();
        urlInput.select();
    }

    if (e.key === "F5") {
        reloadBtn.click();
    }
    if (e.key === "F12") {
        window.windowControls.toggleDevTools();
    }

    // Alt + mũi tên
    if (e.altKey && e.key === "ArrowLeft") backBtn.click();
    if (e.altKey && e.key === "ArrowRight") forwardBtn.click();
});

// ─── Init ─────────────────────────────────────────────────────────────────────
renderTabs();
showNewTabPage();
backBtn.disabled = true;
forwardBtn.disabled = true;
