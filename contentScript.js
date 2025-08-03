/* contentScript.js
 * Scrapes Handshake job postings for cover letter generation
 */
;(function scrapeJob() {
  console.log('📡 Scraper starting…')

  const interval = setInterval(() => {
    // 1) Title
    const titleEl = document.querySelector('h1.sc-hyeYAt.bbdLgZ')
                   || document.querySelector('h1');

    // 2) Company
    const companyEl = document.querySelector('a[href*="/e/"] > div');

    // 3) Overview: entire "At a glance" section
    const overviewEl = document.querySelector(
      '#skip-to-content > div > div.sc-dplrdh.kUQPgF > div.sc-ldzBfC.gsJmga > div > div > div > div:nth-child(3)'
    );

    // 4) Expand full description if collapsed
    const moreBtn = document.querySelector('button.view-more-button');
    if (moreBtn && /more/i.test(moreBtn.innerText)) {
      moreBtn.click();
    }

    // 5) Description: specified section under description
    const descEl = document.querySelector(
      '#skip-to-content > div > div.sc-dplrdh.kUQPgF > div.sc-ldzBfC.gsJmga > div > div > div > div:nth-child(4) > div > div'
    );

    console.log('👀 waiting for…', {
      title:    !!titleEl,
      company:  !!companyEl,
      overview: !!overviewEl,
      desc:     !!descEl
    });

    if (titleEl && companyEl && overviewEl && descEl) {
      clearInterval(interval);

      const payload = {
        title:       titleEl.innerText.trim(),
        company:     companyEl.innerText.trim(),
        overview:    overviewEl.innerText.trim(),
        description: descEl.innerText.trim(),
      };

      console.log('✅ Scraped payload:', payload);
      chrome.runtime.sendMessage({ type: "JOB_DATA", payload });
    }
  }, 200);
})();
