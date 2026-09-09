const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3002";
const PATH_ = process.env.CLS_PATH || "/thu-vien";
const NET = { offline: false, downloadThroughput: (1.6*1024*1024)/8, uploadThroughput: (750*1024)/8, latency: 150 };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 }, locale: "vi-VN" });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", NET);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await page.goto(BASE + PATH_, { waitUntil: "domcontentloaded" });
  const shifts = await page.evaluate(() => new Promise((res) => {
    const out = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        out.push({
          value: +e.value.toFixed(4),
          t: Math.round(e.startTime),
          sources: (e.sources || []).map((s) => ({
            tag: s.node ? s.node.tagName : "?",
            cls: s.node && s.node.className ? s.node.className.toString().slice(0, 44) : "",
            from: s.previousRect ? `${Math.round(s.previousRect.y)},${Math.round(s.previousRect.height)}` : "",
            to: s.currentRect ? `${Math.round(s.currentRect.y)},${Math.round(s.currentRect.height)}` : "",
          })),
        });
      }
    }).observe({ type: "layout-shift", buffered: true });
    setTimeout(() => res(out), 5000);
  }));
  console.log(`${PATH_}  total CLS = ${shifts.reduce((a, s) => a + s.value, 0).toFixed(4)}`);
  for (const s of shifts) {
    console.log(`  ${s.value} @${s.t}ms`);
    for (const src of s.sources) console.log(`      <${src.tag}> .${src.cls}  y,h ${src.from} -> ${src.to}`);
  }
  await b.close();
})();
