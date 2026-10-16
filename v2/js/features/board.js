/* 05 章行程規劃板：整日／上午／下午／晚上四個時段，資料來自 ds.items(day)。
   目前可新增自訂行程（需通關碼）；拖曳、順路排序之後再加。 */
import { $, esc, toast } from "../util.js";
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

/* ---------- 新增自訂行程 ---------- */
const BD = {formOpen:false};

function formHTML(){
  if(ds.mode!=="live") return "";
  if(!BD.formOpen) return `<div class="row" style="margin-top:12px"><button class="btn" id="bdOpenForm">＋ 新增自訂行程</button></div>`;
  return `<div class="card lilac" id="bdFormCard" style="margin-top:12px"><span class="tag lilac">＋ 新增自訂行程</span>
    <div class="pk-form">
      <label class="full">名稱 *<input type="text" id="bdTitle" maxlength="60" placeholder="例如：去超市買早餐"></label>
      <label>時段<select id="bdSlot">${SLOTS.map(([k,t])=>`<option value="${k}" ${k==="morning"?'selected':''}>${t}</option>`).join("")}</select></label>
      <label>開始時間（可留空）<input type="time" id="bdStart"></label>
      <label>必去／備案<select id="bdStatus"><option value="must">必去</option><option value="maybe">備案</option></select></label>
      <label class="full">備註（可留空）<textarea id="bdNote" maxlength="300"></textarea></label>
    </div>
    <div class="row" style="margin-top:12px"><button class="btn" id="bdSave">加入行程</button>
      <button class="btn ghost" id="bdCancel">取消</button><span class="muted" id="bdMsg"></span></div></div>`;
}
const renderForm = () => { const w=$("#bd-formwrap"); if(w) w.innerHTML=formHTML(); };

async function saveItem(){
  const title=$("#bdTitle").value.trim(), msg=$("#bdMsg");
  if(!title){ msg.textContent="請先填寫名稱"; $("#bdTitle").focus(); return; }
  if(!await ensureEditor()) return;
  const day=dayDate(S.curDay), slot=$("#bdSlot").value;
  const pos=ds.items(day).filter(x=>x.slot===slot).reduce((m,x)=>Math.max(m,x.position||0),0)+1;   // 排在該時段最後
  const btn=$("#bdSave"); btn.disabled=true; msg.textContent="儲存中…";
  try{
    await ds.upsertItem({ day, slot, position:pos, title, kind:"visit", status:$("#bdStatus").value,
      start_time:$("#bdStart").value||null, note:$("#bdNote").value.trim()||null });
    toast("已加入行程"); BD.formOpen=false; renderForm();
  }catch(e){ msg.textContent=""; btn.disabled=false; pkError(e); }
}

document.addEventListener("click",async e=>{
  const t=e.target;
  if(t.id==="bdOpenForm"){ if(!await ensureEditor()) return; BD.formOpen=true; renderForm(); const n=$("#bdTitle"); if(n) n.focus(); return; }
  if(t.id==="bdCancel"){ BD.formOpen=false; renderForm(); return; }
  if(t.id==="bdSave"){ saveItem(); return; }
});

export function boardSectionHTML(i){
  BD.formOpen=false;
  return `<div class="card" style="margin-top:14px"><span class="tag lilac">行程規劃板</span>
    <div id="bd-area" class="bd">${boardHTML(i)}</div><div id="bd-formwrap">${formHTML()}</div></div>`;
}

function refreshBoard(){
  const a=$("#bd-area"); if(a) a.innerHTML=boardHTML(S.curDay);
  if(!BD.formOpen) renderForm();   // 表單打開時不重畫，避免輸入到一半被清掉
}
ds.ready().then(refreshBoard);
ds.on("change", refreshBoard);
