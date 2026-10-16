/* 05 章行程規劃板：整日／上午／下午／晚上四個時段，資料來自 ds.items(day)。
   自訂行程可新增、修改、刪除、按住 ⇅ 拖曳調整順序、可跨時段（需通關碼）；順路排序之後再加。 */
import { $, esc, gmaps, toast, toastAction } from "../util.js";
import { ds } from "../datastore.js";
import { S } from "../state.js";
import { ensureEditor } from "./editor.js";
import { pkError } from "./pocket.js";

const SLOTS = [["allday","整日"],["morning","上午"],["afternoon","下午"],["evening","晚上"]];
const START = new Date(Date.UTC(2026, 11, 25));

// 第 i 天（0 起算）對應的日期字串 YYYY-MM-DD
export function dayDate(i){ return new Date(START.getTime() + i*86400000).toISOString().slice(0,10); }

const hm = t => t ? String(t).slice(0,5) : "";
const addrOf = it => (it.place_snapshot && it.place_snapshot.address) || "";
// 地圖直接用這格搜尋：填店名最準（只填地址時，同一棟樓可能跳到別家）
const byOrder = (a,b) => (a.position-b.position) || hm(a.start_time).localeCompare(hm(b.start_time));

function itemHTML(it){
  const name = it.title || (it.place_snapshot && it.place_snapshot.name) || "（未命名）";
  const time = hm(it.start_time) + (it.end_time ? "～"+hm(it.end_time) : "");
  const meta = (it.locked?'<span class="bd-grp lock">🔒 固定</span>':'') +
    (it.group_label?`<span class="bd-grp">${esc(it.group_label)}</span>`:'') +
    (it.status==="maybe"?'<span class="bd-grp">備案</span>':'');
  const edit = ds.mode==="live" && !it.locked;
  return `<li class="bd-item${it.locked?' locked':''}" data-id="${it.id}">
    <div class="bd-head">${time?`<span class="bd-time">${time}</span>`:''}<span class="bd-name">${esc(name)}</span>${edit
      ?`<button type="button" class="bd-drag" data-bddrag="${it.id}" aria-label="按住拖曳調整順序" title="按住拖曳">⇅</button><button type="button" class="bd-more" data-bdmenu="${it.id}" aria-label="更多動作" aria-expanded="${BD.menu===it.id}">⋯</button>`:''}</div>
    ${meta?`<div class="bd-meta">${meta}</div>`:''}
    ${addrOf(it)?`<a class="bd-map" href="${gmaps(addrOf(it))}" target="_blank" rel="noopener">🗺️ ${esc(addrOf(it))}</a>`:''}
    ${it.note?`<div class="muted bd-note">${esc(it.note)}</div>`:''}
    ${edit&&BD.menu===it.id?`<div class="row bd-acts"><button class="btn ghost" data-bdedit="${it.id}">✏️ 修改</button><button class="btn ghost" data-bddel="${it.id}">🗑️ 刪除</button></div>`:''}</li>`;
}

function boardHTML(i){
  const items = ds.items(dayDate(i)).filter(x => !x.locked);   // 固定行程看上方「今日安排」，這裡不重複顯示
  const slots = SLOTS.map(([k,t]) => {
    const list = items.filter(x => x.slot===k).sort(byOrder);
    if(k==="allday" && !list.length) return "";
    // 空的時段也留一個 ul，拖曳時才放得進去
    return `<div class="bd-slot" data-slot="${k}"><b>${t}</b><ul class="bd-list">${list.map(itemHTML).join("")}</ul><p class="muted bd-empty">還沒有安排</p></div>`;
  }).join("");
  return slots;
}

