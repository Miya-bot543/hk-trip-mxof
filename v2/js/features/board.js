/* 05 章行程規劃板：整日／上午／下午／晚上四個時段，資料來自 ds.items(day)。
   第一步只做顯示；新增、拖曳、順路排序之後再加。 */
import { $, esc } from "../util.js";
import { ds } from "../datastore.js";
import { S } from "../state.js";

const SLOTS = [["allday","整日"],["morning","上午"],["afternoon","下午"],["evening","晚上"]];
const START = new Date(Date.UTC(2026, 11, 25));

// 第 i 天（0 起算）對應的日期字串 YYYY-MM-DD
export function dayDate(i){ return new Date(START.getTime() + i*86400000).toISOString().slice(0,10); }

const hm = t => t ? String(t).slice(0,5) : "";
const byOrder = (a,b) => (a.position-b.position) || hm(a.start_time).localeCompare(hm(b.start_time));

function itemHTML(it){
  const name = it.title || (it.place_snapshot && it.place_snapshot.name) || "（未命名）";
  const time = hm(it.start_time) + (it.end_time ? "～"+hm(it.end_time) : "");
  const meta = (it.locked?'<span class="bd-grp lock">🔒 固定</span>':'') +
    (it.group_label?`<span class="bd-grp">${esc(it.group_label)}</span>`:'') +
    (it.status==="maybe"?'<span class="bd-grp">備案</span>':'');
  return `<li class="bd-item${it.locked?' locked':''}">
    <div class="bd-head">${time?`<span class="bd-time">${time}</span>`:''}<span class="bd-name">${esc(name)}</span></div>
    ${meta?`<div class="bd-meta">${meta}</div>`:''}
    ${it.note?`<div class="muted bd-note">${esc(it.note)}</div>`:''}</li>`;
}

function boardHTML(i){
  const items = ds.items(dayDate(i)).filter(x => !x.locked);   // 固定行程看上方「今日安排」，這裡不重複顯示
  const slots = SLOTS.map(([k,t]) => {
    const list = items.filter(x => x.slot===k).sort(byOrder);
    if(k==="allday" && !list.length) return "";
    return `<div class="bd-slot"><b>${t}</b>${list.length
      ? `<ul class="bd-list">${list.map(itemHTML).join("")}</ul>`
      : '<p class="muted bd-empty">還沒有安排</p>'}</div>`;
  }).join("");
  return slots;
}

export function boardSectionHTML(i){
  return `<div class="card" style="margin-top:14px"><span class="tag lilac">行程規劃板</span>
    <div id="bd-area" class="bd">${boardHTML(i)}</div></div>`;
}

function refreshBoard(){ const a=$("#bd-area"); if(a) a.innerHTML=boardHTML(S.curDay); }
ds.ready().then(refreshBoard);
ds.on("change", refreshBoard);
