/* Visit Japan Web 填寫小抄（值已核對，不可更動）＋複製按鈕。 */
import { esc, toast } from "../util.js";

/* ---------- Visit Japan Web 填寫小抄 ---------- */
export function cp(val){ return `<button class="cp" data-copy="${esc(val)}" aria-label="複製">複製</button>`; }
export function vjwHTML(){
  const V=[["旅行名称","自行填寫，例如：北海道冬季旅行",null],
           ["抵达日本预定日期","2026/12/25","2026/12/26"],
           ["航空公司","CHINA AIRLINES (CAL)","STARLUX AIRLINES (SJX)"],
           ["航班号（仅限数字）","2130","318"],
           ["出发地","TAIPEI（桃園）","TAICHUNG（台中）"]];
  const C=[["住宿名稱","ADEX INN","adex inn"],
           ["邮政编码","0590551","059-0551（輸入時通常不加「-」）"],
           ["都道府县","HOKKAIDO","北海道（通常是下拉選單）"],
           ["市区町村","NOBORIBETSU-SHI","登別市"],
           ["町域・番地","NOBORIBETSUONSEN-CHO 76-2","登別温泉町76-2"],
           ["建筑物名","ADEX INN","—"],
           ["电话号码","0143842205","0143-84-2205"]];
  const val=x=>x.replace(/（.*）$/,"").replace(/\s+\(.*$/,m=>m);
  return `<div class="card lilac vjw" id="vjw"><div class="htop"><span class="tag lilac">📝 Visit Japan Web 填寫小抄</span><span class="nights">每位旅客都要登記</span></div>
    <p style="margin:8px 0 0">出發前在 Visit Japan Web 登記入境資料，完成後會拿到入境審查與海關申報用的 QR code，抵達時出示即可。</p>
    <h3 style="margin-top:14px">① 登记入境/返回日本的预定</h3>
    <ol class="plan"><li><b>VISA信息</b>：觀光免簽身份，「引用申请VISA时的信息」<b>不用勾選</b></li>
      <li>選擇<b>「不引用，前往登记」</b></li></ol>
    <h3 style="margin-top:14px">② 入境預定資料</h3>
    <p class="muted" style="margin:0 0 6px">旅行名称：自行填寫，例如「北海道冬季旅行」</p>
    <div class="grid2">${[["✈️ 中華組（4 位）","pink",1],["✈️ 星宇組（3 位）","ice",2]].map(([t,c,col])=>`<div class="card ${c}" style="padding:12px 14px"><b>${t}</b>
      <dl class="kv vjw-kv">${V.slice(1).map(r=>`<dt>${r[0]}</dt><dd>${esc(r[col])} ${cp(r[col].replace(/（.*）/,""))}</dd>`).join("")}</dl></div>`).join("")}</div>
    <h3 style="margin-top:14px">③ 在日本的联络处（填第一間住宿：登別 adex inn）</h3>
    <div class="card" style="padding:12px 14px"><dl class="kv vjw-kv">
      ${C.map(([k,a,b])=>`<dt>${k}</dt><dd>${esc(a)} ${cp(a)}${b!=="—"?`<div class="split">${esc(b)}</div>`:''}</dd>`).join("")}
    </dl></div>
    <div class="note" style="margin-top:12px"><b>小提醒</b><ul class="clean">
      <li>欄位名稱以你看到的 Visit Japan Web 畫面為準；輸入郵遞區號後，部分欄位可能會自動帶出。</li>
      <li>兩組航班不同，記得各自填自己那一組的日期和航班。</li>
      <li>完成後把 QR code 截圖存在手機裡，入境時沒有網路也能出示。</li></ul></div>
  </div>`;
}
document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-copy]"); if(!b) return;
  const t=b.dataset.copy; let ok=false;
  try{ await navigator.clipboard.writeText(t); ok=true; }catch(err){
    try{ const ta=document.createElement("textarea"); ta.value=t; document.body.appendChild(ta); ta.select(); ok=document.execCommand("copy"); ta.remove(); }catch(e2){} }
  toast(ok?`已複製：${t}`:"無法自動複製，請長按文字複製");
});
