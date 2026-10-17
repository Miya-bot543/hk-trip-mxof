/* 08 記帳：新增、修改、刪除（需通關碼）和帳目清單（大家都看得到）。
   每筆存當下匯率（rate_to_base），之後改共用匯率不影響舊帳。
   金額一律換成最小單位的整數計算（日圓以元、其他幣別以分），除不盡的餘數算在付款人身上。 */
import { $, esc, toast, toastAction } from "../util.js";
import { ds } from "../datastore.js";
import { ensureEditor, editorStatusHTML } from "./editor.js";
import { pkError } from "./pocket.js";
import { activeTravelers, travelerGroups } from "./members.js";

export const EX_CATS = [["food", "🍜 餐飲"], ["transport", "🚃 交通"], ["ticket", "🎫 門票"], ["shopping", "🛍️ 購物"], ["lodging", "🏨 住宿"], ["other", "📦 其他"]];
const MODES = [["equal", "均分"], ["shares", "按份數"], ["exact", "指定金額"]];
const CUR_NAME = { JPY: "日圓", TWD: "台幣" };

// 最小單位：日圓沒有小數，其他幣別到分
export const minor = cur => cur === "JPY" ? 1 : 100;
export const toUnits = (n, cur) => Math.round(Number(n || 0) * minor(cur));
export const money = (units, cur) => {
  const m = minor(cur), n = units / m;
  const s = n.toLocaleString("en-US", { minimumFractionDigits: m > 1 && units % m ? 2 : 0, maximumFractionDigits: 2 });
  return cur === "JPY" ? `¥${s}` : cur === "TWD" ? `NT$${s}` : `${cur} ${s}`;
};

/* 每位分攤者應付多少（最小單位整數）。回傳 { map: Map(traveler_id → units), rem, ok, diff }
   rem：除不盡、加在付款人身上的餘數；exact 模式 diff ≠ 0 表示指定金額加總不等於總額 */
export function splitUnits(total, cur, mode, splits, payer) {
  const map = new Map(splits.map(s => [s.traveler_id, 0]));
  if (!splits.length || total <= 0) return { map, rem: 0, ok: false, diff: 0 };
  if (mode === "exact") {
    let sum = 0;
    splits.forEach(s => { const u = toUnits(s.amount, cur); map.set(s.traveler_id, u); sum += u; });
    return { map, rem: 0, ok: sum === total, diff: total - sum };
  }
  const w = splits.map(s => mode === "shares" ? Math.max(0, Number(s.shares) || 0) : 1), W = w.reduce((a, b) => a + b, 0);
  if (W <= 0) return { map, rem: 0, ok: false, diff: 0 };
  let used = 0;
  splits.forEach((s, i) => { const u = Math.floor(total * w[i] / W + 1e-9); map.set(s.traveler_id, u); used += u; });
  const rem = total - used;
  if (rem) map.set(payer, (map.get(payer) || 0) + rem);
  return { map, rem, ok: true, diff: 0 };
}

/* ---------- 表單狀態 ---------- */
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const EX = { open: false, cat: "food", cur: "JPY", rate: "", rateTouched: false, payer: "", mode: "equal", sel: null, shares: {}, exact: {}, pending: false, editId: null };
const nameOf = id => (ds.travelers().find(t => t.id === id) || {}).nickname || "?";
const meId = () => { const me = String(ds.me() || "").trim(), t = activeTravelers().find(x => x.nickname === me); return t ? t.id : ""; };
const currencies = () => [...new Set(["JPY", "TWD", ...ds.fx().map(r => r.currency), EX.cur])];
const shared = cur => cur === "TWD" ? 1 : ds.rate(cur);
// 名單變動時補上預設值：付款人預設「我」，分攤者預設全部成員
function syncState() {
  const act = activeTravelers(), ids = new Set(act.map(t => t.id));
  if (!EX.payer || !ids.has(EX.payer)) EX.payer = meId() || (act[0] ? act[0].id : "");
  if (!EX.sel) EX.sel = new Set(ids); else EX.sel = new Set([...EX.sel].filter(id => ids.has(id)));
  if (!EX.rateTouched) EX.rate = shared(EX.cur) ? String(shared(EX.cur)) : "";
}

