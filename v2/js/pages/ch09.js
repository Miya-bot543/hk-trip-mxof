/* 第 09 章 */
import { CHECKLIST, CHECKLIST_NOTE, INSTALL_INFO } from "../../data/static.js";
import { esc, store } from "../util.js";
import { head, pager } from "../ui.js";
import { vjwHTML } from "../features/vjw.js";
import { backupHTML } from "../features/backup.js";

export default function ch09(){
  const st=store.get("hk-check",{}); const done=CHECKLIST.filter((_,i)=>st[i]).length;
  const groups=[...new Set(CHECKLIST.map(c=>c[0]))]; const op=store.get("hk-ckfold",[]);
  return `${head("09")}
  ${vjwHTML()}
  <div class="card ice" style="margin-top:14px"><span class="tag ice">${esc(INSTALL_INFO.title)}</span>
    <p style="margin:8px 0 0">${esc(INSTALL_INFO.intro)}</p>
    <ul class="clean">${INSTALL_INFO.steps.map(x=>`<li>${x}</li>`).join("\n      ")}</ul></div>
  <div class="card pink ck-prog" style="margin-top:14px"><b class="nw">完成 <span id="cDone">${done}</span> / ${CHECKLIST.length}</b>
    <div class="bar"><i id="cBar" style="width:${done/CHECKLIST.length*100}%"></i></div>
    <button class="btn ghost" id="cReset">全部重設</button></div>
  <div class="ck-ctl"><button type="button" class="pk-allfb" data-ckall aria-expanded="${groups.every((_,gi)=>op.includes(gi))}" aria-label="全部展開或收合"><span class="ex-fb" aria-hidden="true"><span class="fold-ar">▾</span></span></button></div>
  <div class="grid ck-grid">${groups.map((g,gi)=>{const items=CHECKLIST.map((c,i)=>[c,i]).filter(([c])=>c[0]===g); const isOp=op.includes(gi);
    return `<div class="card ck-card${isOp?'':' ck-shut'}"><button type="button" class="ck-top" data-ckfold="${gi}" aria-expanded="${isOp}"><span class="tag ice">${g}</span><span class="ck-n" data-ckg="${gi}">${items.filter(([,i])=>st[i]).length} / ${items.length}</span><span class="ex-fb" aria-hidden="true"><span class="fold-ar">▾</span></span></button>
    ${items.map(([c,i])=>`<label class="check ${st[i]?'done':''}"><input type="checkbox" data-ck="${i}" ${st[i]?'checked':''}><span>${c[1]}</span></label>`).join("")}</div>`;}).join("")}</div>
  <p class="muted">${esc(CHECKLIST_NOTE)}</p>
  ${backupHTML()}${pager("09")}`;
}

/* 手機版（≤600px）清單每組可收合，展開狀態記在 hk-ckfold；電腦版一律展開 */
function ckSync(){
  const op=[...document.querySelectorAll("[data-ckfold]")].filter(b=>b.getAttribute("aria-expanded")==="true").map(b=>+b.dataset.ckfold);
  store.set("hk-ckfold",op);
  const all=document.querySelector("[data-ckall]"); if(all) all.setAttribute("aria-expanded", op.length===document.querySelectorAll("[data-ckfold]").length);
}
function ckSet(b,o){ b.setAttribute("aria-expanded",o); b.closest(".ck-card").classList.toggle("ck-shut",!o); }
document.addEventListener("click",e=>{
  const f=e.target.closest("[data-ckfold]");
  if(f){ ckSet(f, f.getAttribute("aria-expanded")!=="true"); ckSync(); return; }
  const a=e.target.closest("[data-ckall]");
  if(a){ const o=a.getAttribute("aria-expanded")!=="true"; document.querySelectorAll("[data-ckfold]").forEach(b=>ckSet(b,o)); ckSync(); }
});
