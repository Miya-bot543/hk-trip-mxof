/* 第 01 章 */
import { TRIP, HOTELS, DAYS } from "../../data/static.js";
import { esc, v } from "../util.js";
import { isMove, head, pager } from "../ui.js";
import { mapHTML } from "../features/map.js";

// 換宿標籤和標題最後一段綁在一起，不會單獨掉到下一行
function titleHTML(d){
  if (!isMove(d)) return esc(d.title);
  const k = d.title.lastIndexOf("・"), head = d.title.slice(0, k+1), tail = d.title.slice(k+1);
  return `${esc(head)}<span class="nw">${esc(tail)} <span class="flag">換宿</span></span>`;
}

export default function ch01(){
  return `${head("01")}
  <div class="grid"><div class="card pink"><span class="tag">旅遊日期</span><div class="big"><span class="nw">2026/12/25（五）</span>→ <span class="nw">2027/01/03（日）</span></div><p class="muted">10 天 9 夜</p></div>
  <div class="card ice"><span class="tag ice">住宿</span><div class="big">4 間・9 晚</div><p class="muted">登別 3 晚、札幌 6 晚；換宿日 12/28、12/31、01/02</p></div>
  <div class="card lilac"><span class="tag lilac">旅伴人數</span><div class="pax">${TRIP.travelers.split("｜").map(x=>`<div>${esc(x)}</div>`).join("")}</div></div></div>
  <h3 style="margin-top:20px">行程地圖</h3>${mapHTML()}
  <h3 style="margin-top:20px">10 日總表</h3>
  <div class="tbl stack"><table><thead><tr><th>日期</th><th>行程</th><th>地點</th><th>當晚住宿</th></tr></thead><tbody>
  ${DAYS.map((d,i)=>`<tr><td><button class="chip" data-go="05?d=${i}">${d.md}（${d.wd}）</button></td>
    <td><div class="ttl">${titleHTML(d)}</div></td><td><div>${v(d.area,'滑雪場待確認')}${(d.split||[]).map(x=>`<div class="split">${esc(x)}</div>`).join("")}</div></td>
    <td><div>${d.stay===null?'— 全員返台':`住宿 ${d.stay+1}｜${esc(HOTELS[d.stay].name)}${i===8?'<div class="split">（中華 4 位）</div>':''}`}</div></td></tr>`).join("")}
  </tbody></table></div>${pager("01")}`;
}