const statusHTML = () => {
  if (ds.mode === "offline") return `<div class="caution">📴 目前沒有網路，連上網路後才能記帳。</div>`;
  if (ds.mode !== "live") return `<div class="caution">📌 目前為唯讀模式，暫時無法記帳。</div>`;
  return editorStatusHTML("共用帳本：輸入通關碼後，就能新增記帳。", "共用帳本：記下的每一筆，旅伴打開網站都看得到。");
};

function rateHTML() {
  if (EX.cur === "TWD") return `<p class="muted ex-hint">台幣不需要匯率。</p>`;
  const s = shared(EX.cur), r = parseFloat(EX.rate), amt = parseFloat($("#exAmt") ? $("#exAmt").value : "");
  const conv = r > 0 && amt > 0 ? `≈ NT$${(Math.round(amt * r * 100) / 100).toLocaleString("en-US")}` : "";
  const hint = s ? (r === s ? `共用匯率` : `共用匯率是 ${s}，<button type="button" class="linkbtn" data-exrate>改回共用</button>`) : `還沒有共用匯率，請自己填`;
  return `<label class="ex-rate">匯率：1 ${esc(CUR_NAME[EX.cur] || EX.cur)} ＝<input type="number" id="exRate" step="0.0001" min="0" inputmode="decimal" value="${esc(EX.rate)}" placeholder="例如 0.2">台幣</label>
    <p class="muted ex-hint">${hint}。這筆會存當下的匯率，之後改共用匯率不影響。${conv ? `<b class="ex-conv">${conv}</b>` : ""}</p>`;
}

function splitHTML() {
  const act = activeTravelers();
  if (!act.length) return `<p class="muted">還沒有成員，請先在上面「👥 旅行成員」新增。</p>`;
  const groups = travelerGroups();
  const quick = [`<button type="button" class="ex-q" data-exq="*">全部</button>`, ...groups.map(g => `<button type="button" class="ex-q" data-exq="${esc(g)}">${esc(g)}</button>`)].join("");
  const chips = act.map(t => `<button type="button" class="ex-chip" data-exsel="${t.id}" aria-pressed="${EX.sel.has(t.id)}"><span class="mb-dot" style="background:${esc(t.color || "#9a7fd6")}">${esc([...t.nickname][0] || "?")}</span>${esc(t.nickname)}</button>`).join("");
  const modes = MODES.map(([k, l]) => `<button type="button" data-exmode="${k}" aria-pressed="${EX.mode === k}">${l}</button>`).join("");
  return `<div class="ex-quick">${quick}</div><div class="ex-chips">${chips}</div>
    <div class="ex-seg" role="group" aria-label="分攤方式">${modes}</div><div id="exDetail">${detailHTML()}</div>`;
}

