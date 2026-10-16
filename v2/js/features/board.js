/* 05 章行程規劃板：整日／上午／下午／晚上四個時段，資料來自 ds.items(day)。
   自訂行程可新增、修改、刪除（需通關碼）；拖曳、順路排序之後再加。 */
import { $, esc, toast, toastAction } from "../util.js";
import { ds } from "../datastore.js";
import { S } from "../state.js";
import { ensureEditor } from "./editor.js";
import { pkError } from "./pocket.js";

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
  const edit = ds.mode==="live" && !it.locked;
  return `<li class="bd-item${it.locked?' locked':''}">
    <div class="bd-head">${time?`<span class="bd-time">${time}</span>`:''}<span class="bd-name">${esc(name)}</span>${edit
      ?`<button type="button" class="bd-more" data-bdmenu="${it.id}" aria-label="更多動作" aria-expanded="${BD.menu===it.id}">⋯</button>`:''}</div>
    ${meta?`<div class="bd-meta">${meta}</div>`:''}
    ${it.note?`<div class="muted bd-note">${esc(it.note)}</div>`:''}
    ${edit&&BD.menu===it.id?`<div class="row bd-acts"><button class="btn ghost" data-bdedit="${it.id}">✏️ 修改</button><button class="btn ghost" data-bddel="${it.id}">🗑️ 刪除</button></div>`:''}</li>`;
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
  const btn=$("#bdSave"); btn.disabled=true; msg.textContent="儲存中…";
  try{
    await ds.upsertItem(Object.assign({ kind:"visit" }, old, { day, slot, position:pos, title, status:$("#bdStatus").value,
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

function refreshBoard(){
  const a=$("#bd-area"); if(a) a.innerHTML=boardHTML(S.curDay);
  if(!BD.formOpen) renderForm();   // 表單打開時不重畫，避免輸入到一半被清掉
}
ds.ready().then(refreshBoard);
ds.on("change", refreshBoard);
