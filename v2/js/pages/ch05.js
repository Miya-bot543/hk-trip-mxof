/* 第 05 章 */
import { S } from "../state.js";
import { FLIGHTS, HOTELS, DAYS, HOTEL_DRIVER, CHAPTERS } from "../../data/static.js";
import { esc, v } from "../util.js";
import { isMove, dayStrip, flightCard, mapsBtn, head } from "../ui.js";
import { driverBtn } from "../features/driver.js";
import { boardSectionHTML } from "../features/board.js";

/* 今日安排的一行：開頭的「4 位：」變成小標籤、「10:00 前」放到左欄，其餘文字照原樣 */
function planItem(s){
  let who="", time="", m=s.match(/^(\d+ 位)：/);
  if(m){ who=m[1]; s=s.slice(m[0].length); }
  m=s.match(/^(\d{1,2}:\d{2}(?: ?[前後])?) ?/);
  if(m){ time=m[1]; s=s.slice(m[0].length); }
  return `<li class="bd-item"><div class="bd-head"><span class="bd-time pl-time">${esc(time)}</span><span class="bd-name">${esc(s)}</span></div>
    ${who?`<div class="bd-meta pl-meta"><span class="bd-grp">${esc(who)}</span></div>`:''}</li>`;
}

// 頁尾章節換頁：前後章改成小文字連結，跟前一天／後一天放同一排
const CH = ["04","06"].map(n=>{ const c=CHAPTERS.find(x=>x[0]===n); return [n,c[3]]; });

export default function ch05(){
  const d = DAYS[S.curDay], i=S.curDay;
  let stayBlock;
  if(isMove(d)){
    const o=HOTELS[d.checkout], n=HOTELS[d.stay];
    stayBlock = `<div class="card pink" style="grid-column:1/-1"><span class="flag">🧳 今天換住宿</span>
      <div class="swap" style="margin-top:10px">
        <div class="card out"><b>① 退房</b><h3>${esc(o.name)}</h3>
          <dl class="kv"><dt>退房</dt><dd>${o.outDate} ${o.outTime}</dd><dt>地址</dt><dd>${v(o.address)}</dd></dl>${o.extra?'<p class="muted" style="margin:6px 0 0">兩筆訂房（4 人＋3 人）同日退房</p>':''}
          <div class="hbtns">${mapsBtn(o.address,"🗺️ Google Maps")}</div></div>
        <div class="arrow">➜</div>
        <div class="card in"><b>② 入住</b><h3>${esc(n.name)}</h3>
          <dl class="kv"><dt>入住</dt><dd>${n.inDate} ${n.inTime}</dd><dt>住到</dt><dd>${n.outDate}（${n.nights} 晚）</dd>
          <dt>地址</dt><dd>${v(n.address)}</dd></dl>
          <div class="hbtns">${mapsBtn(n.address,"🗺️ Google Maps")}${driverBtn(HOTEL_DRIVER[d.stay])}</div></div></div></div>`;
  } else if(d.stay===null){
    const o=HOTELS[d.checkout];
    stayBlock = `<div class="card pink"><span class="flag">退房・返台</span>
      <div class="card out" style="margin-top:10px"><b>退房</b><h3>${esc(o.name)}</h3>
      <dl class="kv"><dt>退房期限</dt><dd>${o.outDate} ${o.outTime}</dd></dl></div></div>`;
  } else {
    const h=HOTELS[d.stay], first = i===0;
    stayBlock = `<div class="card ice"><span class="tag ice">${first?'今晚入住':'今晚住宿（續住）'}</span>
      <h3 style="margin-top:6px">${esc(h.name)}</h3>
      <dl class="kv">${first?`<dt>入住</dt><dd>${h.inDate} ${h.inTime}</dd>`:''}
      <dt>住宿期間</dt><dd>${h.inDate.slice(5)} → ${h.outDate.slice(5)}</dd><dt>地址</dt><dd>${v(h.address)}</dd></dl>
      <div class="hbtns">${mapsBtn(h.address,"🗺️ Google Maps")}${driverBtn(HOTEL_DRIVER[d.stay])}</div></div>`;
  }
  const plan = d.plan.length ? `<ul class="bd-list">${d.plan.map(planItem).join("")}</ul>`
    : `<p><span class="tbd">當日景點待確認</span></p>`;
  const extra = (d.cost?`<p>💰 費用：${esc(d.cost)}</p>`:'') +
    (d.link?`<button class="btn" data-go="${d.link}">查看章節 ${d.link}</button> `:'') +
    (d.pocket?`<button class="btn ghost" data-go="07">🍜 看札幌口袋名單</button>`:'');
  return `${head("05")}${dayStrip(i,false)}
  <div class="card lilac" style="margin:14px 0">
    <span class="tag lilac">Day ${i+1}</span>
    <div class="big" style="font-size:26px">${d.md}（${d.wd}）${esc(d.title)}</div>
    <dl class="kv"><dt>📍 地點</dt><dd>${v(d.area,'滑雪場待確認')}</dd><dt>🚗 交通</dt><dd>${v(d.transport)}</dd></dl>
    ${(d.split||[]).length?`<div class="split-box">${d.split.map(x=>`<div>${esc(x)}</div>`).join("")}</div>`:''}
    ${(d.alerts||[]).map(a=>`<div class="warn">⏰ ${esc(a)}</div>`).join("")}</div>
  <div class="grid2 d5">
    <div class="card" style="grid-column:1/-1"><span class="tag">今日安排</span>${plan}${extra?`<div class="row" style="margin-top:10px">${extra}</div>`:''}</div>
    ${stayBlock}
    ${(d.flights||[]).map(k=>flightCard(FLIGHTS[k],false)).join("")}</div>
  ${boardSectionHTML(i)}
  <div class="pager d5pg"><button class="btn ghost" data-go="05?d=${Math.max(0,i-1)}" ${i===0?'disabled':''}>← 前一天</button>
    <span class="pg-ch">${CH.map(([n,t],k)=>`<button type="button" data-go="${n}">${k?`${n} ${t} →`:`← ${n} ${t}`}</button>`).join("")}</span>
    <button class="btn" data-go="05?d=${Math.min(9,i+1)}" ${i===9?'disabled':''}>後一天 →</button></div>`;
}