// 分攤明細預覽：均分、按份數直接算給你看；指定金額讓你每人填
function detailHTML() {
  const sel = activeTravelers().filter(t => EX.sel.has(t.id));
  if (!sel.length) return `<p class="ex-warn">請至少選一位分攤的人</p>`;
  const cur = EX.cur, total = toUnits($("#exAmt") ? $("#exAmt").value : 0, cur);
  const splits = sel.map(t => ({ traveler_id: t.id, shares: EX.shares[t.id] ?? 1, amount: EX.exact[t.id] ?? "" }));
  const r = splitUnits(total, cur, EX.mode, splits, EX.payer);
  const step = minor(cur) > 1 ? "0.01" : "1";
  const rows = sel.map(t => {
    const u = r.map.get(t.id) || 0;
    const inp = EX.mode === "shares" ? `<input type="number" class="ex-n" data-exshare="${t.id}" min="0" step="0.5" inputmode="decimal" value="${esc(EX.shares[t.id] ?? 1)}" aria-label="${esc(t.nickname)} 份數"><span class="muted">份</span>`
      : EX.mode === "exact" ? `<input type="number" class="ex-n" data-exexact="${t.id}" min="0" step="${step}" inputmode="decimal" value="${esc(EX.exact[t.id] ?? "")}" placeholder="0" aria-label="${esc(t.nickname)} 金額">` : "";
    return `<li><span class="ex-who">${esc(t.nickname)}</span>${inp}${EX.mode !== "exact" ? `<b>${total > 0 && r.ok ? money(u, cur) : "—"}</b>` : ""}</li>`;
  }).join("");
  let foot = "";
  if (EX.mode === "exact" && total > 0) foot = r.diff === 0 ? `<p class="ex-ok">✓ 加總剛好等於總額</p>` : `<p class="ex-warn">${r.diff > 0 ? "還差" : "多了"} ${money(Math.abs(r.diff), cur)}</p>`;
  else if (r.rem) foot = `<p class="muted ex-hint">除不盡的 ${money(r.rem, cur)} 算在付款人 ${esc(nameOf(EX.payer))} 身上</p>`;
  return `<ul class="ex-detail">${rows}</ul>${foot}`;
}

function placeOptions() {
  const L = ds.places().slice().sort((a, b) => String(a.name).localeCompare(b.name, "zh-Hant"));
  return `<option value="">不關聯</option>` + L.map(p => `<option value="${p.id}">${esc(p.name)}${p.area ? `（${esc(String(p.area).replace(/（.*）/, ""))}）` : ""}</option>`).join("");
}

function formHTML() {
  if (ds.mode !== "live") return "";
  if (!EX.open) return `<button type="button" class="btn ex-open" data-exopen>＋ 記一筆</button>`;
  syncState();
  const act = activeTravelers();
  const ed = EX.editId && ds.expenses().find(e => e.id === EX.editId);
  return `<div class="ex-form">${ed ? `<p class="ex-editing">✏️ 正在修改「${esc(ed.title)}」</p>` : ""}
    <div class="ex-grid">
      <label>日期<input type="date" id="exDate" value="${today()}"></label>
      <label class="ex-wide">項目<input type="text" id="exTitle" maxlength="80" placeholder="例如：午餐 味噌拉麵"></label>
    </div>
    <div class="ex-cats" role="group" aria-label="類別">${EX_CATS.map(([k, l]) => `<button type="button" data-excat="${k}" aria-pressed="${EX.cat === k}">${l}</button>`).join("")}</div>
    <div class="ex-grid">
      <label>金額<input type="number" id="exAmt" min="0" step="${minor(EX.cur) > 1 ? "0.01" : "1"}" inputmode="decimal" placeholder="0"></label>
      <label>幣別<select id="exCur">${currencies().map(c => `<option value="${c}"${c === EX.cur ? " selected" : ""}>${c}${CUR_NAME[c] ? ` ${CUR_NAME[c]}` : ""}</option>`).join("")}<option value="+">＋ 其他幣別</option></select></label>
      <label class="ex-payer">誰付的<select id="exPayer">${act.map(t => `<option value="${t.id}"${t.id === EX.payer ? " selected" : ""}>${esc(t.nickname)}</option>`).join("")}</select></label>
    </div>
    <div id="exRateBox">${rateHTML()}</div>
    <div class="ex-sub">誰分攤</div><div id="exSplit">${splitHTML()}</div>
    <div class="ex-grid">
      <label>關聯地點（選填）<select id="exPlace">${placeOptions()}</select></label>
      <label>備註（選填）<input type="text" id="exNote" maxlength="200" placeholder="例如：刷卡、含小費"></label>
    </div>
    <p class="ex-warn" id="exMsg" role="alert"></p>
    <div class="row"><button type="button" class="btn ex-save" id="exSave">${saveLabel()}</button><button type="button" class="btn ghost" data-exclose>${EX.editId ? "取消修改" : "收起來"}</button></div>
  </div>`;
}

