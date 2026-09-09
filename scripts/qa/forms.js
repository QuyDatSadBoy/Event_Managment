const { chromium } = require("playwright");
const HOST = process.env.LIVE_HOST || "";
const IP = process.env.LIVE_IP || "";
const BASE = process.env.BASE || (HOST ? `https://${HOST}` : "http://localhost:3002");
const OUT = process.env.SHOT_DIR || ".";

let pass = 0, fail = 0;
const step = async (name, fn) => {
  try { await fn(); pass++; console.log(`PASS  ${name}`); }
  catch (e) { fail++; console.log(`FAIL  ${name}: ${e.message.split("\n")[0].slice(0,140)}`); }
};

(async () => {
  const browser = await chromium.launch(HOST ? { args: [`--host-resolver-rules=MAP ${HOST} ${IP}`] } : {});
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true, locale: "vi-VN" });
  const page = await ctx.newPage();
  const email = `e2e-${Date.now()}@example.com`;

  await step("open register page", async () => {
    await page.goto(`${BASE}/dang-ky`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#full_name", { timeout: 20000 });
  });

  await step("client validation blocks empty submit", async () => {
    await page.getByRole("button", { name: /Hoàn tất đăng ký/ }).click();
    await page.waitForSelector("text=Vui lòng nhập họ và tên", { timeout: 10000 });
  });

  await step("invalid email is rejected", async () => {
    await page.fill("#full_name", "Nguyễn Kiểm Thử");
    await page.fill("#email", "khong-phai-email");
    await page.fill("#phone", "0900111222");
    await page.getByRole("button", { name: /Hoàn tất đăng ký/ }).click();
    await page.waitForSelector("text=Email không hợp lệ", { timeout: 10000 });
  });

  await step("submit succeeds and lands on thank-you", async () => {
    await page.fill("#email", email);
    await page.fill("#company", "E2E Co");
    await page.getByRole("button", { name: /Đầu tư & M&A/ }).click();
    await page.getByRole("button", { name: /Hoàn tất đăng ký/ }).click();
    await page.waitForURL("**/dang-ky/hoan-tat**", { timeout: 30000 });
    await page.waitForSelector("text=Đăng ký thành công", { timeout: 15000 });
  });

  await step("ticket code is shown", async () => {
    const code = await page.locator("code").first().textContent();
    if (!/^EVT-/.test((code || "").trim())) throw new Error(`unexpected code: ${code}`);
    console.log(`      code = ${code.trim()}`);
  });
  await page.screenshot({ path: `${OUT}/live-thankyou-mobile.png` });

  await step("duplicate email is refused", async () => {
    await page.goto(`${BASE}/dang-ky`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#full_name");
    await page.fill("#full_name", "Nguyễn Kiểm Thử");
    await page.fill("#email", email);
    await page.fill("#phone", "0900111222");
    await page.getByRole("button", { name: /Hoàn tất đăng ký/ }).click();
    await page.waitForSelector("text=đã được đăng ký", { timeout: 20000 });
  });

  await step("contact form sends", async () => {
    await page.goto(`${BASE}/lien-he`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#contact-name");
    await page.fill("#contact-name", "Nguyễn Liên Hệ");
    await page.fill("#contact-email", `contact-${Date.now()}@example.com`);
    await page.fill("#contact-message", "Đây là tin nhắn kiểm thử tự động từ Playwright.");
    await page.getByRole("button", { name: /Gửi liên hệ/ }).click();
    await page.waitForSelector("text=Đã gửi liên hệ", { timeout: 25000 });
  });

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
