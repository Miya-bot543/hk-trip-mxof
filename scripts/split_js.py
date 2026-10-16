"""一次性腳本：把 v1 index.html 最後一個 <script> 依行號原樣搬到 v2 的 ES modules。
用法：python3 -I scripts/split_js.py
程式碼內容不改寫，只做：加 export、補 import、共用變數改放 state.js（S.curDay 等）、圖片 base64 改成 images/ 路徑。
執行後 v2/ 底下的檔案就是正式原始碼，之後直接修改那些檔案，不再重跑此腳本。
"""
import os, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = (ROOT / "index.html").read_text(encoding="utf-8")
L = SRC.split("\n")
V2 = ROOT / "v2"

def lines(a, b):  # 1-based, inclusive
    return L[a - 1:b]

IMAGES = '''const IMG_H = "images/cover-h.jpg";
const IMG_V = "images/cover-v.jpg";
const HOTEL_IMG = ["images/hotel-1.jpg","images/hotel-2.jpg","images/hotel-3.jpg","images/hotel-4.jpg"];
const LINE_QR = "images/line-qr.png";
const CH_ICON = ["images/ch-01.jpg","images/ch-02.jpg","images/ch-03.jpg","images/ch-04.jpg","images/ch-05.jpg","images/ch-06.jpg","images/ch-07.jpg","images/ch-08.jpg","images/ch-09.jpg"];
const MASCOT = ["images/mascot-countdown.jpg","images/mascot-trip.jpg","images/mascot-home.jpg"];
const ACT_IMG = ["images/act-asahikawa.jpg","images/act-ski.jpg"];
const MAP_IMG = "images/map.jpg";'''.split("\n")

def check(rng, must):
    txt = "\n".join(lines(*rng))
    assert must in txt, (rng, must)
    return rng

# 每個模組：(輸出路徑, 檔頭說明, [行號範圍或文字])
M = {}
M["data/static.js"] = ("固定資料（不在網站上編輯）。航班、住宿、租車、司機地址卡等已人工核對，內容不可更動。", [
    IMAGES, "",
    check((393, 489), "const TRIP_ROUTES"), "",
    check((498, 526), "const DAYS"), "",
    check((528, 534), "const PLACES"),
    check((536, 538), "const ROUTE"), "",
    check((540, 545), "const CHAPTERS"), "",
    check((547, 548), "const POCKET_SEED"), "",
    check((552, 562), "const CHECKLIST"), "",
    check((1324, 1334), "const HOTEL_DRIVER"), "",
    check((1196, 1196), "const TRIP_START"), "",
    check((1368, 1373), "const WX_PLACES"),
])
M["js/util.js"] = ("共用小工具：選取、HTML 跳脫、localStorage、地圖連結、toast。", [
    check((565, 572), "const gmaps"), "",
    check((998, 1001), "function toast"),
])
M["js/ui.js"] = ("各頁共用的畫面片段：日期列、航班卡、住宿小卡、收合區、章節標題與翻頁。", [
    check((573, 573), "const isMove"), "",
    check((576, 581), "function dayStrip"), "",
    check((635, 664), "function pager"),
])
M["js/features/map.js"] = ("插畫地圖（座標是插畫像素，不是經緯度）。", [check((583, 633), "function showPlace")])
M["js/features/pocket.js"] = ("07 口袋名單（v1 原樣；5.2 會改接 datastore）。", [
    check((549, 549), "const STATIC_BUILD"), "",
    check((980, 997), "const pkCatName"), "",
    check((1002, 1193), "function pkSave"),
])
M["js/features/today.js"] = ("今天模式＋出發倒數＋預覽。", [check((1195, 1195), "今天"), check((1199, 1245), "function todayCardHTML")])
M["js/features/fx.js"] = ("💱 日圓／台幣換算。", [check((1247, 1278), "function fxInit")])
M["js/features/vjw.js"] = ("Visit Japan Web 填寫小抄（值已核對，不可更動）＋複製按鈕。", [check((1281, 1322), "function vjwHTML")])
M["js/features/driver.js"] = ("🚕 給司機看的日文地址卡（資料在 data/static.js）。", [check((1335, 1365), "function driverListHTML")])
M["js/features/weather.js"] = ("☁️ 天氣預報（Open-Meteo）。", [check((1367, 1367), "天氣"), check((1374, 1425), "function weatherCardHTML")])
M["js/features/net.js"] = ("📶 離線提示。", [check((1427, 1433), "function netBanner")])

PAGES = [("home", 667, 697), ("01", 698, 710), ("02", 711, 721), ("03", 722, 759), ("04", 761, 833),
         ("05", 835, 881), ("06", 882, 905), ("07", 906, 910), ("08", 911, 959), ("09", 961, 977)]
for key, a, b in PAGES:
    body = lines(a, b)
    first = 'home(){' if key == "home" else f'"{key}"(){{'
    assert body[0] == first, (key, body[0])
    assert body[-1] in ("},", "}"), (key, body[-1])
    fname = "home" if key == "home" else "ch" + key
    body = [f"export default function {fname}(){{"] + body[1:-1] + ["}"]
    M[f"js/pages/{fname}.js"] = ("首頁" if key == "home" else f"第 {key} 章", [body])

