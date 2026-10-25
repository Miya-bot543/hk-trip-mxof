/* 首頁封面動態：溫泉白霧、湖面漣漪、飄雪與底部積雪。
   全部畫在疊在封面上的 canvas，座標用封面原圖的像素。
   雪堆高度存在模組裡：切頁回來維持原樣，重新整理才歸零。
   減少動態：不跑動畫，只畫一層薄薄的靜態積雪。封面捲出畫面或切到別的 app 時暫停。 */

const GROW_SEC = 240;            /* 約 4 分鐘堆到最高 */
const COLS = 96;

const smooth = (a,b,t) => { t=Math.min(1,Math.max(0,(t-a)/(b-a))); return t*t*(3-2*t); };
/* a～b 之間壓低到 low，兩側用 edge 寬度慢慢過渡，不會有斷崖 */
const dip = (x,a,b,low,high,edge) => high - (high-low)*smooth(a-edge,a,x)*(1-smooth(b,b+edge,x));

/* 各版封面的位置設定（原圖像素） */
const SPEC = {
  h: { w:1774, h:887,
    steam:[[155,700],[345,690],[250,735]],
    lake:{x0:610, x1:1030, y0:605, y1:690},
    /* 雪堆上限：一般是封面高度一成，滑雪板那段壓低避免蓋到人 */
    pileMax:x => dip(x, 1110, 1570, 34, 89, 110) },
  v: { w:1122, h:1402,
    steam:[[178,985],[322,975],[252,1012]],
    lake:{x0:345, x1:640, y0:768, y1:840},
    pileMax:x => dip(x, 360, 900, 92, 140, 120) }
};

const ST = {};                  /* 各版的積雪狀態，跨頁保留 */
let cur = null;                 /* 目前正在跑的那組 */

function stateFor(key){
  if(ST[key]) return ST[key];
  const sp = SPEC[key];
  const max = Array.from({length:COLS}, (_,i) => {
    const x = i/(COLS-1)*sp.w;
    /* 讓上限本身也高低起伏，邊界平滑過渡 */
    const wave = .78 + .14*Math.sin(i*.37) + .08*Math.sin(i*1.13+1);
    return sp.pileMax(x)*wave;
  });
  ST[key] = { t:0, max, pile:max.map(m=>m*.06) };
  return ST[key];
}

let puffImg = null;
function puff(){
  if(puffImg) return puffImg;
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,"rgba(255,255,255,.9)"); r.addColorStop(.5,"rgba(255,255,255,.4)"); r.addColorStop(1,"rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0,0,64,64);
  return puffImg = c;
}

