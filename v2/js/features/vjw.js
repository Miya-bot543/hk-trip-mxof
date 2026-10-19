/* Visit Japan Web 填寫小抄＋複製按鈕。內容在 static.js 的 VJW（值已核對，不可更動） */
import { esc, toast } from "../util.js";
import { VJW } from "../../data/static.js";

/* ---------- Visit Japan Web 填寫小抄 ---------- */
export function cp(val){ return `<button class="cp" data-copy="${esc(val)}" aria-label="複製">複製</button>`; }
export function vjwHTML(){
  const V=VJW.fields, C=VJW.contact;
  const val=x=>x.replace(/（.*）$/,"").replace(/\s+\(.*$/,m=>m);
  return `<div class="card lilac vjw" id="vjw"><div class="htop"><span class="tag lilac">${esc(VJW.title)}</span><span class="nights">${esc(VJW.badge)}</span></div>
    <p style="margin:8px 0 0">${esc(VJW.intro)}</p>
    <h3 style="margin-top:14px">${esc(VJW.step1)}</h3>
    <ol class="plan">${VJW.step1Items.map(x=>`<li>${x}</li>`).join("\n      ")}</ol>
    <h3 style="margin-top:14px">${esc(VJW.step2)}</h3>
    <p class="muted" style="margin:0 0 6px">${esc(VJW.step2Note)}</p>
    <div class="grid2">${VJW.groups.map(([t,c,col])=>`<div class="card ${c}" style="padding:12px 14px"><b>${t}</b>
      <dl class="kv vjw-kv vjw-f">${V.slice(1).map(r=>`<dt>${r[0]}</dt><dd>${esc(r[col])} ${cp(r[col].replace(/（.*）/,""))}</dd>`).join("")}</dl></div>`).join("")}</div>
    <h3 style="margin-top:14px">${esc(VJW.step3)}</h3>
    <div class="card" style="padding:12px 14px"><dl class="kv vjw-kv vjw-c">
      ${C.map(([k,a,b])=>`<dt>${k}</dt><dd>${esc(a)} ${cp(a)}${b!=="—"?`<div class="split">${esc(b)}</div>`:''}</dd>`).join("")}
    </dl></div>
    <div class="note" style="margin-top:12px"><b>${esc(VJW.tipsTitle)}</b><ul class="clean">
      ${VJW.tips.map(x=>`<li>${esc(x)}</li>`).join("\n      ")}</ul></div>
  </div>`;
}
document.addEventListener("click",async e=>{
  const b=e.target.closest("[data-copy]"); if(!b) return;
  const t=b.dataset.copy; let ok=false;
  try{ await navigator.clipboard.writeText(t); ok=true; }catch(err){
    try{ const ta=document.createElement("textarea"); ta.value=t; document.body.appendChild(ta); ta.select(); ok=document.execCommand("copy"); ta.remove(); }catch(e2){} }
  toast(ok?`已複製：${t}`:"無法自動複製，請長按文字複製");
});
