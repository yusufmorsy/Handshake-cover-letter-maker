// popup/popup.js
// Generates, edits, auto-saves, and downloads cover letters

import { generateCoverLetter } from "../openai.js";
import { buildPdf }  from "../utils/pdfBuilder.js";
import { buildDocx } from "../utils/docxBuilder.js";
import { buildTxt }  from "../utils/txtBuilder.js";

/* ------------ DOM refs ------------ */
const statusEl    = document.getElementById("status");
const previewSec  = document.getElementById("preview");
const letterEl    = document.getElementById("letter");
const formatEl    = document.getElementById("format");
const dlBtn       = document.getElementById("downloadBtn");
const genBtn      = document.getElementById("generateBtn");
const settingsBtn = document.getElementById("settingsBtn");   // ⚙️ button

/* ------------ globals ------------ */
let currentJob = null;   // job payload from scraper
let store      = {};     // everything pulled from storage
let cacheKey   = "";     // currentJob.url (key inside letterCache)
let dirty      = false;  // becomes true when the user edits the letter

/* ---------- helper: scrape or timeout ---------- */
async function scrapeWithTimeout(tabId, ms = 2000) {
  const scrape  = chrome.tabs.sendMessage(tabId, { type: "SCRAPE_NOW" });
  const timeout = new Promise(res => setTimeout(() => res(null), ms));
  return Promise.race([scrape, timeout]);
}

/* ---------- load popup ---------- */
async function init() {
  store = await chrome.storage.local.get([
    "currentJob",
    "apiKey",
    "resumeText",
    "template",
    "user",
    "letterCache"          // { <url>: "<letter text>" }
  ]);
  store.letterCache ||= {};

  statusEl.textContent = "Reload Your Page";
  previewSec.classList.add("hidden");
  genBtn.disabled = true;

  // grab active tab’s job info (or fallback to cached job)
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const scraped = await scrapeWithTimeout(tab.id, 2000);

  if (scraped?.title) {
    currentJob = scraped;
    await chrome.storage.local.set({ currentJob: scraped });
  } else if (store.currentJob?.title) {
    currentJob = store.currentJob;
  }

  if (!currentJob) {
    statusEl.textContent = "Open a Handshake job posting first.";
    return;
  }

  // show cached letter if we already generated / edited one
  cacheKey = currentJob.url;
  const cached = store.letterCache[cacheKey] || "";
  if (cached) {
    letterEl.value = cached;
    previewSec.classList.remove("hidden");
    statusEl.textContent = `Draft for: ${currentJob.title} (cached)`;
  } else {
    statusEl.textContent = `Ready to generate for: ${currentJob.title}`;
  }
  genBtn.disabled = false;
}

/* ---------- generate only when the user clicks ---------- */
async function handleGenerate() {
  genBtn.disabled = true;
  statusEl.textContent = "Contacting OpenAI…";

  try {
    const letter = await generateCoverLetter({
      job:    currentJob,
      resume: store.resumeText || "",
      apiKey: store.apiKey,
      user:   store.user || {},
      template: store.template || ""
    });

    letterEl.value = letter;
    previewSec.classList.remove("hidden");
    statusEl.textContent = `Draft for: ${currentJob.title}`;

    // cache the freshly-generated letter
    store.letterCache[cacheKey] = letter;
    await chrome.storage.local.set({ letterCache: store.letterCache });
    dirty = false;
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Error: " + err.message;
  } finally {
    genBtn.disabled = false;
  }
}

/* ---------- auto-save while user edits ---------- */
function handleTyping() {
  dirty = true;
  clearTimeout(handleTyping.t);
  handleTyping.t = setTimeout(async () => {
    if (!dirty) return;
    store.letterCache[cacheKey] = letterEl.value;
    await chrome.storage.local.set({ letterCache: store.letterCache });
    dirty = false;
    console.log("💾 Draft auto-saved");
  }, 300); // save 300 ms after last keystroke
}

/* ---------- download (popup stays open) ---------- */
function handleDownload() {
  if (!letterEl.value) return;

  const safeTitle = currentJob.title
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  const fileBase  = `${safeTitle}_CoverLetter`;
  const ext       = formatEl.value;
  const fileName  = `${fileBase}.${ext}`;

  if      (ext === "pdf")  buildPdf(fileName,  letterEl.value);
  else if (ext === "docx") buildDocx(fileName, letterEl.value);
  else                     buildTxt(fileName, letterEl.value);
}

/* ---------- open Options page ---------- */
function openSettings() {
  chrome.runtime.openOptionsPage();
}

/* ---------- wire up events ---------- */
document.addEventListener("DOMContentLoaded", init);
genBtn     .addEventListener("click",  handleGenerate);
dlBtn      .addEventListener("click",  handleDownload);
letterEl   .addEventListener("input",  handleTyping);
settingsBtn.addEventListener("click",  openSettings);