export function expenseSectionHTML() {
  return `<div class="card pink" id="ex-card"><div class="htop"><span class="tag">🧾 記帳</span><span class="nights" id="ex-count"></span></div>
    <div id="ex-ed">${statusHTML()}</div><div id="ex-form">${formHTML()}</div><div id="ex-list">${listHTML()}</div></div>`;
}

/* ---------- 帳目清單 ---------- */
const LS = { who: "", cat: "", open: new Set() };
const WEEK = "日一二三四五六";
const catOf = k => (EX_CATS.find(c => c[0] === k) || EX_CATS[EX_CATS.length - 1])[1];
const dayLabel = d => { const x = new Date(d + "T00:00"); return `${d.slice(5).replace("-", "/")}（${WEEK[x.getDay()]}）`; };
// 原幣別最小單位 → 台幣（分），用這筆自己存的匯率
const toTwd = (units, e) => e.currency === "TWD" ? units : Math.round(units / minor(e.currency) * Number(e.rate_to_base) * 100);
// 每筆的分攤結果（跟表單用同一套算法）
function shareOf(e) {
  const splits = ds.splits().filter(s => s.expense_id === e.id).map(s => ({ traveler_id: s.traveler_id, shares: s.shares, amount: s.amount }));
  const total = toUnits(e.amount, e.currency);
  return { total, splits, r: splitUnits(total, e.currency, e.split_mode, splits, e.paid_by) };
}
const involves = (e, id, sh) => e.paid_by === id || (sh.r.map.get(id) || 0) > 0;
const sorted = () => ds.expenses().slice().sort((a, b) => a.spent_on < b.spent_on ? 1 : a.spent_on > b.spent_on ? -1 : a.created_at < b.created_at ? 1 : -1);

function filterHTML() {
  const T = ds.travelers().filter(t => t.active !== false || ds.expenses().some(e => involves(e, t.id, shareOf(e))));
  const who = `<option value="">全部旅伴</option>` + T.map(t => `<option value="${t.id}"${t.id === LS.who ? " selected" : ""}>${esc(t.nickname)}${t.active === false ? "（已隱藏）" : ""}</option>`).join("");
  const cat = `<option value="">全部類別</option>` + EX_CATS.map(([k, l]) => `<option value="${k}"${k === LS.cat ? " selected" : ""}>${l}</option>`).join("");
  return `<div class="ex-filter"><select id="exFWho" aria-label="篩選旅伴">${who}</select><select id="exFCat" aria-label="篩選類別">${cat}</select></div>`;
}

