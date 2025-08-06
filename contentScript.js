// contentScript.js
// Scrapes Handshake job postings for cover-letter generation

(function () {
  /**
   * Attempts to collect all job data.  Returns an object only when
   * title, company, overview **and** description are non-empty.
   */
  function getJobData() {
    /* ----- 1) Title -------------------------------------------------- */
    const titleEl = document.querySelector('a[href*="/jobs/"] h1');
    if (titleEl) console.log("✓ Title:", titleEl.textContent.trim());

    /* ----- 2) Company ------------------------------------------------ */
    const companyEl = document.querySelector('a[href*="/e/"] div');
    if (companyEl) console.log("✓ Company:", companyEl.textContent.trim());

    /* ----- 3) “At a glance” overview -------------------------------- */

    let atAGlanceText = "";

    // 3a. Most common full-page layout: shallow div:nth-child(3)
    const shallow = document.querySelector(
      "#skip-to-content > div > div:nth-child(3)"
    );

    // 3b. Alternate deeply-nested layout
    const deep = document.querySelector(
      "#skip-to-content > div > div:nth-child(2) > div:nth-child(2) > div > div > div > div:nth-child(3)"
    );

    const overviewContainer = shallow || deep;

    if (overviewContainer) {
      atAGlanceText = overviewContainer.innerText.trim();
    } else {
      // 3c. Side-panel / card view (old logic)
      const panelEls = document.querySelectorAll(
        ".sc-kJCwM.fElEOM, .sc-byhhpF.kgQOGZ"
      );
      panelEls.forEach((el) => {
        const txt = el.innerText.trim();
        if (txt.startsWith("At a glance")) atAGlanceText = txt;
      });
    }

    if (atAGlanceText) {
      console.log("✓ Overview:", atAGlanceText);
    } else {
      console.warn('⚠️ Could not find the "At a glance" section.');
    }

    /* ----- 4) Expand collapsed description ------------------------- */
    const moreBtn = document.querySelector("button.view-more-button");
    if (moreBtn && /more/i.test(moreBtn.innerText)) moreBtn.click();

    /* ----- 5) Full description text --------------------------------- */
    const descContainer =
      document.querySelector("#skip-to-content > div > div:nth-child(4)") ||
      document.querySelector(
        "* > div > div:nth-of-type(2) > div:nth-of-type(2) > div > div > div > div:nth-of-type(4)"
      );

    let descriptionText = "";
    if (descContainer) {
      descriptionText = descContainer.innerText.trim();
      console.log("✓ Description:", descriptionText);
    } else {
      console.warn("⚠️ Couldn't find the description container.");
    }

    /* ----- 6) Return payload only when all four parts exist --------- */
    const hasAll =
      titleEl?.innerText.trim() &&
      companyEl?.innerText.trim() &&
      atAGlanceText &&
      descriptionText;

    if (hasAll) {
      return {
        title: titleEl.innerText.trim(),
        company: companyEl.innerText.trim(),
        overview: atAGlanceText,
        description: descriptionText,
        url: location.href // key for caching in popup.js
      };
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  console.log("📡 Scraper starting…");

  const interval = setInterval(() => {
    const payload = getJobData();

    if (payload) {
      clearInterval(interval);
      console.log("✅ Full payload:", payload);
      chrome.runtime.sendMessage({ type: "JOB_DATA", payload });
    } else {
      console.log("👀 still waiting…", payload);
    }
  }, 200);

  /* ---------- Respond to on-demand scrape from popup ---------------- */
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("⚡️ contentScript got message:", msg);

    if (msg.type === "SCRAPE_NOW") {
      const payload = getJobData();
      console.log("⚡️ responding with payload:", payload);
      sendResponse(payload);
    }
    return false; // synchronous response only
  });
})();
