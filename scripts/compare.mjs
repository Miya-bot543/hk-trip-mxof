// 比對兩組截圖（shoot.mjs 的輸出）：DOM 是否完全相同、像素差異比例。
// 用法：HK_TOOLS=/tmp/hk-tools node scripts/compare.mjs scripts/baseline/v1 scripts/baseline/v2
import { createRequire } from "node:module";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(path.join(process.env.HK_TOOLS || "/tmp/hk-tools", "x.js"));
const { PNG } = require("pngjs");
const pixelmatch = require("pixelmatch");

const [A, B] = process.argv.slice(2);
const imap = JSON.parse(fs.readFileSync(new URL("./image-map.json", import.meta.url)));
// v1 的 data URI 換成對應的 images/ 檔名，才能和 v2 逐字比較
const norm = s => s.replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g,
  u => imap[crypto.createHash("sha1").update(u).digest("hex")] || "UNKNOWN-IMAGE");

const files = fs.readdirSync(A).filter(f => f.endsWith(".png")).sort();
let domDiff = 0, rows = [];
for (const f of files) {
  const base = f.slice(0, -4);
  const ja = JSON.parse(fs.readFileSync(path.join(A, base + ".json")));
  const jb = JSON.parse(fs.readFileSync(path.join(B, base + ".json")));
  const keys = Object.keys(ja).filter(k => norm(String(ja[k])) !== String(jb[k]));
  if (keys.length) domDiff++;
  const pa = PNG.sync.read(fs.readFileSync(path.join(A, f)));
  const pb = PNG.sync.read(fs.readFileSync(path.join(B, f)));
  let pct = null, size = pa.width === pb.width && pa.height === pb.height;
  if (size) {
    const diff = new PNG({ width: pa.width, height: pa.height });
    const n = pixelmatch(pa.data, pb.data, diff.data, pa.width, pa.height, { threshold: 0.1 });
    pct = n / (pa.width * pa.height) * 100;
    if (n) fs.writeFileSync(path.join(B, base + ".diff.png"), PNG.sync.write(diff));
  }
  rows.push({ base, dom: keys.length ? "不同:" + keys.join(",") : "相同", size: size ? `${pa.width}x${pa.height}` : `${pa.width}x${pa.height} vs ${pb.width}x${pb.height}`, pct });
}
for (const r of rows) console.log(`${r.base.padEnd(26)} DOM ${r.dom.padEnd(6)} ${r.size.padEnd(12)} 像素差異 ${r.pct === null ? "尺寸不同" : r.pct.toFixed(3) + "%"}`);
const max = Math.max(...rows.map(r => r.pct ?? 100));
console.log(`\n共 ${rows.length} 組；DOM 不同 ${domDiff} 組；最大像素差異 ${max.toFixed(3)}%`);
