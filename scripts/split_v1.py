"""一次性腳本：從 v1 的 index.html 拆出圖片與 CSS 到 v2/。
用法：python3 -I scripts/split_v1.py
- JPEG 以品質 85 重新壓縮（封面 cover-h / cover-v 用 90），結果沒有比原檔小就保留原檔。
- LINE QR code 維持原本的 PNG，不轉檔。
- 會輸出 scripts/image-map.json（base64 雜湊 → 檔名），給截圖比對時對照用。
"""
import base64, hashlib, io, json, pathlib, re
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "index.html"
V2 = ROOT / "v2"
IMG_DIR = V2 / "images"
IMG_DIR.mkdir(parents=True, exist_ok=True)

s = SRC.read_text(encoding="utf-8")
URI = r'"(data:image/([a-z]+);base64,([A-Za-z0-9+/=]+))"'

def one(name):
    m = re.search(r"const " + name + r" = " + URI, s)
    return [m.groups()]

def many(name):
    m = re.search(r"const " + name + r" = \[(.*?)\];", s, re.S)
    return re.findall(URI, m.group(1))

PLAN = [
    ("IMG_H", one, ["cover-h"]),
    ("IMG_V", one, ["cover-v"]),
    ("HOTEL_IMG", many, ["hotel-1", "hotel-2", "hotel-3", "hotel-4"]),
    ("LINE_QR", one, ["line-qr"]),
    ("CH_ICON", many, [f"ch-{i:02d}" for i in range(1, 10)]),
    ("MASCOT", many, ["mascot-countdown", "mascot-trip", "mascot-home"]),
    ("ACT_IMG", many, ["act-asahikawa", "act-ski"]),
    ("MAP_IMG", one, ["map"]),
]

mapping, rows = {}, []
for const, fn, names in PLAN:
    found = fn(const)
    assert len(found) == len(names), (const, len(found))
    for (uri, kind, b64), name in zip(found, names):
        raw = base64.b64decode(b64)
        if kind == "png":
            fname, data = name + ".png", raw
        else:
            q = 90 if name.startswith("cover") else 85
            im = Image.open(io.BytesIO(raw))
            buf = io.BytesIO()
            im.convert("RGB").save(buf, "JPEG", quality=q, optimize=True, progressive=True)
            data = buf.getvalue() if len(buf.getvalue()) < len(raw) else raw
            fname = name + ".jpg"
        (IMG_DIR / fname).write_bytes(data)
        mapping[hashlib.sha1(uri.encode()).hexdigest()] = "images/" + fname
        w, h = Image.open(io.BytesIO(raw)).size
        rows.append((fname, f"{w}x{h}", len(raw), len(data), "原檔" if data is raw else "重新壓縮"))

css = re.search(r"<style>\n(.*?)</style>", s, re.S).group(1)
(V2 / "css").mkdir(exist_ok=True)
(V2 / "css" / "style.css").write_text(css, encoding="utf-8")

# HTML 骨架：<style> 改連結 css/style.css，最後的 <script> 改成 ES module
html = re.sub(r"<style>\n.*?</style>", '<link rel="stylesheet" href="css/style.css">', s, count=1, flags=re.S)
start = html.rindex("<script>")
end = html.index("</script>", start) + len("</script>")
html = html[:start] + '<script type="module" src="js/main.js"></script>' + html[end:]
assert "base64" not in html
(V2 / "index.html").write_text(html, encoding="utf-8")
for f in ["manifest.webmanifest", "icon-192.png", "icon-512.png"]:
    (V2 / f).write_bytes((ROOT / f).read_bytes())

(ROOT / "scripts" / "image-map.json").write_text(json.dumps(mapping, indent=1), encoding="utf-8")
tot0 = sum(r[2] for r in rows); tot1 = sum(r[3] for r in rows)
for r in rows:
    print(f"{r[0]:24} {r[1]:>10} {r[2]:>9} -> {r[3]:>9}  {r[4]}")
print(f"images: {len(rows)}  {tot0} -> {tot1} bytes; css {len(css)} chars")
