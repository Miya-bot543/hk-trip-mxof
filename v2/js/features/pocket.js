/* 07 口袋名單：資料來自 datastore（places 裡 is_wishlist=true 的景點、購物、美食）。 */
import { DAYS } from "../../data/static.js";
import { $, esc, v, gmaps, toast, toastAction } from "../util.js";
import { ds } from "../datastore.js";
import { ensureEditor, editorStatusHTML } from "./editor.js";
import { S } from "../state.js";

/* ---------- 07 共用口袋名單（新增・修改・刪除走 datastore，需通關碼） ---------- */
export const PK = {pending:false, filter:"all", afilter:"all", open:new Set(), adding:null, editing:null, formOpen:false, draftExtra:null};
export const PK_CATS = [["spot","⛩️ 景點・散步"],["shop","🛍️ 購物"],["food","🍜 美食"]];
export const PK_COLOR = {spot:"ice", shop:"lilac", food:"pink"};
export const PK_AREAS = ["札幌（薄野）","札幌（大通）","札幌（札幌站周邊）","札幌（中島公園）","札幌（圓山）","札幌（市區其他）",
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
export const pkWritable = () => ds.canEdit();
export const pkCatName = k => (PK_CATS.find(c=>c[0]===k)||PK_CATS[0])[1];
const PK_SLOTS = [["allday","待排入"],["morning","上午"],["afternoon","下午"],["evening","晚上"]];
// 第 i 天（0 起算）對應的日期，跟 05 章規劃板一樣從 12/25 開始
const pkDay = i => new Date(Date.UTC(2026, 11, 25) + i*86400000).toISOString().slice(0,10);


export function pkError(e){
  if(e && e.code==="invalid_code") toast("通關碼已更換，請重新輸入");
  else if(e && e.code==="no_code") return;
  else toast("暫時無法儲存，請稍後再試");
}

/* 資料庫的地點轉成卡片用的格式。id 沿用舊版代號（legacy_id） */
const fromPlace = p => ({ id:p.legacy_id||p.id, uuid:p.id, name:p.name, cat:p.category, area:p.area, venue:p.venue, address:p.address||"",
  transport:p.transport||[], tags:p.tags||[], info:p.info||{}, extra:p.extra||[], note:p.note||"", stay:p.stay_minutes, lat:p.lat, lng:p.lng, createdAt:p.created_at, by:p.created_by });
export function pkList(){
  return ds.places().filter(p=>p.is_wishlist && PK_FIELDS[p.category]).map(fromPlace);
}
const placeOf = it => ds.places().find(p=>p.id===it.uuid);
// 有地址時用「店名＋地址」搜尋：只用地址的話，同一棟樓可能跳到別家店
export const pkQuery = it => it.address ? `${it.name} ${it.address}` : `${it.name} ${(it.area||"").replace(/（.*）/,"").replace("其他","北海道")}`;

export function pkCardHTML(it){
  const cat=PK_FIELDS[it.cat]?it.cat:"spot", color=PK_COLOR[cat];
  const info=it.info||{}, live=ds.mode==="live";
  // 地區統一顯示在上方（札幌加上細分區域）；標籤裡跟地區重複的字就不再顯示
  const areaRaw=it.area||"其他", areaLabel=areaRaw.replace(/（(.+)）/,"・$1");
  const tags=(it.tags||[]).filter(t=>t && !areaRaw.includes(t));
  const who = it.by && it.by!=="匯入" ? it.by : "";
  const rows = [["地址", it.address||null],["交通方式",(it.transport&&it.transport.length)?it.transport.join("、"):null],
    ...PK_FIELDS[cat].map(([k,l])=>[l, info[k]&&info[k]!=="待確認"?info[k]:null]),
    ...((it.extra||[]).filter(x=>x&&x.k).map(x=>[x.k, x.v||null]))];
  return `<div class="card ${color} hcard">
    <div class="htop"><span class="tag ${color==='pink'?'':color}">${pkCatName(cat)}</span><span class="nights">📍 ${esc(areaLabel)}</span></div>
    <h3 style="margin-top:6px">${esc(it.name)}</h3>
    <div class="pk-tags">${(()=>{const vv=PK_VENUES.find(x=>x[0]===it.venue); return vv?`<span class="pk-venue v-${vv[0]}">${vv[1].split("（")[0]}</span>`:'<span class="pk-venue">室內／戶外待確認</span>';})()}${tags.map(t=>`<span>${esc(t)}</span>`).join("")}</div>
    ${it.note?`<p class="muted pk-note ${PK.open.has(it.id)?'':'clamp'}">${esc(it.note)}</p>`:''}
    ${PK.open.has(it.id)?`<dl class="kv">${rows.map(([k,x])=>`<dt>${esc(k)}</dt><dd>${v(x)}</dd>`).join("")}</dl>`:''}
    ${who&&PK.open.has(it.id)?`<p class="muted" style="margin:8px 0 0">由 ${esc(who)} 新增</p>`:''}
    <div class="mapgo pk-acts"><button class="btn ghost pk-more" data-pkopen="${it.id}" aria-expanded="${PK.open.has(it.id)}">${PK.open.has(it.id)?'收合 ▴':'看詳細 ▾'}</button>
      <a class="btn" href="${gmaps(pkQuery(it))}" target="_blank" rel="noopener">🗺️ 地圖</a>
      ${live?`<button class="btn ghost" data-pkadd="${it.id}" aria-expanded="${PK.adding===it.id}">＋ 加入行程</button>`:''}
      ${live&&PK.open.has(it.id)?`<button class="btn ghost" data-editpk="${it.id}">✏️ 修改</button><button class="btn ghost" data-delpk="${it.id}">🗑️ 刪除</button>`:''}</div>
    ${live&&PK.adding===it.id?pkAddHTML(it):''}</div>`;
}

/* ---------- 卡片上的「＋ 加入行程」：選哪一天、哪個時段，加進 05 章規劃板 ---------- */
function pkAddHTML(it){
  const days=DAYS.map((d,i)=>[i,d]).filter(([i])=>ds.items(pkDay(i)).some(x=>x.place_id===it.uuid && !x.locked)).map(([,d])=>d.md);
  const cur=Math.min(Math.max(S.curDay||0,0),DAYS.length-1);
  return `<div class="pk-add">
    <div class="pk-form">
      <label class="full">哪一天<select data-pkaddday>${DAYS.map((d,i)=>`<option value="${i}" ${i===cur?'selected':''}>${d.md}（${d.wd}）</option>`).join("")}</select></label>
      <label>時段<select data-pkaddslot>${PK_SLOTS.map(([k,t])=>`<option value="${k}" ${k==="allday"?'selected':''}>${t}</option>`).join("")}</select></label>
      <label>必去／備案<select data-pkaddstatus><option value="must">必去</option><option value="maybe">備案</option></select></label>
    </div>
    ${days.length?`<p class="muted" style="margin:8px 0 0">✓ 已排在 ${days.join("、")}</p>`:''}
    <div class="row" style="margin-top:10px"><button class="btn" data-pkaddgo="${it.id}">加入</button><button class="btn ghost" data-pkaddno>取消</button></div></div>`;
}
async function pkAddToDay(id, btn){
  const it=pkList().find(i=>i.id===id); if(!it) return;
  if(!await ensureEditor()) return;
  const box=btn.closest(".pk-add"), i=+box.querySelector("[data-pkaddday]").value, slot=box.querySelector("[data-pkaddslot]").value;
  const day=pkDay(i), pos=ds.items(day).filter(x=>x.slot===slot).reduce((m,x)=>Math.max(m,x.position||0),0)+1;
  const snap={ name:it.name }; if(it.address) snap.address=it.address; if(it.area) snap.area=it.area;
  btn.disabled=true;
  try{
    await ds.upsertItem({ kind:"visit", day, slot, position:pos, title:it.name, place_id:it.uuid, place_snapshot:snap,
      status:box.querySelector("[data-pkaddstatus]").value, start_time:null, note:null });
    toast(`已把「${it.name}」加入 ${DAYS[i].md} ${PK_SLOTS.find(x=>x[0]===slot)[1]}`); PK.adding=null; refreshPocket();
  }catch(e){ btn.disabled=false; pkError(e); }
}

export function pocketListHTML(){
  const list=pkList().filter(i=>i&&i.name).filter(i=>PK.afilter==="all" || (PK.afilter==="其他" ? !/^(札幌|登別)/.test(i.area||"") : (i.area||"").startsWith(PK.afilter)));
  if(!ds.trip()) return `<p class="muted" style="margin-top:14px">口袋名單讀取中…</p>`;
  const show = PK_CATS.filter(([k])=>PK.filter==="all"||PK.filter===k);
  return show.map(([k,t])=>{ const L=list.filter(c=>(PK_FIELDS[c.cat]?c.cat:"spot")===k);
    return `<div class="cat-h">${t}<span class="muted">（${L.length}）</span></div>${L.length?`<div class="grid pk-grid">${L.map(pkCardHTML).join("")}</div>`:'<p class="muted">還沒有項目。</p>'}`;}).join("");
}

export function pkStatusHTML(){
  if(ds.mode==="offline") return `<div class="caution">📴 目前沒有網路，顯示最後一次讀到的清單，連上網路後才能修改。</div>`;
  if(ds.mode!=="live") return `<div class="caution">📌 目前為唯讀模式，暫時無法新增或修改。</div>`;
  return editorStatusHTML("共用清單：輸入通關碼後，就能新增或修改地點。","共用中：新增、修改、刪除，打開網站都看得到。");
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
  if(ds.mode!=="live") return "";
  if(!PK.formOpen && !PK.editing) return `<div class="row" style="margin-top:14px"><button class="btn" id="pkOpenForm">＋ 新增地點</button></div>`;
  const it = PK.editing ? (pkList().find(i=>i.id===PK.editing)||{}) : {};
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
      <label>預估停留（分鐘，排行程用）<input type="number" id="pkStay" min="5" max="720" step="5" inputmode="numeric" value="${it.stay||""}"></label>
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
      <button class="btn ghost" id="pkCancel">${PK.editing?'取消修改':'取消'}</button><span class="muted" id="pkMsg"></span></div></div>`;
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
ds.ready().then(()=>refreshPocket());
ds.on("change",()=>refreshPocket(true));
document.addEventListener("focusout",()=>{ if(PK.pending) setTimeout(()=>{ if(PK.pending) refreshPocket(); },50); });

export async function pkSave(){
  const name=$("#pkName").value.trim(), msg=$("#pkMsg");
  if(!name){ msg.textContent="請先填寫名稱"; $("#pkName").focus(); return; }
  if(!await ensureEditor()) return;
  const cat=$("#pkCat").value, old=PK.editing ? (placeOf(pkList().find(i=>i.id===PK.editing)||{})||{}) : {};
  const info=Object.assign({}, old.info&&old.info.when?{when:old.info.when}:{});
  document.querySelectorAll("#pkCatFields [data-info]").forEach(el=>{ info[el.dataset.info]=el.value.trim().slice(0,120); });
  const address=$("#pkAddr").value.trim(), stay=parseInt($("#pkStay").value,10);
  const data=Object.assign({}, old, { name, category:cat, area:$("#pkArea").value, venue:$("#pkVenue").value||null, address:address||null,
    transport:[...document.querySelectorAll("#pkFormCard [data-tr]:checked")].map(x=>x.value),
    tags:$("#pkTags").value.split(/[,，、]/).map(t=>t.trim()).filter(Boolean).slice(0,8),
    info, extra:pkReadExtra().filter(x=>x.k||x.v).slice(0,20), note:$("#pkNote").value.trim()||null,
    stay_minutes: stay>=5 && stay<=720 ? stay : null, is_wishlist:true });
  if(old.id && (old.address||"")!==(address||"")){ data.lat=null; data.lng=null; }   // 地址改了，舊座標就不準了
  const btn=$("#pkSave"); btn.disabled=true; msg.textContent="儲存中…";
  try{
    await ds.upsertPlace(data);
    toast(PK.editing?"已儲存修改":"已加入口袋名單");
    PK.editing=null; PK.formOpen=false; PK.draftExtra=null; pkRenderForm();
  }catch(e){ msg.textContent=""; btn.disabled=false; pkError(e); }
}

document.addEventListener("click",async e=>{
  const t=e.target;
  if(t.id==="pkSave"){ pkSave(); return; }
  if(t.id==="pkOpenForm"){ if(!await ensureEditor()) return; PK.formOpen=true; PK.draftExtra=null; pkRenderForm(); const n=$("#pkName"); if(n) n.focus(); return; }
  if(t.id==="pkCancel"){ PK.editing=null; PK.formOpen=false; PK.draftExtra=null; pkRenderForm(); return; }
  if(t.id==="pkXAdd"){ PK.draftExtra=pkReadExtra(); PK.draftExtra.push({k:"",v:""}); $("#pkExtra").innerHTML=pkExtraRowsHTML(PK.draftExtra);
    const ins=document.querySelectorAll("#pkExtra [data-xk]"); if(ins.length) ins[ins.length-1].focus(); return; }
  const xd=t.closest("[data-xdel]"); if(xd){ PK.draftExtra=pkReadExtra(); PK.draftExtra.splice(+xd.dataset.xdel,1); $("#pkExtra").innerHTML=pkExtraRowsHTML(PK.draftExtra); return; }
  const pa2=t.closest("[data-pkadd]");
  if(pa2){ const id=pa2.dataset.pkadd; if(PK.adding!==id && !await ensureEditor()) return; PK.adding = PK.adding===id ? null : id; refreshPocket(); return; }
  if(t.closest("[data-pkaddno]")){ PK.adding=null; refreshPocket(); return; }
  const go=t.closest("[data-pkaddgo]"); if(go){ pkAddToDay(go.dataset.pkaddgo, go); return; }
  const po=t.closest("[data-pkopen]"); if(po){ const id=po.dataset.pkopen; PK.open.has(id)?PK.open.delete(id):PK.open.add(id); refreshPocket(); return; }
  const pa=t.closest("[data-pkall]"); if(pa){ if(pa.dataset.pkall==="open") pkList().forEach(i=>PK.open.add(i.id)); else PK.open.clear(); refreshPocket(); return; }
  const fa=t.closest("[data-pka]"); if(fa){ PK.afilter=fa.dataset.pka; document.querySelectorAll("[data-pka]").forEach(b=>b.toggleAttribute("aria-current",b===fa)); refreshPocket(); return; }
  const f=t.closest("[data-pkf]"); if(f){ PK.filter=f.dataset.pkf; document.querySelectorAll("[data-pkf]").forEach(b=>b.toggleAttribute("aria-current",b===f)); refreshPocket(); return; }
  const ed=t.closest("[data-editpk]");
  if(ed){ if(!await ensureEditor()) return; PK.editing=ed.dataset.editpk; PK.draftExtra=null; pkRenderForm(); const c=$("#pkFormCard"); if(c) c.scrollIntoView({behavior:"smooth",block:"start"}); return; }
  const d=t.closest("[data-delpk]");
  if(d){ const it=pkList().find(i=>i.id===d.dataset.delpk); if(!it) return;
    if(!await ensureEditor()) return;
    if(!confirm(`確定要從口袋名單刪除「${it.name}」嗎？`)) return;
    try{ await ds.deletePlace(it.uuid); if(PK.editing===it.id){PK.editing=null;PK.draftExtra=null;pkRenderForm();}
      toastAction(`已刪除「${it.name}」`,"復原",()=>ds.restorePlace(it.uuid).then(()=>toast("已復原")).catch(pkError)); }
    catch(err){ pkError(err); } }
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.id==="pkCat"){ const cur={}; document.querySelectorAll("#pkCatFields [data-info]").forEach(el=>cur[el.dataset.info]=el.value);
    $("#pkCatFields").innerHTML=pkCatFieldsHTML(t.value,cur); const s=document.querySelector("#pkFormCard .pk-sub"); if(s) s.textContent="📋 "+pkCatName(t.value)+"的資料"; }
});
