const { chromium } = require("playwright");

async function disableSmoothScroll(page) {
  await page.addStyleTag({
    content: "html { scroll-behavior: auto !important; } *, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }",
  });
}

const { PNG } = require("pngjs");

const BASE = process.env.BASE || "http://localhost:3002";
const WIDTHS = (process.env.WIDTHS || "390,1440").split(",").map(Number);
const PAGES = [
  ["home", "/"], ["about", "/gioi-thieu"], ["agenda", "/chuong-trinh"],
  ["speakers", "/dien-gia"], ["speaker", "/dien-gia/nguyen-minh-quan"],
  ["news", "/tin-tuc"],
  ["article", "/tin-tuc/bai-phat-bieu-nganh-dich-vu-viet-nam-trong-thap-ky-so"],
  ["gallery", "/thu-vien"], ["register", "/dang-ky"],
  ["partners", "/doi-tac"], ["contact", "/lien-he"],
];

const lum = (r, g, b) => {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/**
 * Contrast measured from the rendered pixels, which is the only way to judge
 * text sitting on a photograph, a gradient, or a translucent panel.
 * Background = the most common luminance in the box; text = the extreme that is
 * furthest from it, taken at a percentile so antialiased edges do not dominate.
 */
const N = 40; // histogram resolution

/**
 * `cssLum` is the luminance of the element's declared colour. Glyphs are a small
 * minority of pixels in a box, so a percentile lands in the background; anchoring
 * on the declared colour finds the text cluster reliably, and the densest bin
 * away from it is the true backdrop.
 */
function measure(png, cssLum) {
  const bins = new Array(N).fill(0);
  let total = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i + 3] < 128) continue;
    const l = lum(png.data[i], png.data[i + 1], png.data[i + 2]);
    bins[Math.min(N - 1, Math.floor(l * N))]++;
    total++;
  }
  if (total < 60) return null;

  const centre = (i) => (i + 0.5) / N;
  const floor = Math.max(3, total * 0.002);

  // Text: the populated bin nearest the declared colour.
  let ti = -1, tbest = Infinity;
  for (let i = 0; i < N; i++) {
    if (bins[i] < floor) continue;
    const d = Math.abs(centre(i) - cssLum);
    if (d < tbest) { tbest = d; ti = i; }
  }
  if (ti < 0 || tbest > 0.14) return null; // text colour never actually rendered

  // Background: densest bin that is clearly not the text cluster.
  let bi = -1, bbest = -1;
  for (let i = 0; i < N; i++) {
    if (Math.abs(centre(i) - centre(ti)) < 0.06) continue;
    if (bins[i] > bbest) { bbest = bins[i]; bi = i; }
  }
  if (bi < 0 || bbest < floor) return null; // solid block, nothing to compare

  return { ratio: ratio(centre(ti), centre(bi)), coverage: total };
}


// domcontentloaded fires before stylesheets finish, and measuring an unstyled
// page reports every ratio and every measure as a failure. Nothing is sampled
// until the page is actually wearing its CSS.
async function waitForStyled(page) {
  await page.waitForFunction(
    () => {
      if (document.styleSheets.length === 0) return false;
      // Tailwind compiles most theme tokens to literals, so a custom property
      // is not a reliable signal; the font stack is set from one that survives.
      const ff = getComputedStyle(document.body).fontFamily;
      return ff.includes("Be Vietnam") || ff.includes("--font-be-vietnam");
    },
    null,
    { timeout: 20000 },
  );
}

(async () => {
  const browser = await chromium.launch();
  const findings = [];

  for (const width of WIDTHS) {
    for (const [name, path] of PAGES) {
    const ctx = await browser.newContext({
      viewport: { width, height: width < 768 ? 844 : 900 },
      deviceScaleFactor: 2, isMobile: width < 768, locale: "vi-VN",
    });
    const page = await ctx.newPage();
      await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 45000 });
      await waitForStyled(page);
      await disableSmoothScroll(page);
      await page.evaluate(async () => {
        const s = window.innerHeight * 0.8;
        for (let y = 0; y < document.body.scrollHeight; y += s) {
          window.scrollTo({ top: y, behavior: "instant" }); await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo({ top: 0, behavior: "instant" }); await new Promise((r) => setTimeout(r, 350));
      });
      await page.waitForTimeout(400);

      const targets = await page.evaluate(() => {
        const out = [];
        const seen = new Set();
        for (const el of document.querySelectorAll("p,span,a,li,h1,h2,h3,h4,button,label,td,th,dt,dd,figcaption,time,small,strong,code")) {
          const txt = (el.textContent || "").trim();
          if (txt.length < 3) continue;
          if (el.children.length && !Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
          const r = el.getBoundingClientRect();
          if (r.width < 12 || r.height < 8 || r.height > 200) continue;
          if (r.bottom < 0 || r.top > document.body.scrollHeight) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || +cs.opacity === 0) continue;
          // A closed drawer keeps its layout box; its contents are not on screen.
          let hidden = false;
          for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
            const acs = getComputedStyle(a);
            if (+acs.opacity === 0 || acs.visibility === "hidden" || a.getAttribute("aria-hidden") === "true") {
              hidden = true; break;
            }
          }
          if (hidden) continue;
          const size = parseFloat(cs.fontSize);
          const bold = parseInt(cs.fontWeight, 10) >= 700;
          const m = cs.color.match(/rgba?\(([^)]+)\)/);
          const c = m ? m[1].split(",").map(Number) : [0, 0, 0];
          const key = `${cs.color}|${Math.round(size)}|${cs.fontWeight}|${txt.slice(0, 12)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          out.push({
            key, size, bold, rgb: [c[0], c[1], c[2]],
            need: size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5,
            text: txt.slice(0, 40),
            box: { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height },
          });
          if (out.length > 55) break;
        }
        return out;
      });

      for (const t of targets) {
        try {
          const buf = await page.screenshot({
            clip: {
              x: Math.max(0, t.box.x), y: Math.max(0, t.box.y),
              width: Math.max(4, Math.min(t.box.w, 900)), height: Math.max(4, t.box.h),
            },
            scale: "device",
          });
          const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
          const cssLum = 0.2126 * f(t.rgb[0]) + 0.7152 * f(t.rgb[1]) + 0.0722 * f(t.rgb[2]);
          const m = measure(PNG.sync.read(buf), cssLum);
          if (m && m.ratio < t.need - 0.05) {
            findings.push({
              where: `${name}@${width}`, ratio: +m.ratio.toFixed(2), need: t.need,
              size: Math.round(t.size), text: t.text,
            });
          }
        } catch { /* element scrolled out of the capture area */ }
      }
      await ctx.close();
    }
  }
  await browser.close();

  console.log(`=== PIXEL CONTRAST: ${findings.length} real failures ===`);
  const seen = new Set();
  for (const f of findings) {
    const k = `${f.text}|${f.size}`;
    if (seen.has(k)) continue;
    seen.add(k);
    console.log(`  ${String(f.ratio).padStart(5)}:1 (need ${f.need})  ${String(f.size).padStart(2)}px  ${f.where.padEnd(16)} "${f.text}"`);
  }
})();
