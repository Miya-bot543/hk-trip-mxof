/* 💱 日圓／台幣換算。
   有通關碼時讀寫旅程共用匯率（fx_rates，記帳也用這個）；唯讀或沒有通關碼時用這支手機記的 hk-rate。 */
import { $, esc, store } from "../util.js";
import { ds } from "../datastore.js";
import { pkError } from "./pocket.js";

const CUR = "JPY";
let saveTimer = null;
const shared = () => ds.canEdit();
const sharedRow = () => ds.fx().find(x => x.currency === CUR);
// 現在要顯示的匯率：共用模式用共用匯率，否則用手機裡的，沒有再借用共用匯率
const curRate = () => {
  const s = ds.rate(CUR), l = store.get("hk-rate", "");
  return shared() ? (s ? String(s) : l) : (l || (s ? String(s) : ""));
};
const when = iso => { const d = new Date(iso); return isNaN(d) ? "" : `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };

function noteHTML(){
  const s = sharedRow();
  if (shared()) return `👥 共用匯率：改了大家都看得到，記帳也會用這個匯率。<br>${s ? `最後更新：${esc(s.updated_by || "旅伴")} ${when(s.updated_at)}` : `還沒有人設定，填好後會自動存成共用匯率。${store.get("hk-rate", "") > 0 ? ` <button type="button" class="fx-act" data-fxsave>💾 把 ${esc(store.get("hk-rate", ""))} 存成共用匯率</button>` : ""}`}`;
  const tail = ds.mode === "live" ? `<br><button type="button" class="linkbtn" data-edlogin>🔑 輸入通關碼</button>後可修改共用匯率。` : "";
  if (s) {
    const sr = Number(s.rate_to_base), use = Number(store.get("hk-rate", "")) !== sr ? ` <button type="button" class="fx-act" data-fxuse>套用</button>` : "";
    return `📱 目前記在這支手機。共用匯率：1 日圓 ＝ ${esc(String(sr))} 台幣${use}${tail}`;
  }
  return `📱 匯率請依當天銀行或刷卡匯率自行填寫，會記在這支手機。${tail}`;
}

export function fxHTML(){
  return `<div class="fx-panel" id="fxPanel" role="dialog" aria-label="日圓台幣換算" hidden>
    <div class="htop"><b>💱 日圓／台幣換算</b><button class="btn ghost" id="fxClose" aria-label="關閉">✕</button></div>
    <label class="fx-row">匯率：1 日圓 ＝<input type="number" id="fxRate" step="0.0001" min="0" inputmode="decimal" placeholder="例如 0.2" value="${esc(curRate())}">台幣</label>
    <p class="muted fx-note" id="fxNote">${noteHTML()}</p>
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
export function fxOpen(){ const p=$("#fxPanel"); p.hidden=false; sync(); setTimeout(()=>{ (fxRate()?$("#fxJpy"):$("#fxRate")).focus(); },50); }

// 資料更新（別人改了匯率、輸入通關碼、斷線）時重畫；正在輸入或等待儲存時不蓋掉匯率欄
function sync(){
  const inp = $("#fxRate"); if (!inp) return;
  const s = ds.rate(CUR);
  if (shared() && s) store.set("hk-rate", String(s));   // 共用匯率也記在手機，離線時照樣能換算
  if (document.activeElement !== inp && !saveTimer) { inp.value = curRate(); fxFromJpy(); }
  $("#fxNote").innerHTML = noteHTML(); fxQuick();
}

// 共用模式：停止輸入 0.8 秒後存到資料庫
function queueSave(){
  clearTimeout(saveTimer); saveTimer = null;
  if (!shared()) return;
  const r = Math.round(fxRate() * 1e8) / 1e8;
  if (!r || r === ds.rate(CUR)) return;
  saveTimer = setTimeout(async () => {
    $("#fxNote").textContent = "儲存中…";
    try { await ds.setFx(CUR, r); } catch (e) { pkError(e); }
    saveTimer = null; sync();
  }, 800);
}

export function fxInit(){
  document.body.insertAdjacentHTML("beforeend", fxHTML());
  $("#fxFab").onclick=()=>{ const p=$("#fxPanel"); p.hidden ? fxOpen() : (p.hidden=true); };
  $("#fxClose").onclick=()=>{ $("#fxPanel").hidden=true; };
  $("#fxRate").oninput=()=>{ store.set("hk-rate",$("#fxRate").value); fxFromJpy(); fxQuick(); queueSave(); };
  $("#fxRate").onblur=()=>{ if (!saveTimer) sync(); };
  $("#fxJpy").oninput=fxFromJpy; $("#fxTwd").oninput=fxFromTwd;
  $("#fxNote").onclick=e=>{
    if(e.target.closest("[data-fxsave]")){ queueSave(); return; }
    if(!e.target.closest("[data-fxuse]")) return;
    const s=ds.rate(CUR); if(s){ store.set("hk-rate",String(s)); $("#fxRate").value=String(s); fxFromJpy(); sync(); }
  };
  $("#fxQuick").onclick=e=>{ const b=e.target.closest("[data-fxy]"); if(b){ $("#fxJpy").value=b.dataset.fxy; fxFromJpy(); } };
  document.addEventListener("click",e=>{ if(e.target.closest("[data-fx]")) fxOpen(); });
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") $("#fxPanel").hidden=true; });
  ds.ready().then(sync);
  ds.on("change", sync);
}
