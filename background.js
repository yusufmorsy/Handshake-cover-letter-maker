// background.js – MV3 service-worker

// 1) Log install
chrome.runtime.onInstalled.addListener(() => {
  console.log("Handshake Cover-Letter Generator installed.");
});

// 2) Cache job data coming from contentScript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "JOB_DATA") {
    chrome.storage.local.set({ currentJob: msg.payload });
    sendResponse({ status: "cached" });
  }
  // no return value needed for synchronous sendResponse
});

// 3) Watch for SPA navigations (history.pushState, replaceState)
chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
  // Only trigger on Handshake job pages
  const url = details.url || details.tabUrl;
  if (!/https:\/\/[^/]+\.joinhandshake\.com\/job-search\/\d+/.test(url)) {
    return;
  }

  // Clear any old job
  chrome.storage.local.remove("currentJob");

  // Ask content script in that tab for fresh data
  chrome.tabs.sendMessage(details.tabId, { type: "SCRAPE_NOW" }, (res) => {
    if (chrome.runtime.lastError) {
      // content script not ready yet
      console.warn("SCRAPE_NOW failed:", chrome.runtime.lastError.message);
      return;
    }
    if (res && res.title) {
      chrome.storage.local.set({ currentJob: res });
    }
  });
});
