/* 各頁共用的畫面片段：日期列、航班卡、住宿小卡、收合區、章節標題與翻頁。 */
import { HOTEL_IMG, CH_ICON, FLIGHTS, groupOf, DAYS, CHAPTERS } from "../data/static.js";
import { esc, v, gmaps } from "./util.js";
import { todayIdx } from "./features/today.js";

export const isMove = d => d.checkout!==null && d.stay!==null;

export function dayStrip(activeIdx, linkTo){
  return `<div class="strip" role="group" aria-label="選擇日期">${DAYS.map((d,i)=>`
    <button class="daybtn ${isMove(d)?'move':''} ${i===todayIdx()?'is-today':''}" ${linkTo?`data-go="05?d=${i}"`:`data-go="05?d=${i}"`}
      aria-pressed="${i===activeIdx}">${i===todayIdx()?'<em class="tdy">今天</em>':''}<span>Day ${i+1}</span><b>${d.md}</b><span>（${d.wd}）${isMove(d)?'🧳換宿':''}</span></button>`).join("")}</div>
    <div class="legend"><span><i style="background:var(--pink)"></i>更換住宿日（12/28、12/31、01/02）</span><span>點日期看當天安排</span></div>`;
}

/* 05 的日期線：一條纜繩串起 10 天，小纜車掛在選到的那天上方，換日期時滑過去 */
const CAR_SVG = `<svg viewBox="0 0 44 52" aria-hidden="true">
  <defs><linearGradient id="rwBody" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6aecd"/><stop offset="1" stop-color="#b79ef0"/></linearGradient></defs>
  <circle cx="17" cy="4" r="3.2" class="rw-wh"/><circle cx="27" cy="4" r="3.2" class="rw-wh"/>
  <rect x="14" y="3" width="16" height="5" rx="2.5" class="rw-wh"/>
  <path d="M22 8v7M22 15l-9 4M22 15l9 4" class="rw-arm"/>
  <rect x="6" y="18" width="32" height="30" rx="9" fill="url(#rwBody)"/>
  <path d="M7 24c0-5 4-7.5 8-7.5h14c4 0 8 2.5 8 7.5c-2-2.2-4-2.2-6 0c-2-2.2-4-2.2-6 0c-2-2.2-4-2.2-6 0c-2-2.2-4-2.2-6 0c-2-2.2-4-2.2-6 0z" fill="#fff"/>
  <rect x="10.5" y="26" width="9.5" height="10" rx="3" fill="#fff" opacity=".88"/><rect x="24" y="26" width="9.5" height="10" rx="3" fill="#fff" opacity=".88"/>
  <rect x="6" y="40" width="32" height="3.2" fill="#fff" opacity=".55"/>
</svg>`;
export function ropeway(activeIdx, fromIdx){
  const ti=todayIdx();
  return `<div class="rw" style="--n:${DAYS.length}">
    <div class="rw-cable" aria-hidden="true"></div>
    <div class="rw-car" style="--i:${fromIdx}" data-to="${activeIdx}" aria-hidden="true">${CAR_SVG}</div>
    <div class="rw-stops" role="group" aria-label="選擇日期">${DAYS.map((d,i)=>`
      <button class="rw-stop ${isMove(d)?'move':''} ${i===ti?'is-today':''}" data-go="05?d=${i}" aria-pressed="${i===activeIdx}"
        aria-label="Day ${i+1} ${d.md}（${d.wd}）${isMove(d)?'換宿':''}${i===ti?' 今天':''}"><i class="rw-dot"></i><b>${d.md}</b><span>${d.wd}${isMove(d)?'<em class="rw-bag">🧳</em>':''}</span>${i===ti?'<em class="rw-tdy">今天</em>':''}</button>`).join("")}</div>
  </div>
  <div class="legend"><span><i style="background:var(--pink-d)"></i>🧳 換宿日（12/28、12/31、01/02）</span><span>點日期，小纜車會滑過去</span></div>`;
}
/* 畫面放上去之後才把纜車移到目標日期，transition 才會動 */
export function rideCar(){
  const c=document.querySelector(".rw-car"); if(!c) return;
  const from=+c.style.getPropertyValue("--i"), to=+c.dataset.to;
  if(from===to) return;
  c.style.setProperty("--dur", Math.min(1.1, .4+Math.abs(to-from)*.08)+"s");
  c.style.setProperty("--tilt", (to>from?-8:8)+"deg");
  c.getBoundingClientRect();
  c.classList.add("moving"); c.style.setProperty("--i", to);
  const done=e=>{ if(e.propertyName!=="left") return;
    c.removeEventListener("transitionend",done); c.classList.remove("moving"); c.classList.add("sway"); };
  c.addEventListener("transitionend", done);
  if(matchMedia("(prefers-reduced-motion:reduce)").matches) c.classList.remove("moving");
}

