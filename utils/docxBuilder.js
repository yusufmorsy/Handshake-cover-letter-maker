/* utils/docxBuilder.js
 *
 * Generates a .docx with 11-pt Arial text and 1-inch page margins
 * using the docx IIFE bundle loaded in popup.html.
 */

export async function buildDocx(fileName, content) {
  /* 1) Classes from the global bundle */
  const { Document, Packer, Paragraph, TextRun } = window.docx;

  /* 2) Convert each non-empty line into a Paragraph */
  const paragraphs = content
    .split(/\r?\n/)
    .filter(Boolean)
    .map(line =>
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            font: "Arial",
            size: 22            // 22 half-points = 11 pt
          })
        ]
      })
    );

  /* 3) Build the document with 1-inch margins (1440 twips) */
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
          }
        },
        children: paragraphs
      }
    ]
  });

  /* 4) Turn into Blob & download */
  const blob = await Packer.toBlob(doc);
  const url  = URL.createObjectURL(blob);

  chrome.downloads.download({
    url,
    filename: fileName,
    saveAs: true           // shows native Save dialog
  });
}
