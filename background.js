// background.js – MV3 service‑worker
chrome.runtime.onInstalled.addListener(() => {
  console.log("Handshake Cover‑Letter Generator installed.");
});

// Relay messages between content‑script and popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "JOB_DATA") {
    // Cache the latest job scraped by the content script
    chrome.storage.local.set({ currentJob: msg.payload });
    sendResponse({ status: "cached" });
  }
});