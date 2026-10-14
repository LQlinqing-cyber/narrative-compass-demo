import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const root = fileURLToPath(new URL("../", import.meta.url));
const files = { "index.html": "text/html", "demo.js": "text/javascript", "styles.css": "text/css", "favicon.svg": "image/svg+xml", "叙事罗盘-报告.md": "text/markdown", "叙事罗盘-终稿.txt": "text/plain" };
const server = createServer(async (request, response) => {
  const path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const file = path === "/narrative-compass-demo/" ? "index.html" : path.replace(/^\/narrative-compass-demo\//, "");
  if (!Object.hasOwn(files, file)) { response.writeHead(404).end(); return; }
  try { response.setHeader("Content-Type", files[file] + ";charset=utf-8"); response.end(await readFile(resolve(root, file))); }
  catch { response.writeHead(500).end(); }
});
await new Promise((done) => server.listen(0, "127.0.0.1", done));
const url = process.env.DEMO_URL || `http://127.0.0.1:${server.address().port}/narrative-compass-demo/`;
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1366, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });
  const page = await context.newPage();
  const errors = [];
  const apiRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => { if (new URL(request.url()).pathname.includes("/api/")) apiRequests.push(request.url()); });
  const response = await page.goto(url, { waitUntil: "networkidle" });
  assert.equal(response.status(), 200);
  assert.equal(await page.getByRole("heading", { name: "叙事罗盘", exact: true }).count(), 1);
  assert.equal(await page.getByText("静态模板演示api未连接", { exact: true }).count(), 1);
  assert.equal(await page.locator("#api-status-dot").evaluate((node) => getComputedStyle(node).backgroundColor), "rgb(239, 68, 68)");
  assert.equal(await page.getByRole("link", { name: /^https:\/\/narrative-compass-campus/ }).getAttribute("href"), "https://narrative-compass-campus.jingxuantang031.chatgpt.site/svg");
  for (const field of await page.locator("textarea").all()) assert.equal(await field.getAttribute("readonly"), "");
  assert.equal(await page.getByRole("button", { name: "开始分析", exact: true }).count(), 0);
  const titles = ["结构诊断", "表达自检", "场景重写", "舆情沙盘", "传播评分"];
  for (let index = 0; index < titles.length; index++) {
    await page.locator("[data-report-panel]:not([hidden]) nav button").nth(index).click();
    assert.equal(await page.locator("[data-report-panel]:not([hidden])").getAttribute("data-report-panel"), String(index + 1));
    assert.ok(await page.locator(`#report-${index + 1}`).isVisible());
  }
  assert.match(await page.locator("#report-5").innerText(), /90\s*\/\s*100/u);
  for (const score of [19, 25, 21, 25]) assert.match(await page.locator("#report-5").innerText(), new RegExp(`${score} / 25`));
  await page.locator("#report-5 nav button").first().click();
  await page.locator("#report-1 nav button").first().press("ArrowRight");
  assert.equal(await page.locator("#report-2").isVisible(), true);
  const quote = page.locator("#report-2 button").filter({ hasText: /^“/ }).first();
  const quoteText = (await quote.innerText()).slice(1, -1);
  await quote.click();
  assert.equal(await page.locator("#source-text").evaluate((node) => node.value.slice(node.selectionStart, node.selectionEnd)), quoteText);
  await page.locator("#report-2 nav button").nth(3).click();
  assert.equal(await page.getByText("本次导出报告未提供复检明细。", { exact: true }).count(), 1);
  assert.equal(await page.getByText(/结构 0 项/).count(), 0);
  const finalText = await readFile(resolve(root, "叙事罗盘-终稿.txt"), "utf8");
  assert.equal(await page.locator("#final-text").inputValue(), finalText);
  for (const comparison of ["rewrite", "original"]) {
    await page.locator(`[data-compare=${comparison}]`).click();
    const diff = page.locator(`[data-diff=${comparison}]`);
    assert.equal(await diff.isVisible(), true);
    assert.equal(await diff.evaluate((node) => [...node.children].filter((part) => part.tagName !== "DEL").map((part) => part.textContent).join("")), finalText);
  }
  await page.getByRole("button", { name: "复制终稿", exact: true }).click();
  // Windows 剪贴板会将换行转为 CRLF，比较时只统一换行形式。
  assert.equal((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n"), finalText);
  await page.evaluate(() => Object.defineProperty(navigator.clipboard, "writeText", { value: async () => { throw Error("Clipboard denied"); } }));
  await page.getByRole("button", { name: "复制终稿", exact: true }).click();
  assert.match(await page.locator("#copy-status").innerText(), /已选中终稿/);
  for (const [name, file] of [["下载 Markdown 报告", "叙事罗盘-报告.md"], ["下载文字稿", "叙事罗盘-终稿.txt"]]) {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("link", { name, exact: true }).click();
    const download = await downloadPromise;
    assert.equal(download.suggestedFilename(), file);
    const chunks = [];
    for await (const chunk of await download.createReadStream()) chunks.push(chunk);
    assert.deepEqual(Buffer.concat(chunks), await readFile(resolve(root, file)));
  }
  await page.locator("#report-4 nav button").first().click();
  await page.evaluate(() => {
    document.querySelector("#final-text").setSelectionRange(0, 0);
    document.querySelector("#final-text").blur();
    document.querySelector("#copy-status").hidden = true;
  });
  await page.screenshot({ path: resolve(tmpdir(), "narrative-compass-demo-desktop.png"), fullPage: true });
  for (const width of [390, 683, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (let stage = 1; stage <= 5; stage++) {
      await page.locator("[data-report-panel]:not([hidden]) nav button").nth(stage - 1).click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `模块 ${stage} 在 ${width}px 横向溢出`);
    }
    if (width === 390) await page.screenshot({ path: resolve(tmpdir(), "narrative-compass-demo-mobile.png"), fullPage: true });
  }
  await page.reload({ waitUntil: "networkidle" });
  assert.equal(await page.locator("#report-1").isVisible(), true);
  assert.deepEqual(apiRequests, []);
  assert.deepEqual(errors, []);
  console.log("浏览器验收通过：五模块、红色状态、原句定位、键盘切换、两种 Diff、复制与失败回退、下载原文、390/683/1366/1920px 布局、刷新及零 API 请求。");
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
