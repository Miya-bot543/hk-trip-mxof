/* 第 08 章 */
import { HOTELS, RENTAL, BUDGET } from "../../data/static.js";
import { esc, v, store } from "../util.js";
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
  const groups=[
    {title:"中華航空組", people:4, color:"pink", items:[["機票 CI2130／CI2131",b.flights[0].per],["住宿 1 adex inn（3 晚）",H[0].perNum],["住宿 2 APA（3 晚）",H[1].perNum],["住宿 3 札幌民宿（2 晚）",H[2].perNum],["住宿 4 Vessel（1 晚）",H[3].perNum],["旭川一日遊",b.asahi.per]], car:["租車 第 1 台",b.cars[0].per]},
    {title:"星宇航空組", people:3, color:"ice", items:[["機票 JX318／JX319",b.flights[1].per],["住宿 1 adex inn・第 2 筆（2 晚）",4688.67],["住宿 2 APA（3 晚）",H[1].perNum],["住宿 3 札幌民宿（2 晚）",H[2].perNum],["旭川一日遊",b.asahi.per]], car:["租車 第 2 台",b.cars[1].per]}
  ];
  return `${head("08")}
  ${membersSectionHTML()}
  <div style="margin-top:14px">${expenseSectionHTML()}</div>
  <h3 style="margin-top:20px">💴 已知費用</h3>
  <div class="tbl stack"><table><thead><tr><th>項目</th><th>人數</th><th>整筆費用</th><th>每位費用</th></tr></thead><tbody>
  ${row("✈️ 機票・中華航空（CI2130／CI2131）","4 人",T(b.flights[0].total),T(b.flights[0].per))}
  ${row("✈️ 機票・星宇航空（JX318／JX319）","3 人",T(b.flights[1].total),T(b.flights[1].per))}
  ${H.map(h=>row(`🏨 住宿 ${h.n}｜${esc(h.name)}（${h.inDate.slice(5,10)}～${h.outDate.slice(5,10)}，${h.nights} 晚）`,h.people+" 人",h.total,h.per)+
    (h.extra?row(`🏨 住宿 ${h.n}・第 2 筆｜${esc(h.name)}（${h.extra.inDate.slice(5,10)}～${h.extra.outDate.slice(5,10)}，${h.extra.nights} 晚）`,h.extra.people+" 人",h.extra.total,h.extra.per):'')).join("")}
  ${row("🎫 旭川一日遊套裝（12/29）","7 人",T(b.asahi.per*b.asahi.people)+'<br><span class="muted">1,710 × 7 計算</span>',T(b.asahi.per))}
  ${R.map((o,k)=>row(`🚗 租車 第 ${k+1} 台（${o.from.slice(5,10)}～${o.to.slice(5,10)}）`,b.cars[k].people+" 人",Y(b.cars[k].total)+"（含稅）",Y(b.cars[k].per)+'<br><span class="muted">整筆 ÷ '+b.cars[k].people+' 計算</span>')).join("")}
  ${row("🎿 滑雪（01/01）",v(null),v(null),v(null))}
  <tr><th>台幣（TWD）合計</th><th></th><th>${T(twdTotal)}</th><th>—</th></tr>
  <tr><th>日圓（¥）合計</th><th></th><th>${Y(jpyTotal)}</th><th>—</th></tr>
  </tbody></table></div>
  <p class="muted">機票、住宿、旭川一日遊是台幣；租車是日圓，兩種幣別分開加總，不換算。</p>

  <h3 style="margin-top:20px">👥 每人已知費用試算</h3>
  <div class="grid2">${groups.map(g=>{const twd=g.items.reduce((a,i)=>a+i[1],0);
    return `<div class="card ${g.color}"><div class="htop"><span class="tag ${g.color==='pink'?'':'ice'}">${g.title}</span><span class="nights">👥 ${g.people} 位</span></div>
    <dl class="kv" style="margin-top:10px">${g.items.map(([k,x])=>`<dt>${k}</dt><dd>${T(x)}</dd>`).join("")}<dt>${g.car[0]}</dt><dd>${Y(g.car[1])}</dd></dl>
    <div class="stats" style="grid-template-columns:1fr 1fr;margin-top:12px"><div><small>每人台幣小計</small><b style="color:var(--pink-d)">${T(twd)}</b></div>
      <div><small>每人日圓小計</small><b style="color:var(--pink-d)">${Y(g.car[1])}</b></div></div></div>`;}).join("")}</div>
  <p class="muted">試算只包含目前已知的費用（不含滑雪、餐飲、交通、購物）。各筆每位費用有小數，所以「每人小計 × 人數」與整筆合計可能差幾分錢。</p>

  <div class="card lilac" style="margin-top:14px"><span class="tag lilac">簡易分帳計算</span>
    <div class="grid" style="margin-top:10px">
      <label>整筆金額<input type="number" id="sTotal" min="0" inputmode="decimal" value="${esc(s.total)}"></label>
      <label>分攤人數<input type="number" id="sPeople" min="1" inputmode="numeric" value="${esc(s.people)}"></label></div>
    <p class="big" id="sOut" style="margin:12px 0 0"></p>
    <p class="muted">試算工具，數字只存在你這台裝置。</p>
    <div class="row" style="margin-top:6px"><button class="btn ghost" data-fx>💱 打開日圓／台幣換算</button></div></div>
  <div class="card pink" style="margin-top:14px"><div class="htop"><span class="tag">🧾 旅行分帳小幫手</span><span class="nights">外部工具</span></div>
    <p style="margin:8px 0 0">旅行中誰先付錢、誰該還誰，用這個工具記帳和結算：</p>
    <ul class="clean"><li>可記錄消費名稱、類別、日期、金額、誰先墊付和參與分帳的人，可以一鍵均分</li>
    <li>兩種模式：「單機使用」資料只存在自己手機；「雲端共用」可以建立旅程代碼，分享給旅伴一起記帳</li>
    <li>結算時會算出每個人應付／應收和建議轉帳方式，還能複製報告貼到 LINE 群組</li>
    <li>可以「加入主畫面」，像 App 一樣快速開啟</li></ul>
    <div class="row" style="margin-top:10px"><a class="btn" href="https://keen-kulfi-7d676b.netlify.app/" target="_blank" rel="noopener">開啟旅行分帳小幫手 ↗</a></div></div>${pager("08")}`;
}