function itemHTML(e, sh) {
  const cur = e.currency, n = [...sh.r.map.values()].filter(u => u > 0).length;
  const mode = `${n} 人${e.split_mode === "equal" ? "均分" : e.split_mode === "shares" ? "按份數" : "指定金額"}`;
  const mu = LS.who ? sh.r.map.get(LS.who) || 0 : 0;
  const mine = mu > 0 ? `・${esc(nameOf(LS.who))} 分 ${money(mu, cur)}` : "";
  const open = LS.open.has(e.id);
  const rows = sh.splits.filter(s => (sh.r.map.get(s.traveler_id) || 0) > 0).map(s => {
    const u = sh.r.map.get(s.traveler_id), sub = e.split_mode === "shares" ? `<small>${Number(s.shares)} 份</small>` : "";
    return `<li><span class="ex-who">${esc(nameOf(s.traveler_id))}${sub}</span><b>${money(u, cur)}</b>${cur !== "TWD" ? `<small>≈ ${money(toTwd(u, e), "TWD")}</small>` : ""}</li>`;
  }).join("");
  const place = e.place_id && ds.places().find(p => p.id === e.place_id);
  const meta = [cur !== "TWD" ? `匯率 1 ${esc(CUR_NAME[cur] || cur)} ＝ ${Number(e.rate_to_base)} 台幣` : "", place ? `📍 ${esc(place.name)}` : "", e.note ? `📝 ${esc(e.note)}` : "", `記錄：${esc(e.updated_by || e.created_by || "旅伴")}`].filter(Boolean).join("<br>");
  const btns = ds.mode === "live" ? `<div class="row"><button type="button" class="btn ghost" data-exedit="${e.id}">✏️ 修改</button><button type="button" class="btn ghost ex-del" data-exdel="${e.id}">🗑️ 刪除</button></div>` : "";
  return `<li class="ex-item${open ? " open" : ""}"><button type="button" class="ex-row" data-exrow="${e.id}" aria-expanded="${open}">
      <span class="ex-ic" aria-hidden="true">${[...catOf(e.category)][0]}</span>
      <span class="ex-main"><b>${esc(e.title)}</b><small>${esc(nameOf(e.paid_by))} 付・${mode}${mine}</small></span>
      <span class="ex-amt"><b>${money(sh.total, cur)}</b>${cur !== "TWD" ? `<small>≈ ${money(toTwd(sh.total, e), "TWD")}</small>` : ""}</span></button>
    ${open ? `<div class="ex-more"><ul class="ex-detail">${rows}</ul>${sh.r.rem ? `<p class="muted ex-hint">除不盡的 ${money(sh.r.rem, cur)} 算在付款人身上</p>` : ""}<p class="muted ex-hint">${meta}</p>${btns}</div>` : ""}</li>`;
}

function listHTML() {
  const all = sorted();
  if (!all.length) return `<p class="muted ex-empty">還沒有任何記帳。</p>`;
  const L = all.map(e => [e, shareOf(e)]).filter(([e, sh]) => (!LS.cat || e.category === LS.cat) && (!LS.who || involves(e, LS.who, sh)));
  const twdSum = list => list.reduce((a, [e, sh]) => a + toTwd(sh.total, e), 0);
  const mine = LS.who ? L.reduce((a, [e, sh]) => a + toTwd(sh.r.map.get(LS.who) || 0, e), 0) : 0;
  const head = `<p class="ex-sum">${L.length} 筆・合計 ≈ <b>${money(twdSum(L), "TWD")}</b>${LS.who ? `<br>其中 ${esc(nameOf(LS.who))} 分攤 ≈ <b>${money(mine, "TWD")}</b>` : ""}</p>`;
  const body = [...new Set(L.map(([e]) => e.spent_on))].map(d => {
    const items = L.filter(([e]) => e.spent_on === d);
    return `<div class="ex-day"><div class="ex-dayh"><span>${dayLabel(d)}</span><span>≈ ${money(twdSum(items), "TWD")}</span></div>
      <ul class="ex-items">${items.map(([e, sh]) => itemHTML(e, sh)).join("")}</ul></div>`;
  }).join("");
  return `<div class="ex-sub ex-listh">📋 帳目清單</div>${filterHTML()}${L.length ? head + body : `<p class="muted ex-empty">沒有符合條件的帳。</p>`}
    <p class="muted ex-hint">台幣金額用每筆記帳當下存的匯率換算。點一筆可以看分攤明細。</p>`;
}
const refreshList = () => { const b = $("#ex-list"); if (b) b.innerHTML = listHTML(); };

