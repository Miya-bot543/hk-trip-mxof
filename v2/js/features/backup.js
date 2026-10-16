/* 09 章「資料備份」：把口袋名單、行程等共用資料下載成 JSON 檔。 */
import { ds } from "../datastore.js";
import { toast } from "../util.js";

const MODE = { live:"即時同步中，匯出的是最新資料", snapshot:"目前是唯讀快照，匯出的是最後一次讀到的資料", offline:"目前沒有網路，匯出的是最後一次讀到的資料" };

export function backupHTML(){
  const n = ds.places().filter(p=>p.category!=="hotel").length, m = ds.items().filter(x=>!x.locked).length;
  return `<div class="card lilac" id="bkCard" style="margin-top:14px"><span class="tag lilac">💾 資料備份</span>
    <p style="margin:8px 0 0">把共用的口袋名單、行程規劃等資料下載成一個檔案存起來，萬一資料被誤刪還能對照找回。</p>
    <p class="muted" style="margin:6px 0 0">現在有口袋名單 ${n} 個、自己排的行程 ${m} 個。${MODE[ds.mode]||""}。</p>
    <div class="row" style="margin-top:10px"><button class="btn" id="bkExport">⬇️ 下載備份檔</button></div></div>`;
}

function exportJSON(){
  const d = ds.dump(); if(!d.trip){ toast("還沒有資料可以備份"); return; }
  const t = new Date(Date.now()+8*3600000).toISOString().slice(0,16).replace(/[-:]/g,"").replace("T","-");   // 台北時間
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], {type:"application/json"}));
  a.download = `北海道行程備份-${t}.json`; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 10000);
  toast("備份檔已下載");
}
document.addEventListener("click", e => { if(e.target.id==="bkExport") exportJSON(); });
// 背景連上資料庫或資料有變，就更新筆數和模式說明
ds.on("change", () => { const c=document.getElementById("bkCard"); if(c) c.outerHTML=backupHTML(); });
