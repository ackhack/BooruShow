browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.command === "waitForTabCompletion") {
        prepareTrigger(msg.defaultDuration, msg.tabId);
        return true; // indicates async response
    }
});

function prepareTrigger(defaultDuration, tabId) {
    let videos = document.getElementsByTagName("video");
    if (videos.length > 0) {
        videos[0].addEventListener("ended", () => {
            browser.runtime.sendMessage({ command: "triggerShow", tabId });
        });
    } else {
        setTimeout(() => {
            browser.runtime.sendMessage({ command: "triggerShow", tabId });
        }, defaultDuration * 1000);
    }
}