import { Document, Packer, Paragraph } from "https://cdn.jsdelivr.net/npm/docx@8.1.0/build/index.min.js";

export async function buildDocx(fileName, content) {
  const paragraphs = content.split(/\n+/).map(line => new Paragraph(line));
  const doc = new Document({ sections: [{ children: paragraphs }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename: fileName, saveAs: true });
}