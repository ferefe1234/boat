"""Fetch the user-selected logo once and render Android/PWA icons. Requires Pillow.
An existing public/qrtransfer-logo.jpg is used offline, without redownloading.
"""
from pathlib import Path
from urllib.request import Request, urlopen
from PIL import Image, ImageOps
import hashlib

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://i.pinimg.com/564x/ec/d6/1f/ecd61f0b2bca53cca308c7a4e42d0d7b.jpg'
logo = ROOT / 'public/qrtransfer-logo.jpg'
if not logo.exists():
    with urlopen(Request(URL, headers={'User-Agent': 'QRtransfer-build/1.0'}), timeout=30) as response:
        data = response.read(8 * 1024 * 1024 + 1)
    if len(data) > 8 * 1024 * 1024:
        raise ValueError('Logo exceeds 8 MB')
    logo.write_bytes(data)
source = ImageOps.exif_transpose(Image.open(logo)).convert('RGB')
square = ImageOps.fit(source, (512, 512), method=Image.Resampling.LANCZOS)
def icon(path, size, padding=0):
    path.parent.mkdir(parents=True, exist_ok=True)
    tile = Image.new('RGB', (size, size), 'white')
    inner = size - 2 * padding
    tile.paste(square.resize((inner, inner), Image.Resampling.LANCZOS), (padding, padding))
    tile.save(path)
for name, size in [('icon-192.png',192),('icon-512.png',512),('apple-touch-icon.png',180)]:
    icon(ROOT/'public'/name, size)
icon(ROOT/'public/icon-maskable-512.png', 512, 100)
square.save(ROOT/'public/favicon.ico', sizes=[(16,16),(32,32),(48,48)])
res = ROOT/'android/app/src/main/res'
for density,size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    icon(res/f'mipmap-{density}/ic_launcher.png', size)
    icon(res/f'mipmap-{density}/ic_launcher_foreground.png', round(size*2.25), round(size*.45))
print('Logo SHA-256:', hashlib.sha256(logo.read_bytes()).hexdigest())
