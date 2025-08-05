// contentScript.js
// Scrapes Handshake job postings for cover letter generation

(function() {
  /**
   * Performs the scrape and returns job data when all elements are present.
   * @returns {{title: string, company: string, overview: string, description: string}|null}
   */
  function getJobData() {
    // 1) Title
    const titleEl = document.querySelector('a[href*="/jobs/"] h1');
    if (titleEl) {
      const jobTitle = titleEl.textContent;
      console.log(jobTitle);
    }

    // 2) Company
    const companyEl = document.querySelector('a[href*="/e/"] div');
    if (companyEl) {
      const companyTitle = companyEl.textContent;
      console.log(companyTitle);
    }

    // 3) Overview: entire "At a glance" section
    const overviewEl = document.querySelectorAll('.sc-kJCwM.fElEOM');

    let atAGlanceText = null;

    overviewEl.forEach(div => {
      const text = div.textContent.trim();
      if (text.startsWith('At a glance')) {
        atAGlanceText = text;
        // If you only want the first one, you can break here
        // break;
      }
    });

    if (atAGlanceText) {
      console.log(atAGlanceText);
    } else {
      console.log('Could not find the "At a glance" section.');
    }

    // 4) Expand full description if collapsed
    // const moreBtn = document.querySelector('button.view-more-button');
    // if (moreBtn && /more/i.test(moreBtn.innerText)) {
    //   moreBtn.click();
    // }

    // 5) Description: specified section under description
    const descEl = document.querySelector(
      '#skip-to-content > div > div.sc-dplrdh.kUQPgF > div.sc-ldzBfC.gsJmga > div > div > div > div:nth-child(4) > div > div'
    );

    if (titleEl && companyEl && overviewEl && descEl) {
      return {
        title:       titleEl.innerText.trim(),
        company:     companyEl.innerText.trim(),
        overview:    overviewEl.innerText.trim(),
        description: descEl.innerText.trim(),
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

    if (payload) {
      clearInterval(interval);
      console.log('✅ Scraped payload:', payload);
      chrome.runtime.sendMessage({ type: 'JOB_DATA', payload });
    }
  }, 200);

  // Listen for on-demand scrape requests from popup
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SCRAPE_NOW') {
      const payload = getJobData();
      sendResponse(payload);
      // No asynchronous work, so no need to return true
    }
    // If not handling SCRAPE_NOW, do not keep sendResponse channel open
    return false;
  });
})();
