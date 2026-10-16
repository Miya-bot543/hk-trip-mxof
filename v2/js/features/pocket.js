/* 07 口袋名單（v1 原樣；5.2 會改接 datastore）。 */
import { DAYS, POCKET_SEED } from "../../data/static.js";
import { $, esc, v, store, gmaps, toast } from "../util.js";

export const STATIC_BUILD = true;

/* ---------- 07 全家共用口袋名單（新增・修改・刪除） ---------- */
export const PK = {db:null, user:null, uid:null, canWrite:null, readonly:false, items:[], names:{}, ready:false, pending:false, filter:"all", afilter:"all", open:new Set(), editing:null, draftExtra:null};
export const PK_CATS = [["spot","⛩️ 景點・散步"],["shop","🛍️ 購物"],["food","🍜 美食"]];
export const PK_COLOR = {spot:"ice", shop:"lilac", food:"pink"};
export const PK_AREAS = ["札幌（薄野）","札幌（大通・狸小路）","札幌（札幌站周邊）","札幌（中島公園）","札幌（圓山・宮之森）","札幌（市區其他）",
  "手稻","定山溪","小樽","登別","白老","洞爺湖","室蘭","千歲・新千歲機場","苫小牧","旭川","美瑛","富良野","層雲峽","二世谷","函館","其他"];
export const PK_TRANSPORT = ["步行","地下鐵","JR 電車／鐵路","市電（路面電車）","路線巴士","高速巴士","機場巴士","飯店接駁車","免費接駁車","計程車","租車自駕","套裝行程接送","飛機","其他"];
export const PK_FIELDS = {
  spot:[["hours","開放時間"],["fee","門票／費用"],["stay","建議停留時間"],["tips","注意事項"]],
  shop:[["hours","營業時間"],["closed","公休日"],["buy","想買的東西"]],
  food:[["branch","分店"],["hours","營業時間"],["closed","公休日"],["dish","招牌／想點的"],
        ["reserve","預約",["待確認","需要預約","不用預約","不接受預約","已預約"]],["queue","候位資訊"],["budget","預算（每人）"]]
};
export const PK_VENUES = [["室內","🏠 室內"],["戶外","🌲 戶外"],["園區","🎡 園區（室內＋戶外）"]];
export const PK_WHEN = ["住宿札幌期間（12/28～01/03）", ...DAYS.map(d=>`${d.md}（${d.wd}）`)];
export const pkWritable = () => !!PK.db && PK.canWrite!==false && !PK.readonly;
export const pkCatName = k => (PK_CATS.find(c=>c[0]===k)||PK_CATS[0])[1];


export function pkError(e){
  const code=e&&e.code;
  if(code==="invalid_argument"){PK.readonly=true; toast("你目前只有檢視權限，無法修改共用清單"); refreshPocket(true);}
  else if(code==="quota_exceeded") toast("共用清單已滿，請先刪除一些項目");
  else if(code==="resource_exhausted") toast("操作太頻繁，請稍等一下再試");
  else toast("暫時無法儲存，請稍後再試");
}

(async function initPocketDb(){
  try{
    if(typeof STATIC_BUILD!=="undefined" || !window.claude || typeof window.claude.use!=="function") return;
    const [db,user]=await Promise.all([window.claude.use("db"),window.claude.use("user")]);
    if(!db) return;
    PK.db=db; PK.user=user;
    if(user){ PK.uid=await user.id(); PK.canWrite=await user.can("data.write"); }
    db.collection("pocket").orderBy("createdAt","asc").onSnapshot(snap=>{
      PK.items=snap.docs.map(d=>Object.assign({id:d.id},d.data())); PK.ready=true; resolvePkNames(); refreshPocket();
    }, e=>console.warn("pocket",e));
    refreshPocket(true);
  }catch(e){ console.warn(e); }
})();

export async function resolvePkNames(){
  if(!PK.user) return;
  const ids=[...new Set(PK.items.flatMap(i=>[i.by,i.editedBy]).filter(id=>id && !(id in PK.names)))];
  if(!ids.length) return;
  try{ const ps=await PK.user.profiles(ids); ids.forEach(id=>{PK.names[id]=(ps[id]&&ps[id].name)||"";}); refreshPocket(); }catch(e){}
}

