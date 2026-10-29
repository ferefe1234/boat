"""Restore optional large upstream demo images omitted by the connector's size limit."""
from pathlib import Path
from urllib.request import urlopen
import hashlib
root = Path(__file__).resolve().parents[1]
commit = '5301fc2020716b5a97d4edf6e1793c3dedbf6e17'
for name in ['benchmark.png', 'success-2mb.png']:
    path = root/'public'/name
    if path.exists():
        continue
    with urlopen(f'https://raw.githubusercontent.com/bashalarmistalt/decimen-optical-transfer/{commit}/public/{name}', timeout=60) as response:
        data = response.read(4*1024*1024)
    if not data.startswith(b'\x89PNG\r\n\x1a\n'):
        raise ValueError(f'{name} is not a PNG')
    path.write_bytes(data)
    print(name, hashlib.sha256(data).hexdigest())
