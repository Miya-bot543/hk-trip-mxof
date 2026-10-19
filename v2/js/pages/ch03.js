/* 第 03 章 */
import { HOTEL_IMG, HOTELS, HOTEL_DRIVER, STAY_TL, HOTEL1_ALT } from "../../data/static.js";
import { esc, v } from "../util.js";
import { mapsBtn, head, pager } from "../ui.js";
import { driverBtn } from "../features/driver.js";

export default function ch03(){
  const C=['pink','ice','lilac','pink'], T=['','ice','lilac',''];
  const md=d=>d.slice(5);
  const dates=(i1,t1,o1,t2)=>`<div class="hdates"><div><small>入住</small><b>${md(i1)}</b><span>${t1}</span></div>
    <span class="ar">→</span><div><small>退房</small><b>${md(o1)}</b><span>${t2}</span></div></div>`;
  const money=s=>{const m=/^([A-Z]{3}) (.+)$/.exec(s); return m?`<i class="cur">${m[1]}</i> <span class="nw">${esc(m[2])}</span>`:esc(s);};
  const stats=(tot,ppl,per)=>`<div class="stats"><div><small>整筆費用</small><b>${money(tot)}</b></div><div><small>人數</small><b>${ppl} 人</b></div><div><small>每位費用</small><b>${money(per)}</b></div></div>`;
  /* 名稱與地址的結尾綁在一起，避免只剩一兩個字掉到下一行 */
  const tail=(s,i)=>i>0?`${esc(s.slice(0,i))}<span class="nw">${esc(s.slice(i))}</span>`:esc(s);
  const hname=s=>{const i=s.indexOf("（"); return tail(s, i>0?i:s.lastIndexOf(" ")+1);};
  const addr=s=>{if(!s) return v(s); const m=/(?:\S{1,2}丁目)?[\d-]+(?:\s\S{1,8})?$/.exec(s); return tail(s, m?m.index:-1);};
  const btns=(a,id)=>`<div class="hbtns">${mapsBtn(a,"🗺️ Google Maps")}${driverBtn(id)}</div>`;
  const perks=h=>`<div class="perk"><b>✨ 住宿亮點</b><ul>${h.perks.map(p=>`<li>${esc(p)}</li>`).join("")}</ul></div>`;
  const tl=`<div class="stay-tl"><div class="tl">
    ${STAY_TL.bars.map(b=>`<button class="${b.c}" style="grid-column:${b.col}" data-scroll="${b.to}">${b.lines.map(esc).join("<br>")}${b.sub?`<span class="xb">${esc(b.sub)}</span>`:""}</button>`).join("\n    ")}
    ${STAY_TL.nights.map((d,i)=>`<small style="grid-column:${i+1}/${i+2};grid-row:3">${d}</small>`).join("")}
  </div><p class="muted" style="margin:4px 0 0">${esc(STAY_TL.hint)}</p></div>`;
  const h=HOTELS[0], x=h.extra;
  const first=`<article class="card pink hwide" id="hotel-1">
    <div><div class="htop"><span class="tag">住宿 1・${h.area}</span><span class="nights">${h.nights} 晚・2 筆訂房</span></div>
      <div class="h-head"><img class="hotel-pic big" src="${HOTEL_IMG[0]}" alt="${esc(HOTEL1_ALT)}"><h3 style="margin:0;font-size:22px">${hname(h.name)}</h3></div>
      <p class="addr">📍 ${addr(h.address)}</p>${perks(h)}
      ${btns(h.address,"h1")}</div>
    <div class="hw-books">
      <div class="tix"><div class="lb">🧳 第 1 筆訂房・${h.people} 人・${h.nights} 晚</div>
        ${dates(h.inDate,h.inTime,h.outDate,h.outTime)}${stats(h.total,h.people,h.per)}</div>
      <div class="tix b2"><div class="lb">➕ 第 2 筆訂房・${x.people} 人・${x.nights} 晚</div>
        ${dates(x.inDate,x.inTime,x.outDate,x.outTime)}${stats(x.total,x.people,x.per)}</div>
    </div></article>`;
  const rest=HOTELS.slice(1).map((h,k)=>{const i=k+1; return `<article class="card ${C[i]} hcard" id="hotel-${h.n}">
    <div class="htop"><span class="tag ${T[i]}">住宿 ${h.n}・${h.area}</span><span class="nights">${h.nights} 晚</span></div>
    <div class="h-head"><img class="hotel-pic" src="${HOTEL_IMG[h.n-1]}" alt="${esc(h.name)} 插圖"><h3 style="margin:0">${hname(h.name)}</h3></div>
    ${dates(h.inDate,h.inTime,h.outDate,h.outTime)}${stats(h.total,h.people,h.per)}
    <p class="addr">📍 ${addr(h.address)}</p>${perks(h)}
    ${h.issue?`<div class="warn">⚠️ ${esc(h.issue)}</div>`:''}
    ${h.caution?`<div class="caution">⏰ 注意：${esc(h.caution)}</div>`:''}
    <div class="mapgo">${btns(h.address,HOTEL_DRIVER[h.n-1])}</div></article>`;}).join("");
  return `${head("03")}${tl}${first}<div class="hrow">${rest}</div>${pager("03")}`;
}
