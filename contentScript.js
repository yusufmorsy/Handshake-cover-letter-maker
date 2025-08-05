// contentScript.js
// Scrapes Handshake job postings for cover letter generation

(function() {
  /**
   * Performs the scrape and returns job data when any elements are present.
   * @returns {{title: string, company: string, overview: string, description: string}|null}
   */
  function getJobData() {
    // 1) Title
    const titleEl = document.querySelector('a[href*="/jobs/"] h1');
    if (titleEl) {
      console.log("✓ Title:", titleEl.textContent.trim());
      console.log(titleEl);
    }

    // 2) Company
    const companyEl = document.querySelector('a[href*="/e/"] div');
    if (companyEl) {
      console.log("✓ Company:", companyEl.textContent.trim());
      console.log(companyEl);
    }

    // 3) Overview: side-panel cards OR single-job wrapper
    const overviewEls = document.querySelectorAll(
      '.sc-kJCwM.fElEOM, .sc-byhhpF.kgQOGZ'
    );

    let atAGlanceText = '';
    overviewEls.forEach(el => {
      const txt = el.innerText.trim();
      // both types start with "At a glance"
      if (txt.startsWith('At a glance')) {
        atAGlanceText = txt;
      }
    });

    if (atAGlanceText) {
      console.log("✓ Overview:", atAGlanceText);
    } else {
      console.warn('⚠️ Could not find the "At a glance" section.');
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

    // 6) Return whatever you were able to scrape
    if (titleEl || companyEl || atAGlanceText || descriptionText) {
      return {
        title:       titleEl?.innerText.trim()   ?? '',
        company:     companyEl?.innerText.trim() ?? '',
        overview:    atAGlanceText               ?? '',
        description: descriptionText
      };
    }
    return null;
  }

  console.log('📡 Scraper starting…');
  const interval = setInterval(() => {
    const payload = getJobData();
    console.log('👀 waiting for…', {
      title:    !!payload?.title,
      company:  !!payload?.company,
      overview: !!payload?.overview,
      desc:     !!payload?.description
    });

    // if (payload) {
    //   clearInterval(interval);
    //   console.log('✅ Scraped payload:', payload);
    //   chrome.runtime.sendMessage({ type: 'JOB_DATA', payload });
    // }
  }, 200);

  // Listen for on-demand scrape requests from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPE_NOW') {
      const payload = getJobData();
      sendResponse(payload);
    }
    return false;
  });
})();