// 地名後半段（航廈）不拆開，避免「（CTS）」單獨掉到下一行
const placeNW=s=>{ const i=s.indexOf(" "); return i<0?esc(s):`${esc(s.slice(0,i))} <span class="nw">${esc(s.slice(i+1))}</span>`; };
export function flightCard(f, full, bag=true){
  const g=groupOf(FLIGHTS.indexOf(f));
  return `<div class="card ${f.dir==="去程"?'pink':'ice'}">
    <div class="htop"><span class="tag ${f.dir==="去程"?'':'ice'}">${f.dir==="去程"?'✈️ 去程':'🏠 回程'}</span><span class="nights">👥 ${g.people} 位</span></div>
    <div class="big" style="margin-top:6px">${f.date}　${esc(f.no)}</div>
    <dl class="kv"><dt>出發</dt><dd>${esc(f.depTime)}｜${placeNW(f.from)}</dd><dt>抵達</dt><dd>${esc(f.arrTime)}｜${placeNW(f.to)}</dd>
    <dt>航空公司</dt><dd>${v(f.airline)}</dd>${bag?`<dt>手提行李</dt><dd>${v(f.carryOn)}</dd>
    <dt>託運行李</dt><dd>${esc(f.checked)}</dd>`:''}</dl></div>`;
}
export function mapsBtn(addr, label="🗺️ 在 Google Maps 開啟"){
  return addr ? `<a class="btn" href="${gmaps(addr)}" target="_blank" rel="noopener">${label}</a>`
              : `<button class="btn" disabled>🗺️ Google Maps（地址待確認）</button>`;
}
export function hotelMini(h){
  return `<div class="card"><span class="tag lilac">住宿 ${h.n}・${h.area}</span>
    <div class="h-head"><img class="hotel-pic sm" src="${HOTEL_IMG[h.n-1]}" alt="" loading="lazy"><h3 style="margin:0">${esc(h.name)}</h3></div>
    <dl class="kv"><dt>日期</dt><dd><span class="nw">${h.inDate.slice(5)}</span> → <span class="nw">${h.outDate.slice(5)}</span><span class="nw">（${h.nights} 晚）</span></dd>
    <dt>整筆費用</dt><dd>${h.total}</dd><dt>人數</dt><dd>${h.people} 人</dd><dt>每位費用</dt><dd>${h.per}</dd></dl>
    ${h.extra?`<p class="muted" style="margin:6px 0 0">➕ 第 2 筆：${h.extra.inDate.slice(5,10)}～${h.extra.outDate.slice(5,10)}，${h.extra.people} 人，${h.extra.total}（每位 ${h.extra.per}）</p>`:''}</div>`;
}
export const FOLD = new Set();
export const fold=(id,title,inner)=>`<details class="fold" data-fold="${id}" ${FOLD.has(id)?'open':''}><summary>${title}<span class="ex-fb fold-fb" aria-hidden="true"><span class="fold-ar">▾</span></span></summary><div class="fold-body">${inner}</div></details>`;
document.addEventListener("toggle",e=>{ const d=e.target; if(d.dataset&&d.dataset.fold){ d.open?FOLD.add(d.dataset.fold):FOLD.delete(d.dataset.fold); } },true);
document.addEventListener("click",e=>{ const b=e.target.closest("[data-foldall]"); if(!b) return; const op=b.dataset.foldall==="open"; document.querySelectorAll("details.fold").forEach(d=>d.open=op); });
export function head(no){ const c=CHAPTERS.find(x=>x[0]===no); return `<h2 class="sec"><img class="sec-ic" src="${CH_ICON[+no-1]}" alt=""><span class="no">${no}</span>${c[2]}</h2>`; }
export function pager(no){
  const i=CHAPTERS.findIndex(x=>x[0]===no), p=CHAPTERS[i-1], n=CHAPTERS[i+1];
  return `<div class="pager">${p?`<button class="btn ghost" data-go="${p[0]}">← ${p[0]} ${p[3]}</button>`:`<button class="btn ghost" data-go="home">← 首頁</button>`}
    ${n?`<button class="btn" data-go="${n[0]}">${n[0]} ${n[3]} →</button>`:`<button class="btn" data-go="home">回首頁 →</button>`}</div>`;
}
