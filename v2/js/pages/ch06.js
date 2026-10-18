/* 第 06 章 */
import { ACT_IMG } from "../../data/static.js";
import { v } from "../util.js";
import { mapsBtn, head, pager } from "../ui.js";

export default function ch06(){
  return `${head("06")}
  <div class="grid2 d6">
   <div class="card pink"><div class="h-head" style="margin-top:0"><img class="hotel-pic big" src="${ACT_IMG[0]}" alt="旭川一日遊插圖"><span class="tag">旭川一日遊</span></div>
    <dl class="kv"><dt>日期</dt><dd>12/29（二）</dd><dt>出發地</dt><dd>札幌（住 APA 札幌薄野站前飯店）</dd>
    <dt>每位費用</dt><dd>TWD 1,710</dd><dt>整筆費用</dt><dd>TWD 11,970（1,710 × 7 位）</dd>
    <dt>方案</dt><dd>套裝行程（一日遊）<span class="ok">已購買</span></dd><dt>交通</dt><dd>依套裝行程安排</dd><dt>集合時間地點</dt><dd>${v(null)}</dd><dt>行程景點</dt><dd>${v(null)}</dd></dl>
    <div class="hbtns"><button class="btn ghost" data-go="05?d=4">看 12/29 每日行程</button></div></div>
   <div class="card ice"><div class="h-head" style="margin-top:0"><img class="hotel-pic big" src="${ACT_IMG[1]}" alt="滑雪插圖"><span class="tag ice">⛷️ 滑雪</span></div>
    <dl class="kv"><dt>日期</dt><dd>01/01（五）元旦</dd><dt>出發地</dt><dd>札幌（住札幌民宿）</dd>
    <dt>滑雪場</dt><dd>札幌手稻滑雪場<span class="nw">（サッポロテイネ）<span class="ok">預定</span></span></dd>
    <dt>地址</dt><dd>〒006-0029 北海道札幌市手稲区<span class="nw">手稲本町593番地3</span></dd><dt>電話</dt><dd><a href="tel:+81116826000">011-682-6000</a></dd>
    <dt>交通</dt><dd>${v(null,'待決定')}<div class="split">可選：JR＋巴士、雪場「ビッグランズ號」巴士套票（市區主要飯店直達，含纜車券）、計程車套票</div></dd>
    <dt>雪具租借</dt><dd>${v(null,'待決定')}<div class="split">雪場有出租，可網路預約（價格請看官網「レンタル」）</div></dd><dt>教練課程</dt><dd>${v(null,'待決定')}</dd>
    <dt>纜車 1 日券</dt><dd>大人 ¥9,800（窗口）／<span class="nw">¥8,800（網路預購）</span><div class="split">2026–27 季 12/19～3/7 價格；<span class="nw">5 小時券 ¥7,600／¥6,600</span></div></dd>
    <dt>整筆費用</dt><dd>${v(null)}</dd><dt>每位費用</dt><dd>${v(null)}</dd></dl>
    <div class="hbtns b3">${mapsBtn("北海道札幌市手稲区手稲本町593-3","🗺️ Google Maps")}<a class="btn ghost" href="https://sapporo-teine.com/snow/lift-time" target="_blank" rel="noopener">官網票價 ↗</a><button class="btn ghost" data-go="05?d=7">看 01/01 每日行程</button></div></div></div>
  <div class="perk d6-perk"><b>⛷️ 滑雪場小檔案</b><ul><li>分為上層「テイネハイランド」與中層「テイネオリンピア」兩個區域</li>
      <li>下層以緩坡、中級坡為主，適合家庭；另有可玩雪橇、雪上甜甜圈的「スノーランド」</li>
      <li>大眾交通：JR 手稻站轉搭巴士約 16～20 分鐘；開車從札幌市中心約 40 分鐘</li>
      <li>元旦特別：山頂纜車「サミットエクスプレス」1/1 預定清晨 6:30 起運行（新年日出）</li>
      <li>窗口可用 Suica、Kitaca 等交通 IC 卡和信用卡付款</li></ul></div>
  <div class="note" style="margin-top:14px">滑雪場為「預定」。票價為官網公布的 2026–27 季價格，網路預購較便宜；交通方式、雪具租借與課程確定後告訴我。</div>${pager("06")}`;
}
