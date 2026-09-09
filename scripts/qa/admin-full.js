const { chromium } = require("playwright");
const BASE = process.env.BASE || "http://localhost:3002";
const OUT = process.env.SHOT_DIR || ".";

let pass = 0, fail = 0;
const errors = [];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 }, locale: "vi-VN" });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 100)));
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message.slice(0, 100)));

  const step = async (name, fn) => {
    try { await fn(); pass++; console.log(`PASS  ${name}`); }
    catch (e) { fail++; console.log(`FAIL  ${name}\n      ${e.message.split("\n")[0].slice(0, 160)}`); }
  };

  // ---------- auth ----------
  await step("login", async () => {
    await page.goto(`${BASE}/admin/login`, { waitUntil: "domcontentloaded" });
    await page.fill("#login-email", "admin@vhdcorp.com");
    await page.fill("#login-password", process.env.ADMIN_PW || "Admin@12345");
    await page.click('button[type="submit"]');
    await page.waitForURL(`${BASE}/admin`, { timeout: 25000 });
  });

  const visit = async (path, waitFor) => {
    await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(waitFor, { timeout: 20000 });
    await page.waitForTimeout(700);
  };

  // ---------- every admin screen loads with data ----------
  const SCREENS = [
    ["dashboard", "/admin", "text=Đăng ký gần đây"],
    ["agenda", "/admin/chuong-trinh", "text=Ngày 1"],
    ["speakers", "/admin/dien-gia", "table"],
    ["posts", "/admin/tin-tuc", "table"],
    ["gallery", "/admin/thu-vien", "text=Hình ảnh"],
    ["partners", "/admin/doi-tac", "table"],
    ["registrations", "/admin/dang-ky", "table"],
    ["contacts", "/admin/lien-he", "text=Trả lời qua email"],
    ["settings", "/admin/cai-dat", "#s-name"],
  ];
  for (const [name, path, sel] of SCREENS) {
    await step(`screen ${name}`, async () => {
      await visit(path, sel);
      const ovf = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (ovf > 0) throw new Error(`horizontal overflow ${ovf}px`);
      await page.screenshot({ path: `${OUT}/admin-${name}.png` });
    });
  }

  // ---------- agenda: create + delete a session ----------
  await step("agenda create session", async () => {
    await visit("/admin/chuong-trinh", "text=Ngày 1");
    await page.getByRole("button", { name: /^Thêm phiên$/ }).first().click();
    await page.waitForSelector("#ses-title");
    await page.fill("#ses-title", "E2E Phiên Kiểm Thử");
    await page.fill("#ses-room", "Phòng Test");
    await page.getByRole("button", { name: /^Lưu phiên$/ }).click();
    await page.waitForSelector("text=E2E Phiên Kiểm Thử", { timeout: 20000 });
  });
  await step("agenda delete session", async () => {
    const row = page.locator("li", { hasText: "E2E Phiên Kiểm Thử" }).first();
    await row.locator('button[aria-label="Xoá phiên"]').click();
    await page.getByRole("button", { name: /^Xoá$/ }).last().click();
    await page.waitForSelector("text=E2E Phiên Kiểm Thử", { state: "detached", timeout: 20000 });
  });

  // ---------- posts: create + edit + delete ----------
  await step("post create", async () => {
    await visit("/admin/tin-tuc", "table");
    await page.getByRole("button", { name: /Viết bài mới/ }).first().click();
    await page.waitForSelector("#post-title");
    await page.fill("#post-title", "E2E Bài Viết Kiểm Thử");
    await page.locator('[role="textbox"]').first().click();
    await page.keyboard.type("Nội dung kiểm thử tự động cho bài viết.");
    await page.getByRole("button", { name: /^Đăng bài$/ }).click();
    await page.waitForSelector("text=E2E Bài Viết Kiểm Thử", { timeout: 20000 });
  });
  await step("post appears on public site", async () => {
    const p2 = await ctx.newPage();
    try {
      await p2.goto(`${BASE}/tin-tuc?q=${encodeURIComponent("E2E Bài Viết")}`, {
        waitUntil: "domcontentloaded",
      });
      const html = await p2.content();
      if (!html.includes("E2E Bài Viết Kiểm Thử")) {
        throw new Error("title missing from server HTML; page length " + html.length);
      }
    } finally {
      await p2.close();
    }
  });
  await step("post delete", async () => {
    await visit("/admin/tin-tuc", "table");
    const row = page.locator("tr", { hasText: "E2E Bài Viết Kiểm Thử" }).first();
    await row.locator('button[aria-label="Xoá"]').click();
    await page.getByRole("button", { name: /^Xoá$/ }).last().click();
    await page.waitForSelector("text=E2E Bài Viết Kiểm Thử", { state: "detached", timeout: 20000 });
  });

  // ---------- partner CRUD ----------
  await step("partner create + delete", async () => {
    await visit("/admin/doi-tac", "table");
    await page.getByRole("button", { name: /Thêm đối tác/ }).first().click();
    await page.waitForSelector("#p-name");
    await page.fill("#p-name", "E2E Đối Tác Kiểm Thử");
    await page.fill("#p-website", "https://example.com");
    await page.getByRole("button", { name: /^Lưu$/ }).click();
    await page.waitForSelector("text=E2E Đối Tác Kiểm Thử", { timeout: 20000 });

    const row = page.locator("tr", { hasText: "E2E Đối Tác Kiểm Thử" }).first();
    await row.locator('button[aria-label="Xoá"]').click();
    await page.getByRole("button", { name: /^Xoá$/ }).last().click();
    await page.waitForSelector("text=E2E Đối Tác Kiểm Thử", { state: "detached", timeout: 20000 });
  });

  // ---------- gallery item ----------
  await step("gallery add video + delete", async () => {
    await visit("/admin/thu-vien", "text=Hình ảnh");
    await page.getByRole("button", { name: /^Thêm mục$/ }).first().click();
    await page.waitForSelector("#g-type");
    await page.selectOption("#g-type", "video");
    await page.fill("#g-url", "https://www.youtube.com/watch?v=abc12345678");
    await page.fill("#g-title", "E2E Video Kiểm Thử");
    await page.getByRole("button", { name: /^Lưu$/ }).click();
    await page.waitForSelector("text=E2E Video Kiểm Thử", { timeout: 20000 });

    const card = page.locator("div.group").filter({ hasText: "E2E Video Kiểm Thử" }).first();
    await card.hover();
    await card.locator('button[aria-label="Xoá"]').click();
    await page.getByRole("button", { name: /^Xoá$/ }).last().click();
    await page.waitForSelector("text=E2E Video Kiểm Thử", { state: "detached", timeout: 20000 });
  });

  // ---------- registration status change ----------
  await step("registration status change", async () => {
    await visit("/admin/dang-ky", "table");
    const select = page.locator("select[aria-label^='Trạng thái']").first();
    const before = await select.inputValue();
    const next = before === "confirmed" ? "pending" : "confirmed";
    await select.selectOption(next);
    await page.waitForTimeout(1200);
    if ((await select.inputValue()) !== next) throw new Error("status did not stick");
    await select.selectOption(before);
    await page.waitForTimeout(800);
  });

  // ---------- settings save round-trip ----------
  await step("settings save", async () => {
    await visit("/admin/cai-dat", "#s-name");
    const original = await page.inputValue("#s-name");
    await page.fill("#s-name", original + " ✓");
    await page.getByRole("button", { name: /Lưu thay đổi/ }).click();
    await page.waitForSelector("text=Đã lưu cấu hình", { timeout: 20000 });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#s-name");
    if (!(await page.inputValue("#s-name")).endsWith("✓")) throw new Error("value not persisted");
    await page.fill("#s-name", original);
    await page.getByRole("button", { name: /Lưu thay đổi/ }).click();
    await page.waitForTimeout(1500);
  });

  // ---------- logout ----------
  await step("logout", async () => {
    await visit("/admin", "text=Đăng ký gần đây");
    await page.locator("header button").last().click();
    await page.getByRole("button", { name: /Đăng xuất/ }).click();
    await page.waitForURL("**/admin/login", { timeout: 20000 });
  });

  await step("protected route redirects when logged out", async () => {
    await page.goto(`${BASE}/admin/dien-gia`, { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/admin/login", { timeout: 20000 });
  });

  const real = errors.filter((e) => !e.includes("401"));
  console.log(`\n${pass} passed, ${fail} failed`);
  console.log("console errors:", real.length ? JSON.stringify([...new Set(real)].slice(0, 6), null, 1) : "none");
  await browser.close();
  process.exit(fail > 0 ? 1 : 0);
})();