/* ---------- 新增・修改・刪除自訂行程 ---------- */
const BD = {formOpen:false, editing:null, menu:null};
const itemOf = id => ds.items().find(x => x.id===id);
function formHTML(){
  if(ds.mode!=="live") return "";
  if(!BD.formOpen) return `<div class="row" style="margin-top:12px"><button class="btn" id="bdOpenForm">＋ 新增自訂行程</button></div>`;
  const it = (BD.editing && itemOf(BD.editing)) || {}, slot = it.slot || "morning";
  return `<div class="card lilac" id="bdFormCard" style="margin-top:12px"><span class="tag lilac">${BD.editing?'✏️ 修改行程':'＋ 新增自訂行程'}</span>
    <div class="pk-form">
      <label class="full">名稱 *<input type="text" id="bdTitle" maxlength="60" placeholder="例如：去超市買早餐" value="${esc(it.title||"")}"></label>
      <label>時段<select id="bdSlot">${SLOTS.map(([k,t])=>`<option value="${k}" ${k===slot?'selected':''}>${t}</option>`).join("")}</select></label>
      <label>開始時間（可留空）<input type="time" id="bdStart" value="${hm(it.start_time)}"></label>
      <label>必去／備案<select id="bdStatus"><option value="must">必去</option><option value="maybe" ${it.status==="maybe"?'selected':''}>備案</option></select></label>
      <label class="full">地點（可留空，填了就能用 Google Maps 開啟；填店名最準，也可以填地址）<input type="text" id="bdAddr" maxlength="150" placeholder="例如：adex BAKERY&amp;CAFE" value="${esc(addrOf(it))}"></label>
      <label class="full">備註（可留空）<textarea id="bdNote" maxlength="300">${esc(it.note||"")}</textarea></label>
    </div>
    <div class="row" style="margin-top:12px"><button class="btn" id="bdSave">${BD.editing?'儲存修改':'加入行程'}</button>
      <button class="btn ghost" id="bdCancel">取消</button><span class="muted" id="bdMsg"></span></div></div>`;
}
const renderForm = () => { const w=$("#bd-formwrap"); if(w) w.innerHTML=formHTML(); };

async function saveItem(){
  const title=$("#bdTitle").value.trim(), msg=$("#bdMsg");
  if(!title){ msg.textContent="請先填寫名稱"; $("#bdTitle").focus(); return; }
  if(!await ensureEditor()) return;
  const old = BD.editing ? itemOf(BD.editing) : null;
  const day = old ? old.day : dayDate(S.curDay), slot=$("#bdSlot").value;
  // 新增或換時段時排在該時段最後；只改內容就留在原位
  const pos = old && old.slot===slot ? old.position
    : ds.items(day).filter(x=>x.slot===slot).reduce((m,x)=>Math.max(m,x.position||0),0)+1;
  const address=$("#bdAddr").value.trim(), snap=Object.assign({}, old && old.place_snapshot);   // 地址放在 place_snapshot，不用改資料表
  if(address) snap.address=address; else delete snap.address;
  const btn=$("#bdSave"); btn.disabled=true; msg.textContent="儲存中…";
  try{
    await ds.upsertItem(Object.assign({ kind:"visit" }, old, { day, slot, position:pos, title, place_snapshot:snap, status:$("#bdStatus").value,
      start_time:$("#bdStart").value||null, note:$("#bdNote").value.trim()||null }));
    toast(old?"已儲存修改":"已加入行程"); BD.formOpen=false; BD.editing=null; BD.menu=null; renderForm(); refreshBoard();
  }catch(e){ msg.textContent=""; btn.disabled=false; pkError(e); }
}

document.addEventListener("click",async e=>{
  const t=e.target;
  if(t.id==="bdOpenForm"){ if(!await ensureEditor()) return; BD.formOpen=true; BD.editing=null; renderForm(); const n=$("#bdTitle"); if(n) n.focus(); return; }
  if(t.id==="bdCancel"){ BD.formOpen=false; BD.editing=null; renderForm(); return; }
  if(t.id==="bdSave"){ saveItem(); return; }
  const mn=t.closest("[data-bdmenu]"); if(mn){ BD.menu = BD.menu===mn.dataset.bdmenu ? null : mn.dataset.bdmenu; refreshBoard(); return; }
  const ed=t.closest("[data-bdedit]");
  if(ed){ if(!await ensureEditor()) return; BD.editing=ed.dataset.bdedit; BD.formOpen=true; renderForm();
    const c=$("#bdFormCard"); if(c) c.scrollIntoView({behavior:"smooth",block:"center"}); return; }
  const dl=t.closest("[data-bddel]");
  if(dl){ const it=itemOf(dl.dataset.bddel); if(!it) return;
    if(!await ensureEditor()) return;
    if(!confirm(`確定要刪除「${it.title||"這個行程"}」嗎？`)) return;
    try{ await ds.deleteItem(it.id); BD.menu=null; if(BD.editing===it.id){ BD.editing=null; BD.formOpen=false; renderForm(); }
      toastAction(`已刪除「${it.title||"行程"}」`,"復原",()=>ds.restoreItem(it.id).then(()=>toast("已復原")).catch(pkError)); }
    catch(err){ pkError(err); } }
});

