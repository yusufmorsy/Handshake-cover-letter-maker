/* options/options.js
 * Loads and saves extension settings (API key, contact info, résumé, etc.)
 */

const els = {
  /* API key */
  apiKey: document.getElementById("apiKey"),

  /* Contact-info fields */
  userName:  document.getElementById("userName"),
  cityState: document.getElementById("cityState"),
  phone:     document.getElementById("phone"),
  email:     document.getElementById("email"),

  /* Other settings */
  resume:     document.getElementById("resume"),
  pathPrefix: document.getElementById("pathPrefix"),
  template:   document.getElementById("template"),

  /* Save button */
  saveBtn: document.getElementById("saveBtn")
};

/* ---------- Load settings when the page opens ---------- */
(async () => {
  const stored = await chrome.storage.local.get([
    "apiKey",
    "resumeText",
    "pathPrefix",
    "template",
    "user"
  ]);

  els.apiKey.value     = stored.apiKey                ?? "";
  els.userName.value   = stored.user?.name            ?? "";
  els.cityState.value  = stored.user?.cityState       ?? "";
  els.phone.value      = stored.user?.phone           ?? "";
  els.email.value      = stored.user?.email           ?? "";
  els.resume.value     = stored.resumeText            ?? "";
  els.pathPrefix.value = stored.pathPrefix            ?? "";
  els.template.value   = stored.template              ?? "";
})();

/* -------------- Save handler ---------------------------- */
els.saveBtn.addEventListener("click", async () => {
  await chrome.storage.local.set({
    apiKey: els.apiKey.value.trim(),

    /* Resume text is optional; blank is allowed */
    resumeText: els.resume.value.trim(),

    /* Optional sub-folder prefix for downloads */
    pathPrefix: els.pathPrefix.value.trim(),

    /* Optional custom prompt / template */
    template: els.template.value.trim(),

    /* Contact block (any blank field will fall back to a placeholder) */
    user: {
      name:      els.userName.value.trim(),
      cityState: els.cityState.value.trim(),
      phone:     els.phone.value.trim(),
      email:     els.email.value.trim()
    }
  });
  alert("Settings saved!");
});
