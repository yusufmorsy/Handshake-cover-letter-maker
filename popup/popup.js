// popup.js
import { generateCoverLetter } from "../openai.js";
import { buildPdf } from "../utils/pdfBuilder.js";
import { buildDocx } from "../utils/docxBuilder.js";
import { buildTxt } from "../utils/txtBuilder.js";

const statusEl       = document.getElementById("status");
const previewSection = document.getElementById("preview");
const letterEl       = document.getElementById("letter");
const formatEl       = document.getElementById("format");
const downloadBtn    = document.getElementById("downloadBtn");

let currentJob = null;
let resume     = "";

async function scrapeWithTimeout(tabId, timeoutMs = 2000) {
  const scrapePromise = chrome.tabs.sendMessage(tabId, { type: 'SCRAPE_NOW' });
  const timeoutPromise = new Promise(resolve =>
    setTimeout(() => resolve(null), timeoutMs)
  );
  return Promise.race([scrapePromise, timeoutPromise]);
}

async function init() {
  console.log("🔔 Popup init started");
  statusEl.textContent = "Loading job…";
  previewSection.classList.add("hidden");

  // 1) Load stored data
  const store = await chrome.storage.local.get([
    "currentJob", "apiKey", "resumeText", "pathPrefix"
  ]);
  console.log("🔔 Loaded store:", store);
  resume = store.resumeText || "";

  // 2) Attempt fresh scrape, with timeout
  let scraped = null;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log(`🔔 Sending SCRAPE_NOW to tab ${tab.id}`);
    scraped = await scrapeWithTimeout(tab.id, 2000);
    console.log("🤖 popup got payload:", scraped);
  } catch (err) {
    console.error("Scrape error:", err);
  }

  // 3) Choose between fresh scrape or stored fallback
  if (scraped && scraped.title) {
    console.log("🔔 Using freshly scraped job");
    currentJob = scraped;
    await chrome.storage.local.set({ currentJob });
  } else if (store.currentJob && store.currentJob.title) {
    console.log("🔔 Falling back to stored job");
    currentJob = store.currentJob;
  }

  // 4) Handle case with no job data
  if (!currentJob) {
    console.log("🔔 No job data available");
    statusEl.textContent = "Open a Handshake job posting first.";
    return;
  }

  // 5) Generate the cover letter
  statusEl.textContent = "Generating cover-letter…";
  try {
    const letter = await generateCoverLetter({
      job: currentJob,
      resume,
      apiKey: store.apiKey
    });
    console.log("✍️ Received generated letter");
    letterEl.value = letter;
    statusEl.textContent = `Draft for: ${currentJob.title}`;
    previewSection.classList.remove("hidden");
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error: " + err.message;
  }
}

function handleDownload() {
  if (!letterEl.value) return;

  const safeTitle = currentJob.title.replace(/[^a-z0-9]+/gi, "_");
  const fileBase  = `${safeTitle}_CoverLetter`;
  const ext       = formatEl.value;

  chrome.storage.local.get("pathPrefix", ({ pathPrefix }) => {
    const prefix   = pathPrefix || "";
    const fileName = prefix
      ? `${prefix}/${fileBase}.${ext}`
      : `${fileBase}.${ext}`;

    if (ext === "pdf")      buildPdf(fileName, letterEl.value);
    else if (ext === "docx") buildDocx(fileName, letterEl.value);
    else                     buildTxt(fileName, letterEl.value);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  downloadBtn.addEventListener("click", handleDownload);
});
