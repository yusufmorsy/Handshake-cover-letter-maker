// handshakeUploader.js
// NB: Requires user to be logged‑in to Handshake (cookies present)

export async function uploadPdf(blob, fileName) {
  try {
    const gqlResp = await fetch("https://boulder.joinhandshake.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": await getCsrf(),
      },
      body: JSON.stringify({
        operationName: "GenerateUploadUrl",
        query: "mutation GenerateUploadUrl($input: UploadInput!) { generateUploadUrl(input: $input) { url fields { key value } } }",
        variables: { input: { filename: fileName, contentType: "application/pdf" } }
      })
    });

    const { data } = await gqlResp.json();
    const { url, fields } = data.generateUploadUrl;

    // Build FormData for S3
    const form = new FormData();
    Object.entries(fields).forEach(([k, v]) => form.append(k, v));
    form.append("file", blob);

    const s3Resp = await fetch(url, { method: "POST", body: form });
    if (!s3Resp.ok) throw new Error("S3 upload failed");

    console.log("Uploaded to Handshake files");
  } catch (err) {
    console.error("Auto‑upload error", err);
  }
}

function getCsrf() {
  // Handshake stores the CSRF token as a cookie named "csrf_token"
  return new Promise(res => chrome.cookies.get({ url: "https://boulder.joinhandshake.com", name: "csrf_token" }, c => res(c?.value)));
}