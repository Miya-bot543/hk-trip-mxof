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
    <div class="h-head"><img class="hotel-pic sm" src="${HOTEL_IMG[h.n-1]}" alt=""><h3 style="margin:0">${esc(h.name)}</h3></div>
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
