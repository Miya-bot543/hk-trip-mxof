// 截圖＋DOM 擷取，用來比對 v1 與 v2 外觀是否一致。
// 用法：HK_TOOLS=/tmp/hk-tools node scripts/shoot.mjs <網址> <輸出資料夾>
// 需要 playwright（裝在 HK_TOOLS，不放進儲存庫）。
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.env.HK_TOOLS || "/tmp/hk-tools", "x.js"));
const { chromium } = require("playwright");

const [base, out] = process.argv.slice(2);
if (!base || !out) { console.error("usage: shoot.mjs <url> <outdir>"); process.exit(1); }
fs.mkdirSync(out, { recursive: true });

// 固定天氣資料，讓兩次截圖一致
const wx = {
  current: { temperature_2m: 3.2, weather_code: 71 },
  daily: {
    time: ["2026-10-16","2026-10-17","2026-10-18","2026-10-19","2026-10-20","2026-10-21","2026-10-22"],
    weather_code: [71, 3, 0, 61, 73, 2, 85],
    temperature_2m_max: [5, 7, 9, 6, 2, 4, 1],
    temperature_2m_min: [-1, 0, 2, 1, -3, -2, -4],
    precipitation_probability_max: [60, 20, 0, 80, 70, 10, 90],
    snowfall_sum: [1.2, 0, 0, 0, 3.5, 0, 6],
    sunset: Array(7).fill("2026-10-16T16:58")
  }
};

const VIEWS = { m: { width: 390, height: 844 }, d: { width: 1280, height: 900 } };
const THEMES = { light: "2026-10-16T12:00:00+08:00", dark: "2026-10-16T20:00:00+08:00" };
const ROUTES = [["home","home"],["01","01"],["02","02"],["03","03"],["04","04"],["05","05"],["06","06"],["07","07"],["08","08"],["09","09"],["05-d3","05?d=3"]];

const browser = await chromium.launch({ channel: "chrome" });
const report = [];
for (const [vk, vp] of Object.entries(VIEWS)) {
  for (const [tk, time] of Object.entries(THEMES)) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, timezoneId: "Asia/Taipei", locale: "zh-TW", reducedMotion: "reduce" });
    await ctx.route("https://api.open-meteo.com/**", r => r.fulfill({ contentType: "application/json", body: JSON.stringify(wx) }));
    const shots = [...ROUTES.map(([n, h]) => [n, h, null]), ["home-preview-day5", "home", "4"]];
    for (const [name, hash, preview] of shots) {
      const page = await ctx.newPage();
      await page.clock.setFixedTime(new Date(time));
      const errors = [];
      page.on("pageerror", e => errors.push(String(e)));
      page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
      await page.goto(`${base}#/${hash}`, { waitUntil: "load" });
      if (preview !== null) await page.selectOption("#previewSel", preview);
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
      });
      await page.waitForTimeout(300);
      const file = `${vk}-${tk}-${name}`;
      await page.screenshot({ path: path.join(out, file + ".png"), fullPage: true });
      const dom = await page.evaluate(() => ({
        theme: document.documentElement.dataset.theme,
        title: document.title,
        nav: document.querySelector("#nav").outerHTML,
        app: document.querySelector("#app").outerHTML,
        extra: [...document.body.children].filter(e => !["SCRIPT","MAIN","HEADER"].includes(e.tagName) && e.id !== "snow").map(e => e.outerHTML).join("\n")
      }));
      fs.writeFileSync(path.join(out, file + ".json"), JSON.stringify(dom, null, 1));
      report.push({ file, errors });
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(out, "_errors.json"), JSON.stringify(report.filter(r => r.errors.length), null, 1));
console.log("shots:", report.length, "with errors:", report.filter(r => r.errors.length).length);
