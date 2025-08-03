# Handshake Cover‑Letter Generator (Chrome MV3 Extension)

Generate and download targeted cover letters straight from any Handshake job posting using the OpenAI API.

## Quick Start
1. Clone / download this repo.
2. Open **chrome://extensions** → *Load unpacked* → select the `handshake-cover-letter-extension` folder.
3. Click the extension’s ⋮ menu → *Options* to paste your OpenAI API key and résumé text.
4. Browse to a Handshake job page, click the extension icon, review the draft, choose a format, and download.

## Features
* Auto‑detects job pages on `*.joinhandshake.com`.
* Scrapes **title**, **company**, and **description** in the browser – no server.
* Sends context + your résumé to **OpenAI Chat API** (defaults to `gpt‑4o‑mini`).
* Live preview inside the popup.
* Download as PDF (jsPDF), DOCX (docx), or plain TXT.
* All data is stored locally via `chrome.storage` – no external DB.
* Clean, commented ES modules for easy hacking.

### Handshake upload (optional)
Handshake doesn’t provide an official public file‑upload API. You’d need to intercept your auth cookies and POST a `multipart/form-data` payload to their private endpoint (usually `/graphql`).  A stub `uploadToHandshake()` can be added once you’ve inspected the network calls while manually uploading a file.

## License
MIT