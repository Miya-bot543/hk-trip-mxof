# 北海道 10 日遊 v2 規格書（給 Claude Code）

> **請先讀同資料夾的 `CURRENT_SITE.md`**：v1 是使用者在 Claude 對話中逐步做出來的，你之前只負責上傳，這份文件說明 v1 的設計、功能與可以沿用的程式。v2 是在 v1 上「延伸」，不是重做。
>
> 使用者不是工程師。所有需要使用者操作的步驟，請**先停下來**，用簡單的繁體中文一步一步說明要點哪裡、按什麼，等使用者回覆「完成」再繼續。帳號設定的說明請參考同資料夾的 `SETUP_GUIDE.md`，用到哪一段再把那一段轉述給使用者。

---

## 0. 目標與原則

**要解決的問題**：目前網站的每日行程、口袋名單是寫死在網頁裡，家人無法自己新增／刪除／修改；也沒有記帳分帳。

**v2 要加入**
1. 景點、餐廳、購物、住宿等地點資料的新增、編輯、刪除（全家共用）。
2. 收藏清單（口袋名單）與每日行程分離。
3. 多人共同編輯、即時同步（**不需要登入**，編輯時輸入一次「家庭通關碼」）。
4. 每日行程規劃板：固定骨架鎖定＋自由增刪＋拖曳排序＋一鍵順路排序。
5. 多幣別記帳與分帳。

**最高原則（依優先順序）**
1. **改動最小、保留既有畫面**：現有的配色、字型、圖片、卡片樣式、章節順序、互動（今天模式、日夜切換、司機地址卡、天氣、💱換算、收合區塊、Visit Japan Web 小抄…）全部保留。
2. **免費優先**：GitHub Pages＋Supabase Free。不使用 Next.js、Vercel、付費 API。
3. **容易維護**：純 HTML/CSS/JavaScript（ES modules），**不需要建置工具**，原始碼就是上線檔案。
4. **Supabase 停用後網站仍可看**：任何時候資料庫連不上、被暫停或刻意停用，網站都要能以「唯讀快照」完整顯示。
5. **不放個人資料**：不放真實姓名、訂單編號、私人手機號碼。旅伴只用暱稱。

---

## 1. 現況（請先閱讀）

### 1.1 檔案位置
- 本機資料夾：`/Users/mj/北海道網站/`
  - `index.html`（約 3 MB，單一檔案，含全部 HTML／CSS／JS 與 22 張以 base64 內嵌的圖片）
  - `sw.js`（離線快取，Service Worker）
  - `manifest.webmanifest`、`icon-192.png`、`icon-512.png`（加入主畫面用）
- GitHub 儲存庫：`hk-trip-mxof`（main 分支根目錄，GitHub Pages）
- 網站網址：https://miya-bot543.github.io/hk-trip-mxof/
- **注意**：使用者的 GitHub 還有其他專案，只能操作 `hk-trip-mxof`，其他儲存庫一律不要動。

### 1.2 技術現況
- 沒有框架、沒有建置工具、沒有外部 JS 函式庫。外部資源只有 Google Fonts（Zen Maru Gothic、Caveat）與 Open-Meteo 天氣 API（免金鑰）。
- 路由：hash 路由，`#/home`、`#/01`～`#/09`、`#/05?d=0..9`。主函式 `route()`，各頁由 `PAGES` 物件的函式回傳 HTML 字串後以 `innerHTML` 繪製。
- 事件：多個 `document.addEventListener("click", …)` 以 `data-*` 屬性做事件委派。
- HTML 跳脫函式：`esc()`。**所有來自資料庫的文字都必須經過 `esc()`**（多人編輯後更重要）。
- 檔案大小：圖片佔 96%（約 2.96 MB），JS 約 96 KB（約 1,100 行），CSS 約 24 KB。

