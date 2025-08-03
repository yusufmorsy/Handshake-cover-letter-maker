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
  const store = await chrome.storage.local.get(["currentJob", "apiKey", "resumeText", "pathPrefix"]);
  currentJob = store.currentJob;
  resume = store.resumeText || "";

  if (!currentJob) {
    statusEl.textContent = "Open a job posting on Handshake first.";
    return;
  }

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

init();

// Download handler
downloadBtn.addEventListener("click", () => {
  if (!letterEl.value) return;
  const safeTitle = currentJob.title.replace(/[^a-z0-9]+/gi, "_");
  const fileNameBase = `${safeTitle}_CoverLetter`;
  const prefix = (formatEl.value === "pdf") ? `${fileNameBase}.pdf` : (formatEl.value === "docx") ? `${fileNameBase}.docx` : `${fileNameBase}.txt`;
  const fileName = (chrome.runtime.getManifest().name === "Handshake Cover‑Letter Generator" && (chrome.storage.local.get("pathPrefix") || "")) ? `${chrome.storage.local.get("pathPrefix")}/${prefix}` : prefix;

  switch (formatEl.value) {
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