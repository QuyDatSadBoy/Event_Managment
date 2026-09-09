# QA suite

Browser-driven checks. They talk to a running site — point `BASE` at whichever
one you want to test.

```bash
cd scripts/qa
npm install
npx playwright install chromium

BASE=http://localhost:3002 npm run audit     # responsive + a11y, 11 pages × 9 widths
BASE=http://localhost:3002 npm run contrast  # contrast measured from rendered pixels
BASE=http://localhost:3002 npm run perf      # LCP/CLS/TBT on Slow 4G + 4× CPU
BASE=http://localhost:3002 npm run crawl     # status, console errors, broken images
BASE=http://localhost:3002 npm run admin     # 21 admin flows (needs ADMIN_PW)
BASE=http://localhost:3002 npm run forms     # registration + contact
```

Against the deployed site, add the host mapping so it works before DNS
propagates and accepts the Cloudflare origin certificate:

```bash
BASE=https://event.vhdcorp.com LIVE_HOST=event.vhdcorp.com LIVE_IP=116.118.6.61 npm run crawl
```

## Why contrast is measured from pixels

A computed `background-color` cannot see a photograph, a gradient, or a
translucent panel. Estimating from CSS reported 642 failures on this site, nearly
all of them white hero text over a dark image. Sampling the rendered pixels and
anchoring on the element's declared colour found the 23 that were real.

`audit.js` therefore leaves contrast to `contrast.js` and checks only what the
DOM can answer honestly.

## Extra tools

- `slices.js` — captures a page in viewport-sized slices, for reading a long page
  at a real device width. `PAGE_PATH`, `PAGE_NAME`, `W`, `H`, `MAX_SLICES`.
- `lcp.js` — names the LCP element and its transfer size per page.
- `cls.js` — lists every layout shift with the nodes that moved.
