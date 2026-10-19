/* 第 08 章 */
import { HOTELS, RENTAL, BUDGET, BUDGET_INFO } from "../../data/static.js";
import { esc, store } from "../util.js";
import { head, pager } from "../ui.js";
import { membersSectionHTML } from "../features/members.js";
import { expenseSectionHTML } from "../features/expense.js";

export default function ch08(){
  const s=store.get("hk-split",{total:"",people:""});
  const T=n=>"TWD "+(Math.ceil(Math.round(n*1e4)/100)/100).toLocaleString("en-US",{maximumFractionDigits:2});
  const Y=n=>"¥"+n.toLocaleString("en-US");
  const b=BUDGET, H=HOTELS, R=RENTAL.orders;
  const twdTotal=b.flights.reduce((a,f)=>a+f.total,0)+H.reduce((a,h)=>a+h.totalNum+(h.extra?h.extra.totalNum:0),0)+b.asahi.per*b.asahi.people;
  const jpyTotal=b.cars.reduce((a,c)=>a+c.total,0);
  const row=(item,ppl,tot,per,cls)=>`<tr${cls?` class="${cls}"`:''}><td>${item}</td><td>${ppl}</td><td>${tot}</td><td>${per}</td></tr>`;
  const I=BUDGET_INFO;
  /* 試算項目的金額從機票、住宿、旭川的資料取，不另外寫數字 */
  const amt=(src,k)=>src==="flight"?b.flights[k].per:src==="hotel"?H[k].perNum:src==="hotelExtra"?H[k].extra.perNum:b.asahi.per;
  const groups=I.groups.map(g=>({...g, items:g.items.map(([t,src,k])=>[t,amt(src,k)]), car:[g.car[0],b.cars[g.car[1]].per]}));
  return `${head("08")}
  ${membersSectionHTML()}
  <div style="margin-top:14px">${expenseSectionHTML()}</div>
  <h3 style="margin-top:20px">💴 已知費用</h3>
  <div class="tbl stack d8t"><table><thead><tr><th>項目</th><th>人數</th><th>整筆費用</th><th>每位費用</th></tr></thead><tbody>
  ${b.flights.map((f,k)=>row(I.flightLabels[k],f.people+" 人",T(f.total),T(f.per))).join("\n  ")}
  ${H.map(h=>row(`🏨 住宿 ${h.n}｜${esc(h.name)}（${h.inDate.slice(5,10)}～${h.outDate.slice(5,10)}，${h.nights} 晚）`,h.people+" 人",h.total,h.per)+
    (h.extra?row(`🏨 住宿 ${h.n}・第 2 筆｜${esc(h.name)}（${h.extra.inDate.slice(5,10)}～${h.extra.outDate.slice(5,10)}，${h.extra.nights} 晚）`,h.extra.people+" 人",h.extra.total,h.extra.per):'')).join("")}
  ${row(I.asahiLabel,b.asahi.people+" 人",T(b.asahi.per*b.asahi.people)+`<br><span class="muted">${I.asahiCalc}</span>`,T(b.asahi.per))}
  ${R.map((o,k)=>row(`🚗 租車 第 ${k+1} 台（${o.from.slice(5,10)}～${o.to.slice(5,10)}）`,b.cars[k].people+" 人",Y(b.cars[k].total)+"（含稅）",Y(b.cars[k].per)+'<br><span class="muted">整筆 ÷ '+b.cars[k].people+' 計算</span>')).join("")}
  <tr><th>台幣（TWD）合計</th><th></th><th>${T(twdTotal)}</th><th class="d8-dash">—</th></tr>
  <tr><th>日圓（¥）合計</th><th></th><th>${Y(jpyTotal)}</th><th class="d8-dash">—</th></tr>
  </tbody></table></div>
  <p class="muted">${esc(I.currencyNote)}</p>

  <h3 style="margin-top:20px">👥 每人已知費用試算</h3>
  <div class="grid2 d8g">${groups.map(g=>{const twd=g.items.reduce((a,i)=>a+i[1],0);
    return `<div class="card ${g.color}"><div class="htop"><span class="tag ${g.color==='pink'?'':'ice'}">${g.title}</span><span class="nights">👥 ${g.people} 位</span></div>
    <dl class="kv" style="margin-top:10px">${g.items.map(([k,x])=>`<dt>${k}</dt><dd>${T(x)}</dd>`).join("")}<dt>${g.car[0]}</dt><dd>${Y(g.car[1])}</dd></dl>
    <div class="stats d8-sum" style="grid-template-columns:1fr 1fr"><div><small>每人台幣小計</small><b style="color:var(--pink-d)">${T(twd)}</b></div>
      <div><small>每人日圓小計</small><b style="color:var(--pink-d)">${Y(g.car[1])}</b></div></div></div>`;}).join("")}</div>
  <p class="muted">${esc(I.groupNote)}</p>

  <div class="card lilac" style="margin-top:14px"><span class="tag lilac">簡易分帳計算</span>
    <div class="grid d8s" style="margin-top:10px">
      <label>整筆金額<input type="number" id="sTotal" min="0" inputmode="decimal" value="${esc(s.total)}"></label>
      <label>分攤人數<input type="number" id="sPeople" min="1" inputmode="numeric" value="${esc(s.people)}"></label></div>
    <p id="sOut" style="margin:12px 0 0"></p>
    <p class="muted">${esc(I.splitNote)}</p>
    <div class="row" style="margin-top:6px"><button class="btn ghost" data-fx>💱 打開日圓／台幣換算</button></div></div>
  <div class="card pink" style="margin-top:14px"><div class="htop"><span class="tag">${esc(I.tool.title)}</span><span class="nights">${esc(I.tool.badge)}</span></div>
    <p style="margin:8px 0 0">${esc(I.tool.intro)}</p>
    <ul class="clean">${I.tool.points.map(x=>`<li>${esc(x)}</li>`).join("\n    ")}</ul>
    <div class="row" style="margin-top:10px"><a class="btn" href="${I.tool.url}" target="_blank" rel="noopener">${esc(I.tool.button)}</a></div></div>${pager("08")}`;
}
