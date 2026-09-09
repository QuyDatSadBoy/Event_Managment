const { chromium } = require("playwright");
const fs = require("fs");

const BASE = process.env.BASE || "http://localhost:3002";
const OUT = process.env.OUT_DIR || "./audit";
const ONLY = process.env.ONLY_PAGES ? process.env.ONLY_PAGES.split(",") : null;

// Standard device widths people actually use.
const BREAKPOINTS = [
  ["320", 320, 640],    // iPhone SE 1st gen — the narrow floor
  ["375", 375, 667],    // iPhone SE / mini
  ["390", 390, 844],    // iPhone 14 / 15
  ["430", 430, 932],    // iPhone 15 Pro Max
  ["768", 768, 1024],   // iPad portrait
  ["1024", 1024, 768],  // iPad landscape
  ["1280", 1280, 800],  // laptop
  ["1440", 1440, 900],  // desktop
  ["1920", 1920, 1080], // large desktop
];

const PAGES = [
  ["home", "/"],
  ["about", "/gioi-thieu"],
  ["agenda", "/chuong-trinh"],
  ["speakers", "/dien-gia"],
  ["speaker", "/dien-gia/nguyen-minh-quan"],
  ["news", "/tin-tuc"],
  ["article", "/tin-tuc/bai-phat-bieu-nganh-dich-vu-viet-nam-trong-thap-ky-so"],
  ["gallery", "/thu-vien"],
  ["register", "/dang-ky"],
  ["partners", "/doi-tac"],
  ["contact", "/lien-he"],
];

