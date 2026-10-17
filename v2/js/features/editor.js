/* 通關碼與「我是誰」：第一次要新增／修改／刪除時跳出小視窗，之後記在手機。 */
import { $, esc } from "../util.js";
import { ds } from "../datastore.js";

function dialogHTML(needCode){
  const names=ds.travelers().filter(t=>t.active).map(t=>t.nickname);
  return `<form method="dialog" class="ed-form">
    <h3>🔑 ${needCode?'輸入通關碼':'你是哪位旅伴'}</h3>
    <p class="muted">${needCode?'輸入一次後這支手機會記住，之後不用再輸入。':'新增或修改時會記錄是誰改的。'}</p>
    ${needCode?'<label>通關碼<input type="password" id="edCode" autocomplete="current-password" required></label>':''}
    <label>你的暱稱（最多 8 字）<input type="text" id="edMe" maxlength="8" list="edMeList" required value="${esc(ds.me())}"></label>
    <datalist id="edMeList">${names.map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
    <p class="ed-msg" id="edMsg" role="alert"></p>
    <div class="row"><button class="btn" value="ok" id="edOk">確認</button><button class="btn ghost" value="cancel" formnovalidate>取消</button></div>
  </form>`;
}

/* 確保可以編輯：回傳 true 表示通關碼與暱稱都已就緒 */
export function ensureEditor(){
  if(ds.mode!=="live"){ alert(ds.mode==="offline"?"目前沒有網路，連上網路後才能修改。":"目前為唯讀模式，暫時無法修改。"); return Promise.resolve(false); }
  if(ds.canEdit() && ds.me()) return Promise.resolve(true);
  const needCode=!ds.canEdit();
  let d=$("#edDialog"); if(!d){ d=document.createElement("dialog"); d.id="edDialog"; document.body.appendChild(d); }
  d.innerHTML=dialogHTML(needCode);
  return new Promise(resolve=>{
    const form=d.querySelector("form"), msg=d.querySelector("#edMsg"), ok=d.querySelector("#edOk");
    form.addEventListener("submit",async e=>{
      if(e.submitter && e.submitter.value==="cancel"){ return; }
      e.preventDefault();
      const me=d.querySelector("#edMe").value.trim();
      if(!me){ msg.textContent="請填寫暱稱"; return; }
      if(needCode){
        const code=d.querySelector("#edCode").value;
        ok.disabled=true; msg.textContent="確認中…";
        try{ if(!await ds.verifyCode(code)){ msg.textContent="通關碼不正確，請再確認一次"; ok.disabled=false; return; } }
        catch(err){ msg.textContent="暫時無法連線，請稍後再試"; ok.disabled=false; return; }
      }
      ds.setMe(me); d.close("ok");
    });
    d.addEventListener("close",()=>resolve(d.returnValue==="ok" && ds.canEdit() && !!ds.me()),{once:true});
    d.returnValue=""; d.showModal();
    const first=d.querySelector(needCode?"#edCode":"#edMe"); if(first) first.focus();
  });
}

/* 共用狀態列：沒輸入通關碼時有「輸入通關碼」按鈕，輸入後顯示暱稱、換人、登出 */
export function editorStatusHTML(guest, member){
  if(ds.mode!=="live") return "";
  if(!ds.canEdit()) return `<div class="caution">👥 ${guest}<div class="ed-line"><span>🔒 尚未輸入通關碼</span><button type="button" class="btn ed-login" data-edlogin>🔑 輸入通關碼</button></div></div>`;
  return `<div class="caution">👥 ${member}<div class="ed-line"><span>✍️ 目前是 ${esc(ds.me()||"旅伴")}</span><button type="button" class="linkbtn" data-edswitch>換人</button><button type="button" class="linkbtn" data-edlogout>登出通關碼</button></div></div>`;
}
document.addEventListener("click",async e=>{
  if(e.target.closest("[data-edlogin]")){ await ensureEditor(); return; }
  if(e.target.closest("[data-edlogout]")){ if(confirm("登出後要再輸入通關碼才能修改，確定嗎？")) ds.logout(); return; }
  if(e.target.closest("[data-edswitch]")){ const n=prompt("你的暱稱（最多 8 字）", ds.me()); if(n && n.trim()) ds.setMe(n); }
});