/* 沒有共用資料庫（例如在 Claude 以外開啟）時，顯示內建的預設清單，勾選存本機 */
export function pkList(){ return PK.db ? PK.items : POCKET_SEED.map(x=>Object.assign({},x,(store.get("hk-pocket",{})[x.id])||{})); }
export const wantCount = st => Object.values(st.wantBy||{}).filter(Boolean).length;
export const iWant = st => PK.db ? !!(PK.uid && st.wantBy && st.wantBy[PK.uid]) : !!st.want;
export const pkQuery = it => it.address ? it.address : `${it.name} ${(it.area||"").replace(/（.*）/,"").replace("其他","北海道")}`;

export async function pkUpdate(id,shared,local){
  if(!PK.db){ const st=store.get("hk-pocket",{}); st[id]=Object.assign({},st[id]||{},local); store.set("hk-pocket",st); return; }
  if(!pkWritable()){ toast("你目前只有檢視權限"); return; }
  try{ await PK.db.doc("pocket/"+id).update(shared); }catch(e){ pkError(e); }
}

export function pkCardHTML(it){
  const canW = PK.db ? pkWritable() : true, cat=PK_FIELDS[it.cat]?it.cat:"spot", color=PK_COLOR[cat];
  const info=it.info||{}, wc=wantCount(it), mine=iWant(it);
  const who = it.by ? (PK.names[it.by] || "家人") : "";
  const rows = [["地址", it.address||null],["交通方式",(it.transport&&it.transport.length)?it.transport.join("、"):null],
    ...PK_FIELDS[cat].map(([k,l])=>[l, info[k]&&info[k]!=="待確認"?info[k]:null]),
    ...((it.extra||[]).filter(x=>x&&x.k).map(x=>[x.k, x.v||null]))];
  return `<div class="card ${color} hcard">
    <div class="htop"><span class="tag ${color==='pink'?'':color}">${pkCatName(cat)}</span>${/（.+）/.test(it.area||"")?`<span class="nights">📍 ${esc((it.area.match(/（(.+)）/)||[])[1])}</span>`:''}</div>
    <h3 style="margin-top:6px">${esc(it.name)}</h3>
    <div class="pk-tags"><span class="pk-city">📍 ${esc((it.area||"其他").replace(/（.*）/,""))}</span>${(()=>{const vv=PK_VENUES.find(x=>x[0]===it.venue); return vv?`<span class="pk-venue v-${vv[0]}">${vv[1].split("（")[0]}</span>`:'<span class="pk-venue">室內／戶外待確認</span>';})()}${(it.tags||[]).map(t=>`<span>${esc(t)}</span>`).join("")}</div>
    ${it.note?`<p class="muted pk-note ${PK.open.has(it.id)?'':'clamp'}">${esc(it.note)}</p>`:''}
    ${PK.open.has(it.id)?`<dl class="kv">${rows.map(([k,x])=>`<dt>${esc(k)}</dt><dd>${v(x)}</dd>`).join("")}</dl>`:''}
    <div class="stars">
      ${(PK.db && !PK.uid)?'':`<label><input type="checkbox" data-pk="${it.id}" data-f="want" ${mine?'checked':''} ${canW?'':'disabled'}>♡ 想去${PK.db&&wc?`（${wc} 人）`:''}</label>`}
      <label><input type="checkbox" data-pk="${it.id}" data-f="done" ${it.done?'checked':''} ${canW?'':'disabled'}>✓ 已去</label></div>
    ${who&&PK.open.has(it.id)?`<p class="muted" style="margin:8px 0 0">由 ${esc(who)} 新增</p>`:''}
    <div class="mapgo row"><button class="btn ghost pk-more" data-pkopen="${it.id}" aria-expanded="${PK.open.has(it.id)}">${PK.open.has(it.id)?'收合 ▴':'看詳細 ▾'}</button>
      <a class="btn" href="${gmaps(pkQuery(it))}" target="_blank" rel="noopener">🗺️ 地圖</a>
      ${PK.db&&canW&&PK.open.has(it.id)?`<button class="btn ghost" data-editpk="${it.id}">✏️ 修改</button><button class="btn ghost" data-delpk="${it.id}">🗑️ 刪除</button>`:''}</div></div>`;
}