// ---------------------------------------------------------------- checks ---
const AUDIT = () => {
  const out = { overflow: 0, issues: [] };
  const add = (rule, detail) => out.issues.push({ rule, detail });

  const doc = document.documentElement;
  out.overflow = doc.scrollWidth - doc.clientWidth;

  // Elements sticking out past the viewport.
  if (out.overflow > 0) {
    const vw = doc.clientWidth;
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.right > vw + 1 || r.left < -1) {
        const cs = getComputedStyle(el);
        if (cs.position === "fixed" || cs.visibility === "hidden" || cs.opacity === "0") continue;
        add("overflow-element",
          `${el.tagName.toLowerCase()}.${(el.className || "").toString().split(" ").slice(0,2).join(".")} right=${Math.round(r.right)} vw=${vw}`);
        if (out.issues.filter((i) => i.rule === "overflow-element").length > 4) break;
      }
    }
  }

  // --- contrast (WCAG 2.1) ---
  const lum = (c) => {
    const s = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
  };
  const parse = (str) => {
    const m = str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(",").map((x) => parseFloat(x));
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  };
  const blend = (fg, bg, a) => fg.map((v, i) => v * a + bg[i] * (1 - a));
  // Returns null when the text sits over media or a gradient, where a computed
  // colour says nothing about the real backdrop — those need an eye, not a ratio.
  const bgOf = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== "none") return null;
      for (const child of n.children) {
        if (child === el) break;
        const ccs = getComputedStyle(child);
        if ((child.tagName === "IMG" || child.tagName === "VIDEO") &&
            (ccs.position === "absolute" || ccs.position === "fixed")) return null;
      }
      const c = parse(cs.backgroundColor);
      if (c && c.a > 0.85) return c.rgb;
      n = n.parentElement;
    }
    return [255, 255, 255];
  };

  const seen = new Set();
  const SKIP_CONTRAST = true; // measured for real in contrast.js
  for (const el of SKIP_CONTRAST ? [] : document.querySelectorAll("p,span,a,li,h1,h2,h3,h4,h5,h6,button,label,td,th,dt,dd,figcaption,time,small,code")) {
    const text = (el.textContent || "").trim();
    if (!text || text.length < 2) continue;
    if (el.children.length > 0 && !Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > 6000) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.opacity === "0") continue;
    const fg = parse(cs.color);
    if (!fg) continue;
    const bg = bgOf(el);
    if (!bg) continue;
    const eff = fg.a < 1 ? blend(fg.rgb, bg, fg.a) : fg.rgb;
    const L1 = lum(eff), L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize);
    const bold = parseInt(cs.fontWeight, 10) >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (ratio < need) {
      const key = `${cs.color}|${Math.round(size)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      add("contrast", `${ratio.toFixed(2)}:1 need ${need} — ${size}px "${text.slice(0, 34)}"`);
    }
  }

  // --- tap targets ---
  const mobile = window.innerWidth < 768;
  const min = mobile ? 44 : 24;
  const tseen = new Set();
  for (const el of document.querySelectorAll("a,button,input,select,textarea,[role=button],[tabindex]")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.bottom < 0 || r.top > 4000) continue;
    const cs = getComputedStyle(el);
    if (cs.display === "contents") continue;
    // Inline links inside prose are exempt from the target rule.
    if (el.tagName === "A" && cs.display.includes("inline") && el.closest("p,li")) continue;
    // Visually-hidden helpers (skip links) are 1px until focused.
    if (r.width <= 2 && r.height <= 2 && cs.clip !== "auto") continue;
    if (el.className && el.className.toString().includes("sr-only")) continue;
    let buried = false;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
      const acs = getComputedStyle(a);
      if (+acs.opacity === 0 || acs.visibility === "hidden" || a.getAttribute("aria-hidden") === "true") {
        buried = true; break;
      }
    }
    if (buried) continue;
    if (r.height < min - 0.5 || r.width < min - 0.5) {
      const key = `${el.tagName}|${Math.round(r.width)}x${Math.round(r.height)}|${(el.getAttribute("aria-label") || el.textContent || "").slice(0,20)}`;
      if (tseen.has(key)) continue;
      tseen.add(key);
      add("tap-target", `${Math.round(r.width)}×${Math.round(r.height)} (min ${min}) — ${el.tagName.toLowerCase()} "${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 28)}"`);
    }
  }

  // --- form input font-size (iOS zoom) ---
  for (const el of document.querySelectorAll("input,select,textarea")) {
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size < 16) add("input-font-size", `${size}px on ${el.id || el.name || el.tagName} (<16px zooms on iOS)`);
  }

  // --- accessible names on icon-only controls ---
  for (const el of document.querySelectorAll("button,a")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    const text = (el.textContent || "").trim();
    const label = el.getAttribute("aria-label") || el.getAttribute("title");
    if (!text && !label) {
      add("missing-name", `${el.tagName.toLowerCase()} with no text and no aria-label`);
    }
  }

  // --- images without dimensions (CLS) ---
  for (const img of document.images) {
    const cs = getComputedStyle(img);
    const parent = img.parentElement && getComputedStyle(img.parentElement);
    const sized = img.getAttribute("width") || cs.position === "absolute" ||
      (parent && (parent.aspectRatio !== "auto" || parent.height !== "auto"));
    if (!sized) add("cls-image", `${(img.currentSrc || img.src || "").slice(-46)} has no reserved box`);
  }

  // --- heading order ---
  const hs = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6"))
    .filter((h) => h.getBoundingClientRect().width > 0);
  const h1s = hs.filter((h) => h.tagName === "H1").length;
  if (h1s !== 1) add("heading-h1", `${h1s} <h1> on the page (need exactly 1)`);
  let prev = 0;
  for (const h of hs) {
    const lvl = +h.tagName[1];
    if (prev && lvl > prev + 1) add("heading-skip", `${h.tagName} follows H${prev} — "${h.textContent.trim().slice(0, 28)}"`);
    prev = lvl;
  }

  // --- line length of prose ---
  const proseEl = document.querySelector(".prose-event p");
  if (proseEl) {
    const r = proseEl.getBoundingClientRect();
    if (r.width > 0) {
      // Measure one "0" in this element's own font to get a true ch.
      const probe = document.createElement("span");
      probe.textContent = "0";
      probe.style.cssText = "position:absolute;visibility:hidden;white-space:pre;";
      proseEl.appendChild(probe);
      const chPx = probe.getBoundingClientRect().width || 8;
      probe.remove();
      const ch = r.width / chPx;
      if (ch > 78) add("measure", `${Math.round(ch)}ch prose line (target 65–75)`);
    }
  }

  // --- transition: all ---
  const tseen2 = new Set();
  for (const el of document.querySelectorAll("body *")) {
    const cs2 = getComputedStyle(el);
    const dur = parseFloat(cs2.transitionDuration) || 0;
    const p = cs2.transitionProperty;
    if (p === "all" && dur > 0) {
      const k = el.className.toString().slice(0, 30);
      if (!tseen2.has(k)) { tseen2.add(k); add("transition-all", `on .${k}`); }
    }
    if (tseen2.size > 2) break;
  }

  return out;
};

// ------------------------------------------------------------------ run ---
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = {};
  const pages = ONLY ? PAGES.filter(([n]) => ONLY.includes(n)) : PAGES;

  for (const [bpName, w, h] of BREAKPOINTS) {
    const ctx = await browser.newContext({
      viewport: { width: w, height: h },
      deviceScaleFactor: 1,
      isMobile: w < 768,
      hasTouch: w < 768,
      locale: "vi-VN",
    });
    const page = await ctx.newPage();

    for (const [name, path] of pages) {
      try {
        await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.evaluate(async () => {
          const step = window.innerHeight * 0.8;
          for (let y = 0; y < document.body.scrollHeight; y += step) {
            window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60));
          }
          window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 250));
        });
        await page.waitForTimeout(500);

        const res = await page.evaluate(AUDIT);
        const key = `${name}@${bpName}`;
        if (res.overflow > 0 || res.issues.length) report[key] = res;

        await page.screenshot({ path: `${OUT}/${bpName}-${name}.png`, fullPage: true });
      } catch (e) {
        report[`${name}@${bpName}`] = { overflow: 0, issues: [{ rule: "nav-error", detail: e.message.slice(0, 100) }] };
      }
    }
    await ctx.close();
  }
  await browser.close();

  // Roll up by rule so the output stays readable.
  const byRule = {};
  for (const [key, r] of Object.entries(report)) {
    for (const i of r.issues) {
      byRule[i.rule] ??= [];
      byRule[i.rule].push(`${key}: ${i.detail}`);
    }
  }
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));

  console.log("=== ISSUES BY RULE ===");
  const order = ["nav-error","overflow-element","contrast","tap-target","input-font-size","missing-name","cls-image","heading-h1","heading-skip","measure","transition-all"];
  for (const rule of order) {
    const list = byRule[rule];
    if (!list) continue;
    console.log(`\n## ${rule}  (${list.length})`);
    const uniq = [...new Set(list.map((l) => l.replace(/@\d+:/, ": ")))];
    for (const l of list.slice(0, 10)) console.log("   " + l);
    if (list.length > 10) console.log(`   … +${list.length - 10} more (${uniq.length} distinct)`);
  }
  const total = Object.values(byRule).reduce((a, b) => a + b.length, 0);
  console.log(`\nTOTAL: ${total} issues across ${Object.keys(report).length} page/breakpoint combos`);
})();
