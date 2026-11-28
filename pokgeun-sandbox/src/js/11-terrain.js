/* ----- 지형 ----- */
class GB {
  constructor() { this.p = []; this.c = []; this.u = []; this.w = []; }
  quad(a, b, c, d, col, nrm, uv, w) {
    let swapped = false; const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    if ((uy * vz - uz * vy) * nrm[0] + (uz * vx - ux * vz) * nrm[1] + (ux * vy - uy * vx) * nrm[2] < 0) { [b, d] = [d, b]; swapped = true; if (uv) [uv[1], uv[3]] = [uv[3], uv[1]]; }
    const cs = Array.isArray(col); if (cs && swapped) [col[1], col[3]] = [col[3], col[1]]; if (w && swapped) [w[1], w[3]] = [w[3], w[1]];
    for (const i of [0, 1, 2, 0, 2, 3]) { const v = [a, b, c, d][i], cc = cs ? col[i] : col; this.p.push(v[0], v[1], v[2]); if (col) this.c.push(cc.r, cc.g, cc.b); if (uv) this.u.push(uv[i][0], uv[i][1]); if (w) this.w.push(...w[i]); }
  }
  build(mat, shadow = true) {
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(this.p, 3));
    if (this.c.length) g.setAttribute("color", new THREE.Float32BufferAttribute(this.c, 3));
    if (this.u.length) g.setAttribute("uv", new THREE.Float32BufferAttribute(this.u, 2));
    if (this.w.length) { const n = this.w.length / 6, a0 = new Float32Array(n * 3), a1 = new Float32Array(n * 3); for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { a0[i * 3 + k] = this.w[i * 6 + k]; a1[i * 3 + k] = this.w[i * 6 + 3 + k]; } g.setAttribute("sw0", new THREE.BufferAttribute(a0, 3)); g.setAttribute("sw1", new THREE.BufferAttribute(a1, 3)); }
    g.computeVertexNormals(); const m = new THREE.Mesh(g, mat); m.receiveShadow = shadow; m.castShadow = false; return m;
  }
}
const VMAT = map => toonPatch(TOON({ vertexColors: true, gradientMap: gradTex, map: map || null }));
const rn = (x, y, k) => ((x * 73856093 ^ y * 19349663 ^ k * 83492791) >>> 0) / 4294967296;
let brickTex = null;
function getBrick() {
  if (brickTex) return brickTex;
  const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
  x.fillStyle = "#262c40"; x.fillRect(0, 0, 64, 64);
  for (let j = 0; j < 4; j++) for (let i = -1; i < 3; i++) { const bx = i * 32 + (j % 2 ? 16 : 0) + 1, by = j * 16 + 1; x.fillStyle = (i + j) % 3 ? "#58607c" : "#646c8a"; x.fillRect(bx, by, 29, 13); x.fillStyle = "rgba(255,255,255,.15)"; x.fillRect(bx, by, 29, 2); }
  brickTex = new THREE.CanvasTexture(c); brickTex.wrapS = brickTex.wrapT = THREE.RepeatWrapping; brickTex.magFilter = THREE.NearestFilter; return brickTex;
}
function tileCol(kind, c, x, y) {
  const v = (rn(x, y, 1) - .5) * .09, col = new THREE.Color();
  if (kind === "dun") return col.setHex(c === "#" ? 0x343a54 : (x + y) % 2 ? 0x58627e : 0x525c78).offsetHSL(0, 0, v * .6);
  if (c === "s") return col.setHex(0xead9a0).offsetHSL(0, 0, v * .6);
  if (c === "p") return col.setHex(0xcfa870).offsetHSL(0, 0, v * .6);
  if (c === "w") return col.setHex(0xb9a56c);
  if (c === "#") return col.setHex(0x4f9a3e).offsetHSL(0, 0, v);
  return col.setHex(kind === "village" ? 0x78c455 : 0x6dbb4f).offsetHSL(0, 0, v);
}
function terrainGroup(w, h, at, kind) {
  const top = new GB(), side = new GB(), brick = new GB(), water = new GB(), grp = new THREE.Group();
  const hh = c => kind === "dun" ? (c === "#" ? 1.9 : 0) : (c === "#" ? 1.3 : c === "w" ? -.32 : 0);
  const cliff = new THREE.Color(kind === "dun" ? 0x5b5478 : 0x8a7d62), dirt = new THREE.Color(0x8a6a44), wcol = new THREE.Color(0x4a94d8);
  const NB = [[-1, -1], [0, -1], [-1, 0], [0, 0]], tvc = (x, y) => { const v = new THREE.Color(0, 0, 0); let n = 0; for (const [dx, dy] of NB) { const q = at(x + dx, y + dy); if (q === undefined || q === "#") continue; v.add(tileCol(kind, q, x + dx, y + dy)); n++; } return n ? v.multiplyScalar(1 / n) : tileCol(kind, at(x, y) || "g", x, y); };
  const tvw = (x, y) => { const v = [0, 0, 0, 0, 0, 0]; let n = 0; for (const [dx, dy] of NB) { const q = at(x + dx, y + dy); if (q === undefined) continue; v[GLAY[q] ?? 0]++; n++; } if (!n) v[0] = 1; else for (let i = 0; i < 6; i++) v[i] /= n; return v; };
  const DIR = [[1, 0], [-1, 0], [0, 1], [0, -1]], tufts = [], F1 = new THREE.Color(1, 0, 0), F0 = new THREE.Color(0, 0, 0), ld = (xx, yy) => { const q = at(xx, yy); return q !== undefined && q !== "w"; }, fc = (X, Y) => ld(X - 1, Y - 1) || ld(X, Y - 1) || ld(X - 1, Y) || ld(X, Y) ? F1 : F0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const c = at(x, y); if (c === undefined) continue; const H = hh(c);
    const GV = GRD && kind !== "dun";
    top.quad([x, H, y], [x, H, y + 1], [x + 1, H, y + 1], [x + 1, H, y], GV ? [tvc(x, y), tvc(x, y + 1), tvc(x + 1, y + 1), tvc(x + 1, y)] : tileCol(kind, c, x, y), [0, 1, 0], [[x * .5, y * .5], [x * .5, (y + 1) * .5], [(x + 1) * .5, (y + 1) * .5], [(x + 1) * .5, y * .5]], GV ? [tvw(x, y), tvw(x, y + 1), tvw(x + 1, y + 1), tvw(x + 1, y)] : undefined);
    if (c === "w") water.quad([x, -.12, y], [x, -.12, y + 1], [x + 1, -.12, y + 1], [x + 1, -.12, y], [fc(x, y), fc(x, y + 1), fc(x + 1, y + 1), fc(x + 1, y)], [0, 1, 0]);
    if (kind !== "dun" && REAL && NAT && (c === "." || c === "g")) { for (let i = 0; i < 2; i++) if (rn(x, y, 60 + i) < .45) tufts.push([x + .1 + rn(x, y, 62 + i) * .8, H, y + .1 + rn(x, y, 64 + i) * .8]); } else if (kind !== "dun" && (c === "." || c === "g") && rn(x, y, 3) < .55) tufts.push([x + .15 + rn(x, y, 4) * .7, H, y + .15 + rn(x, y, 5) * .7]);
    for (const [dx, dy] of DIR) {
      const c2 = at(x + dx, y + dy); if (c2 === undefined) continue; const H2 = hh(c2); if (H2 >= H) continue;
      const ex = dx > 0 ? x + 1 : x, ez = dy > 0 ? y + 1 : y, nrm = [dx, 0, dy];
      const a = dx ? [ex, H2, y] : [x, H2, ez], b = dx ? [ex, H, y] : [x, H, ez], c3 = dx ? [ex, H, y + 1] : [x + 1, H, ez], d = dx ? [ex, H2, y + 1] : [x + 1, H2, ez];
      if (kind === "dun") { const u0 = dx ? y : x; brick.quad(a, b, c3, d, null, nrm, [[u0, H2], [u0, H], [u0 + 1, H], [u0 + 1, H2]]); }
      else { const u0 = dx ? y : x; side.quad(a, b, c3, d, kind !== "village" && c === "#" ? cliff : dirt, nrm, GRD ? [[u0 * .5, H2 * .5], [u0 * .5, H * .5], [(u0 + 1) * .5, H * .5], [(u0 + 1) * .5, H2 * .5]] : undefined); }
    }
  }
  grp.add(top.build(GRD && kind !== "dun" ? groundMat() : VMAT(detailTex())));
  if (side.p.length) grp.add(side.build(GRD && kind !== "dun" ? toonPatch(TOON({ vertexColors: true, map: GRD.RK, normalMap: GRD.RKN, color: new THREE.Color(2.6, 2.5, 2.3) })) : VMAT()));
  if (brick.p.length) { const m = brick.build(TOON({ map: getBrick(), gradientMap: gradTex })); grp.add(m); }
  if (water.p.length) { const m = water.build(WATERMAT, false); m.userData.water = 1; grp.add(m); grp.userData.water = m; }
  if (tufts.length && REAL && NAT) {
    const by = {}; tufts.forEach((t, i) => { const v = i % 9 === 4 ? "Flower_3_Clump" : i % 2 ? "Grass_Small" : "Grass_Large"; (by[v] ||= []).push(t); }); const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
    for (const v in by) for (const p of NAT.parts[v]) { const L = by[v], im = new THREE.InstancedMesh(p.g, natMat(p.m), L.length); L.forEach((t, i) => { e.set(0, i * 2.4, 0); q.setFromEuler(e); const k = .8 + (i % 5) * .12; sv.set(k, k, k); pv.set(t[0], t[1], t[2]); mm.compose(pv, q, sv); im.setMatrixAt(i, mm); }); im.receiveShadow = true; grp.add(im); }
  } else if (tufts.length) {
    const im = new THREE.InstancedMesh(geo("tuft", () => new THREE.ConeGeometry(.06, .3, 4)), windMat({ color: 0x4f9a3e }, .55), tufts.length), mm = new THREE.Matrix4();
    tufts.forEach((t, i) => { mm.makeRotationY(i); mm.setPosition(t[0], t[1] + .13, t[2]); im.setMatrixAt(i, mm); }); im.castShadow = false; grp.add(im);
  }
  return grp;
}
