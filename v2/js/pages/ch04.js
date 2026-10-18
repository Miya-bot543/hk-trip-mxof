/* 第 04 章 */
import { LINE_QR, HOTELS, RENTAL, TRANSIT, TRIP_ROUTES, transitLink, DAYS } from "../../data/static.js";
import { esc, v } from "../util.js";
import { isMove, mapsBtn, fold, head, pager } from "../ui.js";
import { driverListHTML } from "../features/driver.js";

export default function ch04(){
  const R=RENTAL, o=R.office, moves = DAYS.filter(isMove);
  /* 飯店名稱結尾綁在一起，規則同 03 */
  const nw=s=>`<span class="nw">${esc(s)}</span>`;
  const hname=s=>{const j=s.indexOf("（"), i=j>0?j:s.lastIndexOf(" ")+1; return i>0?esc(s.slice(0,i))+nw(s.slice(i)):esc(s);};
  const order=(x,k)=>`<div class="tix ${k?'b2':''}"><div class="lb">${k?'🚙':'🚗'} 第 ${k+1} 台</div>
    <dl class="kv"><dt>車型</dt><dd>${esc(x.car)}</dd>    <dt>備註航班</dt><dd>${x.flight}</dd><dt>加購</dt><dd>${esc(x.hep)}</dd></dl>
    <div class="hdates"><div><small>取車</small><b>${x.from.slice(5)}</b><span>新千歲空港營業所</span></div><span class="ar">→</span>
      <div><small>還車</small><b>${x.to.slice(5)}</b><span>新千歲空港營業所</span></div></div>
    <div class="stats rent-st"><div><small>租金</small><b>${x.fee}</b><em class="sub">含全險、NOC、JAF</em></div>
      <div><small>合計金額（含稅）</small><b style="color:var(--pink-d)">${x.total}</b></div></div></div>`;
  return `${head("04")}
  <article class="card pink hwide rent">
    <div><div class="htop"><span class="tag">🚗 租車公司</span><span class="nights">12/25～12/28・2 台</span></div>
      <h3 style="margin-top:8px;font-size:20px">${esc(R.company)}</h3>
      <dl class="kv"><dt>負責人</dt><dd>${R.staff}</dd><dt>電話</dt><dd><a href="tel:+81123408887">${R.tel}</a></dd><dt>傳真</dt><dd>${R.fax}</dd></dl>
      <div class="perk line-box"><img class="line-qr" src="${LINE_QR}" alt="租車公司中文 LINE 客服 QR code" title="點一下放大">
        <div><b>💬 中文 LINE 客服</b><br>有問題都可以透過 LINE 告知訂單號聯絡
        <div style="margin-top:8px"><a class="btn" href="https://lin.ee/MzOQ6pI" target="_blank" rel="noopener">💬 直接加入 LINE 好友</a></div></div></div></div>
    <div class="hw-books">${R.orders.map(order).join("")}</div>
  </article>

  <div class="card ice" style="margin-top:14px"><span class="tag ice">📍 ${o.name}</span>
    <dl class="kv"><dt>地址</dt><dd>${o.address}</dd><dt>營業時間</dt><dd>${o.hours}</dd>
    <dt>聯絡電話</dt><dd><a href="tel:+81123408887">${o.tel}</a></dd><dt>緊急聯絡</dt><dd>${o.emergency}</dd>
    <dt>Map Code</dt><dd style="font-size:20px;color:var(--pink-d)">${o.mapcode}</dd></dl>
    <div class="caution">⏰ 營業所在機場外，機場內不能還車；營業所往機場的接駁巴士末班 19:00，之後需自費搭計程車。</div>
    <div style="margin-top:10px">${mapsBtn(o.address)}</div></div>

  <div class="row" style="margin-top:16px"><button class="btn ghost" data-foldall="open">全部展開</button><button class="btn ghost" data-foldall="close">全部收合</button></div>
  ${fold("f-doc","🪪 準備證件・保險・NOC",`<div class="card lilac"><h3 style="margin-top:0">🪪 準備證件</h3>
    <ul class="clean"><li>駕駛須帶：<b>護照＋台灣駕照＋日文譯本</b></li><li>駕照與日文譯本內容需一致，效期與地址相同</li><li>所有證件都必須是正本</li></ul>
    <h3 style="margin-top:12px">🛡️ 保險（兩張訂單相同）</h3>
    <ul class="clean"><li>對人：無限制</li><li>對物：無限制（免責 5 萬円）</li><li>車輛：時價（免責 5 萬円）</li>
    <li>已包含免責保險料全額免</li><li>人身傷害：3,000 萬円（定員まで）</li><li>使用人身傷害保險時，必須報警處理並有醫生正式診療紀錄</li></ul>
    <h3 style="margin-top:12px">⚠️ NOC（營業損失補償）</h3>
    <ul class="clean"><li>車可開回營業所：¥20,000</li><li>車無法開回營業所：¥50,000</li></ul>
    <p class="muted" style="margin:6px 0 0">報價單備註寫「含全險＆免責 NOC 保險料金」，NOC 實際是否另收請以櫃檯說明為準。</p></div>`)}

  ${fold("f-car","🚗 取車 → 加油 → 還車 步驟",`<div class="grid">
   <div class="card pink"><span class="tag">① 取車</span>
    <ol class="plan"><li>到新千歲機場<b>國際線</b>或<b>國內線</b>航廈 1 樓 World Net Rent-A-Car 櫃檯報到</li>
    <li>櫃檯沒人時，拿起櫃台電話按 <b>1</b> 聯絡營業所</li><li>搭免費接駁車到營業所取車</li></ol></div>
   <div class="card ice"><span class="tag ice">② 加油</span>
    <ul class="clean"><li>滿油租、滿油還，油種 <b>REGULAR レギュラー（紅色）</b></li><li>在千歲市內加油站或營業所加油，<b>保留收據</b>給營業所</li>
    <li>最後加油處不在千歲市內，需在營業所補滿，價格略高</li></ul>
    <dl class="kv" style="margin-top:8px"><dt>コスモ千歳空港SS</dt><dd>24 小時・<a class="nw" href="tel:+81123232324">0123-23-2324</a>・<span class="nw">到營業所約 10 分</span></dd>
    <dt>ENEOS SS</dt><dd>8:00～17:30・<a class="nw" href="tel:+81123452345">0123-45-2345</a>・<span class="nw">到營業所約 10 分</span></dd></dl></div>
   <div class="card lilac"><span class="tag lilac">③ 還車</span>
    <ol class="plan"><li>導航輸入 Map Code <b>${o.mapcode}</b> 到新千歲空港營業所</li><li>營業時間內（${o.hours}）歸還，計日制</li>
    <li>交回租車時拿到的書面資料與車鑰匙</li><li>還車處常擁擠，請先整理好行李，避免遺忘物品</li><li>搭接駁巴士到機場（末班 19:00）</li></ol></div>
  </div>`)}

  ${fold("f-tr","🚇 札幌大眾交通指南（還車後使用）",`<p class="muted" style="margin-top:0">12/28 還車後就沒有車了，以下整理常用的交通工具。時間與票價是 2026 年公開資料，實際以官方時刻表為準。</p>
  <div class="grid tr3">${TRANSIT.map(t=>`<div class="card"><div class="htop"><b style="font-size:17px">${t.ico} ${esc(t.name)}</b></div>
    <dl class="kv"><dt>適合</dt><dd>${esc(t.use)}</dd><dt>時間</dt><dd>${esc(t.time)}</dd><dt>票價</dt><dd>${esc(t.fare)}</dd><dt>營運</dt><dd>${esc(t.hours)}</dd></dl>
    <p class="muted" style="margin:8px 0 0">${esc(t.note)}</p></div>`).join("")}</div>
  <div class="note" style="margin-top:12px">💳 <b>交通 IC 卡</b>：Suica、Kitaca 等交通 IC 卡，大多可以搭 JR、地下鐵、市電和主要巴士，少數路線以現場標示為準。</div>
  <h3 style="margin-top:20px">🧭 依日期的移動建議</h3>
  <div class="grid2 rt">${TRIP_ROUTES.map(r=>`<div class="card ice"><div class="htop"><span class="tag ice">${r.d}</span><span class="nights">👥 ${r.who}</span></div>
    <p style="margin:8px 0 4px;font-weight:700">${esc(r.from)} → ${esc(r.to)}</p>
    <p class="muted" style="margin:0">${esc(r.tip)}</p>
    <div class="rt-go"><a class="btn" href="${transitLink(r)}" target="_blank" rel="noopener">🗺️ 用 Google Maps 查大眾運輸路線</a></div></div>`).join("")}</div>
  <div class="row" style="margin-top:12px">
    <a class="btn ghost" href="https://www.jrhokkaido.co.jp/" target="_blank" rel="noopener">JR 北海道官網 ↗</a>
    <a class="btn ghost" href="https://www.city.sapporo.jp/st/" target="_blank" rel="noopener">札幌市交通局（地下鐵・市電）↗</a></div>
  <p class="muted">路線圖請以官方網站為準；Google Maps 按鈕會帶入起點和終點，打開後可以選出發時間查班次。</p>`)}

  ${driverListHTML()}
  <h3 style="margin-top:18px">換宿日的移動</h3>
  <div class="tbl stack"><table><thead><tr><th>日期</th><th>退房</th><th>入住</th><th>交通方式</th></tr></thead><tbody>
  ${moves.map(d=>`<tr><td><div>${nw(`${d.md}（${d.wd}）`)}</div></td><td><div>${hname(HOTELS[d.checkout].name)}</div></td><td><div>${hname(HOTELS[d.stay].name)}</div></td><td>${v(d.transport)}</td></tr>`).join("")}
  </tbody></table></div>
  <div class="note" style="margin-top:14px"><b>冬季開車提醒</b>
   <ul class="clean"><li>北海道冬季路面常結冰、天黑得早，請預留寬鬆時間。</li><li>本網站不提供即時車程，請出發前用導航查詢。</li></ul></div>${pager("04")}`;
}
