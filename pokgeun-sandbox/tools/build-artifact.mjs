// 아티팩트(claude.ai) 게시용 사본 만들기 → dist/artifact/
// - 아티팩트는 .glb를 올릴 수 없어서 glTF(JSON)로 바꾸고, 버퍼·이미지는 data: 주소로 넣어요.
//   (뷰어가 data: 읽기를 막기 때문에 index.html의 GLTFLoader 보정이 blob:으로 바꿔 읽어요)
// - index.html 은 문서 뼈대 태그를 빼고, 모델 확장자(KEXT/NEXT)를 "json"으로 바꿔요.
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'dist', 'artifact');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const mime = u => u.endsWith('.png') ? 'image/png' : u.endsWith('.jpg') || u.endsWith('.jpeg') ? 'image/jpeg' : u.endsWith('.webp') ? 'image/webp' : 'application/octet-stream';
fs.mkdirSync(OUT, { recursive: true });
let s = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const re of [/<!doctype html>\n/i, /<html lang="ko">\n/, /<head>\n/, /<meta charset="utf-8">\n/, /<meta name="viewport"[^\n]*\n/, /<\/head>\n/, /<body>\n/, /<\/body>\n/, /<\/html>\n?/]) s = s.replace(re, '');
for (const k of ['KEXT', 'NEXT']) { const a = `const ${k} = "glb";`; if (!s.includes(a)) throw new Error(a + ' 를 찾지 못했어요'); s = s.replace(a, `const ${k} = "json";`); }
fs.writeFileSync(path.join(OUT, 'index.html'), '<!doctype html><meta charset="utf-8">\n' + s);
let n = 0, bytes = 0;
for (const f of walk(path.join(ROOT, 'assets'))) {
  const rel = path.relative(ROOT, f), ext = path.extname(f).toLowerCase();
  if (ext === '.glb') {
    const dst = path.join(OUT, rel.replace(/\.glb$/, '.json'));
    if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(f).mtimeMs) continue;
    const { json, resources } = await io.writeJSON(await io.read(f));
    for (const b of json.buffers || []) if (b.uri) b.uri = `data:application/octet-stream;base64,${Buffer.from(resources[b.uri]).toString('base64')}`;
    for (const im of json.images || []) if (im.uri && resources[im.uri]) im.uri = `data:${mime(im.uri)};base64,${Buffer.from(resources[im.uri]).toString('base64')}`;
    fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, JSON.stringify(json)); n++; bytes += fs.statSync(dst).size;
  } else if (ext === '.vrm') {   // VRM은 확장(뼈대·표정·흔들림) 번호가 바뀌면 안 돼서 변환 도구를 쓰지 않고 그대로 JSON+data: 로 옮겨요
    const dst = path.join(OUT, rel.replace(/\.vrm$/, '.json'));
    if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(f).mtimeMs) continue;
    const b = fs.readFileSync(f), jl = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + jl).toString()), bl = b.readUInt32LE(20 + jl), bin = b.slice(28 + jl, 28 + jl + bl);
    j.buffers = [{ byteLength: bin.length, uri: `data:application/octet-stream;base64,${bin.toString('base64')}` }];
    fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, JSON.stringify(j)); n++; bytes += fs.statSync(dst).size;
  } else if (['.webp', '.png', '.jpg'].includes(ext)) { const dst = path.join(OUT, rel); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(f, dst); }
}
console.log(`dist/artifact 준비 완료 (새로 변환한 모델 ${n}개, ${(bytes / 1048576).toFixed(1)}MB)`);