export function pocketListHTML(){
  const list=pkList().filter(i=>i&&i.name).filter(i=>PK.afilter==="all" || (PK.afilter==="其他" ? !/^(札幌|登別)/.test(i.area||"") : (i.area||"").startsWith(PK.afilter)));
  if(PK.db && PK.ready && !list.length) return `<p class="muted" style="margin-top:14px">清單是空的，用上面的表單新增第一個地點吧。</p>`;
  const show = PK_CATS.filter(([k])=>PK.filter==="all"||PK.filter===k);
  return show.map(([k,t])=>{ const L=list.filter(c=>(PK_FIELDS[c.cat]?c.cat:"spot")===k);
    return `<div class="cat-h">${t}<span class="muted">（${L.length}）</span></div>${L.length?`<div class="grid pk-grid">${L.map(pkCardHTML).join("")}</div>`:'<p class="muted">還沒有項目。</p>'}`;}).join("");
}

export function pkStatusHTML(){
  if(!PK.db) return `<div class="caution">📌 口袋名單由行程負責人統一更新。想新增地點，請告訴負責人。「♡ 想去」「✓ 已去」只會記在你自己的手機上。</div>`;
  if(!pkWritable()) return `<div class="caution">👀 你目前只有檢視權限，可以看全家的清單，但不能新增或修改。需要時請網站擁有者把你的權限改成「參與者」以上。</div>`;
  return `<div class="caution">👨‍👩‍👧 全家共用中：新增、修改、刪除和勾選，家人打開網站都看得到。</div>`;
}

/* ---------- 表單 ---------- */
export function pkCatFieldsHTML(cat,info){
  info=info||{};
  return PK_FIELDS[cat].map(([k,l,opts])=>opts
    ? `<label>${l}<select data-info="${k}">${opts.map(o=>`<option ${info[k]===o?'selected':''}>${o}</option>`).join("")}</select></label>`
    : `<label>${l}<input type="text" data-info="${k}" maxlength="120" value="${esc(info[k]||"")}"></label>`).join("");
}
export function pkExtraRowsHTML(rows){
  return (rows||[]).map((x,i)=>`<div class="pk-extra-row"><input type="text" data-xk="${i}" placeholder="欄位名稱，例如：預約編號" maxlength="40" value="${esc(x.k||"")}">
    <input type="text" data-xv="${i}" placeholder="內容" maxlength="200" value="${esc(x.v||"")}"><button class="btn ghost" data-xdel="${i}" aria-label="刪除這個欄位">✕</button></div>`).join("");
}
export function pkFormHTML(){
  if(!PK.db || !pkWritable()) return "";
  const it = PK.editing ? (PK.items.find(i=>i.id===PK.editing)||{}) : {};
  const cat = PK_FIELDS[it.cat]?it.cat:"food";
  if(PK.draftExtra===null) PK.draftExtra = JSON.parse(JSON.stringify(it.extra||[]));
  const tr=it.transport||[];
  return `<div class="card lilac" id="pkFormCard" style="margin-top:14px">
    <div class="htop"><span class="tag lilac">${PK.editing?'✏️ 修改地點':'＋ 新增地點'}</span>${PK.editing?`<span class="nights">修改中：${esc(it.name||"")}</span>`:''}</div>
    <div class="pk-form">
      <label class="full">名稱 *<input type="text" id="pkName" maxlength="60" placeholder="例如：湯咖哩 Suage+" value="${esc(it.name||"")}"></label>
      <label>分類<select id="pkCat">${PK_CATS.map(([k,t])=>`<option value="${k}" ${k===cat?'selected':''}>${t}</option>`).join("")}</select></label>
      <label>地區<select id="pkArea">${PK_AREAS.map(a=>`<option ${it.area===a?'selected':''}>${a}</option>`).join("")}</select></label>
      <label>室內／戶外<select id="pkVenue"><option value="">待確認</option>${PK_VENUES.map(([k,t])=>`<option value="${k}" ${it.venue===k?'selected':''}>${t}</option>`).join("")}</select></label>
      <label class="full">地址（建議填寫，地圖會更準確）<input type="text" id="pkAddr" maxlength="150" placeholder="例如：北海道札幌市中央区南5条西4丁目" value="${esc(it.address||"")}"></label>
      <fieldset class="full pk-tr"><legend>交通方式（可複選）</legend>
        ${PK_TRANSPORT.map(t=>`<label><input type="checkbox" data-tr value="${t}" ${tr.includes(t)?'checked':''}>${t}</label>`).join("")}</fieldset>
      <div class="full pk-sub">📋 ${pkCatName(cat)}的資料</div>
      <div class="full pk-form" id="pkCatFields" style="margin:0">${pkCatFieldsHTML(cat,it.info)}</div>
      <label class="full">標籤（用逗號分開，可留空）<input type="text" id="pkTags" maxlength="100" placeholder="例如：夜景, 拍照" value="${esc((it.tags||[]).join(", "))}"></label>
      <div class="full"><div class="pk-sub">🧩 自訂欄位（自己新增、修改、刪除）</div>
        <div id="pkExtra">${pkExtraRowsHTML(PK.draftExtra)}</div>
        <button class="btn ghost" id="pkXAdd" style="margin-top:6px">＋ 新增欄位</button></div>
      <label class="full">補充（可留空）<textarea id="pkNote" maxlength="800" placeholder="為什麼想去、注意事項…">${esc(it.note||"")}</textarea></label>
    </div>
    <div class="row" style="margin-top:12px"><button class="btn" id="pkSave">${PK.editing?'儲存修改':'加入口袋名單'}</button>
      ${PK.editing?'<button class="btn ghost" id="pkCancel">取消修改</button>':''}<span class="muted" id="pkMsg"></span></div></div>`;
}
export function pkReadExtra(){
  const rows=[]; document.querySelectorAll("#pkExtra .pk-extra-row").forEach(r=>{
    rows.push({k:r.querySelector("[data-xk]").value.trim().slice(0,40), v:r.querySelector("[data-xv]").value.trim().slice(0,200)});});
  return rows;
}
export function pkRenderForm(){ const w=$("#pk-formwrap"); if(w) w.innerHTML=pkFormHTML(); }

