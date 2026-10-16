/* 共用小工具：選取、HTML 跳脫、localStorage、地圖連結、toast。 */

export const $ = s => document.querySelector(s);
export const esc = s => String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const v = (x,label) => (x===null||x===undefined||x==="") ? `<span class="tbd">${label||"待確認"}</span>` : esc(x);
export const store = {
  get(k,d){try{const r=localStorage.getItem(k);return r?JSON.parse(r):d}catch(e){return d}},
  set(k,val){try{localStorage.setItem(k,JSON.stringify(val))}catch(e){}}
};
export const gmaps = q => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

export function toast(msg){
  let t=$("#toast"); if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t);}
  t.textContent=msg; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),3200);
}

/* 帶按鈕的提示（例如刪除後的「復原」），6 秒後自動消失 */
export function toastAction(msg, label, fn){
  let t=$("#toastA"); if(!t){t=document.createElement("div");t.id="toastA";t.setAttribute("role","status");document.body.appendChild(t);}
  t.innerHTML=`<span>${esc(msg)}</span><button type="button">${esc(label)}</button>`;
  t.querySelector("button").onclick=()=>{ t.classList.remove("show"); fn(); };
  t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),6000);
}
