const browser = document.getElementById("browser");
const urlBar = document.getElementById("url");

function go() {
    let url = urlBar.value;

    if (!url.startsWith("http")) {
        url = "https://" + url;
    }

    browser.src = url;
}
