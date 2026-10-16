/* ☁️ 天氣預報（Open-Meteo）。 */
import { TODAY_PLACE, WX_PLACES } from "../../data/static.js";
import { $, store } from "../util.js";
import { todayIdx, inTrip } from "./today.js";

/* ---------- ☁️ 天氣預報（Open-Meteo，免金鑰；Claude 版無法連線時改顯示連結） ---------- */
export const WX = {sel:null, data:store.get("hk-wx",{}), err:false, loading:false};
export function wxIcon(c){
  if(c===0) return ["☀️","晴"]; if(c<=2) return ["🌤️","晴時多雲"]; if(c===3) return ["☁️","陰"];
  if(c===45||c===48) return ["🌫️","霧"]; if(c>=51&&c<=57) return ["🌦️","毛毛雨"]; if(c>=61&&c<=67) return ["🌧️","雨"];
  if(c>=71&&c<=77) return ["❄️","雪"]; if(c>=80&&c<=82) return ["🌦️","陣雨"]; if(c===85||c===86) return ["🌨️","陣雪"];
  if(c>=95) return ["⛈️","雷雨"]; return ["🌡️","—"];
}
export async function wxFetch(force){
  if(WX.loading) return; const now=Date.now();
  const stale = WX_PLACES.some(p=>!WX.data[p.id] || now-WX.data[p.id].t>3600000);
  if(!force && !stale) return;
  WX.loading=true;
  try{
    await Promise.all(WX_PLACES.map(async p=>{
      const u=`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum,sunset&timezone=Asia%2FTokyo&forecast_days=7`;
      const r=await fetch(u); if(!r.ok) throw new Error("wx "+r.status);
      const j=await r.json(); WX.data[p.id]={t:Date.now(), j};
    }));
    store.set("hk-wx",WX.data); WX.err=false;
  }catch(e){ WX.err=true; }
  WX.loading=false; const box=$("#wxBox"); if(box) box.innerHTML=wxInner();
}
export function wxInner(){
  const ti=todayIdx(); const def = inTrip(ti) ? ({nob:"nob",spk:"spk",asa:"asa",ski:"ski",cts:"spk"}[TODAY_PLACE[ti]]||"spk") : "spk";
  const sel = WX.sel || def, p=WX_PLACES.find(x=>x.id===sel), rec=WX.data[sel];
  const tabs=`<div class="row" role="group" aria-label="選擇地點">${WX_PLACES.map(x=>`<button class="chip" data-wx="${x.id}" ${x.id===sel?'aria-current="page"':''}>${x.name}</button>`).join("")}</div>`;
  if(!rec){
    const links=`<div class="row" style="margin-top:8px">${WX_PLACES.map(x=>`<a class="btn ghost" href="https://www.google.com/search?q=${encodeURIComponent(x.name.replace("溫泉","温泉")+" 天気")}" target="_blank" rel="noopener">${x.name}天氣 ↗</a>`).join("")}</div>`;
    return tabs + (WX.err ? `<p class="muted" style="margin-top:10px">目前無法取得天氣資料（Claude 版無法連到外部天氣服務，GitHub 版可以正常顯示）。可以先用下面的連結查詢：</p>${links}`
                          : `<p class="muted" style="margin-top:10px">天氣讀取中…</p>`);
  }
  const j=rec.j, d=j.daily, c=j.current; const [ci,ct]=wxIcon(c.weather_code);
  const days=d.time.map((t,k)=>{const [ic,tx]=wxIcon(d.weather_code[k]); const dt=new Date(t+"T00:00:00");
    const wd="日一二三四五六"[dt.getDay()]; const sn=d.snowfall_sum[k];
    return `<div class="wx-day"><b>${t.slice(5).replace("-","/")}（${wd}）</b><span class="wx-ic" title="${tx}">${ic}</span>
      <span class="wx-t"><span class="hi">${Math.round(d.temperature_2m_max[k])}°</span> / <span class="lo">${Math.round(d.temperature_2m_min[k])}°</span></span>
      <small>${d.precipitation_probability_max[k]!=null?`☂ ${d.precipitation_probability_max[k]}%`:''}${sn>0?`<br>❄ ${sn} cm`:''}</small></div>`;}).join("");
  const age=Math.round((Date.now()-rec.t)/60000);
  return tabs+`<div class="wx-now"><span class="wx-big">${ci}</span><div><div class="wx-temp">${Math.round(c.temperature_2m)}°C</div><div class="muted">${p.name}・現在${ct}</div></div>
      <div class="wx-sun muted">🌇 今天日落 ${(d.sunset[0]||"").slice(11,16)}</div></div>
    <div class="wx-strip">${days}</div>
    <p class="muted" style="margin:8px 0 0">${WX.err?'⚠️ 目前離線，顯示上次存下的資料・':''}更新於 ${age<1?'剛剛':age+' 分鐘前'}・資料來源 Open-Meteo・預報只涵蓋未來 7 天，出發前一週起可看到旅行期間的天氣。</p>`;
}
export function weatherCardHTML(){
  setTimeout(()=>wxFetch(false),0);
  return `<div class="card ice" style="margin-top:16px"><div class="htop"><span class="tag ice">☁️ 天氣預報</span>
    <button class="btn ghost" data-wxre style="padding:2px 12px">↻ 更新</button></div><div id="wxBox" style="margin-top:8px">${wxInner()}</div></div>`;
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-wx]"); if(b){ WX.sel=b.dataset.wx; $("#wxBox").innerHTML=wxInner(); return; }
  if(e.target.closest("[data-wxre]")) wxFetch(true);
});
