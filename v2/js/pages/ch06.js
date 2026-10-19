/* 第 06 章 */
import { ACT_IMG, ACTIVITIES, SKI_INFO } from "../../data/static.js";
import { esc, v } from "../util.js";
import { mapsBtn, head, pager } from "../ui.js";

/* 一個活動卡：內容都在 static.js 的 ACTIVITIES */
function actCard(a,i){
  const dd=r=>(r.dd===null?v(null,r.tbd):r.dd)+(r.split?`<div class="split">${esc(r.split)}</div>`:"");
  const btns=(a.maps?mapsBtn(a.maps.q,a.maps.label):"")+(a.links||[]).map(l=>`<a class="btn ghost" href="${l.url}" target="_blank" rel="noopener">${esc(l.name)}</a>`).join("")
    +`<button class="btn ghost" data-go="${a.go.to}">${esc(a.go.label)}</button>`;
  return `<div class="card ${a.cls}"><div class="h-head" style="margin-top:0"><img class="hotel-pic big" src="${ACT_IMG[i]}" alt="${esc(a.alt)}"><span class="tag${a.cls==="pink"?"":" "+a.cls}">${esc(a.tag)}</span></div>
    <dl class="kv">${a.rows.map(line=>line.map(r=>`<dt>${esc(r.dt)}</dt><dd>${dd(r)}</dd>`).join("")).join("\n    ")}</dl>
    <div class="hbtns${a.maps?" b3":""}">${btns}</div></div>`;
}

export default function ch06(){
  return `${head("06")}
  <div class="grid2 d6">
   ${ACTIVITIES.map(actCard).join("\n   ")}</div>
  <div class="perk d6-perk"><b>${esc(SKI_INFO.title)}</b><ul>${SKI_INFO.facts.map(x=>`<li>${esc(x)}</li>`).join("\n      ")}</ul></div>
  <div class="note" style="margin-top:14px">${esc(SKI_INFO.note)}</div>${pager("06")}`;
}
