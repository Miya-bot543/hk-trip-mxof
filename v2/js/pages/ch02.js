/* 第 02 章 */
import { FLIGHTS, FGROUPS } from "../../data/static.js";
import { flightCard, head, pager } from "../ui.js";

export default function ch02(){
  return `${head("02")}
  ${FGROUPS.map(g=>`<h3 style="margin:14px 0 8px">${g.title}・${g.people} 位</h3><div class="grid2">${g.idx.map(k=>flightCard(FLIGHTS[k],true)).join("")}</div>`).join("")}
  <div class="tbl stack" style="margin-top:14px"><table><thead><tr><th>行李（中華、星宇相同）</th><th>規定</th></tr></thead><tbody>
    <tr><td>託運行李</td><td>每位旅客 1 件，每件 23 公斤</td></tr>
    <tr><td>手提行李</td><td>每位旅客 1 件，不可超過 7 公斤</td></tr></tbody></table></div>
  <div class="note" style="margin-top:14px"><b>提醒</b>
    <ul class="clean"><li>行動電源、備用鋰電池只能隨身帶上機，不能託運。</li>
    <li>出發前記得完成 Visit Japan Web 登記，填寫方式見 <button class="chip" data-go="09">🎒 09 Visit Japan Web 小抄</button></li>
    <li>回程買伴手禮，託運每件 23 公斤、手提 7 公斤以內。</li></ul></div>${pager("02")}`;
}
