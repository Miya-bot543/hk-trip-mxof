/* 第 09 章 */
import { CHECKLIST } from "../../data/static.js";
import { store } from "../util.js";
import { head, pager } from "../ui.js";
import { vjwHTML } from "../features/vjw.js";
import { backupHTML } from "../features/backup.js";

export default function ch09(){
  const st=store.get("hk-check",{}); const done=CHECKLIST.filter((_,i)=>st[i]).length;
  const groups=[...new Set(CHECKLIST.map(c=>c[0]))];
  return `${head("09")}
  ${vjwHTML()}
  <div class="card ice" style="margin-top:14px"><span class="tag ice">📲 安裝到手機・離線也能看</span>
    <p style="margin:8px 0 0">用 GitHub 網址打開過一次後，之後在日本沒有網路也能開啟整個網站（天氣會顯示上次更新的資料）。</p>
    <ul class="clean"><li><b>iPhone（Safari）</b>：點下方「分享」按鈕 →「加入主畫面」</li>
      <li><b>Android（Chrome）</b>：點右上角「⋮」→「安裝應用程式」或「加到主畫面」</li>
      <li>出發前請每個人都先打開一次，讓手機把網站存起來。</li></ul></div>
  <div class="card pink" style="margin-top:14px"><div class="row" style="justify-content:space-between"><b>完成 <span id="cDone">${done}</span> / ${CHECKLIST.length}</b>
    <button class="btn ghost" id="cReset">全部重設</button></div>
    <div class="bar" style="margin-top:8px"><i id="cBar" style="width:${done/CHECKLIST.length*100}%"></i></div></div>
  <div class="grid" style="margin-top:14px">${groups.map(g=>`<div class="card"><span class="tag ice">${g}</span>
    ${CHECKLIST.map((c,i)=>c[0]!==g?'':`<label class="check ${st[i]?'done':''}"><input type="checkbox" data-ck="${i}" ${st[i]?'checked':''}><span>${c[1]}</span></label>`).join("")}</div>`).join("")}</div>
  <p class="muted">勾選狀態記在你這台裝置的瀏覽器裡。</p>
  ${backupHTML()}${pager("09")}`;
}
