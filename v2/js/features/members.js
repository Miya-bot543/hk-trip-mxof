/* 08 旅行成員：記帳分帳用的旅伴名單，由旅伴在網站上自由增減（需通關碼）。
   刪除時，已有記帳紀錄的人改成隱藏（帳目保留），沒有紀錄的直接刪除。 */
import { $, esc, toast, toastAction } from "../util.js";
import { ds } from "../datastore.js";
import { ensureEditor, editorStatusHTML } from "./editor.js";
import { pkError } from "./pocket.js";

const MB = { editing: null, pending: false };
const COLORS = ["#e88db4", "#5fa8d6", "#9a7fd6", "#e9a23b", "#4fb38a", "#e0705a", "#7a8be0", "#c27bd1"];
const norm = s => String(s || "").trim().replace(/\s+/g, " ");
const sorted = list => list.slice().sort((a, b) => (a.sort - b.sort) || String(a.nickname).localeCompare(b.nickname));
export const activeTravelers = () => sorted(ds.travelers().filter(t => t.active));
export const travelerGroups = () => [...new Set(activeTravelers().map(t => t.group_label).filter(Boolean))];

const statusHTML = () => {
  if (ds.mode === "offline") return `<div class="caution">📴 目前沒有網路，顯示最後一次讀到的名單，連上網路後才能修改。</div>`;
  if (ds.mode !== "live") return `<div class="caution">📌 目前為唯讀模式，暫時無法新增或修改。</div>`;
  return editorStatusHTML("共用名單：輸入通關碼後，就能新增或修改成員。", "共用中：新增、修改、刪除，打開網站都看得到。");
};

function rowHTML(t, live) {
  const me = norm(ds.me()) === t.nickname;
  if (MB.editing === t.id) return `<li class="mb-row editing" data-mbid="${t.id}">
    <div class="mb-edit"><label>名稱<input type="text" id="mbEName" maxlength="8" value="${esc(t.nickname)}"></label>
      <label>分組（選填）<input type="text" id="mbEGroup" maxlength="12" list="mbGroups" value="${esc(t.group_label || "")}" placeholder="不分組"></label></div>
    <div class="row mb-btns"><button class="btn" data-mbsave="${t.id}">儲存</button><button class="btn ghost" data-mbcancel>取消</button></div></li>`;
  return `<li class="mb-row" data-mbid="${t.id}">
    <span class="mb-dot" style="background:${esc(t.color || COLORS[0])}">${esc([...t.nickname][0] || "?")}</span>
    <span class="mb-name">${esc(t.nickname)}${me ? '<small class="mb-me">我</small>' : ''}</span>
    ${live ? `<span class="mb-ops"><button class="linkbtn" data-mbedit="${t.id}">修改</button><button class="linkbtn" data-mbdel="${t.id}">刪除</button></span>` : ''}</li>`;
}

function listHTML() {
  if (!ds.trip()) return `<p class="muted">成員名單讀取中…</p>`;
  const live = ds.mode === "live", act = activeTravelers(), hidden = sorted(ds.travelers().filter(t => !t.active));
  if (!act.length && !hidden.length) return `<p class="muted mb-empty">還沒有成員。${live ? "先在下面輸入名稱新增，記帳時才能選誰付錢、誰分攤。" : ""}</p>`;
  const groups = [...travelerGroups().map(g => [g, act.filter(t => t.group_label === g)]), ["", act.filter(t => !t.group_label)]].filter(([, L]) => L.length);
  return groups.map(([g, L]) => `<div class="mb-grp"><b>${g ? esc(g) : (groups.length > 1 ? "未分組" : "全部成員")}<span class="muted">（${L.length}）</span></b>
    <ul class="mb-list">${L.map(t => rowHTML(t, live)).join("")}</ul></div>`).join("")
    + (hidden.length ? `<p class="muted mb-hidden">已隱藏（有記帳紀錄，結算仍會計入）：${hidden.map(t => `${esc(t.nickname)}${live ? ` <button class="linkbtn" data-mbshow="${t.id}">恢復</button>` : ''}`).join("、")}</p>` : "");
}

function formHTML() {
  if (ds.mode !== "live") return "";
  return `<div class="mb-add">
    <label>新增成員<input type="text" id="mbName" maxlength="8" placeholder="最多 8 字"></label>
    <label>分組（選填）<input type="text" id="mbGroup" maxlength="12" list="mbGroups" placeholder="例如：中華組"></label>
    <button class="btn" id="mbAdd">＋ 新增</button></div><p class="muted mb-msg" id="mbMsg"></p>`;
}

export function membersSectionHTML() {
  MB.editing = null;
  return `<div class="card ice" id="mb-card"><div class="htop"><span class="tag ice">👥 旅行成員</span><span class="nights" id="mb-count"></span></div>
    <div id="mb-ed">${statusHTML()}</div><div id="mb-list">${listHTML()}</div><div id="mb-form">${formHTML()}</div>
    <datalist id="mbGroups"></datalist></div>`;
}

