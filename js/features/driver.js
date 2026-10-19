/* 🚕 給司機看的日文地址卡（資料在 data/static.js）。 */
import { DRIVER } from "../../data/static.js";
import { $, esc, gmaps } from "../util.js";

export const driverBtn = (id,label) => `<button class="btn drv-btn" data-driver="${id}">🚕 ${label||"給司機看"}</button>`;
export let wakeLock=null;
export function openDriver(id){
  const d=DRIVER.find(x=>x.id===id); if(!d) return;
  let ov=$("#drvOverlay"); if(!ov){ ov=document.createElement("div"); ov.id="drvOverlay"; ov.setAttribute("role","dialog"); ov.setAttribute("aria-modal","true"); document.body.appendChild(ov); }
  ov.innerHTML=`<div class="drv-card">
    <div class="drv-zh">🚕 給司機看：${esc(d.zh)}</div>
    <div class="drv-ask">こちらまでお願いします。</div>
    <div class="drv-name">${esc(d.ja)}</div>
    ${d.sub?`<div class="drv-sub">${esc(d.sub)}</div>`:''}
    <div class="drv-addr">${d.zip?esc(d.zip)+"<br>":""}${esc(d.addr).replace(/([0-9０-９][0-9０-９\-丁目番地号]*)$/,'<span class="nobr">$1</span>')}</div>
    ${d.tel?`<div class="drv-tel">TEL ${esc(d.tel)}<span>（電話番号でナビ検索できます）</span></div>`:''}
    <div class="drv-actions">
      ${d.tel?`<a class="btn ghost" href="tel:${d.tel.replace(/-/g,"")}">📞 撥打</a>`:''}
      <a class="btn ghost" href="${gmaps(d.addr+" "+d.ja.replace(/（.*）/,""))}" target="_blank" rel="noopener">🗺️ 地圖</a>
      <button class="btn" id="drvClose">✕ 關閉</button></div>
  </div>`;
  ov.hidden=false; document.body.style.overflow="hidden";
  try{ if(navigator.wakeLock) navigator.wakeLock.request("screen").then(l=>wakeLock=l).catch(()=>{}); }catch(e){}
}
export function closeDriver(){ const ov=$("#drvOverlay"); if(ov) ov.hidden=true; document.body.style.overflow=""; try{ wakeLock&&wakeLock.release(); }catch(e){} wakeLock=null; }
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-driver]"); if(b){ openDriver(b.dataset.driver); return; }
  if(e.target.id==="drvClose" || e.target.id==="drvOverlay") closeDriver();
});
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeDriver(); });
export function driverListHTML(){
  return `<div class="card pink" style="margin-top:14px"><div class="htop"><span class="tag">🚕 給司機看的日文地址卡</span></div>
    <p class="muted" style="margin:8px 0 10px">搭計程車或問路時，點下面的地點，手機會全螢幕顯示大字的日文名稱和地址，直接拿給司機看。日本計程車也常用電話號碼搜尋導航。</p>
    <div class="row">${DRIVER.map(d=>driverBtn(d.id,d.zh.replace(/^住宿 \d・/,""))).join("")}</div></div>`;
}
