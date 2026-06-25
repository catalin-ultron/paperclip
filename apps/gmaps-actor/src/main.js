import { Actor } from 'apify';
import { PuppeteerCrawler, log } from 'crawlee';

await Actor.init();

const input = await Actor.getInput() ?? {};
const searchQuery = String(input.searchQuery ?? '').trim();
const location = String(input.location ?? '').trim();
const maxResults = Math.max(1, Math.min(Number.parseInt(String(input.maxResults ?? 20), 10) || 20, 200));

if (!searchQuery || !location) {
  throw new Error('Input must include searchQuery and location.');
}

const startUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${searchQuery} ${location}`)}`;
const seen = new Set();
const results = [];

const crawler = new PuppeteerCrawler({
  headless: true,
  maxRequestsPerCrawl: 1,
  requestHandlerTimeoutSecs: 180,
  async requestHandler({ page }) {
    await page.goto(startUrl, { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForSelector('div[role="feed"], .m6QErb[aria-label]', { timeout: 60000 });

    const feedSelector = 'div[role="feed"]';
    let stagnant = 0;
    let previousCount = 0;

    while (results.length < maxResults && stagnant < 8) {
      const batch = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('a[href*="/place/"]'));
        return cards.map((card) => {
          const container = card.closest('div.Nv2PK');
          const text = container?.innerText ?? '';
          const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
          const href = card.href;
          const name = lines[0] ?? '';
          const ratingMatch = text.match(/([0-9]+\.[0-9])/);
          const reviewsMatch = text.match(/\(([\d,]+)\)/);
          const websiteMatch = text.match(/\bhttps?:\/\/[^\s]+/i);
          const phoneMatch = text.match(/(\+?\d[\d\s().-]{7,}\d)/);
          const addressLine = lines.find((line) => /\d/.test(line) && !line.includes('(')) ?? '';
          const category = lines.find((line, index) => index > 0 && !line.includes('·') && line !== addressLine) ?? '';
          return {
            placeUrl: href,
            name,
            address: addressLine,
            rating: ratingMatch ? Number(ratingMatch[1]) : null,
            reviewsCount: reviewsMatch ? Number(reviewsMatch[1].replace(/,/g, '')) : null,
            phone: phoneMatch ? phoneMatch[1].trim() : '',
            website: websiteMatch ? websiteMatch[0] : '',
            category,
          };
        });
      });

      for (const item of batch) {
        if (!item.name || !item.placeUrl || seen.has(item.placeUrl)) continue;
        seen.add(item.placeUrl);
        results.push(item);
        await Actor.pushData(item);
        if (results.length >= maxResults) break;
      }

      const count = results.length;
      stagnant = count === previousCount ? stagnant + 1 : 0;
      previousCount = count;

      await page.evaluate((selector) => {
        const feed = document.querySelector(selector);
        if (feed) feed.scrollBy(0, 1800);
      }, feedSelector);
      await page.waitForTimeout(1500);
    }

    log.info(`Scraped ${results.length} businesses.`);
  },
});

await crawler.run([{ url: startUrl }]);
await Actor.exit();
