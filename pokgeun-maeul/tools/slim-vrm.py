#!/usr/bin/env python3
"""VRM(glb) 가볍게 만들기 — 뼈대·메시·VRM 확장은 그대로 두고
1) 텍스처를 줄이고(노멀맵 256, 썸네일 64, 나머지 최대크기, 투명도 없으면 JPEG)
2) 표정(BlendShape)에서 쓰지 않는 모프 타깃을 지우고 남은 번호를 다시 매겨요(VRM0 blendShapeMaster / VRM1 expressions 둘 다)
사용: python3 tools/slim-vrm.py 원본.vrm 결과.vrm [최대크기=512]"""
import io, json, struct, sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]; MAX = int(sys.argv[3]) if len(sys.argv) > 3 else 512
b = open(src, 'rb').read(); jl = struct.unpack('<I', b[12:16])[0]; j = json.loads(b[20:20 + jl]); bin0 = 20 + jl + 8; binlen = struct.unpack('<I', b[20 + jl:24 + jl])[0]; BIN = b[bin0:bin0 + binlen]
ext = j.get('extensions', {})
# --- 1) 쓰는 모프 타깃만 남기기 ---
used = {}   # mesh index -> set(target index)
binds = []
if 'VRM' in ext:
    for g in ext['VRM'].get('blendShapeMaster', {}).get('blendShapeGroups', []):
        for bd in g.get('binds', []): used.setdefault(bd['mesh'], set()).add(bd['index']); binds.append(bd)
if 'VRMC_vrm' in ext:
    ex = ext['VRMC_vrm'].get('expressions', {})
    for grp in (ex.get('preset', {}), ex.get('custom', {})):
        for e in grp.values():
            for bd in e.get('morphTargetBinds', []):
                mi = j['nodes'][bd['node']]['mesh']; used.setdefault(mi, set()).add(bd['index']); binds.append(('v1', mi, bd))
remap = {}
for mi, m in enumerate(j['meshes']):
    keep = sorted(used.get(mi, set())); remap[mi] = {o: n for n, o in enumerate(keep)}
    for p in m['primitives']:
        if 'targets' in p: p['targets'] = [p['targets'][o] for o in keep if o < len(p['targets'])] or None
        if p.get('targets') is None: p.pop('targets', None)
    if 'weights' in m: m['weights'] = [m['weights'][o] for o in keep if o < len(m['weights'])]
    if 'extras' in m and 'targetNames' in m['extras']: m['extras']['targetNames'] = [m['extras']['targetNames'][o] for o in keep if o < len(m['extras']['targetNames'])]
    for p in m['primitives']:
        if 'extras' in p and 'targetNames' in p['extras']: p['extras']['targetNames'] = [p['extras']['targetNames'][o] for o in keep if o < len(p['extras']['targetNames'])]
for bd in binds:
    if isinstance(bd, tuple): _, mi, x = bd; x['index'] = remap[mi][x['index']]
    else: bd['index'] = remap[bd['mesh']][bd['index']]
# --- 2) 쓰이는 accessor·bufferView만 다시 모으기 ---
acc_used = set()
for m in j['meshes']:
    for p in m['primitives']:
        acc_used.update(p['attributes'].values())
        if 'indices' in p: acc_used.add(p['indices'])
        for t in p.get('targets', []): acc_used.update(t.values())
for s in j.get('skins', []):
    if 'inverseBindMatrices' in s: acc_used.add(s['inverseBindMatrices'])
for a in j.get('animations', []):
    for sm in a['samplers']: acc_used.update([sm['input'], sm['output']])
acc_list = sorted(acc_used); amap = {o: n for n, o in enumerate(acc_list)}
j['accessors'] = [j['accessors'][o] for o in acc_list]
for m in j['meshes']:
    for p in m['primitives']:
        p['attributes'] = {k: amap[v] for k, v in p['attributes'].items()}
        if 'indices' in p: p['indices'] = amap[p['indices']]
        if 'targets' in p: p['targets'] = [{k: amap[v] for k, v in t.items()} for t in p['targets']]
for s in j.get('skins', []):
    if 'inverseBindMatrices' in s: s['inverseBindMatrices'] = amap[s['inverseBindMatrices']]
for a in j.get('animations', []):
    for sm in a['samplers']: sm['input'] = amap[sm['input']]; sm['output'] = amap[sm['output']]
bv_used = sorted({a['bufferView'] for a in j['accessors'] if 'bufferView' in a} | {im['bufferView'] for im in j.get('images', []) if 'bufferView' in im})
img_bv = {im['bufferView']: im for im in j.get('images', []) if 'bufferView' in im}
out = bytearray(); new_bvs = []; bmap = {}
for o in bv_used:
    bv = j['bufferViews'][o]; data = BIN[bv.get('byteOffset', 0):bv.get('byteOffset', 0) + bv['byteLength']]
    if o in img_bv:
        im = img_bv[o]; name = im.get('name', ''); p = Image.open(io.BytesIO(data)); p.load()
        lim = 64 if name == 'Thumbnail' else 256 if ('_nml' in name or name.endswith('_n') or 'Normal' in name) else MAX
        if max(p.size) > lim: s = lim / max(p.size); p = p.resize((max(1, round(p.width * s)), max(1, round(p.height * s))), Image.LANCZOS)
        alpha = p.mode in ('RGBA', 'LA', 'P') and p.convert('RGBA').getextrema()[3][0] < 255
        bio = io.BytesIO()
        if alpha: p.convert('RGBA').save(bio, 'PNG', optimize=True); im['mimeType'] = 'image/png'
        else: p.convert('RGB').save(bio, 'JPEG', quality=86, optimize=True); im['mimeType'] = 'image/jpeg'
        data = bio.getvalue()
    while len(out) % 4: out.append(0)
    nb = {k: v for k, v in bv.items() if k not in ('byteOffset', 'byteLength', 'buffer')}; nb.update(buffer=0, byteOffset=len(out), byteLength=len(data)); bmap[o] = len(new_bvs); new_bvs.append(nb); out += data
while len(out) % 4: out.append(0)
for a in j['accessors']:
    if 'bufferView' in a: a['bufferView'] = bmap[a['bufferView']]
for im in j.get('images', []):
    if 'bufferView' in im: im['bufferView'] = bmap[im['bufferView']]
j['bufferViews'] = new_bvs; j['buffers'] = [{'byteLength': len(out)}]
js = json.dumps(j, separators=(',', ':'), ensure_ascii=False).encode()
while len(js) % 4: js += b' '
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(out)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(out), 0x004E4942) + bytes(out)
open(dst, 'wb').write(glb)
print(f'{src.split("/")[-1]}: {len(b)//1024}KB -> {len(glb)//1024}KB (모프 {sum(len(v) for v in used.values())}개 유지)')
