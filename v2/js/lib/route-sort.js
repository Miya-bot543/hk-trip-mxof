/* 一鍵順路排序：每個時段內重新排順序，時段本身不動。
   起點是前一晚的住宿，終點是當晚的住宿（只當地點用，入住退房時間不當錨點）。
   📌 釘選、有開始時間、沒有座標的行程留在原位，把時段切成幾段，每段各自用最近鄰居法＋2-opt 排。
   距離用直線距離 ×1.3 估算。 */

// 兩點直線距離（公里）×1.3
export function km(a, b){
  const R=6371, r=x=>x*Math.PI/180, dLat=r(b.lat-a.lat), dLng=r(b.lng-a.lng);
  const h=Math.sin(dLat/2)**2 + Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h))*1.3;
}
const len = (from, seq, to) => { let s=0, p=from;
  for(const x of seq){ if(p) s+=km(p, x.pt); p=x.pt; }
  if(p && to) s+=km(p, to); return s; };

// 從 from 走完 list 再到 to 的最短順序（from、to 可以是 null）
function best(from, list, to){
  const tryStart = first => {
    const left=list.filter(x=>x!==first), seq=first?[first]:[];
    let p=first?first.pt:from;
    while(left.length){ left.sort((a,b)=>km(p,a.pt)-km(p,b.pt)); const n=left.shift(); seq.push(n); p=n.pt; }
    // 2-opt：把中間一段反過來，變短就留著，直到沒有改善
    for(let ok=true; ok;){ ok=false;
      for(let i=0;i<seq.length-1;i++) for(let j=i+1;j<seq.length;j++){
        const t=seq.slice(0,i).concat(seq.slice(i,j+1).reverse(), seq.slice(j+1));
        if(len(from,t,to) < len(from,seq,to)-1e-9){ seq.splice(0,seq.length,...t); ok=true; }
      } }
    return seq;
  };
  // 沒有起點時，每個點都試試看當第一站
  const cands = from ? [tryStart(null)] : list.map(tryStart);
  return cands.reduce((a,b)=>len(from,b,to)<len(from,a,to)?b:a);
}

/* slots：[{key, items:[{id, pt:{lat,lng}|null, fixed:boolean}]}]，items 照目前順序
   回傳 {slots:[{key, items}]（新順序）, before, after, changed} */
export function routeSort({start=null, end=null, slots}){
  let prev=start; const out=[];
  slots.forEach((s, si) => {
    const items=s.items.slice(), res=items.slice();
    const laterHasPt = slots.slice(si+1).some(x=>x.items.some(y=>y.pt));
    let i=0;
    while(i<items.length){
      if(items[i].fixed || !items[i].pt){ if(items[i].pt) prev=items[i].pt; i++; continue; }
      let j=i; while(j<items.length && !items[j].fixed && items[j].pt) j++;
      // 這一段的終點：同時段後面第一個留在原位且有座標的行程；後面都沒有地點了就回住宿
      const nxt=items.slice(j).find(x=>x.pt), to = nxt ? nxt.pt : (laterHasPt ? null : end);
      const seg=best(prev, items.slice(i,j), to);
      res.splice(i, seg.length, ...seg);
      prev=seg[seg.length-1].pt; i=j;
    }
    out.push({key:s.key, items:res});
  });
  const flat = ss => ss.flatMap(s=>s.items).filter(x=>x.pt);
  const before=len(start, flat(slots), end), after=len(start, flat(out), end);
  // 省不到 100 公尺就當作已經很順，不建議改
  const changed = after < before-0.1 && out.some((s,k)=>s.items.some((x,n)=>x!==slots[k].items[n]));
  return {slots:out, before, after, changed};
}
