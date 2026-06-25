# PLAN

Goal: Build and ship a complete Apify-powered Google Maps scraper app end to end.

Decisions:
- Build a new Apify actor from scratch in this repo under an isolated app directory.
- Use PuppeteerCrawler and Google Maps page scraping for actor output.
- Deploy the actor as a new Apify actor named `ultron-test-gmaps2`.
- Run the actor with `searchQuery=coffee shops`, `location=Austin, TX`, `maxResults=20` and verify real dataset items.
- Bake the verified dataset into a static dashboard at build time so no Apify token reaches the browser.
- Deploy the static build to Workers for Platforms at `https://gmaps-app.apps.51ultron.com`.

Checklist:
- [ ] Inspect current repo state
- [ ] Scaffold actor files and dependencies
- [ ] Implement Google Maps scraping logic and actor metadata
- [ ] Install dependencies and validate actor locally if possible
- [ ] Deploy actor `ultron-test-gmaps2` to Apify
- [ ] Verify Apify build succeeded
- [ ] Run actor with Austin coffee shop input
- [ ] Verify dataset contains real businesses
- [ ] Scaffold static dashboard app
- [ ] Bake dataset into the dashboard build
- [ ] Build static assets
- [ ] Deploy to Workers for Platforms as `gmaps-app`
- [ ] Verify live URL returns the dashboard
