/* 第 04 章 */
import { LINE_QR, HOTELS, RENTAL, RENTAL_INFO, TRANSIT, TRANSIT_INFO, TRIP_ROUTES, transitLink, DAYS } from "../../data/static.js";
import { esc, v } from "../util.js";
import { isMove, mapsBtn, fold, head, pager } from "../ui.js";
import { driverListHTML } from "../features/driver.js";

export default function ch04(){
  const R=RENTAL, I=RENTAL_INFO, T=TRANSIT_INFO, o=R.office, moves = DAYS.filter(isMove);
  /* 飯店名稱結尾綁在一起，規則同 03 */
  const nw=s=>`<span class="nw">${esc(s)}</span>`;
  const drop=I.dropoff.map(x=>x.replace("{mapcode}",o.mapcode).replace("{hours}",o.hours));
  const hname=s=>{const j=s.indexOf("（"), i=j>0?j:s.lastIndexOf(" ")+1; return i>0?esc(s.slice(0,i))+nw(s.slice(i)):esc(s);};
  const order=(x,k)=>`<div class="tix ${k?'b2':''}"><div class="lb">${k?'🚙':'🚗'} 第 ${k+1} 台</div>
    <dl class="kv"><dt>車型</dt><dd>${esc(x.car)}</dd>    <dt>備註航班</dt><dd>${x.flight}</dd><dt>加購</dt><dd>${esc(x.hep)}</dd></dl>
    <div class="hdates"><div><small>取車</small><b>${x.from.slice(5)}</b><span>${o.name}</span></div><span class="ar">→</span>
      <div><small>還車</small><b>${x.to.slice(5)}</b><span>${o.name}</span></div></div>
    <div class="stats rent-st"><div><small>租金</small><b>${x.fee}</b><em class="sub">${esc(I.feeNote)}</em></div>
      <div><small>合計金額（含稅）</small><b style="color:var(--pink-d)">${x.total}</b></div></div></div>`;
  return `${head("04")}
  <article class="card pink hwide rent">
    <div><div class="htop"><span class="tag">🚗 租車公司</span><span class="nights">${esc(I.span)}</span></div>
      <h3 style="margin-top:8px;font-size:20px">${esc(R.company)}</h3>
      <dl class="kv"><dt>負責人</dt><dd>${R.staff}</dd><dt>電話</dt><dd><a href="${I.telHref}">${R.tel}</a></dd><dt>傳真</dt><dd>${R.fax}</dd></dl>
      <div class="perk line-box"><img class="line-qr" src="${LINE_QR}" alt="${esc(I.line.qrAlt)}" title="點一下放大" width="400" height="400" loading="lazy">
        <div><b>💬 中文 LINE 客服</b><br>${esc(I.line.desc)}
        <div style="margin-top:8px"><a class="btn" href="${I.line.url}" target="_blank" rel="noopener">💬 直接加入 LINE 好友</a></div></div></div></div>
    <div class="hw-books">${R.orders.map(order).join("")}</div>
  </article>

  <div class="card ice" style="margin-top:14px"><span class="tag ice">📍 ${o.name}</span>
    <dl class="kv"><dt>地址</dt><dd>${o.address}</dd><dt>營業時間</dt><dd>${o.hours}</dd>
    <dt>聯絡電話</dt><dd><a href="${I.telHref}">${o.tel}</a></dd><dt>緊急聯絡</dt><dd>${o.emergency}</dd>
    <dt>Map Code</dt><dd style="font-size:20px;color:var(--pink-d)">${o.mapcode}</dd></dl>
    <div class="caution">⏰ ${esc(I.officeCaution)}</div>
    <div style="margin-top:10px">${mapsBtn(o.address)}</div></div>

  <div class="row" style="margin-top:16px"><button class="btn ghost" data-foldall="open">全部展開</button><button class="btn ghost" data-foldall="close">全部收合</button></div>
  ${fold("f-doc","🪪 準備證件・保險・NOC",`<div class="card lilac"><h3 style="margin-top:0">🪪 準備證件</h3>
    <ul class="clean">${I.docs.map(x=>`<li>${x}</li>`).join("")}</ul>
    <h3 style="margin-top:12px">🛡️ 保險（兩張訂單相同）</h3>
    <ul class="clean">${I.insurance.slice(0,3).map(x=>`<li>${x}</li>`).join("")}
    ${I.insurance.slice(3).map(x=>`<li>${x}</li>`).join("")}</ul>
    <h3 style="margin-top:12px">⚠️ NOC（營業損失補償）</h3>
    <ul class="clean">${I.noc.map(x=>`<li>${x}</li>`).join("")}</ul>
    <p class="muted" style="margin:6px 0 0">${esc(I.nocNote)}</p></div>`)}

  ${fold("f-car","🚗 取車 → 加油 → 還車 步驟",`<div class="grid">
   <div class="card pink"><span class="tag">① 取車</span>
    <ol class="plan">${I.pickup.slice(0,1).map(x=>`<li>${x}</li>`).join("")}
    ${I.pickup.slice(1).map(x=>`<li>${x}</li>`).join("")}</ol></div>
   <div class="card ice"><span class="tag ice">② 加油</span>
    <ul class="clean">${I.fuel.slice(0,2).map(x=>`<li>${x}</li>`).join("")}
    ${I.fuel.slice(2).map(x=>`<li>${x}</li>`).join("")}</ul>
    <dl class="kv" style="margin-top:8px">${I.gas.map(g=>`<dt>${esc(g.name)}</dt><dd>${esc(g.hours)}・<a class="nw" href="${g.telHref}">${esc(g.tel)}</a>・<span class="nw">${esc(g.dist)}</span></dd>`).join("\n    ")}</dl></div>
   <div class="card lilac"><span class="tag lilac">③ 還車</span>
    <ol class="plan">${drop.slice(0,2).map(x=>`<li>${x}</li>`).join("")}
    ${drop.slice(2).map(x=>`<li>${x}</li>`).join("")}</ol></div>
  </div>`)}

  ${fold("f-tr","🚇 札幌大眾交通指南（還車後使用）",`<p class="muted" style="margin-top:0">${esc(T.intro)}</p>
  <div class="grid tr3">${TRANSIT.map(t=>`<div class="card"><div class="htop"><b style="font-size:17px">${t.ico} ${esc(t.name)}</b></div>
    <dl class="kv"><dt>適合</dt><dd>${esc(t.use)}</dd><dt>時間</dt><dd>${esc(t.time)}</dd><dt>票價</dt><dd>${esc(t.fare)}</dd><dt>營運</dt><dd>${esc(t.hours)}</dd></dl>
    <p class="muted" style="margin:8px 0 0">${esc(t.note)}</p></div>`).join("")}</div>
  <div class="note" style="margin-top:12px">💳 <b>交通 IC 卡</b>：${esc(T.ic)}</div>
  <h3 style="margin-top:20px">🧭 依日期的移動建議</h3>
  <div class="grid2 rt">${TRIP_ROUTES.map(r=>`<div class="card ice"><div class="htop"><span class="tag ice">${r.d}</span><span class="nights">👥 ${r.who}</span></div>
    <p style="margin:8px 0 4px;font-weight:700">${esc(r.from)} → ${esc(r.to)}</p>
    <p class="muted" style="margin:0">${esc(r.tip)}</p>
    <div class="rt-go"><a class="btn" href="${transitLink(r)}" target="_blank" rel="noopener">🗺️ 用 Google Maps 查大眾運輸路線</a></div></div>`).join("")}</div>
  <div class="row" style="margin-top:12px">
    ${T.links.map(l=>`<a class="btn ghost" href="${l.url}" target="_blank" rel="noopener">${esc(l.name)}</a>`).join("\n    ")}</div>
  <p class="muted">${esc(T.routesNote)}</p>`)}

  ${driverListHTML()}
  <h3 style="margin-top:18px">換宿日的移動</h3>
  <div class="tbl stack"><table><thead><tr><th>日期</th><th>退房</th><th>入住</th><th>交通方式</th></tr></thead><tbody>
  ${moves.map(d=>`<tr><td><div>${nw(`${d.md}（${d.wd}）`)}</div></td><td><div>${hname(HOTELS[d.checkout].name)}</div></td><td><div>${hname(HOTELS[d.stay].name)}</div></td><td>${v(d.transport)}</td></tr>`).join("")}
  </tbody></table></div>
  <div class="note" style="margin-top:14px"><b>冬季開車提醒</b>
   <ul class="clean">${I.winter.map(x=>`<li>${x}</li>`).join("")}</ul></div>${pager("04")}`;
}
