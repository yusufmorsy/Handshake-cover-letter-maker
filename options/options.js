const apiKeyEl = document.getElementById("apiKey");
const resumeEl = document.getElementById("resume");
const pathEl = document.getElementById("pathPrefix");
const saveBtn = document.getElementById("saveBtn");

(async () => {
  const { apiKey, resumeText, pathPrefix } = await chrome.storage.local.get(["apiKey", "resumeText", "pathPrefix"]);
  apiKeyEl.value = apiKey || "";
  resumeEl.value = resumeText || "";
  pathEl.value = pathPrefix || "";
})();

saveBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({
    apiKey: apiKeyEl.value.trim(),
    resumeText: resumeEl.value.trim(),
    pathPrefix: pathEl.value.trim()
  });
  alert("Saved!");
});