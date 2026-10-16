/* 插畫地圖（座標是插畫像素，不是經緯度）。 */
import { MAP_IMG, HOTELS, DAYS, PLACES, TODAY_PLACE, ROUTE } from "../../data/static.js";
import { $, esc } from "../util.js";
import { todayIdx, inTrip } from "./today.js";

export function mapHTML(){
  const P = Object.fromEntries(PLACES.map(p=>[p.id,p]));
  const seg = ROUTE.map(([a,b,t],k)=>{
    const A=P[a],B=P[b], dx=B.x-A.x, dy=B.y-A.y, L=Math.hypot(dx,dy)||1;
    const mx=(A.x+B.x)/2+(-dy/L)*70, my=(A.y+B.y)/2+(dx/L)*70;
    const nx=(A.x+B.x)/2+(-dy/L)*36, ny=(A.y+B.y)/2+(dx/L)*36;
    return `<path class="rt ${t?'rt-tbd':''}" d="M${A.x} ${A.y} Q${mx} ${my} ${B.x} ${B.y}" marker-end="url(#arr2)"/>
      <circle cx="${nx}" cy="${ny}" r="25" fill="#fff" stroke="#9a7fd6" stroke-width="4"/>
      <text x="${nx}" y="${ny+10}" text-anchor="middle" class="rt-n">${k+1}</text>`;
  }).join("");
  const ti=todayIdx(), tp = inTrip(ti) ? TODAY_PLACE[ti] : null;
  const pts = PLACES.map(p=>{ const w=p.name.length*40+56;
    return `<g class="pt" data-place="${p.id}" tabindex="0" role="button" aria-label="${p.name}">
      <circle cx="${p.x}" cy="${p.y}" r="70" fill="transparent"/>
      ${p.id===tp?`<circle class="pulse" cx="${p.x}" cy="${p.y}" r="34" fill="none" stroke="#e88db4" stroke-width="8"/>`:''}
      <circle class="dot" cx="${p.x}" cy="${p.y}" r="20" fill="${p.color}" stroke="#fff" stroke-width="7"/>
      <line x1="${p.x}" y1="${p.y}" x2="${p.lx}" y2="${p.ly}" stroke="#fff" stroke-width="4" stroke-dasharray="6 6" opacity=".9"/>
      <rect class="pill" x="${p.lx-w/2}" y="${p.ly-34}" width="${w}" height="68" rx="34" fill="#fff" stroke="${p.color}" stroke-width="5"/>
      <text class="pill-t" x="${p.lx}" y="${p.ly+14}" text-anchor="middle">${p.name}</text>
      ${p.id===tp?`<g transform="translate(${p.lx-w/2-4} ${p.ly-92})"><rect width="150" height="50" rx="25" fill="#e88db4"/><text x="75" y="35" text-anchor="middle" class="tdy-t">📍 今天</text></g>`:''}
    </g>`;}).join("");
  return `<div class="mapbox">
    <div class="card map lilac" style="padding:10px">
      <div class="imap">
        <img src="${MAP_IMG}" alt="北海道冬季立體插畫地圖：札幌、手稻滑雪場、旭川、新千歲機場、登別" width="1448" height="1086">
        <svg viewBox="0 0 1448 1086" role="img" aria-label="可點選的行程地點與路線">
          <defs><marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10z" fill="#9a7fd6"/></marker></defs>
          ${seg}${pts}
        </svg>
      </div>
      <p class="muted" style="margin:8px 6px 0">🗺️ 插畫示意地圖，非實際比例。數字是移動順序，金色虛線是 01/01 往返手稻滑雪場（預定）。點地名看相關日期與住宿。</p>
    </div>
    <div class="card pink" id="placeInfo" aria-live="polite">
      <span class="tag">點地圖上的地名</span>
      <p>點選新千歲機場、登別、札幌、旭川或手稻滑雪場，這裡會顯示相關日期、住宿與行程。</p>
      <p class="muted">本網站不提供即時導航或車程。</p>
    </div></div>`;
}
export function showPlace(id){
  const p = PLACES.find(x=>x.id===id); if(!p) return;
  document.querySelectorAll(".pt").forEach(g=>g.classList.toggle("on",g.dataset.place===id));
  const box = $("#placeInfo"); if(!box) return;
  const days = p.days.map(i=>`<button class="chip" data-go="05?d=${i}">${DAYS[i].md} ${esc(DAYS[i].title||"")}</button>`).join(" ");
  box.innerHTML = `<span class="tag ${p.tbd?'':'ice'}">${esc(p.name)}</span>
    <p>${esc(p.info)}</p>
    <h3>相關日期</h3><div class="row">${days||'<span class="tbd">待確認</span>'}</div>
    <h3 style="margin-top:12px">相關住宿</h3>
    <p>${p.hotels.length?p.hotels.map(i=>`住宿 ${i+1}｜${esc(HOTELS[i].name)}`).join("<br>"):'—'}</p>
    ${p.link?`<button class="btn" data-go="${p.link}">查看章節 ${p.link}</button>`:''}`;
}