function refresh() {
  const box = $("#mb-list"); if (!box) return;
  const ae = document.activeElement;
  if (ae && ae.tagName === "INPUT" && ae.closest("#mb-list")) { MB.pending = true; return; }   // 修改到一半不重畫
  MB.pending = false;
  $("#mb-ed").innerHTML = statusHTML();
  box.innerHTML = listHTML();
  const hasForm = !!$("#mbName"), live = ds.mode === "live";
  if (hasForm !== live) $("#mb-form").innerHTML = formHTML();   // 切換即時／唯讀時才重畫，避免清掉輸入中的文字
  const n = activeTravelers().length; $("#mb-count").textContent = n ? `👥 ${n} 位` : "";
  $("#mbGroups").innerHTML = travelerGroups().map(g => `<option value="${esc(g)}">`).join("");
}
ds.ready().then(refresh);
ds.on("change", refresh);
document.addEventListener("focusout", () => { if (MB.pending) setTimeout(() => { if (MB.pending) refresh(); }, 50); });

// 名稱不能和別人重複（含已隱藏的成員）
const taken = (name, exceptId) => ds.travelers().some(t => t.id !== exceptId && t.nickname === name);

async function add() {
  const name = norm($("#mbName").value), group = norm($("#mbGroup").value), msg = $("#mbMsg");
  if (!name) { msg.textContent = "請先輸入成員名稱"; $("#mbName").focus(); return; }
  if (taken(name)) { msg.textContent = `已經有「${name}」了，換個名稱吧`; return; }
  if (!await ensureEditor()) return;
  const all = ds.travelers(), sort = all.reduce((m, t) => Math.max(m, t.sort || 0), 0) + 1;
  const btn = $("#mbAdd"); btn.disabled = true; msg.textContent = "儲存中…";
  try {
    await ds.upsertTraveler({ nickname: name, group_label: group || null, color: COLORS[all.length % COLORS.length], sort, active: true });
    $("#mbName").value = ""; msg.textContent = ""; toast(`已新增「${name}」`); $("#mbName").focus();
  } catch (e) { msg.textContent = ""; pkError(e); }
  btn.disabled = false; refresh();
}

async function save(id) {
  const t = ds.travelers().find(x => x.id === id); if (!t) return;
  const name = norm($("#mbEName").value), group = norm($("#mbEGroup").value);
  if (!name) { toast("名稱不能空白"); return; }
  if (taken(name, id)) { toast(`已經有「${name}」了，換個名稱吧`); return; }
  if (!await ensureEditor()) return;
  try {
    await ds.upsertTraveler(Object.assign({}, t, { nickname: name, group_label: group || null }));
    // 改的是自己的名字，記帳時的「我是誰」也一起改
    if (norm(ds.me()) === t.nickname && name !== t.nickname) ds.setMe(name);
    MB.editing = null; toast("已儲存修改");
  } catch (e) { pkError(e); }
  document.activeElement && document.activeElement.blur(); refresh();
}

async function del(id) {
  const t = ds.travelers().find(x => x.id === id); if (!t) return;
  if (!await ensureEditor()) return;
  if (!confirm(`確定要刪除成員「${t.nickname}」嗎？\n已有記帳紀錄的話會改成隱藏，帳目保留。`)) return;
  try {
    const r = await ds.deleteTraveler(id);
    const back = () => ds.upsertTraveler(Object.assign({}, t, { active: true })).then(() => toast("已復原")).catch(pkError);
    toastAction(r === "hidden" ? `「${t.nickname}」有記帳紀錄，已改成隱藏` : `已刪除「${t.nickname}」`, "復原", back);
  } catch (e) { pkError(e); }
}

document.addEventListener("click", async e => {
  const t = e.target;
  if (t.id === "mbAdd") { add(); return; }
  const ed = t.closest("[data-mbedit]"); if (ed) { if (!await ensureEditor()) return; MB.editing = ed.dataset.mbedit; refresh(); const n = $("#mbEName"); if (n) n.focus(); return; }
  if (t.closest("[data-mbcancel]")) { MB.editing = null; refresh(); return; }
  const sv = t.closest("[data-mbsave]"); if (sv) { save(sv.dataset.mbsave); return; }
  const dl = t.closest("[data-mbdel]"); if (dl) { del(dl.dataset.mbdel); return; }
  const sh = t.closest("[data-mbshow]");
  if (sh) { const x = ds.travelers().find(y => y.id === sh.dataset.mbshow); if (!x || !await ensureEditor()) return;
    ds.upsertTraveler(Object.assign({}, x, { active: true })).then(() => toast(`已恢復「${x.nickname}」`)).catch(pkError); }
});
document.addEventListener("input", e => { if (e.target.id === "mbName" || e.target.id === "mbGroup") { const m = $("#mbMsg"); if (m) m.textContent = ""; } });
document.addEventListener("keydown", e => {
  if (e.key !== "Enter" || e.isComposing) return;
  if (e.target.id === "mbName" || e.target.id === "mbGroup") { e.preventDefault(); add(); }
  else if (e.target.id === "mbEName" || e.target.id === "mbEGroup") { e.preventDefault(); if (MB.editing) save(MB.editing); }
});