export function coverFx(){
  if(cur) cur.stop();
  const fig = document.querySelector(".cover"); if(!fig) return;
  const still = matchMedia("(prefers-reduced-motion:reduce)").matches;
  const cv = document.createElement("canvas"); cv.className = "cover-fx"; cv.setAttribute("aria-hidden","true");
  fig.appendChild(cv);
  const ctx = cv.getContext("2d");
  let key, sp, s, k = 1, dpr = 1, raf = 0, last = 0, seen = true, alive = true;
  let flakes = [], puffs = [], rings = [], glints = [], steamT = 0, ringT = 0;

  const rnd = (a,b) => a + Math.random()*(b-a);
  const newFlake = top => ({ x:rnd(0,sp.w), y:top ? rnd(-sp.h*.05,0) : rnd(0,sp.h*.9),
    r:rnd(1.3,3.4)/k, vy:rnd(28,52)/k, sway:rnd(6,16)/k, ph:rnd(0,6.28), a:rnd(.65,1) });

  function setup(){
    key = matchMedia("(min-width:700px)").matches ? "h" : "v";
    sp = SPEC[key]; s = stateFor(key);
    const w = fig.clientWidth; if(!w) return false;
    k = w/sp.w; dpr = Math.min(2, devicePixelRatio||1);
    cv.width = Math.round(w*dpr); cv.height = Math.round(sp.h*k*dpr);
    const n = Math.round(Math.min(90, Math.max(36, w*sp.h*k/9000)));
    flakes = Array.from({length:n}, () => newFlake(false));
    return true;
  }

  const colX = i => i/(COLS-1)*sp.w;
  const pileAt = x => { const f = x/sp.w*(COLS-1), i = Math.max(0,Math.min(COLS-2,Math.floor(f))), t = f-i;
    return s.pile[i]*(1-t) + s.pile[i+1]*t; };
  const level = () => smooth(0, GROW_SEC, s.t)*.94 + .06;

  function land(x){
    const c = x/sp.w*(COLS-1), cap = level();
    for(let i = Math.max(0,Math.floor(c-3)); i <= Math.min(COLS-1,Math.ceil(c+3)); i++){
      const w = Math.exp(-((i-c)**2)/3);
      s.pile[i] = Math.min(s.max[i]*cap, s.pile[i] + s.max[i]*.014*w);
    }
  }
  function step(dt){
    s.t += dt;
    const cap = level();
    /* 慢慢補到當下的上限，雪片落點只是讓表面有起伏 */
    for(let i = 0; i < COLS; i++){ const m = s.max[i]*cap; if(s.pile[i] < m) s.pile[i] += (m-s.pile[i])*dt*.02; }

    for(const f of flakes){
      f.y += f.vy*dt; f.ph += dt*1.3;
      const x = f.x + Math.sin(f.ph)*f.sway;
      if(f.y >= sp.h - pileAt(x)){ land(x); Object.assign(f, newFlake(true)); }
    }

    steamT -= dt;
    if(steamT <= 0){ steamT = rnd(.12,.22);
      const [sx,sy] = sp.steam[Math.floor(Math.random()*sp.steam.length)];
      puffs.push({ x:sx+rnd(-30,30), y:sy+rnd(-6,10), life:0, max:rnd(3.6,5.2), r0:rnd(20,32), drift:rnd(-10,10), ph:rnd(0,6.28) }); }
    puffs = puffs.filter(p => (p.life += dt) < p.max);

    ringT -= dt;
    const L = sp.lake;
    if(ringT <= 0){ ringT = rnd(.7,1.3);
      rings.push({ x:rnd(L.x0+60,L.x1-60), y:rnd(L.y0+12,L.y1-10), life:0, max:rnd(2.8,3.8), r:rnd(50,80) }); }
    rings = rings.filter(r => (r.life += dt) < r.max);
    if(glints.length < 10 && Math.random() < dt*4) glints.push({ x:rnd(L.x0+20,L.x1-20), y:rnd(L.y0,L.y1), life:0, max:rnd(1,2), w:rnd(14,28) });
    glints = glints.filter(g => (g.life += dt) < g.max);
  }

  function drawSteam(){
    const img = puff();
    for(const p of puffs){
      /* 一出來就看得到，往上飄時慢慢變大變淡 */
      const t = p.life/p.max, r = p.r0 + t*60;
      ctx.globalAlpha = Math.min(1, t*6)*(1-t)*.75;
      ctx.drawImage(img, p.x + p.drift*t*4 + Math.sin(p.ph + t*4)*8 - r, p.y - t*120 - r, r*2, r*2);
    }
    ctx.globalAlpha = 1;
  }
  function drawLake(){
    /* 水波：淡紫底線襯一圈白線，淺色湖面上才看得出來 */
    const lw = Math.max(2.4, 1.8/k);
    const ring = (x, y, rx, a) => {
      ctx.lineWidth = lw; ctx.strokeStyle = `rgba(150,128,210,${a*.45})`;
      ctx.beginPath(); ctx.ellipse(x, y+lw*.6, rx, rx*.24, 0, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${a*.9})`;
      ctx.beginPath(); ctx.ellipse(x, y, rx, rx*.24, 0, 0, Math.PI*2); ctx.stroke(); };
    for(const r of rings){
      const t = r.life/r.max;
      ring(r.x, r.y, 6 + r.r*t, (1-t)*Math.min(1, t*5));
      if(t > .3){ const t2 = (t-.3)/.7; ring(r.x, r.y, 4 + r.r*.6*t2, (1-t2)*.7); }
    }
    /* 閃爍反光：一道橫向亮光加小十字星 */
    ctx.lineCap = "round";
    for(const g of glints){
      const a = Math.sin(Math.PI*g.life/g.max);
      ctx.strokeStyle = `rgba(255,252,240,${a*.95})`; ctx.lineWidth = lw*1.1;
      ctx.beginPath(); ctx.moveTo(g.x-g.w/2, g.y); ctx.lineTo(g.x+g.w/2, g.y); ctx.stroke();
      const c = g.w*.35*a; ctx.lineWidth = lw*.7;
      ctx.beginPath(); ctx.moveTo(g.x, g.y-c); ctx.lineTo(g.x, g.y+c); ctx.moveTo(g.x-c*.6, g.y); ctx.lineTo(g.x+c*.6, g.y); ctx.stroke();
    }
  }
  function drawFlakes(){
    ctx.fillStyle = "#fff";
    for(const f of flakes){
      ctx.globalAlpha = f.a;
      ctx.beginPath(); ctx.arc(f.x + Math.sin(f.ph)*f.sway, f.y, f.r, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function drawPile(){
    const H = sp.h;
    ctx.beginPath(); ctx.moveTo(0, H+2); ctx.lineTo(0, H - s.pile[0]);
    for(let i = 1; i < COLS; i++){
      const x0 = colX(i-1), x1 = colX(i), y0 = H - s.pile[i-1], y1 = H - s.pile[i];
      ctx.quadraticCurveTo(x0, y0, (x0+x1)/2, (y0+y1)/2);
    }
    ctx.lineTo(sp.w, H - s.pile[COLS-1]); ctx.lineTo(sp.w, H+2); ctx.closePath();
    const top = H - Math.max(...s.pile);
    const g = ctx.createLinearGradient(0, top, 0, H);
    g.addColorStop(0, "#ffffff"); g.addColorStop(.55, "#f7f3ff"); g.addColorStop(1, "#ece6fb");
    ctx.save();
    ctx.shadowColor = "rgba(130,105,190,.35)"; ctx.shadowBlur = 6*dpr; ctx.shadowOffsetY = -1*dpr;
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }
  function draw(){
    ctx.setTransform(dpr*k, 0, 0, dpr*k, 0, 0);
    ctx.clearRect(0, 0, sp.w, sp.h);
    if(!still){ drawSteam(); drawLake(); }
    drawPile();
    if(!still) drawFlakes();
  }

  function frame(ts){
    raf = 0;
    if(!alive) return;
    if(!fig.isConnected){ stop(); return; }
    const dt = Math.min(.05, last ? (ts-last)/1000 : 0); last = ts;
    step(dt); draw();
    loop();
  }
  function loop(){ if(alive && seen && !document.hidden && !raf){ raf = requestAnimationFrame(frame); } }
  function pause(){ if(raf){ cancelAnimationFrame(raf); raf = 0; } last = 0; }

  function paintStill(){
    /* 減少動態：薄薄一層靜態積雪 */
    s.pile = s.max.map(m => m*.32);
    draw();
  }

  const onVis = () => document.hidden ? pause() : loop();
  const io = new IntersectionObserver(es => { seen = es[0].isIntersecting; seen ? loop() : pause(); });
  const ro = new ResizeObserver(() => { if(setup()) still ? paintStill() : draw(); });
  function stop(){
    alive = false; pause(); io.disconnect(); ro.disconnect();
    document.removeEventListener("visibilitychange", onVis);
    cv.remove(); if(cur && cur.stop === stop) cur = null;
  }
  cur = { stop };

  if(!setup()) return;
  ro.observe(fig);
  if(still){ paintStill(); return; }
  io.observe(fig);
  document.addEventListener("visibilitychange", onVis);
  draw(); loop();
}