### 1.3 資料目前的位置（寫死在 `index.html` 的 JS 常數）
| 常數 | 內容 | v2 去向 |
|---|---|---|
| `TRIP`、`FLIGHTS`、`FGROUPS` | 旅程、4 個航班（中華 4 位、星宇 3 位） | `data/static.js`（靜態，不進資料庫） |
| `HOTELS` | 4 間住宿（含第 2 筆訂房）、費用、亮點 | `data/static.js`；同時在 `places` 建立 category='hotel'、is_wishlist=false 的地點 |
| `RENTAL`、`TRANSIT`、`TRIP_ROUTES` | 租車、交通指南 | `data/static.js` |
| `DAYS` | 10 天的固定行程（`plan` 是字串陣列）、提醒、分組返台 | 轉成 `itinerary_items` 的固定骨架（locked=true） |
| `POCKET_SEED` | 21 筆口袋名單（結構完整） | 匯入 `places` |
| `PLACES`、`ROUTE`、`TODAY_PLACE` | 插畫地圖上的像素座標與路線 | 保留在 `data/static.js`（插畫地圖用，非經緯度） |
| `DRIVER` | 7 個司機地址卡（日文名稱、地址、電話，已人工核對） | `data/static.js`，**內容不可更改** |
| `BUDGET`、`CHECKLIST`、`CHAPTERS`、`WX_PLACES` | 預算、檢查清單、章節、天氣地點 | `data/static.js` |
| `HOTEL_IMG`、`CH_ICON`、`MASCOT`、`ACT_IMG`、`IMG_H`、`IMG_V`、`MAP_IMG`、`LINE_QR` | base64 圖片 | 拆成 `images/` 檔案 |

### 1.4 localStorage（只存在各自手機）
`hk-check`（檢查清單）、`hk-pocket`（舊版想去/已去）、`hk-rate`（匯率）、`hk-split`（分帳試算）、`hk-theme`（日夜模式手動覆寫）、`hk-wx`（天氣快取）。v2 新增：`hk-code`（家庭通關碼）、`hk-me`（我是哪位旅伴）、`hk-snapshot`（最後一次讀到的資料）。

### 1.5 已知問題（v2 要一併改善）
- `index.html` 過大且無法分開快取圖片。
- 每日行程無法增刪；口袋名單在 GitHub 版是唯讀。
- 沒有匯出／還原。
- `sw.js` 對 HTML 是「網路優先」但沒有逾時，收訊差時會等很久。
- 舊的 GitHub 版是由 Claude 版「文字替換」產生的，產生流程不在儲存庫裡。v2 之後**儲存庫就是唯一的原始碼**。

---

## 2. 目標架構

```
瀏覽器（GitHub Pages 靜態網站）
   ├─ 讀取：data/snapshot.json（唯讀快照，永遠可用）
   ├─ 讀取＋即時訂閱：Supabase（有設定且連得上時）
   └─ 寫入：Supabase RPC 函式（需家庭通關碼）
GitHub Actions
   ├─ keep-alive：每週 2 次讀取 Supabase，避免免費專案閒置暫停
   └─ snapshot：把 Supabase 資料存成 data/snapshot.json 並 commit
```

- Supabase JS：使用官方 `@supabase/supabase-js` v2 的瀏覽器版本，從 jsDelivr 以 `<script>` 載入，**鎖定確切版本號**（選一個發佈至少兩週以上的 2.x 版本，不要用 `@2` 或 `@latest`）。
- 不使用 Supabase Auth（不登入）。寫入權限由「家庭通關碼＋RPC」控制，詳見 `schema.sql`。
- 公開金鑰（anon / publishable key）可以放在前端；**service_role（secret）金鑰絕對不能進前端或 commit**，只能放 GitHub Actions secrets。

