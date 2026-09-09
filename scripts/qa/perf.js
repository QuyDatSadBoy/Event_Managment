const { chromium } = require("playwright");

const BASE = process.env.BASE || "http://localhost:3002";
const THROTTLE = process.env.THROTTLE !== "0";
const PAGES = (process.env.PERF_PAGES || "/,/chuong-trinh,/dien-gia,/tin-tuc,/thu-vien,/doi-tac,/dang-ky")
  .split(",");
const RUNS = +(process.env.RUNS || 3);

// Chrome DevTools "Slow 4G" and a 4× CPU slowdown — the profile the guidelines
// say to measure on, not a warm desktop cache.
const NET = { offline: false, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8, latency: 150 };

const collect = () => new Promise((resolve) => {
  const out = { lcp: 0, cls: 0, fcp: 0, ttfb: 0, longTasks: 0, tbt: 0 };
  const nav = performance.getEntriesByType("navigation")[0];
  if (nav) { out.ttfb = nav.responseStart; out.domContentLoaded = nav.domContentLoadedEventEnd; out.load = nav.loadEventEnd; }
  for (const e of performance.getEntriesByName("first-contentful-paint")) out.fcp = e.startTime;

  new PerformanceObserver((l) => { for (const e of l.getEntries()) out.lcp = Math.max(out.lcp, e.startTime); })
    .observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) if (!e.hadRecentInput) out.cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) { out.longTasks++; out.tbt += Math.max(0, e.duration - 50); }
  }).observe({ type: "longtask", buffered: true });

  setTimeout(() => {
    for (const e of performance.getEntriesByName("first-contentful-paint")) out.fcp = e.startTime;
    resolve(out);
  }, 3500);
});

(async () => {
  const browser = await chromium.launch();
  const rows = [];

  for (const path of PAGES) {
    const samples = [];
    for (let run = 0; run < RUNS; run++) {
      const ctx = await browser.newContext({
        viewport: { width: 1366, height: 768 },
        locale: "vi-VN",
        // A first-time visitor, every run.
        storageState: undefined,
      });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);
      if (THROTTLE) {
        await cdp.send("Network.enable");
        await cdp.send("Network.emulateNetworkConditions", NET);
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      }

      let bytes = 0, requests = 0;
      const byType = {};
      page.on("response", async (res) => {
        requests++;
        try {
          const h = res.headers();
          const len = +(h["content-length"] || 0);
          const type = (h["content-type"] || "other").split(";")[0].split("/")[0];
          bytes += len;
          byType[type] = (byType[type] || 0) + len;
        } catch { /* redirects have no body */ }
      });

      await page.goto(BASE + path, { waitUntil: "load", timeout: 90000 });
      const m = await page.evaluate(collect);
      samples.push({ ...m, bytes, requests, byType });
      await ctx.close();
    }

    const med = (k) => {
      const v = samples.map((s) => s[k]).sort((a, b) => a - b);
      return v[Math.floor(v.length / 2)];
    };
    rows.push({
      path,
      ttfb: Math.round(med("ttfb")),
      fcp: Math.round(med("fcp")),
      lcp: Math.round(med("lcp")),
      cls: +med("cls").toFixed(3),
      tbt: Math.round(med("tbt")),
      kb: Math.round(med("bytes") / 1024),
      req: med("requests"),
    });
  }
  await browser.close();

  const verdict = (r) => {
    const bad = [];
    if (r.lcp > 2500) bad.push("LCP");
    if (r.cls > 0.1) bad.push("CLS");
    if (r.tbt > 200) bad.push("TBT");
    return bad.length ? "NEEDS WORK: " + bad.join(",") : "good";
  };

  console.log(`profile: ${THROTTLE ? "Slow 4G + 4x CPU" : "unthrottled"} · median of ${RUNS} cold loads\n`);
  console.log("PATH             TTFB   FCP    LCP    CLS     TBT    KB   REQ   verdict");
  for (const r of rows) {
    console.log(
      `${r.path.padEnd(16)} ${String(r.ttfb).padStart(4)}  ${String(r.fcp).padStart(5)}  ${String(r.lcp).padStart(5)}  ${String(r.cls).padStart(5)}  ${String(r.tbt).padStart(5)}  ${String(r.kb).padStart(4)}  ${String(r.req).padStart(3)}   ${verdict(r)}`,
    );
  }
})();
