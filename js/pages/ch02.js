/* 第 02 章 */
import { FLIGHTS, FGROUPS, BAGGAGE } from "../../data/static.js";
import { esc } from "../util.js";
import { flightCard, head, pager } from "../ui.js";

export default function ch02(){
  return `${head("02")}
  ${FGROUPS.map(g=>`<h3 style="margin:14px 0 8px">${g.title}・${g.people} 位</h3><div class="grid2">${g.idx.map(k=>flightCard(FLIGHTS[k],true,false)).join("")}</div>`).join("")}
  <div class="tbl stack" style="margin-top:14px"><table><thead><tr><th>${esc(BAGGAGE.label)}</th><th>規定</th></tr></thead><tbody>
    ${BAGGAGE.rows.map(([n,k])=>`<tr><td>${esc(n)}</td><td>${esc(FLIGHTS[0][k])}</td></tr>`).join("\n    ")}</tbody></table></div>
  <div class="note" style="margin-top:14px"><b>提醒</b>
    <ul class="clean"><li>${esc(BAGGAGE.tips[0])}</li>
    <li>出發前記得完成 Visit Japan Web 登記，填寫方式見 <button class="chip" data-go="09">🎒 09 Visit Japan Web 小抄</button></li>
    <li>${esc(BAGGAGE.tips[1])}</li></ul></div>${pager("02")}`;
}
