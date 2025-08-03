import { generateCoverLetter } from "../openai.js";
import { buildPdf } from "../utils/pdfBuilder.js";
import { buildDocx } from "../utils/docxBuilder.js";
import { buildTxt } from "../utils/txtBuilder.js";

const statusEl = document.getElementById("status");
const previewSection = document.getElementById("preview");
const letterEl = document.getElementById("letter");
const formatEl = document.getElementById("format");
const downloadBtn = document.getElementById("downloadBtn");

let currentJob = null;
let resume = "";

async function init() {
  // 1) Show loading state
  statusEl.textContent = "Loading job…";

  // 2) Load stored data
  const store = await chrome.storage.local.get(["currentJob", "apiKey", "resumeText", "pathPrefix"]);
  resume = store.resumeText || "";

  // 3) Attempt fresh scrape from active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const scraped = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_NOW' });
    if (scraped) {
      currentJob = scraped;
      await chrome.storage.local.set({ currentJob });
    } else {
      currentJob = store.currentJob;
    }
  } catch (err) {
    console.error('Scrape error:', err);
    currentJob = store.currentJob;
  }

  // 4) Validate job data
  if (!currentJob) {
    statusEl.textContent = "Open a job posting on Handshake first.";
    return;
  }

  // 5) Generate the cover letter
  statusEl.textContent = "Generating cover‑letter…";
  try {
    const letter = await generateCoverLetter({ job: currentJob, resume, apiKey: store.apiKey });
    letterEl.value = letter;
    statusEl.textContent = `Draft for: ${currentJob.title}`;
    previewSection.classList.remove("hidden");
  } catch (e) {
    statusEl.textContent = e.message;
  }
}

document.addEventListener('DOMContentLoaded', init);

// Download handler
downloadBtn.addEventListener("click", async () => {
  if (!letterEl.value) return;

  const safeTitle = currentJob.title.replace(/[^a-z0-9]+/gi, "_");
  const fileNameBase = `${safeTitle}_CoverLetter`;
  const ext = formatEl.value;
  const prefixStore = await chrome.storage.local.get('pathPrefix');
  const prefix = prefixStore.pathPrefix || '';
  const fileName = prefix
    ? `${prefix}/${fileNameBase}.${ext}`
    : `${fileNameBase}.${ext}`;

  switch (ext) {
    case "pdf":
      buildPdf(fileName, letterEl.value);
      break;
    case "docx":
      buildDocx(fileName, letterEl.value);
      break;
    default:
      buildTxt(fileName, letterEl.value);
  }
});