# main.js：路由、全域事件、主題、飄雪、啟動
M["js/main.js"] = ("進入點：路由、全域事件、日夜模式、飄雪、啟動。", [
    "PAGEMAP",
    check((1435, 1478), "function route"), "",
    check((1480, 1494), "serviceWorker"),
    check((1495, 1497), "route();"),
])

STATE = {r"\bcurDay\b": "S.curDay", r"\bPREVIEW_IDX\b": "S.previewIdx", r"\bdayPicked\b": "S.dayPicked"}
DROP = {"let curDay = 0;", "let PREVIEW_IDX = null;                     /* 預覽用：null = 真正的今天 */", "let dayPicked = false;"}

def render(parts):
    out = []
    for p in parts:
        if isinstance(p, str):
            out.extend(p.split("\n"))
        elif isinstance(p, tuple):
            out.extend(lines(*p))
        else:
            out.extend(p)
    return out

# 先組出每個模組的程式碼
code = {}
for path, (desc, parts) in M.items():
    body = [x for x in render(parts) if x not in DROP]
    txt = "\n".join(body)
    for pat, rep in STATE.items():
        txt = re.sub(pat, rep, txt)
    if path == "js/features/today.js":
        txt = txt.replace("S.dayPicked=false; route();", "S.dayPicked=false; S.route();")
    if path == "js/main.js":
        txt = txt.replace("PAGEMAP", "const PAGES = {home, \"01\":ch01, \"02\":ch02, \"03\":ch03, \"04\":ch04, \"05\":ch05, \"06\":ch06, \"07\":ch07, \"08\":ch08, \"09\":ch09};\n")
        txt = txt.replace("\nfunction route(){", "\nS.route = route;\nfunction route(){")
    code[path] = txt

# 頂層宣告 → export
DECL = re.compile(r"^(const|let|function|async function) ([A-Za-z_$][\w$]*)", re.M)
exports = {}
for path, txt in code.items():
    if path == "js/main.js" or path.startswith("js/pages/"):
        names = [m.group(2) for m in DECL.finditer(txt)]
    else:
        names = [m.group(2) for m in DECL.finditer(txt)]
        txt = DECL.sub(lambda m: "export " + m.group(0), txt)
        exports[path] = names
    code[path] = txt
for key, a, b in PAGES:
    fname = "home" if key == "home" else "ch" + key
    exports[f"js/pages/{fname}.js"] = ["default:" + fname]
exports["js/state.js"] = ["S"]

def rel(frm, to):
    r = os.path.relpath(to, os.path.dirname(frm))
    return r if r.startswith("..") else "./" + r

def uses(txt, name):
    if name == "$":
        return re.search(r"(?<![\w$])\$\(", txt) is not None
    return re.search(r"(?<![\w$])(?:(?<=\.\.\.)|(?<!\.))" + re.escape(name) + r"(?![\w$])", txt) is not None

ORDER = ["js/state.js", "data/static.js", "js/util.js", "js/ui.js", "js/features/map.js", "js/features/pocket.js",
         "js/features/today.js", "js/features/fx.js", "js/features/vjw.js", "js/features/driver.js",
         "js/features/weather.js", "js/features/net.js"] + [f"js/pages/{'home' if k=='home' else 'ch'+k}.js" for k, _, _ in PAGES]

for path, txt in code.items():
    local = {m.group(2) for m in re.finditer(r"^(?:export )?(const|let|function|async function) ([A-Za-z_$][\w$]*)", txt, re.M)}
    imps = []
    for other in ORDER:
        if other == path:
            continue
        names = exports[other]
        if names and names[0].startswith("default:"):
            if path == "js/main.js":
                imps.append(f'import {names[0][8:]} from "{rel(path, other)}";')
            continue
        need = [n for n in names if n not in local and uses(txt, n)]
        if need:
            imps.append(f'import {{ {", ".join(need)} }} from "{rel(path, other)}";')
        elif path == "js/main.js":
            imps.append(f'import "{rel(path, other)}";')
    if path == "data/static.js":
        imps = []  # 純資料，不依賴其他模組（避免 JSON 裡的 "v" 被誤判）
    desc = M[path][0]
    head = f"/* {desc} */\n" + ("\n".join(imps) + "\n\n" if imps else "\n")
    f = V2 / path
    f.parent.mkdir(parents=True, exist_ok=True)
    f.write_text(head + txt.strip("\n") + "\n", encoding="utf-8")
    print(f"{path:28} {len(txt):>7} chars  imports: {len(imps)}")

(V2 / "js" / "state.js").write_text(
    "/* 跨模組共用的狀態（ES module 不能從外部重新指派 let，所以集中放這裡） */\n"
    "export const S = {\n  curDay: 0,          /* 05 章目前顯示第幾天 */\n"
    "  previewIdx: null,   /* 預覽用：null = 真正的今天 */\n"
    "  dayPicked: false,\n  route: () => {}     /* main.js 啟動時換成真正的 route() */\n};\n", encoding="utf-8")