### 2.1 目錄結構（第一步就要完成）
```
/                      ← GitHub Pages 根目錄
├─ index.html          ← 只剩 HTML 骨架與 <script type="module" src="js/main.js">
├─ sw.js
├─ manifest.webmanifest
├─ icon-192.png, icon-512.png
├─ css/style.css
├─ images/             ← 從 base64 拆出的 22 張圖（建議轉 WebP 或品質 85 的 JPEG；檔名有語意，例如 cover-h.jpg）
├─ data/
│   ├─ static.js       ← 不會在網站上編輯的固定資料（航班、住宿資訊、司機卡…）
│   └─ snapshot.json   ← 唯讀快照（places / itinerary_items / travelers / fx_rates / expenses / expense_splits / place_marks）
├─ js/
│   ├─ main.js         ← 進入點、路由、全域初始化
│   ├─ config.js       ← SUPABASE_URL、SUPABASE_ANON_KEY、TRIP_SLUG、LIVE_ENABLED
│   ├─ util.js         ← esc()、store（localStorage）、日期、格式化、toast
│   ├─ datastore.js    ← 資料層（見第 3 節）
│   ├─ pages/          ← home.js、ch01.js … ch09.js（由原 PAGES 拆出，畫面不變）
│   ├─ features/       ← today.js、weather.js、driver.js、fx.js、vjw.js、planner.js、pocket.js、ledger.js
│   └─ lib/route-sort.js  ← 一鍵順路排序演算法（純函式，可單獨測試）
├─ scripts/            ← 一次性腳本：拆圖、匯入資料、地理編碼、產生快照
└─ .github/workflows/  ← keep-alive.yml、snapshot.yml
```

---

## 3. 資料層 `datastore.js`

### 3.1 三種模式（畫面右上角或頁首用小標示顯示目前模式）
| 模式 | 條件 | 行為 |
|---|---|---|
| 🟢 即時同步 | `LIVE_ENABLED=true` 且 Supabase 連得上 | 讀寫 Supabase，訂閱 Realtime 變更 |
| 🟡 唯讀快照 | `LIVE_ENABLED=false`、或 Supabase 無法連線／被暫停 | 讀 `data/snapshot.json`，所有新增／修改／刪除按鈕隱藏或停用，並顯示「目前為唯讀模式」 |
| 📴 離線 | 沒有網路 | 讀 localStorage 的 `hk-snapshot`（最後一次讀到的資料），停用寫入 |

- 啟動流程：先用 `hk-snapshot` 或 `data/snapshot.json` **立即畫面**（不要等網路），再背景連 Supabase，成功後替換為最新資料並開始訂閱。
- 每次讀到最新資料後寫回 `hk-snapshot`。
- Supabase 連線逾時 5 秒就視為無法連線，退回唯讀快照。

### 3.2 對外 API（各頁只呼叫這些，不直接碰 Supabase）
```
ds.ready()                        // Promise，初次資料就緒
ds.mode                           // 'live' | 'snapshot' | 'offline'
ds.canEdit()                      // mode==='live' 且已有正確通關碼
ds.places(), ds.items(day?), ds.travelers(), ds.fx(), ds.expenses(), ds.splits(), ds.marks()
ds.on('change', fn)               // 任何資料變更（含 Realtime）時通知重繪
ds.verifyCode(code)               // 呼叫 RPC verify_code，成功才存入 hk-code
ds.upsertPlace(p), ds.deletePlace(id), ds.restorePlace(id)
ds.setMark(placeId, {want, done})
ds.upsertItem(it), ds.reorderItems([{id,day,slot,position,start_time,end_time}]), ds.deleteItem(id), ds.restoreItem(id)
ds.upsertTraveler(t), ds.setFx(currency, rate)
ds.upsertExpense(e /* 含 splits */), ds.deleteExpense(id), ds.restoreExpense(id)
ds.recentChanges(limit)
ds.exportJSON() / ds.importJSON(file)   // 匯入時逐筆呼叫 upsert，需通關碼
```
- 所有寫入 RPC 都要帶 `p_trip`、`p_code`（`hk-code`）、`p_actor`（`hk-me` 的暱稱）。
- 錯誤處理：`invalid_code` → 清除 `hk-code`，請使用者重新輸入；`locked_item` → 提示「固定行程不能刪除或移動」；其他錯誤 → toast「暫時無法儲存，請稍後再試」，表單內容保留不清空。
- 樂觀更新（先改畫面再寫入），失敗時回復並提示。

### 3.3 家庭通關碼與「我是誰」
- 第一次按任何「新增／編輯／刪除」時，跳出小視窗：輸入通關碼（呼叫 `verify_code` 驗證）＋選擇「我是誰」（旅伴暱稱清單，可新增）。之後記在手機，不再詢問。