// 修改：把這筆的內容帶回表單
function startEdit(e) {
  const sh = shareOf(e), ids = new Set(activeTravelers().map(t => t.id));
  if (![e.paid_by, ...sh.splits.map(s => s.traveler_id)].every(id => ids.has(id))) { toast("這筆有已隱藏的成員，請先在「👥 旅行成員」恢復再修改"); return; }
  Object.assign(EX, { open: true, editId: e.id, cat: e.category, cur: e.currency, rate: String(Number(e.rate_to_base)), rateTouched: true, payer: e.paid_by, mode: e.split_mode,
    sel: new Set(sh.splits.map(s => s.traveler_id)), shares: Object.fromEntries(sh.splits.map(s => [s.traveler_id, String(Number(s.shares))])),
    exact: e.split_mode === "exact" ? Object.fromEntries(sh.splits.map(s => [s.traveler_id, String(Number(s.amount || 0))])) : {} });
  $("#ex-form").innerHTML = formHTML();
  $("#exDate").value = e.spent_on; $("#exTitle").value = e.title; $("#exAmt").value = String(Number(e.amount));
  $("#exPlace").value = e.place_id || ""; $("#exNote").value = e.note || "";
  $("#exSplit").innerHTML = splitHTML(); refreshRate();
  $("#ex-form").scrollIntoView({ behavior: "smooth", block: "start" });
}
// 修改完或取消：表單回到新增用的預設值
function endEdit(open) {
  Object.assign(EX, { open: !!open, editId: null, rateTouched: false, sel: null, shares: {}, exact: {}, mode: "equal" });
  $("#ex-form").innerHTML = formHTML();
}
const saveLabel = () => EX.editId ? "💾 儲存修改" : "💾 儲存這筆";

/* ---------- 重畫 ---------- */
const countText = () => { const n = ds.expenses().length; return n ? `共 ${n} 筆` : ""; };
function refresh() {
  const box = $("#ex-form"); if (!box) return;
  $("#ex-ed").innerHTML = statusHTML();
  $("#ex-count").textContent = countText();
  refreshList();
  const live = ds.mode === "live", has = !!box.firstElementChild;
  if (live !== has) { box.innerHTML = formHTML(); return; }   // 切換即時／唯讀才整個重畫，避免清掉輸入中的內容
  if (!live || !EX.open) return;
  const ae = document.activeElement;
  if (ae && box.contains(ae) && ae.matches("input,select")) { EX.pending = true; return; }   // 輸入到一半先不動
  EX.pending = false;
  syncState();
  const pay = $("#exPayer");
  if (pay) pay.innerHTML = activeTravelers().map(t => `<option value="${t.id}"${t.id === EX.payer ? " selected" : ""}>${esc(t.nickname)}</option>`).join("");
  $("#exSplit").innerHTML = splitHTML();
  $("#exRateBox").innerHTML = rateHTML();
}
ds.ready().then(refresh);
ds.on("change", refresh);
document.addEventListener("focusout", () => { if (EX.pending) setTimeout(() => { if (EX.pending) refresh(); }, 50); });

const redrawDetail = () => { const d = $("#exDetail"); if (d) d.innerHTML = detailHTML(); };
const msg = t => { const m = $("#exMsg"); if (m) m.textContent = t || ""; };

