"""Create platform icon containers from the user's existing logo. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parents[1]
output = root / 'desktop/resources'
output.mkdir(parents=True, exist_ok=True)
with Image.open(root / 'public/qrtransfer-logo.jpg') as image:
    square = ImageOps.fit(ImageOps.exif_transpose(image).convert('RGB'), (1024, 1024), method=Image.Resampling.LANCZOS)
square.save(output / 'icon.icns', format='ICNS')
square.save(output / 'icon.ico', format='ICO', sizes=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)])
print('Created desktop/resources/icon.icns and icon.ico from the supplied logo.')