### 3.4 旅行成員管理
- 旅伴不預先建立，一開始為空，由家人在網站「旅行成員」區塊自行新增（輸入框「輸入成員名稱（最多8字）」＋「＋新增」按鈕）。
- 名稱上限 8 字（前端限制；資料庫 `nickname` 限制 1～20 字）。
- 分組選填：可從已有組別挑選、自行輸入新組別，或不分組（`group_label` 為空）。
- 可改名、改分組、刪除。刪除時：已有記帳紀錄（付款或分攤）的成員改為 `active=false` 隱藏；沒有紀錄的直接刪除（需補 `traveler_delete` RPC，5.3 實作時加入 schema）。
- 新增、修改、刪除都需通關碼，走 `traveler_upsert`／`traveler_delete` RPC。
- 頁尾或 09 章提供「更換身分／登出通關碼」。
- **通關碼不可寫在任何檔案或 commit 裡**。

---

## 4. 資料庫（Supabase）

完整建立指令在同資料夾的 `schema.sql`（已在 PostgreSQL 上實測：建立、重複執行、權限、通關碼、鎖定行程、記帳、軟刪除皆正常）。重點：

| 資料表 | 用途 |
|---|---|
| `trips` | 旅程（slug=`hokkaido-2026`）、主要幣別 TWD、通關碼雜湊（前端讀不到） |
| `travelers` | 旅伴（暱稱、選填 `group_label`、color、sort、active），由網站自由增減，人數不固定 |
| `places` | 地點資料庫＝收藏清單（spot/food/shop/hotel/…、area、venue、address、ja_*、lat/lng、stay_minutes、transport[]、tags[]、info{}、extra[]、note、is_wishlist） |
| `place_marks` | 每位旅伴的 ♡想去 / ✓已去 |
| `itinerary_items` | 每日行程（day、slot、position、place_id、place_snapshot、title、kind、start/end_time、locked、pinned、status、group_label） |
| `fx_rates` | 旅程共用匯率（1 外幣 = ? TWD） |
| `expenses`＋`expense_splits` | 多幣別記帳（原幣別金額＋記帳當下匯率）與分攤 |
| `change_log` | 變更紀錄（誰、何時、改了什麼），支援還原 |

- 讀取：任何人可讀（RLS select policy）；軟刪除（`deleted_at`）的資料不顯示。
- 寫入：資料表不開放匿名寫入；只能呼叫 RPC（`place_upsert`、`item_upsert`、`items_reorder`、`expense_upsert`…），每個 RPC 第一步驗證通關碼。
- 收藏與行程分離：從行程刪除不影響地點；刪除地點時行程保留 `place_snapshot` 並顯示「地點已刪除」。
- 套用方式：Claude Code 用 Supabase CLI（使用者需在瀏覽器授權一次）或請使用者在 SQL Editor 貼上執行。通關碼最後用 `set_edit_code` 設定，**請使用者自己在 SQL Editor 輸入**，或由使用者口頭提供後由你執行，但不可寫入任何檔案。

---

## 5. 第一階段（核心）

### 5.0 拆檔案（畫面零改變）
1. 先把目前網站完整截圖（手機 390px 與電腦 1280px，首頁與 01～09 每章、日夜模式各一）存在 `scripts/baseline/`，作為比對基準。
2. 依 2.1 拆出 css/js/images/data，網站外觀與功能必須和拆分前一致（再截圖比對）。
3. GitHub 版目前已移除姓名與訂單編號，`data/static.js` 維持這個狀態，**不要**加回任何個人資料。
4. 更新 `sw.js`：
   - HTML 與 `js/`、`css/`、`data/`：網路優先，**3 秒逾時**後改用快取。
   - `images/`：快取優先（圖片檔名改版時換檔名）。
   - 不快取 Supabase API 回應（由 `hk-snapshot` 負責離線資料）；Open-Meteo 維持網路優先＋快取備援。
   - 每次發佈改 `VERSION`；保留 `skipWaiting`＋`clients.claim`＋清舊快取。

