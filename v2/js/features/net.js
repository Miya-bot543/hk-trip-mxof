/* 📶 離線提示。 */
import { $ } from "../util.js";
import { wxFetch } from "./weather.js";

/* ---------- 📶 離線提示 ---------- */
export function netBanner(){
  let b=$("#netBar"); if(!b){ b=document.createElement("div"); b.id="netBar"; document.body.appendChild(b); }
  b.textContent="📴 目前離線：顯示的是上次存在手機裡的內容"; b.hidden=navigator.onLine;
}
window.addEventListener("online",()=>{ netBanner(); wxFetch(true); });
window.addEventListener("offline",netBanner);
