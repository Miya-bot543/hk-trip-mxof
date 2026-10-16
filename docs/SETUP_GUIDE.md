# 帳號與設定步驟（使用者用）

> 給 Claude Code：只有在規格書第 9 節的時機，才把對應段落轉述給使用者，一次只講一段，等使用者回覆「完成」再繼續。
> 給使用者：畫面上的按鈕名稱可能因網站改版略有不同，找不到時截圖傳給 Claude Code 或 Claude，問下一步要按哪裡。

---

## A. 建立 Supabase 帳號與專案（約 5 分鐘）
1. 用電腦打開 https://supabase.com ，按右上角 **Start your project**（或 **Sign in**）。
2. 選 **Continue with GitHub**，用你平常的 GitHub 帳號登入，按 **Authorize** 授權。
3. 如果要求建立組織（Organization）：名稱隨意（例如 `my-family`），方案選 **Free**，按建立。
4. 按 **New project**，填寫：
   - **Name**：`hk-trip`
   - **Database Password**：按 **Generate a password** 產生，**複製後存到手機備忘錄**（之後 Claude Code 可能會問你）
   - **Region**：選 **Northeast Asia (Tokyo)**（離台灣和北海道最近）
   - **Plan**：Free
5. 按 **Create new project**，等 1～2 分鐘，畫面出現專案儀表板就完成了。
6. 回覆 Claude Code：「Supabase 專案建好了」。

> 費用：Free 方案 $0，不需要綁信用卡。一週沒有人使用會自動暫停，我們已設定自動排程避免這件事。

---

## B. 讓 Claude Code 可以建立資料表（二選一）

**方法 1：授權 Claude Code（推薦）**
1. Claude Code 執行 `supabase login` 後，你的電腦會自動打開瀏覽器。
2. 在瀏覽器頁面按 **Authorize**（授權）。
3. 如果瀏覽器顯示一串驗證碼，照 Claude Code 的說明貼回去即可。
4. 回覆 Claude Code：「授權完成」。之後它會自己建立資料表。

**方法 2：自己貼上執行**
1. 在 Supabase 專案左側選單點 **SQL Editor**。
2. 按 **New query**。
3. 用文字編輯器打開 `schema.sql`，全選、複製，貼到 SQL Editor。
4. 按右下角 **Run**。看到 **Success** 就完成了（出現 NOTICE 訊息是正常的）。

---

## C. 設定家庭通關碼（只有家人知道，用來新增／修改／刪除）
1. 先想一組通關碼：**至少 6 個字元**，英文＋數字，例如 `snow2026tw`（請換成你自己的）。不要用生日或電話。
2. 在 Supabase 左側選單點 **SQL Editor** → **New query**，貼上下面這一行，把 `你的通關碼` 換成你想好的：
   ```
   select public.set_edit_code((select id from public.trips where slug = 'hokkaido-2026'), '你的通關碼');
   ```
3. 按 **Run**，看到 Success 就完成了。
4. **執行完把這個查詢刪掉**（不要儲存），通關碼存在你自己的手機備忘錄就好。
5. 之後想換通關碼，重做一次即可，舊的會立刻失效。

> 通關碼不會寫在網站或 GitHub 裡；家人第一次要編輯時輸入一次，手機會記住。

---

## D. 提供旅伴暱稱（記帳分帳用）
回覆 Claude Code 7 位旅伴的**暱稱**與分組，不要用真實全名，例如：
```
中華組：爸爸、媽媽、哥哥、妹妹
星宇組：阿姨、姨丈、表弟
```

---

## E. GitHub Secrets（通常不用做）
Claude Code 會用指令幫你設定。若它說權限不足，請：
1. 打開 https://github.com/miya-bot543/hk-trip-mxof → **Settings** → 左側 **Secrets and variables** → **Actions**。
2. 按 **New repository secret**，依 Claude Code 提供的名稱與內容新增（例如 `SUPABASE_URL`、`SUPABASE_ANON_KEY`）。

---

## F. 分享給家人
在 LINE 傳兩則**分開的訊息**：
1. 網址：https://miya-bot543.github.io/hk-trip-mxof/
2. 通關碼（只傳給家人）

並提醒家人：
- 出發前用手機打開網站一次（離線也能看）。
- iPhone：Safari「分享」→「加入主畫面」；Android：Chrome「⋮」→「安裝應用程式」。
- 第一次要新增或修改時，輸入通關碼並選「我是誰」。

---

## G. 旅程結束後封存（讓網站永久可看）
告訴 Claude Code：「北海道網站要封存」。它會：
1. 執行最後一次快照，把所有資料存成 `data/snapshot.json`。
2. 把網站設定改成唯讀（`LIVE_ENABLED=false`），之後不再連資料庫。
3. 停用 keep-alive 排程。

完成後，網站會永久留在 GitHub 上可以瀏覽（行程、口袋名單、帳目都在），Supabase 專案可以保留或刪除，都不影響網站。