### 5.1 匯入既有資料到 Supabase（一次性腳本，放 `scripts/`）
- `POCKET_SEED` 21 筆 → `places`（保留 `legacy_id`；`info`/`extra`/`tags`/`transport`/`venue` 原樣搬）。
- 4 間住宿 → `places`（category='hotel'、is_wishlist=false、ja_name/ja_address/phone 取自 `DRIVER`）。
- `DAYS` → `itinerary_items` 固定骨架（locked=true、kind='fixed'），例如：
  - 12/25 05:00 CI2130 桃園 T2 → 09:40 新千歲國際線（group_label=中華組）、取車、14:00 後入住 adex inn
  - 12/26 10:20 JX318 台中 → 15:00 新千歲國際線（星宇組）、取第 2 台車、入住 adex inn
  - 12/28 10:00 前退房、千歲市內加油、Map Code 113774672 還車、15:00 後入住 APA
  - 12/29 旭川一日遊（allday）
  - 12/31 10:00 前退房 APA、15:00 後入住札幌民宿
  - 01/01 手稻滑雪場（allday，預定）
  - 01/02 10:00 前退房民宿、16:00 JX319 返台中（星宇組）、14:00 後入住 Vessel（中華組）
  - 01/03 11:00 前退房（建議 07:30 出發）、10:40 CI2131 返桃園（中華組）
  - 原 `DAYS` 的 `alerts`、`split` 文字保留為 `note` 或固定項目。
- 地理編碼：為所有 `places` 補 `lat/lng`。可用 OpenStreetMap Nominatim（遵守使用政策：每秒最多 1 次、帶 User-Agent、只在腳本執行一次），查不到的列出來請使用者確認，或改用地區中心點並在 note 註明「座標為估算」。已知：adex inn ≈ 42.494643, 141.14383。
- 預設停留時間 `stay_minutes`：景點 60、美食 75、購物 60、大型園區 120（白色戀人公園、熊牧場、時代村、尼克斯 150）。
- 旅伴：不匯入，由家人在網站「旅行成員」區塊自行新增（見 3.4）。**不要自己編名字**。

### 5.2 口袋名單（07 章）
- 保留現有 UI：分類（景點・散步／購物／美食）、地區篩選、收合卡片（看詳細）、標籤列（📍地區、🏠室內／🌲戶外／🎡園區、自訂標籤）、分類專屬欄位、自訂欄位、地圖按鈕（有地址用地址，否則名稱＋地區）。
- 資料來源改為 `ds.places()`（is_wishlist=true）。
- 新增／修改表單沿用現有欄位，另加「建議停留時間」；儲存呼叫 `ds.upsertPlace`。
- 刪除：確認對話框 → 軟刪除；toast 提供「復原」按鈕（呼叫 restore）。
- 卡片新增「＋加入行程」：選日期與時段 → 建立 `itinerary_items`（place_snapshot 寫入當下名稱、地址、座標）。
- ♡想去／✓已去改為 `place_marks`（依「我是誰」），顯示想去人數。唯讀模式下改存本機 `hk-pocket`。

### 5.3 每日行程規劃板（05 章）
保留 05 章現有頂部日期按鈕、當日標題卡、住宿卡、航班卡、分組返台提示；把「今日安排」清單換成規劃板：

