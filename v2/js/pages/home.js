/* 首頁 */
import { IMG_H, IMG_V, CH_ICON, FLIGHTS, FGROUPS, HOTELS, CHAPTERS } from "../../data/static.js";
import { dayStrip, flightCard, hotelMini } from "../ui.js";
import { mapHTML } from "../features/map.js";
import { todayCardHTML } from "../features/today.js";
import { weatherCardHTML } from "../features/weather.js";

export default function home(){
  return `<figure class="cover">
    <picture><source media="(min-width:700px)" srcset="${IMG_H}">
    <img src="${IMG_V}" alt="北海道 10 日遊 Hokkaido Winter Trip 2026–2027，2026/12/25 → 2027/01/03，10 天 9 夜・4 間住宿"></picture></figure>
  ${todayCardHTML()}
  ${weatherCardHTML()}

  <div class="card lilac summary">
    <span class="tag">旅行摘要</span>
    <dl class="kv">
      <dt>旅行日期</dt><dd>2026/12/25～2027/01/03</dd>
      <dt>旅遊天數</dt><dd>10 天 9 夜</dd>
      <dt>住宿安排</dt><dd>4 間住宿</dd>
      <dt>主要路線</dt><dd><div class="route"><b>新千歲機場</b><i>→</i><b>登別</b><i>→</i><b>札幌</b><i>→</i><b>旭川一日遊</b><i>→</i><b>札幌</b><i>→</i><b>手稻滑雪</b><i>→</i><b>台灣</b></div></dd>
      <dt>分批返台</dt><dd><div class="route"><b>01/02 星宇 3 位</b><i>→</i><b>台中</b></div><div class="route" style="margin-top:4px"><b>01/03 中華 4 位</b><i>→</i><b>桃園</b></div></dd>
    </dl>
    <div class="icons" aria-label="主題快速入口">
      <button data-go="02">✈️ 航班</button><button data-go="03">🏨 住宿</button><button data-go="04">🚗 租車</button>
      <button data-go="03">♨️ 溫泉</button><button data-go="07">🛍️ 購物</button><button data-go="07">⛩️ 神社</button><button data-go="06">🎿 滑雪</button><button data-go="08">🧾 分帳</button>
    </div>
  </div>

  <h2 class="sec"><span class="no">✎</span>CONTENTS</h2>
  <div class="toc">${CHAPTERS.map(([n,e,t])=>`<button data-go="${n}"><img class="toc-ic" src="${CH_ICON[+n-1]}" alt=""><span class="n">${n}</span><span class="t">${t}</span></button>`).join("")}</div>

  <h2 class="sec"><span class="no">♡</span>10 日行程</h2>${dayStrip(-1,true)}
  <h2 class="sec"><span class="no">❄</span>行程示意地圖</h2>${mapHTML()}
  <h2 class="sec"><span class="no">✈</span>去回程航班</h2>${FGROUPS.map(g=>`<h3 style="margin:14px 0 8px">${g.title}・${g.people} 位</h3><div class="grid2">${g.idx.map(k=>flightCard(FLIGHTS[k],false)).join("")}</div>`).join("")}
  <h2 class="sec"><span class="no">⌂</span>四間住宿</h2><div class="grid">${HOTELS.map(hotelMini).join("")}</div>
  <p class="muted">「整筆費用」是該間住宿的總金額；「每位費用」是每人負擔，兩者分開列示。</p>`;
}
