// 먼 나무용 간략 모델(LOD) 만들기 → assets/nature/lod/*.glb
// 사용: node tools/make-nature-lod.mjs [비율=0.25]   (meshoptimizer 간략화, 재질·텍스처 좌표는 그대로)
import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, weld, prune, getBounds } from '@gltf-transform/functions'; import { MeshoptSimplifier } from 'meshoptimizer';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SRC = path.join(ROOT, 'assets/nature'), OUT = path.join(SRC, 'lod'), RATIO = +(process.argv[2] || .25);
const TREES = ['NormalTree_1', 'NormalTree_2', 'NormalTree_3', 'PineTree_1', 'PineTree_2', 'PineTree_3', 'BirchTree_1', 'BirchTree_2', 'DeadTree_1', 'DeadTree_2'];
await MeshoptSimplifier.ready; fs.mkdirSync(OUT, { recursive: true });
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const tris = doc => doc.getRoot().listMeshes().reduce((a, m) => a + m.listPrimitives().reduce((b, p) => b + (p.getIndices() ? p.getIndices().getCount() : p.getAttribute('POSITION').getCount()) / 3, 0), 0);
for (const n of TREES) {
  const doc = await io.read(path.join(SRC, n + '.glb')), t0 = tris(doc);
  await doc.transform(weld({}), simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.06, lockBorder: false }), prune());
  await io.write(path.join(OUT, n + '.glb'), doc); console.log(n, Math.round(t0), '→', Math.round(tris(doc)), 'tris', (fs.statSync(path.join(OUT, n + '.glb')).size / 1024 | 0) + 'KB');
}