- 每天分 `allday`（整日固定，例如旭川、滑雪）、`morning`、`afternoon`、`evening` 四區。
- 固定骨架顯示 🔒，不能拖曳、刪除、被排序移動；可展開看備註。
- 每個行程卡：時間（可空）、名稱、地區標籤、預估停留、與上一站之間的移動估算、狀態（必去／備案）、📌釘選、⋯選單（移到別天、改時段、編輯備註、刪除）、🗺️ 地圖、🚕 司機卡（地點有日文地址時）。
- 新增方式：①從口袋名單挑（搜尋＋分類篩選）②「新增自訂行程」（名稱、地址、時段；地址可選擇同時存成口袋名單）。
- 拖曳排序：支援觸控（pointer events），同時提供 ↑↓ 按鈕作為替代（無障礙、手機穩定）。
- **一鍵順路排序**（`lib/route-sort.js`，純函式）：
  1. 起點＝當晚住宿（`DAYS[d].stay`，換宿日上午用前一晚住宿、下午起用新住宿）；終點＝當晚住宿。
  2. 只排未鎖定、未釘選的行程；釘選項目保留時間成為時間錨點。
  3. 最近鄰居法建立初始路線，再用 2-opt 改善（地點數少，直接算即可）。
  4. 依時段起點（上午 09:30、下午 13:30、晚上 18:00）＋停留時間＋移動估算，自動填 start/end_time。
  5. 營業時間（`info.hours` 能解析出 HH:MM～HH:MM 的才用）不符時嘗試調整順序，仍不符則加警告。
  6. 移動估算：直線距離 ×1.3；≤1.2 km 步行 4.5 km/h；其餘大眾運輸 20 km/h（＋等車 8 分）；租車日（12/25～12/28）開車 35 km/h。畫面一律標示「估算」。
  7. 排序結果先預覽（顯示前後差異），使用者按「套用」才呼叫 `ds.reorderItems`。
- 自動提醒（顯示在卡片上，不阻擋）：
  - 公休日：`info.closed` 含星期（例：「週一」）且該日為該星期。
  - 年末年始：`tags` 含「年末年始」或 info 有相關文字，日期在 12/29～01/03。
  - 地區不符：地點 area 屬登別、但當天住札幌（或相反）。
  - 太晚：結束時間超過 22:00；太滿：當天總時數超過可用時間。
  - 冬季天黑：開車日 16:00 以後的行程提示天黑。
- 下雪天模式：切換後把當天「🌲戶外」行程標為備案並建議口袋名單裡「🏠室內」的地點。
- 首頁「今天」卡片的今日安排改讀 `ds.items(today)`。

### 5.4 匯出與快照
- 09 章新增「資料備份」卡：匯出 JSON（全部資料表）、匯入 JSON（需通關碼）。
- `scripts/make-snapshot`＋`.github/workflows/snapshot.yml`：用 anon key 透過 REST 讀所有資料表，寫成 `data/snapshot.json`，有變更才 commit。排程：旅行期間每天一次、平常每週一次，另可手動執行（workflow_dispatch）。
- `.github/workflows/keep-alive.yml`：每週二、五各一次 GET `/rest/v1/trips?select=id&limit=1`（帶 anon key）。
- Actions 需要的 secrets（`SUPABASE_URL`、`SUPABASE_ANON_KEY`）用 `gh secret set` 設定。

### 5.5 第一階段驗收
- [ ] 拆檔前後截圖一致；首頁、01～09、日夜模式、手機／電腦皆正常。
- [ ] 圖片改為獨立檔案，首次載入明顯變小。
- [ ] 兩支手機同時開：A 新增口袋名單或行程，B 在數秒內看到。
- [ ] 沒有通關碼無法寫入；錯誤通關碼有提示；正確後可新增、編輯、刪除、復原。
- [ ] 固定骨架不能刪除或被排序移動。
- [ ] 一鍵順路排序有預覽、有「估算」標示、套用後全家同步。
- [ ] 把 `LIVE_ENABLED` 改成 false 或拔網路：網站以唯讀快照完整顯示，沒有錯誤。
- [ ] 離線（飛航模式）可開啟並看到最後一次資料。
- [ ] keep-alive 與 snapshot 兩個 Actions 執行成功。

---

## 6. 第二階段

### 6.1 其他章節資料整理
- 01～04、06、08、09 的固定資料全部改由 `data/static.js` 提供（畫面不變）。之後若要能在網站上編輯，再個別評估是否搬進資料庫。
- 02 航班、03 住宿、04 交通、司機地址卡、Visit Japan Web 小抄的**內容不可改動**（已人工核對）。

