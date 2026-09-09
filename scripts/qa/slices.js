const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3002";
const OUT = process.env.OUT_DIR || "./slices";
const PATH_ = process.env.PAGE_PATH || "/";
const NAME = process.env.PAGE_NAME || "home";
const W = +(process.env.W || 390);
const H = +(process.env.H || 844);
const MAX = +(process.env.MAX_SLICES || 8);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ctx = await b.newContext({
    viewport: { width: W, height: H },
    isMobile: W < 768, hasTouch: W < 768, locale: "vi-VN",
  });
  const page = await ctx.newPage();
  await page.goto(BASE + PATH_, { waitUntil: "domcontentloaded", timeout: 45000 });

  // Reveal-on-scroll needs a pass before any capture.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90));
    }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400));
  });

  const total = await page.evaluate(() => document.body.scrollHeight);
  const n = Math.min(MAX, Math.ceil(total / H));
  for (let i = 0; i < n; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * H);
    await page.waitForTimeout(450);
    await page.screenshot({ path: `${OUT}/${NAME}-${W}-s${i}.png` });
  }
  console.log(`${NAME} @${W}: height ${total}px → ${n} slices`);
  await b.close();
})();
