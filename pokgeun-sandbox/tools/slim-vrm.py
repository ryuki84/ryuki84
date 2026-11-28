#!/usr/bin/env python3
"""VRM(glb) 텍스처 줄이기: 다른 데이터(뼈대·메시·표정·VRM 확장)는 그대로 두고 이미지만 작게 다시 넣어요.
사용: python3 tools/slim-vrm.py 원본.vrm 결과.vrm [최대크기=512]
- 노멀맵(_n, _nml)은 256, 썸네일은 64, 나머지는 최대크기. 투명도가 없으면 JPEG(품질 88)로 바꿔요."""
import io, json, struct, sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]; MAX = int(sys.argv[3]) if len(sys.argv) > 3 else 512
b = open(src, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl]); bin0 = 20 + jl + 8; binlen = struct.unpack('<I', b[20 + jl:24 + jl])[0]; BIN = b[bin0:bin0 + binlen]
img_bv = {im['bufferView']: i for i, im in enumerate(j['images']) if 'bufferView' in im}
out = bytearray(); new_bvs = []
for k, bv in enumerate(j['bufferViews']):
    data = BIN[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
    if k in img_bv:
        im = j['images'][img_bv[k]]; name = im.get('name', ''); p = Image.open(io.BytesIO(data)); p.load()
        lim = 64 if name == 'Thumbnail' else 256 if name.endswith(('_n', '_nml')) or '_nml' in name or name.endswith('_n') else MAX
        if max(p.size) > lim: s = lim / max(p.size); p = p.resize((max(1, round(p.width * s)), max(1, round(p.height * s))), Image.LANCZOS)
        alpha = p.mode in ('RGBA', 'LA', 'P') and p.convert('RGBA').getextrema()[3][0] < 255
        o = io.BytesIO()
        if alpha: p.convert('RGBA').save(o, 'PNG', optimize=True); im['mimeType'] = 'image/png'
        else: p.convert('RGB').save(o, 'JPEG', quality=88, optimize=True); im['mimeType'] = 'image/jpeg'
        data = o.getvalue()
    while len(out) % 4: out.append(0)
    nb = dict(bv); nb['byteOffset'] = len(out); nb['byteLength'] = len(data); nb['buffer'] = 0; out += data; new_bvs.append(nb)
while len(out) % 4: out.append(0)
j['bufferViews'] = new_bvs; j['buffers'] = [{'byteLength': len(out)}]
js = json.dumps(j, separators=(',', ':')).encode();
while len(js) % 4: js += b' '
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
open(dst, 'wb').write(glb); print(f'{src.split("/")[-1]}: {len(b)//1024}KB -> {len(glb)//1024}KB')