export function boardSectionHTML(i){
  BD.formOpen=false; BD.editing=null; BD.menu=null;
  return `<div class="card" style="margin-top:14px"><span class="tag lilac">行程規劃板</span>
    <div id="bd-area" class="bd">${boardHTML(i)}</div><div id="bd-formwrap">${formHTML()}</div></div>`;
}

/* ---------- 拖曳排序：按住 ⇅ 把卡片拎起來，拖到想要的位置，可以跨時段 ---------- */
let drag=null;
// 卡片浮起來跟著手指走；原位留一個虛線空位，空位會跟著手指換到要放的地方
function follow(y){ drag.li.style.top=(y-drag.dy)+"px"; }
function placeAt(y){
  const slots=[...document.querySelectorAll("#bd-area .bd-slot")]; if(!slots.length) return;
  const s=slots.find(x=>y<x.getBoundingClientRect().bottom) || slots[slots.length-1];
  const ul=s.querySelector(".bd-list"), {li,ph}=drag;
  const before=[...ul.children].find(x=>{ if(x===li||x===ph) return false; const r=x.getBoundingClientRect(); return y<r.top+r.height/2; }) || null;
  if(ph.parentNode!==ul || ph.nextElementSibling!==before) ul.insertBefore(ph, before);
}
// 拖到畫面上下邊緣時自動捲動
function autoScroll(){
  if(!drag) return;
  const y=drag.y, edge=70, v = y<edge ? -10 : y>innerHeight-edge ? 10 : 0;
  if(v){ scrollBy(0,v); placeAt(y); }
  requestAnimationFrame(autoScroll);
}
document.addEventListener("pointerdown", async e=>{
  const h=e.target.closest("[data-bddrag]"); if(!h) return;
  e.preventDefault();
  if(!ds.canEdit()){ if(await ensureEditor()) toast("可以了，再按住 ⇅ 拖一次"); return; }
  const li=h.closest(".bd-item"), r=li.getBoundingClientRect();
  const ph=document.createElement("li"); ph.className="bd-ph"; ph.style.height=r.height+"px";
  li.after(ph);
  drag={li, ph, y:e.clientY, dy:e.clientY-r.top};
  Object.assign(li.style,{position:"fixed", left:r.left+"px", width:r.width+"px", zIndex:50}); follow(e.clientY);
  li.classList.add("dragging"); $("#bd-area").classList.add("dragging");
  h.setPointerCapture(e.pointerId);
  requestAnimationFrame(autoScroll);
});
document.addEventListener("pointermove", e=>{ if(!drag) return; drag.y=e.clientY; follow(e.clientY); placeAt(e.clientY); });
function endDrag(){
  if(!drag) return;
  const {li,ph}=drag; ph.replaceWith(li); li.removeAttribute("style");
  li.classList.remove("dragging"); $("#bd-area").classList.remove("dragging"); drag=null;
  // 每個時段照畫面順序重新編號 1、2、3…，只送有變的
  const patch=[];
  document.querySelectorAll("#bd-area .bd-slot").forEach(s=>{
    [...s.querySelectorAll(".bd-item")].forEach((li,k)=>{
      const it=itemOf(li.dataset.id);
      if(it && (it.slot!==s.dataset.slot || it.position!==k+1)) patch.push({id:it.id, slot:s.dataset.slot, position:k+1});
    });
  });
  if(!patch.length){ refreshBoard(); return; }
  ds.reorderItems(patch).catch(pkError);
}
document.addEventListener("pointerup", endDrag);
document.addEventListener("pointercancel", endDrag);

function refreshBoard(){
  const a=$("#bd-area"); if(a && !drag) a.innerHTML=boardHTML(S.curDay);   // 拖曳中不重畫，放開後會再刷新
  if(!BD.formOpen) renderForm();   // 表單打開時不重畫，避免輸入到一半被清掉
}
ds.ready().then(refreshBoard);
ds.on("change", refreshBoard);
