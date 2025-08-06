/* utils/docxBuilder.js
 *
 * The docx library is loaded globally in popup.html via:
 *   <script src="libs/docx.iife.js"></script>
 * The IIFE build attaches its API to window.docx, so we just
 * pull the classes from there.  No CDN import = no CSP errors.
 */

export async function buildDocx(fileName, content) {
  // 1) Grab the classes from the global bundle
  const { Document, Packer, Paragraph, TextRun } = window.docx;

  // 2) Convert each non-empty line into a Paragraph
  const paragraphs = content
    .split(/\r?\n/)               // split on new-lines
    .filter(Boolean)              // drop blank lines
    .map(line =>
      new Paragraph({ children: [ new TextRun(line) ] })
    );

  // 3) Build the .docx document
  const doc = new Document({
    sections: [{ children: paragraphs }]
  });

  // 4) Turn it into a Blob and trigger a download
  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);

  chrome.downloads.download({
    url,
    filename: fileName,
    saveAs: true
  });
}
