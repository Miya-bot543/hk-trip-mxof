/* 💱 日圓／台幣換算。 */
import { $, esc, v, store } from "../util.js";

/* ---------- 💱 日圓／台幣換算（匯率自己填，存在這支手機） ---------- */
export function fxHTML(){
  const r=store.get("hk-rate","");
  return `<div class="fx-panel" id="fxPanel" role="dialog" aria-label="日圓台幣換算" hidden>
    <div class="htop"><b>💱 日圓／台幣換算</b><button class="btn ghost" id="fxClose" aria-label="關閉">✕</button></div>
    <label class="fx-row">匯率：1 日圓 ＝<input type="number" id="fxRate" step="0.0001" min="0" inputmode="decimal" placeholder="例如 0.2" value="${esc(r)}">台幣</label>
    <p class="muted" style="margin:2px 0 8px">匯率請依當天銀行或刷卡匯率自行填寫，會記在這支手機。</p>
    <label class="fx-row">¥ 日圓<input type="number" id="fxJpy" min="0" inputmode="decimal" placeholder="0"></label>
    <label class="fx-row">NT$ 台幣<input type="number" id="fxTwd" min="0" inputmode="decimal" placeholder="0"></label>
    <div class="fx-quick" id="fxQuick"></div>
  </div>
  <button class="fx-fab" id="fxFab" aria-label="日圓台幣換算">💱</button>`;
}
export function fxRate(){ const v=parseFloat($("#fxRate").value); return v>0?v:0; }
export function fxQuick(){
  const r=fxRate(), box=$("#fxQuick");
  box.innerHTML = r ? [100,500,1000,3000,5000,10000,30000].map(y=>`<button data-fxy="${y}">¥${y.toLocaleString()}<br><b>≈ NT$${Math.round(y*r).toLocaleString()}</b></button>`).join("")
                    : `<p class="muted">先填匯率，這裡會出現常用金額對照表。</p>`;
}
export function fxFromJpy(){ const r=fxRate(), y=parseFloat($("#fxJpy").value); $("#fxTwd").value = (r&&y>=0)? (Math.round(y*r*100)/100) : ""; }
export function fxFromTwd(){ const r=fxRate(), t=parseFloat($("#fxTwd").value); $("#fxJpy").value = (r&&t>=0)? Math.round(t/r) : ""; }
export function fxOpen(){ const p=$("#fxPanel"); p.hidden=false; fxQuick(); setTimeout(()=>{ (fxRate()?$("#fxJpy"):$("#fxRate")).focus(); },50); }
export function fxInit(){
  document.body.insertAdjacentHTML("beforeend", fxHTML());
  $("#fxFab").onclick=()=>{ const p=$("#fxPanel"); p.hidden ? fxOpen() : (p.hidden=true); };
  $("#fxClose").onclick=()=>{ $("#fxPanel").hidden=true; };
  $("#fxRate").oninput=()=>{ store.set("hk-rate",$("#fxRate").value); fxFromJpy(); fxQuick(); };
  $("#fxJpy").oninput=fxFromJpy; $("#fxTwd").oninput=fxFromTwd;
  $("#fxQuick").onclick=e=>{ const b=e.target.closest("[data-fxy]"); if(b){ $("#fxJpy").value=b.dataset.fxy; fxFromJpy(); } };
  document.addEventListener("click",e=>{ if(e.target.closest("[data-fx]")) fxOpen(); });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") $("#fxPanel").hidden=true; });
}