### 6.2 記帳分帳（08 章新增「記帳」區，保留現有預算表與試算機）
- 新增一筆：日期（預設今天）、項目、類別（餐飲、交通、門票、購物、住宿、其他）、金額、幣別（JPY 預設，另有 TWD；可新增其他幣別）、誰付（預設「我是誰」）、誰分攤（預設全部旅伴；快速選組按鈕依實際存在的 `group_label` 動態產生，例如「中華組」「星宇組」）、分攤方式（均分／按份數／指定金額）、備註、可選擇關聯的地點。
- 匯率：從 `fx_rates` 帶入當下匯率存進該筆（`rate_to_base`），之後改匯率不影響舊帳；首頁 💱 換算器改讀寫 `fx_rates`（唯讀或無通關碼時退回本機 `hk-rate`）。
- 清單：依日期分組，顯示原幣別與換算 TWD，可篩選旅伴、類別。
- 結算：每位旅伴「已付」「應付」「差額」（TWD），並用貪婪法算出**最少轉帳次數**（例：小明 → 媽媽 NT$1,260）；同時提供依原幣別（JPY）的結算檢視。
- 「複製結算報告」：純文字，方便貼到 LINE 群組。
- 匯出 CSV。
- 金額計算一律用整數（JPY 以元、TWD 以分）避免浮點誤差；分攤除不盡時，餘數加在付款人身上並在明細註明。
- 保留現有「旅行分帳小幫手」外部連結。

### 6.3 第二階段驗收
- [ ] 多人同時記帳即時同步；刪除可復原。
- [ ] JPY／TWD 混合記帳，結算正確（用手算的 3～4 筆範例比對）。
- [ ] 改匯率後舊帳金額不變。
- [ ] 結算報告可複製貼上。
- [ ] 唯讀快照模式可以看帳目與結算，但不能新增。

---

## 7. 非功能要求
- **安全**：只用 anon key；不得 commit service_role 金鑰、通關碼或任何個人資料。所有資料以 `esc()` 跳脫後再放進 `innerHTML`（或改用 `textContent`）。
- **效能**：圖片 `loading="lazy"`（首屏封面除外）；Realtime 只訂閱本旅程；重繪只更新受影響區塊。
- **相容**：iPhone Safari、Android Chrome、桌機 Chrome；手機寬 360px 不可水平捲動。
- **無障礙**：按鈕有 `aria-label`；拖曳有 ↑↓ 替代。
- **日夜模式、今天模式、💱換算、天氣、離線、司機地址卡**：功能與外觀維持現狀。
- **錯誤處理**：網路錯誤不得讓頁面空白；任何時候都能退回唯讀快照。

## 8. 工作方式與回報
1. 依序進行：5.0 → 5.1 → 5.2 → 5.3 → 5.4 → 第一階段驗收 → 第二階段。每完成一個小步驟就 commit（訊息用繁體中文，簡短）。
2. **開發中不要直接覆蓋正式網站**：v2 先發佈在 `/v2/` 子資料夾（例如 https://miya-bot543.github.io/hk-trip-mxof/v2/），請使用者在手機確認後，再搬到根目錄取代舊版。舊版另存到 `/v1/` 保留。
3. 每次回報用繁體中文、條列簡短：做了什麼、使用者要確認什麼（附網址）、下一步是什麼。
4. 需要使用者操作的地方（帳號、授權、通關碼、旅伴暱稱、無法地理編碼的地點），先停下來，依 `SETUP_GUIDE.md` 對應段落教學。
5. 不確定的資料不要自行編造，列出來問使用者。

## 9. 何時需要使用者（對照 SETUP_GUIDE.md）
| 時機 | 使用者要做的事 | 指南段落 |
|---|---|---|
| 開始 5.1 前 | 建立 Supabase 帳號與專案 | A |
| 套用 schema 前 | 在瀏覽器授權 Supabase CLI，或在 SQL Editor 貼上執行 | B |
| 套用 schema 後 | 設定家庭通關碼 | C |
| 5.3 完成後 | 在網站「旅行成員」區塊新增旅伴 | D |
| 5.4 | （通常不用）若 `gh` 權限不足，於 GitHub 設定 Secrets | E |
| 完成後 | 把網址與通關碼傳給家人 | F |
| 旅程結束 | 封存：最後一次快照、關閉即時模式 | G |
