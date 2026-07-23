// Listen for messages from popup
browser.runtime.onMessage.addListener(async (msg) => {
    console.log(msg.command);
    if (msg.command === "start") startTimer();
    else if (msg.command === "triggerShow") timerIteration(msg.tabId);
});

// Start a repeating alarm
function startTimer() {
    timerIteration(undefined);
}

// Runs everytime the alarm triggers
async function timerIteration(tabId) {
    // Open immediately
    await triggerTabOpen(tabId);
}

// In-memory cache: Map<url, { data: array, currentIndex: number }>
const urlRotationCache = new Map();

// Open tab based on storage URL

async function triggerTabOpen(tabId) {
    const data = await browser.storage.local.get("url");
    const jsonUrl = data.url;
    console.log("Target URL:", jsonUrl);

    if (!jsonUrl) return;

    // 1. Check cache
    const cache = urlRotationCache.get(jsonUrl);
    let json = cache?.data;
    let nextIndex = cache?.index ?? 0;

    // 2. Fetch if not cached or invalid
    if (!json || !Array.isArray(json) || nextIndex >= json.length) {
        try {
            urlRotationCache.delete(jsonUrl);
            const response = await fetchUrl(jsonUrl);
            if (!response || !Array.isArray(response)) {
                throw new Error("Expected a JSON array");
            }
            json = response;
            nextIndex = 0;
            // Store in cache
            console.log("Caching " + json.length + " entries for " + jsonUrl);
            urlRotationCache.set(jsonUrl, { data: json, index: nextIndex });
        } catch (err) {
            console.error("Failed to fetch or parse JSON:", err);
            return;
        }
    } else {
        console.log("Accessing cache for " + jsonUrl);
    }

    // 4. Select current item & advance index for next call
    //clear cache if we have reached the end
    const currentItem = json[nextIndex];
    if (nextIndex < json.length)
        urlRotationCache.set(jsonUrl, { data: json, index: nextIndex + 1 });
    else 
        urlRotationCache.delete(jsonUrl);

    // 5. Extract & open the last variant
    const variants = currentItem?.media_asset?.variants;
    if (Array.isArray(variants) && variants.length > 0) {
        const lastVariantUrl = variants[variants.length - 1].url;
        console.log("Opening tab with variant:", lastVariantUrl);
        
        const newTabId = await openLink(lastVariantUrl, tabId);
        waitForTabCompletion(newTabId, await getDefaultDuration());
    } else {
        console.warn(`No variants found at index ${nextIndex}. Skipping.`);
    }
}

async function getDefaultDuration() {
    const data = await browser.storage.local.get("intervalSec");
    let intervalSec = parseFloat(data.intervalSec);

    if (!intervalSec || intervalSec <= 0) intervalSec = 5; // default 5 seconds
    return intervalSec;
}

// Fetch content from url
async function fetchUrl(url) {
    console.log("Fetching: " + url);
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "json";

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(xhr.response);
            } else {
                console.error(`XHR Error: Request failed with status ${xhr.status} (${xhr.statusText})`);
                console.error("Response:", xhr.response);
                resolve(undefined);
            }
        };

        xhr.onerror = () => {
            console.error("XHR Network Error: Failed to make the request.");
            console.error("Status:", xhr.status);
            console.error("Status Text:", xhr.statusText);
            console.error("Response:", xhr.response);
            resolve(undefined);
        };

        xhr.ontimeout = () => {
            console.error("XHR Timeout: The request took too long and timed out.");
            resolve(undefined);
        };

        xhr.send();
    });
}

// Open the tab or reuse existing
async function openLink(url, oldTabId) {
    if (!url) return;

    if (oldTabId === null || oldTabId === undefined) {
        const tab = await browser.tabs.create({ url });
        return tab.id;
    } else {
        try {
            // Update the tab URL
            await browser.tabs.update(oldTabId, { url });
            return oldTabId;
        } catch (e) {
            // Tab was closed, reset
            return await openLink(url);
        }
    }
}

// Update tab URL and wait for DOM to load
async function waitForTabCompletion(targetTabId, defaultDuration) {
    if (!targetTabId) {
        console.log("no tab to wait")
        return null;
    }

    // Wait until DOM is fully loaded
    await new Promise((resolve) => {
        const listener = (tabId, changeInfo) => {
            if (tabId === targetTabId && changeInfo.status === "complete") {
                browser.tabs.onUpdated.removeListener(listener);
                resolve();
            }
        };
        browser.tabs.onUpdated.addListener(listener);
    });

    browser.tabs.sendMessage(targetTabId, {
        command: "waitForTabCompletion",
        defaultDuration: defaultDuration,
        tabId: targetTabId
    });
}