/* ---------- 儲存 ---------- */
async function save() {
  const cur = EX.cur, title = $("#exTitle").value.trim(), amtStr = $("#exAmt").value, total = toUnits(amtStr, cur);
  const rate = cur === "TWD" ? 1 : Math.round(parseFloat(EX.rate) * 1e8) / 1e8;
  const sel = activeTravelers().filter(t => EX.sel.has(t.id));
  if (!$("#exDate").value) return msg("請選日期");
  if (!title) { $("#exTitle").focus(); return msg("請填項目"); }
  if (!(total > 0)) { $("#exAmt").focus(); return msg("請填金額"); }
  if (!(rate > 0)) { const r = $("#exRate"); if (r) r.focus(); return msg("請填匯率"); }
  if (!EX.payer) return msg("請選誰付的");
  if (!sel.length) return msg("請至少選一位分攤的人");
  const splits = sel.map(t => EX.mode === "shares" ? { traveler_id: t.id, shares: Number(EX.shares[t.id] ?? 1) || 0 }
    : EX.mode === "exact" ? { traveler_id: t.id, shares: 1, amount: toUnits(EX.exact[t.id], cur) / minor(cur) } : { traveler_id: t.id, shares: 1 });
  const chk = splitUnits(total, cur, EX.mode, splits, EX.payer);
  if (!chk.ok) return msg(EX.mode === "exact" ? `指定金額加總${chk.diff > 0 ? "還差" : "多了"} ${money(Math.abs(chk.diff), cur)}` : "份數加總要大於 0");
  msg("");
  if (!await ensureEditor()) return;
  const p = { spent_on: $("#exDate").value, title, category: EX.cat, amount: total / minor(cur), currency: cur, rate_to_base: rate,
    paid_by: EX.payer, split_mode: EX.mode, place_id: $("#exPlace").value || null, note: $("#exNote").value.trim() || null, splits };
  const editId = EX.editId;
  if (editId) p.id = editId;
  const btn = $("#exSave"); btn.disabled = true; btn.textContent = "儲存中…";
  try {
    await ds.upsertExpense(p);
    if (editId) {
      toast(`已更新「${title}」`); endEdit(false); LS.open.add(editId); refreshList();
      const r = document.querySelector(`[data-exrow="${editId}"]`); if (r) r.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    toast(`已記下「${title}」${money(total, cur)}`);
    // 日期、幣別、匯率、付款人、分攤設定保留，方便連續記好幾筆
    ["#exTitle", "#exAmt", "#exNote"].forEach(s => { $(s).value = ""; });
    $("#exPlace").value = ""; EX.exact = {}; redrawDetail(); refreshRate(); $("#exTitle").focus();
  } catch (e) { pkError(e); }
  btn.disabled = false; btn.textContent = saveLabel();
}

const refreshRate = () => { const b = $("#exRateBox"); if (b) b.innerHTML = rateHTML(); };
// 只更新換算金額，不重畫匯率欄（避免輸入時游標跳掉）
const refreshConv = () => {
  const r = parseFloat(EX.rate), amt = parseFloat($("#exAmt").value), h = $("#exRateBox .ex-conv");
  const txt = EX.cur !== "TWD" && r > 0 && amt > 0 ? `≈ NT$${(Math.round(amt * r * 100) / 100).toLocaleString("en-US")}` : "";
  if (h) h.textContent = txt; else if (txt) { const p = $("#exRateBox .ex-hint"); if (p) p.insertAdjacentHTML("beforeend", `<b class="ex-conv">${txt}</b>`); }
};

function setCur(c) {
  EX.cur = c; EX.rateTouched = false; EX.exact = {};
  syncState();
  $("#exAmt").step = minor(c) > 1 ? "0.01" : "1";
  $("#exCur").innerHTML = currencies().map(x => `<option value="${x}"${x === c ? " selected" : ""}>${x}${CUR_NAME[x] ? ` ${CUR_NAME[x]}` : ""}</option>`).join("") + `<option value="+">＋ 其他幣別</option>`;
  refreshRate(); redrawDetail();
}

document.addEventListener("click", async e => {
  const t = e.target;
  if (!t.closest("#ex-card")) return;
  if (t.closest("[data-exopen]")) { if (!await ensureEditor()) return; EX.open = true; $("#ex-form").innerHTML = formHTML(); $("#exTitle").focus(); return; }
  if (t.closest("[data-exclose]")) { if (EX.editId) endEdit(false); else { EX.open = false; $("#ex-form").innerHTML = formHTML(); } return; }
  const row = t.closest("[data-exrow]");
  if (row) { const id = row.dataset.exrow; LS.open.has(id) ? LS.open.delete(id) : LS.open.add(id); refreshList(); return; }
  const ed = t.closest("[data-exedit]");
  if (ed) { const x = ds.expenses().find(e => e.id === ed.dataset.exedit); if (!x || !await ensureEditor()) return; startEdit(x); return; }
  const del = t.closest("[data-exdel]");
  if (del) {
    const x = ds.expenses().find(e => e.id === del.dataset.exdel); if (!x || !await ensureEditor()) return;
    if (!confirm(`確定要刪除「${x.title}」${money(toUnits(x.amount, x.currency), x.currency)} 嗎？`)) return;
    try {
      await ds.deleteExpense(x.id);
      if (EX.editId === x.id) endEdit(false);
      toastAction(`已刪除「${x.title}」`, "復原", () => ds.restoreExpense(x.id).then(() => toast("已復原")).catch(pkError));
    } catch (err) { pkError(err); }
    return;
  }
  if (t.id === "exSave") { save(); return; }
  const c = t.closest("[data-excat]");
  if (c) { EX.cat = c.dataset.excat; document.querySelectorAll("[data-excat]").forEach(b => b.setAttribute("aria-pressed", b === c)); return; }
  if (t.closest("[data-exrate]")) { EX.rateTouched = false; syncState(); refreshRate(); return; }
  const s = t.closest("[data-exsel]");
  if (s) { const id = s.dataset.exsel; EX.sel.has(id) ? EX.sel.delete(id) : EX.sel.add(id); s.setAttribute("aria-pressed", EX.sel.has(id)); redrawDetail(); return; }
  const q = t.closest("[data-exq]");
  if (q) { const g = q.dataset.exq; EX.sel = new Set(activeTravelers().filter(x => g === "*" || x.group_label === g).map(x => x.id)); $("#exSplit").innerHTML = splitHTML(); return; }
  const m = t.closest("[data-exmode]");
  if (m) { EX.mode = m.dataset.exmode; $("#exSplit").innerHTML = splitHTML(); return; }
});

document.addEventListener("input", e => {
  const t = e.target;
  if (!t.closest || !t.closest("#ex-card")) return;
  if (t.id === "exAmt") { redrawDetailKeep(); refreshConv(); msg(""); return; }
  if (t.id === "exRate") { EX.rate = t.value; EX.rateTouched = true; refreshConv(); return; }
  if (t.dataset.exshare) { EX.shares[t.dataset.exshare] = t.value; redrawDetailKeep(); return; }
  if (t.dataset.exexact) { EX.exact[t.dataset.exexact] = t.value; redrawDetailKeep(); return; }
  if (t.id === "exTitle") msg("");
});
// 份數、指定金額輸入時只更新算出來的數字和提示，不重畫輸入框
function redrawDetailKeep() {
  const box = $("#exDetail"); if (!box) return;
  const ae = document.activeElement;
  if (!ae || !box.contains(ae)) { redrawDetail(); return; }
  const tmp = document.createElement("div"); tmp.innerHTML = detailHTML();
  box.querySelectorAll(".ex-detail li").forEach((li, i) => { const nb = tmp.querySelectorAll(".ex-detail li")[i], b = li.querySelector("b"), b2 = nb && nb.querySelector("b"); if (b && b2) b.textContent = b2.textContent; });
  box.querySelectorAll(":scope > p").forEach(p => p.remove());
  tmp.querySelectorAll(":scope > p").forEach(p => box.appendChild(p));
}

document.addEventListener("change", e => {
  const t = e.target;
  if (t.id === "exPayer") { EX.payer = t.value; redrawDetail(); return; }
  if (t.id === "exFWho" || t.id === "exFCat") { LS[t.id === "exFWho" ? "who" : "cat"] = t.value; refreshList(); return; }
  if (t.id === "exCur") {
    if (t.value !== "+") { setCur(t.value); return; }
    const c = String(prompt("輸入幣別代碼（3 個英文字母，例如 USD、KRW）", "") || "").trim().toUpperCase();
    if (/^[A-Z]{3}$/.test(c)) setCur(c); else { if (c) toast("幣別代碼要是 3 個英文字母"); t.value = EX.cur; }
  }
});
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.isComposing && (e.target.id === "exTitle" || e.target.id === "exAmt" || e.target.id === "exNote")) { e.preventDefault(); save(); }
});
