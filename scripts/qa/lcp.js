const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3002";
const PATHS = ["/", "/chuong-trinh", "/dien-gia", "/tin-tuc", "/thu-vien", "/doi-tac", "/dang-ky"];
const NET = { offline: false, downloadThroughput: (1.6*1024*1024)/8, uploadThroughput: (750*1024)/8, latency: 150 };

(async () => {
  const b = await chromium.launch();
  console.log("PATH             LCP    element / url                                         bytes");
  for (const path of PATHS) {
    const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, locale: "vi-VN" });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", NET);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

    const sizes = new Map();
    page.on("response", (r) => {
      const len = +(r.headers()["content-length"] || 0);
      if (len) sizes.set(r.url(), len);
    });

    await page.goto(BASE + path, { waitUntil: "load", timeout: 90000 });
    const info = await page.evaluate(() => new Promise((res) => {
      let best = null;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!best || e.startTime > best.startTime) best = e;
      }).observe({ type: "largest-contentful-paint", buffered: true });
      setTimeout(() => {
        if (!best) return res(null);
        const el = best.element;
        res({
          t: Math.round(best.startTime),
          url: best.url || "",
          tag: el ? el.tagName.toLowerCase() : "?",
          text: el ? (el.textContent || "").trim().slice(0, 34) : "",
          cls: el ? (el.className || "").toString().slice(0, 26) : "",
        });
      }, 3200);
    }));

    // Total image bytes, so the picture is not just about the LCP element.
    let imgBytes = 0;
    for (const [u, n] of sizes) if (/unsplash|placehold|_next\/image|\.(png|jpe?g|webp|avif)/.test(u)) imgBytes += n;

    if (info) {
      const short = info.url ? info.url.replace(/^https?:\/\//, "").slice(0, 50) : `<${info.tag}> ${info.text}`;
      console.log(`${path.padEnd(16)} ${String(info.t).padStart(5)}  ${short.padEnd(52)} ${(sizes.get(info.url) ? Math.round(sizes.get(info.url)/1024)+"KB" : "-").padStart(6)}   imgTotal=${Math.round(imgBytes/1024)}KB`);
    }
    await ctx.close();
  }
  await b.close();
})();
