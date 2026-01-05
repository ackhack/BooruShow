let intervalId = null;

const defaultUrl = "https://danbooru.donmai.us/posts.json?tags=animated&limit=1";
const defaultInterval = 5;

// Load last saved settings
window.addEventListener("DOMContentLoaded", async () => {
    const data = await browser.storage.local.get(["url", "interval"]);

    document.getElementById("urlInput").placeholder = defaultUrl;
    if (data.url) document.getElementById("urlInput").value = data.url;

    document.getElementById("intervalInput").placeholder = defaultInterval;
    if (data.interval) document.getElementById("intervalInput").value = data.interval;
});

document.getElementById("startBtn").addEventListener("click", async () => {
    let url = document.getElementById("urlInput").value.trim();
    let intervalSec = parseFloat(document.getElementById("intervalInput").value);

    if (!url) url = defaultUrl;
    if (!intervalSec || intervalSec <= 0) interval = defaultInterval;

    // Save settings
    await browser.storage.local.set({ url, intervalSec });

    // Start timer in background
    browser.runtime.sendMessage({ command: "start" });
});
