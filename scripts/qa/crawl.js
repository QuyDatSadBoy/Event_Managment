const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3002";
const OUT = process.env.SHOT_DIR || ".";

const PAGES = [
  ["home", "/"],
  ["about", "/gioi-thieu"],
  ["agenda", "/chuong-trinh"],
  ["speakers", "/dien-gia"],
  ["speaker-detail", "/dien-gia/nguyen-minh-quan"],
  ["news", "/tin-tuc"],
  ["news-detail", "/tin-tuc/bai-phat-bieu-nganh-dich-vu-viet-nam-trong-thap-ky-so"],
  ["gallery", "/thu-vien"],
  ["register", "/dang-ky"],
  ["thankyou", "/dang-ky/hoan-tat?code=EVT-TEST-1234"],
  ["partners", "/doi-tac"],
  ["contact", "/lien-he"],
  ["notfound", "/khong-ton-tai"],
];

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 834, height: 1112 },
  mobile: { width: 390, height: 844 },
};

(async () => {
  const browser = await chromium.launch();
  const results = [];

  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport, locale: "vi-VN" });
    const page = await ctx.newPage();

    for (const [name, path] of PAGES) {
      const errors = [];
      const onConsole = (m) => {
        if (m.type() === "error") errors.push(m.text().slice(0, 120));
      };
      const onPageError = (e) => errors.push("PAGEERROR: " + e.message.slice(0, 120));
      page.on("console", onConsole);
      page.on("pageerror", onPageError);

      let status = 0;
      let overflow = 0;
      let h1 = "";
      let imgBroken = 0;
      const t0 = Date.now();
      try {
        const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 45000 });
        status = res ? res.status() : 0;

        // Walk the page so lazy sections and reveal animations settle.
        await page.evaluate(async () => {
          const step = window.innerHeight * 0.85;
          for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 80));
          }
          window.scrollTo(0, 0);
          await new Promise((r) => setTimeout(r, 300));
        });
        await page.waitForTimeout(500);

        overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        h1 = (await page.locator("h1").first().textContent().catch(() => "")) || "";
        imgBroken = await page.evaluate(
          () =>
            Array.from(document.images).filter(
              (i) => i.complete && i.naturalWidth === 0 && i.getAttribute("src"),
            ).length,
        );

        if (vpName !== "tablet") {
          await page.screenshot({ path: `${OUT}/${vpName}-${name}.png`, fullPage: false });
        }
      } catch (e) {
        errors.push("NAV: " + e.message.slice(0, 120));
      }
      const ms = Date.now() - t0;

      page.off("console", onConsole);
      page.off("pageerror", onPageError);

      results.push({ vp: vpName, name, path, status, overflow, imgBroken, ms, h1: h1.trim().slice(0, 40), errors });
    }
    await ctx.close();
  }
  await browser.close();

  let bad = 0;
  console.log("VP        PAGE             STATUS OVF IMG   MS  H1");
  for (const r of results) {
    const expect404 = r.name === "notfound";
    const okStatus = expect404 ? r.status === 404 : r.status === 200;
    const ok = okStatus && r.overflow <= 0 && r.imgBroken === 0 && r.errors.length === 0;
    if (!ok) bad++;
    console.log(
      `${ok ? "OK  " : "BAD "} ${r.vp.padEnd(8)} ${r.name.padEnd(16)} ${String(r.status).padEnd(6)} ${String(r.overflow).padEnd(3)} ${String(r.imgBroken).padEnd(3)} ${String(r.ms).padStart(5)}  ${r.h1}`,
    );
    if (r.errors.length) console.log("       errors:", JSON.stringify(r.errors.slice(0, 3)));
  }
  console.log(`\n${results.length - bad}/${results.length} checks passed`);
})();