export function pocketSectionHTML(){
  PK.draftExtra=null;
  return `<div id="pk-status">${pkStatusHTML()}</div><div id="pk-formwrap">${pkFormHTML()}</div>
    <div class="row" style="margin-top:16px" role="group" aria-label="篩選分類">
      ${[["all","全部"],...PK_CATS].map(([k,t])=>`<button class="chip" data-pkf="${k}" ${PK.filter===k?'aria-current="page"':''}>${t}</button>`).join("")}</div>
    <div class="row" style="margin-top:8px" role="group" aria-label="篩選地區">
      ${[["all","📍 全部地區"],["札幌","札幌"],["登別","登別"],["其他","小樽・富良野・其他"]].map(([k,t])=>`<button class="chip" data-pka="${k}" ${PK.afilter===k?'aria-current="page"':''}>${t}</button>`).join("")}</div>
    <div class="row" style="margin-top:8px"><button class="btn ghost" data-pkall="open">全部展開</button><button class="btn ghost" data-pkall="close">全部收合</button></div>
    <div id="pk-area">${pocketListHTML()}</div>`;
}

export function refreshPocket(full){
  const area=$("#pk-area"); if(!area) return;
  const ae=document.activeElement;
  if(ae && (ae.tagName==="TEXTAREA"||ae.tagName==="SELECT"||(ae.tagName==="INPUT"&&ae.type==="text")) && ae.closest("#pk-area")){ PK.pending=true; return; }
  if(full){ $("#pk-status").innerHTML=pkStatusHTML(); const n=$("#pkName"); if(!n || (!n.value && !PK.editing)){ PK.draftExtra=null; pkRenderForm(); } }
  area.innerHTML=pocketListHTML(); PK.pending=false;
}
document.addEventListener("focusout",()=>{ if(PK.pending) setTimeout(()=>{ if(PK.pending) refreshPocket(); },50); });

