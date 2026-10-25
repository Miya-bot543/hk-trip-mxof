/* 今天模式＋出發倒數＋預覽。 */
import { S } from "../state.js";
import { MASCOT, FLIGHTS, FGROUPS, HOTELS, DAYS, CHECKLIST, HOTEL_DRIVER, TRIP_START } from "../../data/static.js";
import { esc, v, store } from "../util.js";
import { isMove, mapsBtn } from "../ui.js";
import { driverBtn } from "./driver.js";
import { ds } from "../datastore.js";
import { dayDate } from "./board.js";

/* 規劃板上自己排的行程（不含固定行程），依時段、順序排好 */
const SLOT_ORDER = ["allday","morning","afternoon","evening"];
function boardNames(i){
  return ds.items(dayDate(i)).filter(x=>!x.locked)
    .sort((a,b)=>(SLOT_ORDER.indexOf(a.slot)-SLOT_ORDER.indexOf(b.slot)) || (a.position-b.position))
    .map(x=>x.title || (x.place_snapshot && x.place_snapshot.name) || "（未命名）");
}
// 首頁只放一行摘要，最多列 3 個，細節到 05 章看
function boardLine(i){
  const L=boardNames(i); if(!L.length) return "";
  return `<p class="today-bd">📝 另外排了：${L.slice(0,3).map(esc).join("、")}${L.length>3?` 等 ${L.length} 個`:""}</p>`;
}

/* ---------- 「今天」模式＋倒數 ---------- */
export function todayIdx(){
  if(S.previewIdx!==null) return S.previewIdx;
  const n=new Date(), t=new Date(n.getFullYear(),n.getMonth(),n.getDate());
  return Math.round((t-TRIP_START)/86400000);
}
export const inTrip = i => i>=0 && i<=9;

export function todayCardHTML(){
  const i=todayIdx(), prev=S.previewIdx!==null;
  let body="";
  if(i<0){
    const n=-i, st=store.get("hk-check",{}), done=CHECKLIST.filter((_,k)=>st[k]).length;
    const firsts=FGROUPS.map(g=>{const f=FLIGHTS[g.idx[0]]; return `<li><b>${f.date.slice(5)}</b> ${esc(f.depTime)} ${esc(f.no)}｜${esc(f.from)}出發<span class="muted">（${g.title}・${g.people} 位）</span></li>`;}).join("");
    body=`<div class="today-big">${n===1?'明天就出發了！':`還有 <b>${n}</b> 天出發`}</div>
      <ul class="clean">${firsts}</ul>
      <div class="row" style="margin-top:10px"><button class="btn" data-go="09">🎒 出發前檢查清單 ${done}/${CHECKLIST.length}</button>
        <button class="btn ghost" data-go="02">✈️ 看航班</button></div>`;
  } else if(inTrip(i)){
    const d=DAYS[i], nx=DAYS[i+1];
    const stay = d.stay!==null ? HOTELS[d.stay] : null;
    body=`<div class="today-big">Day ${i+1}／10・${d.md}（${d.wd}）</div>
      <h3 style="margin:2px 0 6px;font-size:20px">${esc(d.title)}</h3>
      ${(d.alerts||[]).map(a=>`<div class="warn">⏰ ${esc(a)}</div>`).join("")}
      ${d.plan.length?`<ol class="plan">${d.plan.map(p=>`<li>${esc(p)}</li>`).join("")}</ol>`:`${boardLine(i)?"":'<p class="muted">今天的景點還沒排定，可以看看口袋名單。</p>'}`}
      ${boardLine(i)}
      <div class="grid2" style="margin-top:10px">
        <div class="tix"><div class="lb">🏨 今晚住宿</div>${stay?`<p style="margin:4px 0 0;font-weight:700">${esc(stay.name)}</p>
          <p class="muted" style="margin:2px 0 6px">${isMove(d)?`今天換宿：${stay.inTime}入住`:`續住（${stay.inDate.slice(5,10)}～${stay.outDate.slice(5,10)}）`}</p><span class="row">${mapsBtn(stay.address)}${driverBtn(HOTEL_DRIVER[d.stay])}</span>`
          :`<p style="margin:4px 0 0;font-weight:700">今天搭機返台 🏠</p>`}</div>
        <div class="tix b2"><div class="lb">🔜 明天</div>${nx?`<p style="margin:4px 0 0;font-weight:700">${nx.md}（${nx.wd}）${esc(nx.title)}</p>
          <p class="muted" style="margin:2px 0 0">${esc(nx.plan[0]||boardNames(i+1)[0]||"行程待確認")}</p>`:`<p style="margin:4px 0 0">旅程最後一天，一路順風！</p>`}</div></div>
      <div class="row" style="margin-top:12px"><button class="btn" data-go="05?d=${i}">🗓️ 看今天完整行程</button>
        ${d.pocket?'<button class="btn ghost" data-go="07">🍜 口袋名單</button>':''}<button class="btn ghost" data-fx>💱 日圓換算</button></div>`;
  } else {
    body=`<div class="today-big">旅程結束，歡迎回家 🏠</div>
      <p>記得把旅途中的代墊費用結算一下。</p>
      <div class="row"><button class="btn" data-go="08">💰 旅費與分帳</button></div>`;
  }
  const opts=[["","正常（依今天日期）"],["-1","出發前一天"],...DAYS.map((d,k)=>[String(k),`Day ${k+1}・${d.md}（${d.wd}）`]),["10","回國後"]];
  return `<div class="card pink today-card" id="todayCard">
    <div class="htop"><span class="tag">${i<0?'⏳ 出發倒數':inTrip(i)?'📍 今天':'✨ 旅程回顧'}</span>${prev?'<span class="nights">👀 預覽中</span>':''}</div>
    <div class="today-wrap"><img class="mascot" src="${MASCOT[i<0?0:inTrip(i)?1:2]}" alt=""><div class="today-body">${body}</div></div>
    <label class="preview-sel">🔮 預覽旅行中的樣子：<select id="previewSel">${opts.map(([v,t])=>`<option value="${v}" ${(S.previewIdx===null?"":String(S.previewIdx))===v?'selected':''}>${t}</option>`).join("")}</select></label>
  </div>`;
}
// 資料庫讀到或有人改了行程，就重畫首頁的今天卡片
ds.on("change",()=>{ const c=document.getElementById("todayCard"); if(c && document.activeElement?.id!=="previewSel") c.outerHTML=todayCardHTML(); });
document.addEventListener("change",e=>{
  if(e.target.id==="previewSel"){ S.previewIdx = e.target.value===""?null:+e.target.value; S.route(); }
});
