/* 進入點：路由、全域事件、日夜模式、飄雪、啟動。 */
import { S } from "./state.js";
import { CHAPTERS, CHECKLIST } from "../data/static.js";
import { $, store } from "./util.js";
import "./ui.js";
import { showPlace } from "./features/map.js";
import "./features/pocket.js";
import { todayIdx, inTrip } from "./features/today.js";
import { fxInit } from "./features/fx.js";
import "./features/vjw.js";
import "./features/driver.js";
import "./features/weather.js";
import { netBanner } from "./features/net.js";
import home from "./pages/home.js";
import ch01 from "./pages/ch01.js";
import ch02 from "./pages/ch02.js";
import ch03 from "./pages/ch03.js";
import ch04 from "./pages/ch04.js";
import ch05 from "./pages/ch05.js";
import ch06 from "./pages/ch06.js";
import ch07 from "./pages/ch07.js";
import ch08 from "./pages/ch08.js";
import ch09 from "./pages/ch09.js";

const PAGES = {home, "01":ch01, "02":ch02, "03":ch03, "04":ch04, "05":ch05, "06":ch06, "07":ch07, "08":ch08, "09":ch09};

S.route = route;
function route(){
  const h=(location.hash||"#/home").slice(2); const [page,q]=h.split("?");
  const id = PAGES[page]?page:"home";
  if(id==="05" && q){ const m=q.match(/d=(\d+)/); if(m){ S.curDay=Math.min(9,Math.max(0,+m[1])); S.dayPicked=true; } }
  if(id==="05" && !q && !S.dayPicked && inTrip(todayIdx())) S.curDay=todayIdx();
  $("#app").innerHTML = PAGES[id]();
  const ti=todayIdx();
  $("#nav").innerHTML = `<button class="chip" data-go="home" ${id==="home"?'aria-current="page"':''}>🏠 首頁</button>`+
    (inTrip(ti)?`<button class="chip today-chip" data-go="05?d=${ti}">📍 今天</button>`:'')+
    CHAPTERS.map(([n,e,t,s])=>`<button class="chip" data-go="${n}" ${id===n?'aria-current="page"':''}>${e} ${n} ${s}</button>`).join("");
  const cur=document.querySelector('#nav [aria-current]'); if(cur) cur.scrollIntoView({inline:"center",block:"nearest"});
  document.querySelectorAll(".tbl.stack table").forEach(t=>{const hs=[...t.querySelectorAll("thead th")].map(h=>h.textContent.trim());
    t.querySelectorAll("tbody tr").forEach(r=>[...r.children].forEach((c,i)=>{c.dataset.label=hs[i]||"";}));});
  if(id==="08") bindSplit();
  window.scrollTo({top:0});
}
function bindSplit(){
  const t=$("#sTotal"),p=$("#sPeople"),o=$("#sOut");
  const calc=()=>{const T=parseFloat(t.value),P=parseInt(p.value);
    store.set("hk-split",{total:t.value,people:p.value});
    o.textContent = (T>0&&P>0) ? `每人約 ${(Math.round(T/P*100)/100).toLocaleString()}` : "輸入金額和人數後會自動計算";};
  t.oninput=p.oninput=calc; calc();
}
document.addEventListener("click",e=>{
  if(e.target.id==="cReset"){store.set("hk-check",{});route();return;}
  const sc=e.target.closest("[data-scroll]");
  if(sc){const t=document.getElementById(sc.dataset.scroll); if(t) t.scrollIntoView({behavior:"smooth",block:"start"}); return;}
  const g=e.target.closest("[data-go]");
  if(g && !g.disabled){ const target="#/"+g.dataset.go; if(location.hash===target) route(); else location.hash=target; return; }
  const p=e.target.closest("[data-place]"); if(p) showPlace(p.dataset.place);
});
document.addEventListener("keydown",e=>{
  const p=e.target.closest&&e.target.closest("[data-place]");
  if(p&&(e.key==="Enter"||e.key===" ")){e.preventDefault();showPlace(p.dataset.place)}
});
document.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.ck!==undefined){
    const st=store.get("hk-check",{}); st[t.dataset.ck]=t.checked; store.set("hk-check",st);
    t.closest(".check").classList.toggle("done",t.checked);
    const d=CHECKLIST.filter((_,i)=>st[i]).length; $("#cDone").textContent=d; $("#cBar").style.width=d/CHECKLIST.length*100+"%";
  }
});
window.addEventListener("hashchange",route);

/* 日夜模式：18:00～隔天 06:00 自動夜間；手動切換只在目前這個白天／夜晚時段有效 */
function themePeriod(){ const n=new Date(), h=n.getHours(), d=new Date(n); if(h<6) d.setDate(d.getDate()-1); return d.toDateString()+((h>=6&&h<18)?"D":"N"); }
function applyTheme(){
  const h=new Date().getHours(); let t=(h>=18||h<6)?"dark":"light";
  const o=store.get("hk-theme",null); if(o && o.p===themePeriod()) t=o.t;
  document.documentElement.dataset.theme=t;
  const b=$("#themeT"); b.textContent = t==="dark"?"☀️":"🌙"; b.setAttribute("aria-label", t==="dark"?"切換成日間模式":"切換成夜間模式");
}
$("#themeT").onclick=()=>{ const t=document.documentElement.dataset.theme==="dark"?"light":"dark"; store.set("hk-theme",{t,p:themePeriod()}); applyTheme(); };
applyTheme(); setInterval(applyTheme, 5*60*1000);
(function(){const s=$("#snow");for(let i=0;i<18;i++){const f=document.createElement("i");f.textContent=i%5===0?"♡":"❄";
  f.style.left=Math.random()*100+"%";f.style.fontSize=(10+Math.random()*12)+"px";
  f.style.animationDuration=(9+Math.random()*10)+"s";f.style.animationDelay=(-Math.random()*15)+"s";s.appendChild(f);}})();
document.addEventListener("click",e=>{ if(e.target.classList&&e.target.classList.contains("line-qr")) e.target.classList.toggle("zoom"); });
if("serviceWorker" in navigator && location.protocol==="https:"){ window.addEventListener("load",()=>{ navigator.serviceWorker.register("sw.js").catch(()=>{}); }); }
netBanner();
fxInit();
route();