export async function pkSave(){
  const name=$("#pkName").value.trim(), msg=$("#pkMsg");
  if(!name){ msg.textContent="請先填寫名稱"; $("#pkName").focus(); return; }
  const cat=$("#pkCat").value, info={};
  document.querySelectorAll("#pkCatFields [data-info]").forEach(el=>{ info[el.dataset.info]=el.value.trim().slice(0,120); });
  const data={ name, cat, area:$("#pkArea").value, venue:$("#pkVenue").value||null, address:$("#pkAddr").value.trim(),
    transport:[...document.querySelectorAll("#pkFormCard [data-tr]:checked")].map(x=>x.value),
    tags:$("#pkTags").value.split(/[,，、]/).map(t=>t.trim()).filter(Boolean).slice(0,8),
    info, extra:pkReadExtra().filter(x=>x.k||x.v).slice(0,20), note:$("#pkNote").value.trim() };
  const btn=$("#pkSave"); btn.disabled=true; msg.textContent="儲存中…";
  try{
    if(PK.editing){
      await PK.db.doc("pocket/"+PK.editing).update(Object.assign(data,{editedBy:PK.uid||null, editedAt:new Date().toISOString()}));
      toast("已儲存修改");
    } else {
      await PK.db.collection("pocket").add(Object.assign(data,{by:PK.uid||null, createdAt:new Date().toISOString(), done:false, wantBy:{}}));
      toast("已加入口袋名單");
    }
    PK.editing=null; PK.draftExtra=null; pkRenderForm();
  }catch(e){ msg.textContent=""; btn.disabled=false; pkError(e); }
}

document.addEventListener("click",async e=>{
  const t=e.target;
  if(t.id==="pkSave"){ pkSave(); return; }
  if(t.id==="pkCancel"){ PK.editing=null; PK.draftExtra=null; pkRenderForm(); return; }
  if(t.id==="pkXAdd"){ PK.draftExtra=pkReadExtra(); PK.draftExtra.push({k:"",v:""}); $("#pkExtra").innerHTML=pkExtraRowsHTML(PK.draftExtra);
    const ins=document.querySelectorAll("#pkExtra [data-xk]"); if(ins.length) ins[ins.length-1].focus(); return; }
  const xd=t.closest("[data-xdel]"); if(xd){ PK.draftExtra=pkReadExtra(); PK.draftExtra.splice(+xd.dataset.xdel,1); $("#pkExtra").innerHTML=pkExtraRowsHTML(PK.draftExtra); return; }
  const po=t.closest("[data-pkopen]"); if(po){ const id=po.dataset.pkopen; PK.open.has(id)?PK.open.delete(id):PK.open.add(id); refreshPocket(); return; }
  const pa=t.closest("[data-pkall]"); if(pa){ if(pa.dataset.pkall==="open") pkList().forEach(i=>PK.open.add(i.id)); else PK.open.clear(); refreshPocket(); return; }
  const fa=t.closest("[data-pka]"); if(fa){ PK.afilter=fa.dataset.pka; document.querySelectorAll("[data-pka]").forEach(b=>b.toggleAttribute("aria-current",b===fa)); refreshPocket(); return; }
  const f=t.closest("[data-pkf]"); if(f){ PK.filter=f.dataset.pkf; document.querySelectorAll("[data-pkf]").forEach(b=>b.toggleAttribute("aria-current",b===f)); refreshPocket(); return; }
  const ed=t.closest("[data-editpk]");
  if(ed){ PK.editing=ed.dataset.editpk; PK.draftExtra=null; pkRenderForm(); const c=$("#pkFormCard"); if(c) c.scrollIntoView({behavior:"smooth",block:"start"}); return; }
  const d=t.closest("[data-delpk]");
  if(d && PK.db){ const it=PK.items.find(i=>i.id===d.dataset.delpk); if(!it) return;
    if(!confirm(`確定要從全家的口袋名單刪除「${it.name}」嗎？刪除後無法復原。`)) return;
    try{ await PK.db.doc("pocket/"+it.id).delete(); if(PK.editing===it.id){PK.editing=null;PK.draftExtra=null;pkRenderForm();} toast("已刪除"); }catch(err){ pkError(err); } }
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.id==="pkCat"){ const cur={}; document.querySelectorAll("#pkCatFields [data-info]").forEach(el=>cur[el.dataset.info]=el.value);
    $("#pkCatFields").innerHTML=pkCatFieldsHTML(t.value,cur); const s=document.querySelector("#pkFormCard .pk-sub"); if(s) s.textContent="📋 "+pkCatName(t.value)+"的資料"; return; }
  if(t.dataset.pk){
    const f=t.dataset.f, id=t.dataset.pk;
    if(f==="want"){ if(PK.db){ if(!PK.uid) return; pkUpdate(id,{wantBy:{[PK.uid]:t.checked}}); } else pkUpdate(id,null,{want:t.checked}); }
    else pkUpdate(id,{done:t.checked},{done:t.checked});
  }
});
