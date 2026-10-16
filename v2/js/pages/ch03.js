/* 第 03 章 */
import { HOTEL_IMG, HOTELS, HOTEL_DRIVER } from "../../data/static.js";
import { esc, v } from "../util.js";
import { mapsBtn, head, pager } from "../ui.js";
import { driverBtn } from "../features/driver.js";

export default function ch03(){
  const C=['pink','ice','lilac','pink'], T=['','ice','lilac',''];
  const md=d=>d.slice(5);
  const dates=(i1,t1,o1,t2)=>`<div class="hdates"><div><small>入住</small><b>${md(i1)}</b><span>${t1}</span></div>
    <span class="ar">→</span><div><small>退房</small><b>${md(o1)}</b><span>${t2}</span></div></div>`;
  const stats=(tot,ppl,per)=>`<div class="stats"><div><small>整筆費用</small><b>${tot}</b></div><div><small>人數</small><b>${ppl} 人</b></div><div><small>每位費用</small><b>${per}</b></div></div>`;
  const perks=h=>`<div class="perk"><b>✨ 住宿亮點</b><ul>${h.perks.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>`;
  const nightsLbl=["12/25","12/26","12/27","12/28","12/29","12/30","12/31","01/01","01/02"];
  const tl=`<div class="stay-tl"><div class="tl">
    <button class="c1" style="grid-column:1/4" data-scroll="hotel-1">住宿 1・登別<br>3 晚・4 人</button>
    <button class="c2" style="grid-column:4/7" data-scroll="hotel-2">住宿 2・札幌<br>3 晚・7 人</button>
    <button class="c3" style="grid-column:7/9" data-scroll="hotel-3">住宿 3・札幌<br>2 晚・7 人</button>
    <button class="c4" style="grid-column:9/10" data-scroll="hotel-4">住宿 4<br>1 晚・4 人</button>
    <button class="x" style="grid-column:2/4" data-scroll="hotel-1">＋ 第 2 筆・3 人（12/26 起）</button>
    ${nightsLbl.map((d,i)=>`<small style="grid-column:${i+1}/${i+2};grid-row:3">${d}</small>`).join("")}
  </div><p class="muted" style="margin:4px 0 0">每格代表一晚，點色塊可跳到該住宿（手機可左右滑動）</p></div>`;
  const h=HOTELS[0], x=h.extra;
  const first=`<article class="card pink hwide" id="hotel-1">
    <div><div class="htop"><span class="tag">住宿 1・${h.area}</span><span class="nights">${h.nights} 晚・2 筆訂房</span></div>
      <div class="h-head"><img class="hotel-pic big" src="${HOTEL_IMG[0]}" alt="登別溫泉旅館插圖"><h3 style="margin:0;font-size:22px">${esc(h.name)}</h3></div>
      <p class="addr">📍 ${v(h.address)}</p>${perks(h)}
      <div class="row" style="margin-top:12px">${mapsBtn(h.address)}${driverBtn("h1")}</div></div>
    <div class="hw-books">
      <div class="tix"><div class="lb">🧳 第 1 筆訂房・${h.people} 人・${h.nights} 晚</div>
        ${dates(h.inDate,h.inTime,h.outDate,h.outTime)}${stats(h.total,h.people,h.per)}</div>
      <div class="tix b2"><div class="lb">➕ 第 2 筆訂房・${x.people} 人・${x.nights} 晚</div>
        ${dates(x.inDate,x.inTime,x.outDate,x.outTime)}${stats(x.total,x.people,x.per)}</div>
    </div></article>`;
  const rest=HOTELS.slice(1).map((h,k)=>{const i=k+1; return `<article class="card ${C[i]} hcard" id="hotel-${h.n}">
    <div class="htop"><span class="tag ${T[i]}">住宿 ${h.n}・${h.area}</span><span class="nights">${h.nights} 晚</span></div>
    <div class="h-head"><img class="hotel-pic" src="${HOTEL_IMG[h.n-1]}" alt="${esc(h.name)} 插圖"><h3 style="margin:0">${esc(h.name)}</h3></div>
    ${dates(h.inDate,h.inTime,h.outDate,h.outTime)}${stats(h.total,h.people,h.per)}
    <p class="addr">📍 ${v(h.address)}</p>${perks(h)}
    ${h.issue?`<div class="warn">⚠️ ${esc(h.issue)}</div>`:''}
    ${h.caution?`<div class="caution">⏰ 注意：${esc(h.caution)}</div>`:''}
    <div class="mapgo row">${mapsBtn(h.address)}${driverBtn(HOTEL_DRIVER[h.n-1])}</div></article>`;}).join("");
  return `${head("03")}${tl}${first}<div class="hrow">${rest}</div>${pager("03")}`;
}
