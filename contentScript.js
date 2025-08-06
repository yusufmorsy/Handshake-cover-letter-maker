// contentScript.js
// Scrapes Handshake job postings for cover letter generation

(function() {
  /**
   * Performs the scrape and returns job data when all pieces are present.
   * @returns {{title: string, company: string, overview: string, description: string}|null}
   */
  function getJobData() {
    // 1) Title
    const titleEl = document.querySelector('a[href*="/jobs/"] h1');
    if (titleEl) {
      console.log("✓ Title:", titleEl.textContent.trim());
    }

    // 2) Company
    const companyEl = document.querySelector('a[href*="/e/"] div');
    if (companyEl) {
      console.log("✓ Company:", companyEl.textContent.trim());
    }

    // 3) Overview: side-panel cards OR single-job wrapper
    // 3) Overview  ─── “At a glance” section
    let atAGlanceText = "";

    /* New, simpler selector:
    * On a full Job-Details page Handshake always nests the entire
    * “At a glance” wrapper at:
    *   #skip-to-content > div > div:nth-child(3)
    * If that node exists, just read its innerText.
    */
    const overviewContainer =
      document.querySelector("#skip-to-content > div > div:nth-child(3)") ||
      document.querySelector("#skip-to-content > div > div:nth-child(2) > div:nth-child(2) > div > div > div > div:nth-child(3)");

    if (overviewContainer) {
      atAGlanceText = overviewContainer.innerText.trim();
    } else {
      // fallback to the side-panel / card selectors (old logic)
      const overviewEls = document.querySelectorAll(
        ".sc-kJCwM.fElEOM, .sc-byhhpF.kgQOGZ"
      );
      overviewEls.forEach(el => {
        const txt = el.innerText.trim();
        if (txt.startsWith("At a glance")) {
          atAGlanceText = txt;
        }
      });
    }

    // logging (unchanged)
    if (atAGlanceText) {
      console.log("✓ Overview:", atAGlanceText);
    } else {
      console.warn("⚠️ Could not find the \"At a glance\" section.");
    }

    // 4) Expand full description if collapsed
    const moreBtn = document.querySelector('button.view-more-button');
    if (moreBtn && /more/i.test(moreBtn.innerText)) {
      moreBtn.click();
    }

    // 5) Description — grab all the text in the known wrapper container
    const descContainer =
      document.querySelector("#skip-to-content > div > div:nth-child(4)") ||
      document.querySelector("* > div > div:nth-of-type(2) > div:nth-of-type(2) > div > div > div > div:nth-of-type(4)");
    let descriptionText = '';
    if (descContainer) {
      descriptionText = descContainer.innerText.trim();
      console.log("✓ Description:", descriptionText);
    } else {
      console.warn("⚠️ Couldn't find the description container.");
    }

    // 6) Only return once every piece is non-empty
    if (
      titleEl?.innerText.trim().length    > 0 &&
      companyEl?.innerText.trim().length  > 0 &&
      atAGlanceText.length                > 0 &&
      descriptionText.length              > 0
    ) {
      return {
        title:       titleEl.innerText.trim(),
        company:     companyEl.innerText.trim(),
        overview:    atAGlanceText,
        description: descriptionText
      };
    }

    return null;
  }

  console.log('📡 Scraper starting…');
  const interval = setInterval(() => {
    const payload = getJobData();

    if (payload) {
      clearInterval(interval);
      console.log('✅ Full payload:', payload);
      chrome.runtime.sendMessage({ type: 'JOB_DATA', payload });
    } else {
      console.log('👀 still waiting…', {
        title:    payload?.title?.length    ?? 0,
        company:  payload?.company?.length  ?? 0,
        overview: payload?.overview?.length ?? 0,
        desc:     payload?.description?.length ?? 0
      });
    }
  }, 200);

  // Listen for on-demand scrape requests from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    console.log("⚡️ contentScript got message:", msg);

    if (msg.type === 'SCRAPE_NOW') {
      const payload = getJobData();
      console.log("⚡️ responding with payload:", payload);
      sendResponse(payload);
    }

    return false; // keep channel open only for synchronous response
  });
})();
