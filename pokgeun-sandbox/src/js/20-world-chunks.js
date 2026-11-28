/* ----- 모델 (인스턴싱용으로 합쳐서 구움) ----- */
function bake(group) {
  group.updateMatrixWorld(true); const P = [], Nn = [], Cc = [];
  group.traverse(m => {
    if (!m.isMesh) return; const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()); g.applyMatrix4(m.matrixWorld);
    const col = m.material.color || new THREE.Color(1, 1, 1), pa = g.attributes.position.array, na = g.attributes.normal.array;
    for (let i = 0; i < pa.length; i++) { P.push(pa[i]); Nn.push(na[i]); } for (let i = 0; i < pa.length / 3; i++) Cc.push(col.r, col.g, col.b);
  });
  const bg = new THREE.BufferGeometry(); bg.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute("normal", new THREE.Float32BufferAttribute(Nn, 3)); bg.setAttribute("color", new THREE.Float32BufferAttribute(Cc, 3));
  bg.userData.shared = 1; return bg;
}
const BAKED = {};
const baked = (n, mk) => BAKED[n] || (BAKED[n] = bake(mk()));
const grpOf = f => { const g = new THREE.Group(); f(g); return g; };
const MK = {
  oak: () => grpOf(g => { C(g, .1, .15, .8, 0x7d5433, 0, .4, 0, 7); Sp(g, .62, 0x3d8444, 0, 1.1, 0); Sp(g, .46, 0x4a9a4a, -.32, 1.38, .1); Sp(g, .4, 0x5aa84a, .3, 1.32, -.1); Sp(g, .3, 0x6dbb4f, 0, 1.6, 0); }),
  pine: () => grpOf(g => { C(g, .09, .13, .5, 0x7d5433, 0, .25, 0, 6); for (let k = 0; k < 3; k++) K(g, .62 - k * .14, .75, k % 2 ? 0x3d8444 : 0x2f6b3a, 0, .8 + k * .5, 0, 7); g.scale.setScalar(.95); }),
  spine: () => grpOf(g => { C(g, .09, .13, .5, 0x7d5433, 0, .25, 0, 6); for (let k = 0; k < 3; k++) { K(g, .62 - k * .14, .75, 0x3d8444, 0, .8 + k * .5, 0, 7); K(g, .5 - k * .12, .4, 0xf2f7fb, 0, .98 + k * .5, 0, 7); } g.scale.setScalar(.95); }),
  dead: () => grpOf(g => { C(g, .07, .11, 1, 0x8a7050, 0, .5, 0, 5); B(g, .5, .07, .07, 0x8a7050, .2, .8, 0, { r: [0, 0, .7] }); B(g, .4, .06, .06, 0x8a7050, -.15, .6, 0, { r: [0, 0, -.8] }); }),
  willow: () => grpOf(g => { C(g, .1, .15, .8, 0x6a5238, 0, .4, 0, 6); Sp(g, .62, 0x4a6a3a, 0, 1.05, 0, { s: [1.2, .8, 1.2] }); for (const [x, z] of [[.5, 0], [-.5, .1], [0, .5], [0, -.5], [.35, .35], [-.35, -.35]]) B(g, .06, .5, .06, 0x6f8a5a, x, .65, z); Sp(g, .1, 0x7a5a9a, .3, 1.35, .2); }),
  cactus: () => grpOf(g => { C(g, .13, .15, .95, 0x4a9a4a, 0, .48, 0, 7); C(g, .08, .08, .4, 0x4a9a4a, .26, .55, 0, 6); B(g, .2, .08, .08, 0x4a9a4a, .15, .45, 0); Sp(g, .07, 0xe8508a, 0, .98, 0); }),
  rock: () => grpOf(g => { I(g, .42, 0x8a8e9e, 0, .22, 0, { s: [1.1, .7, 1], r: [.2, .6, 0] }); I(g, .22, 0xb8bcc8, -.2, .2, .15, { s: [1, .7, 1] }); }),
  ore: () => grpOf(g => { I(g, .42, 0x6c7080, 0, .22, 0, { s: [1.1, .7, 1], r: [.2, .6, 0] }); K(g, .1, .4, 0x6ee7ff, .15, .5, .05, 4, { r: [.2, 0, -.3] }); K(g, .08, .3, 0xf0a23c, -.15, .45, -.05, 4, { r: [-.2, 0, .3] }); K(g, .07, .25, 0x6ee7ff, .0, .45, .2, 4); }),
  bush: () => grpOf(g => { Sp(g, .38, 0x3d8444, 0, .25, 0, { s: [1.2, .75, 1] }); Sp(g, .28, 0x6dbb4f, -.1, .38, .1); for (const [x, y, z] of [[.3, .3, .25], [-.25, .25, .3], [.1, .5, .2], [.35, .2, -.1]]) Sp(g, .06, 0x6b4a9e, x, y, z); }),
  tuft: () => grpOf(g => { for (const [x, z, s] of [[0, 0, 1], [.1, .05, .7], [-.08, .06, .8]]) K(g, .05, .28 * s, 0x4f9a3e, x, .13 * s, z, 4); }),
  wall: () => grpOf(g => { B(g, .98, 1.3, .98, 0x9a7048, 0, .65, 0); B(g, 1.02, .12, 1.02, 0x7d5433, 0, 1.3, 0); for (const y of [.35, .75, 1.1]) B(g, 1, .05, 1, 0x7d5433, 0, y, 0); }),
  swall: () => grpOf(g => { B(g, .98, 1.3, .98, 0x8a8e9e, 0, .65, 0); B(g, 1.02, .12, 1.02, 0xb8bcc8, 0, 1.3, 0); for (const y of [.4, .85]) B(g, 1, .05, 1, 0x6c7080, 0, y, 0); }),
};
const treeVar = (b, x, y) => b === 5 ? "spine" : b === 4 || b === 10 ? "dead" : b === 6 ? "willow" : b === 3 ? (hash2(x, y, 3) < .62 ? "pine" : "oak") : b === 7 ? "pine" : "oak";

/* ----- 구조물 모델 ----- */
function mkShrine() { const g = new THREE.Group(); B(g, 1, .18, 1, 0x8a8e9e, 0, .09, 0); C(g, .2, .26, 1.3, 0xb8bcc8, 0, .8, 0, 6); const cr = new THREE.Mesh(geo("shc", () => new THREE.OctahedronGeometry(.26)), HDR(0x6ee7ff)); cr.position.y = 1.7; g.add(cr); g.userData.spin = cr; g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g; }
function mkBoard() { const g = new THREE.Group(); for (const x of [-.4, .4]) B(g, .1, 1.3, .1, 0x7d5433, x, .65, 0); B(g, 1.1, .7, .08, 0xa87645, 0, 1.0, 0); for (const [x, y] of [[-.28, 1.1], [.1, 1.05], [.3, .9]]) B(g, .25, .3, .02, 0xfff3d6, x, y, .06); B(g, 1.2, .08, .14, 0x7d5433, 0, 1.4, 0); return g; }
function mkTent(c) { const g = new THREE.Group(); K(g, .85, 1.2, c, 0, .6, 0, 4, { r: [0, .78, 0] }); B(g, .35, .6, .05, 0x2a1c14, 0, .3, .5); return g; }
function mkChest(open) { const g = new THREE.Group(); B(g, .8, .4, .5, 0x8a5a34, 0, .2, 0); B(g, .82, .06, .52, 0xe8b84a, 0, .1, 0); const lid = new THREE.Group(); lid.position.set(0, .4, -.25); B(lid, .8, .2, .5, 0x9a6a3e, 0, .1, .25); B(lid, .1, .12, .06, 0xf5d142, 0, .05, .5); lid.rotation.x = open ? -1.1 : 0; g.add(lid); if (open) B(g, .6, .06, .3, 0xf5d142, 0, .42, 0); g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g; }
function mkPillar(h) { const g = new THREE.Group(); C(g, .2, .24, h, 0xb8bcc8, 0, h / 2, 0, 7); B(g, .6, .12, .6, 0x8a8e9e, 0, .06, 0); if (h > 1.2) B(g, .55, .12, .55, 0x8a8e9e, 0, h + .05, 0); return g; }
function mkCampfire() { const g = new THREE.Group(); for (let i = 0; i < 6; i++) { const a = i * 1.047; Sp(g, .1, 0x6c7080, Math.cos(a) * .32, .08, Math.sin(a) * .32, { s: [1, .7, 1] }); } B(g, .5, .08, .08, 0x5a3a22, 0, .1, 0, { r: [0, .6, 0] }); B(g, .5, .08, .08, 0x5a3a22, 0, .1, 0, { r: [0, -.6, 0] }); const f = flame(g, 0, .3, 0, 1.6); g.userData.flame = f; return g; }
function mkWorkbench() { const g = new THREE.Group(), W1 = 0x7d5433, W2 = 0xb07a48; B(g, .92, .1, .6, W2, 0, .62, 0); for (const [x, z] of [[-.38, -.22], [.38, -.22], [-.38, .22], [.38, .22]]) B(g, .08, .58, .08, W1, x, .29, z); B(g, .8, .06, .48, W1, 0, .22, 0);
  B(g, .26, .05, .1, 0x9aa0ac, -.18, .7, .05, { r: [0, .4, 0] }); B(g, .05, .05, .22, W1, .2, .7, -.05); B(g, .16, .08, .06, 0x6c7080, .2, .72, .07); B(g, .2, .14, .14, 0xc89a5a, .3, .74, -.15); return g; }
function mkFarm(stage, kind) { const g = new THREE.Group(); B(g, .96, .1, .96, 0x6a4a2a, 0, .05, 0, { cs: false }); if (stage >= 0) for (const [x, z] of [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]]) { C(g, .02, .03, .12 + stage * .18, 0x4a9a4a, x, .12 + (.06 + stage * .09), z, 4); if (stage > 0) Sp(g, .08 + stage * .02, 0x6dbb4f, x, .22 + stage * .2, z, { s: [1.3, .6, 1.3] }); if (stage >= 2) Sp(g, .06, 0xe8508a, x + .05, .42, z); } return g; }

/* ----- 청크 ----- */
const WM = {}, FOAM1 = new THREE.Color(1, 0, 0), FOAM0 = new THREE.Color(0, 0, 0), RIGIDN = new Set(["rock", "ore", "wall", "swall"]);
function wmats() { if (!WM.top) { WM.top = GRD ? groundMat() : VMAT(detailTex()); WM.side = GRD ? toonPatch(TOON({ vertexColors: true, map: GRD.RK, normalMap: GRD.RKN, color: new THREE.Color(2.6, 2.5, 2.3) })) : VMAT(); WM.water = WATERMAT; WM.inst = windMat({ vertexColors: true }, .07); WM.rigid = TOON({ vertexColors: true, gradientMap: gradTex }); } return WM; }
function biomeCol(b, x, y) { return new THREE.Color(BIO_C[b]).offsetHSL(0, 0, (rn(x, y, 1) - .5) * (b === 5 ? .03 : .07)); }
const cropStage = k => { const c = S.crops[k]; return c ? Math.min(2, Math.floor((Date.now() - c.t0) / 40000)) : -1; };
function buildChunk(cx, cy) {
  const W = WORLD, M_ = wmats(), grp = new THREE.Group(), top = new GB(), side = new GB(), water = new GB(), inst = {}, ch = { grp, cx, cy, dirty: false, lit: [], flames: [], spins: [], crops: [], water: null };
  const x0 = cx * CHK, y0 = cy * CHK, hgt = (x, y) => wb(x, y) === 0 ? -.32 : wc(x, y) === CELL.CLIFF ? 1.3 : 0;
  const pushI = (name, x, y, h, sc = 1) => { (inst[name] ||= []).push([x, y, h, sc]); };
  const VW = new Map(), vw = (x, y) => { const k = y * 4096 + x; let v = VW.get(k); if (!v) { v = [0, 0, 0, 0, 0, 0]; let n = 0; for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const xx = x + dx, yy = y + dy, bb = wb(xx, yy); if (bb === undefined) continue; const cc = wc(xx, yy), l = cc === CELL.FLOOR || cc === CELL.FARM ? 5 : BIOL[bb]; v[l]++; n++; } if (!n) v[0] = 1; else for (let i = 0; i < 6; i++) v[i] /= n; VW.set(k, v); } return v.slice(); };
  const VC = new Map(), vcol = (x, y) => { const k = y * 4096 + x; let v = VC.get(k); if (!v) { v = new THREE.Color(0, 0, 0); let n = 0; for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const bb = wb(x + dx, y + dy); if (bb === 0 || bb === undefined) continue; v.add(biomeCol(bb, x + dx, y + dy)); n++; } if (n) v.multiplyScalar(1 / n); else v.copy(biomeCol(wb(x, y), x, y)); VC.set(k, v); } return v; };
  const wcol = new THREE.Color(0x4a94d8), dirt = new THREE.Color(0x8a6a44), cliff = new THREE.Color(0x8a7d62);
  const VR = W.vreg, HR = W.hreg, localCell = (x, y) => VR && ((x >= VR.x && x < VR.x + 30 && y >= VR.y && y < VR.y + 20) || (x >= HR.x && x < HR.x + RW && y >= HR.y + 2 && y < HR.y + RH));
  for (let y = y0; y < y0 + CHK; y++) for (let x = x0; x < x0 + CHK; x++) {
    if (x >= WN || y >= WN || localCell(x, y)) continue;
    const b = wb(x, y), c = wc(x, y), H = hgt(x, y); let col = biomeCol(b, x, y);
    if (c === CELL.FLOOR || (c >= 40 && S.wfloor && S.wfloor[y * WN + x])) col = new THREE.Color(0xc2945e).offsetHSL(0, 0, (rn(x, y, 2) - .5) * .06); else if (c === CELL.FARM) col = new THREE.Color(0x6a4a2a);
    else if (REAL && b !== 0) col = [vcol(x, y), vcol(x, y + 1), vcol(x + 1, y + 1), vcol(x + 1, y)];
    top.quad([x, H, y], [x, H, y + 1], [x + 1, H, y + 1], [x + 1, H, y], col, [0, 1, 0], [[x * .5, y * .5], [x * .5, (y + 1) * .5], [(x + 1) * .5, (y + 1) * .5], [(x + 1) * .5, y * .5]], GRD ? [vw(x, y), vw(x, y + 1), vw(x + 1, y + 1), vw(x + 1, y)] : undefined);
    if (b === 0) { const lw = (xx, yy) => wb(xx, yy) !== 0, f = (X, Y) => lw(X - 1, Y - 1) || lw(X, Y - 1) || lw(X - 1, Y) || lw(X, Y) ? FOAM1 : FOAM0; water.quad([x, -.12, y], [x, -.12, y + 1], [x + 1, -.12, y + 1], [x + 1, -.12, y], [f(x, y), f(x, y + 1), f(x + 1, y + 1), f(x + 1, y)], [0, 1, 0]); }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const H2 = hgt(x + dx, y + dy); if (H2 >= H) continue; const ex = dx > 0 ? x + 1 : x, ez = dy > 0 ? y + 1 : y;
      const a = dx ? [ex, H2, y] : [x, H2, ez], bb = dx ? [ex, H, y] : [x, H, ez], c3 = dx ? [ex, H, y + 1] : [x + 1, H, ez], d = dx ? [ex, H2, y + 1] : [x + 1, H2, ez];
      const u0 = dx ? y : x; side.quad(a, bb, c3, d, H > 0 ? cliff : dirt, [dx, 0, dy], GRD ? [[u0 * .5, H2 * .5], [u0 * .5, H * .5], [(u0 + 1) * .5, H * .5], [(u0 + 1) * .5, H2 * .5]] : undefined);
    }
    if (c === CELL.TREE) pushI(treeVar(b, x, y), x, y, H, .85 + rn(x, y, 6) * .45);
    else if (c === CELL.ROCK) pushI("rock", x, y, H, .8 + rn(x, y, 6) * .6); else if (c === CELL.BUSH) pushI("bush", x, y, H, .9 + rn(x, y, 6) * .3);
    else if (c === CELL.ORE) pushI("ore", x, y, H, 1); else if (c === CELL.CACT) pushI("cactus", x, y, H, .8 + rn(x, y, 6) * .5);
    else if (c === CELL.WALL) pushI("wall", x, y, H, 1); else if (c === CELL.SWALL) pushI("swall", x, y, H, 1);
    else if (REAL && NAT && c === 0 && (b === 2 || b === 3 || b === 6 || b === 7 || b === 8)) { const k = Math.max(1, Math.round((b === 3 ? 3 : 2) * GRASS_DENS())); for (let i = 0; i < k; i++) if (rn(x, y, 20 + i) < .7 * Math.min(1, GRASS_DENS() * 1.4)) pushI("tuft", x + rn(x, y, 30 + i) * .9 - .45, y + rn(x, y, 40 + i) * .9 - .45, H, .7 + rn(x, y, 50 + i) * .6); }
    else if (c === 0 && (b === 2 || b === 3 || b === 8) && rn(x, y, 4) < .4) pushI("tuft", x + rn(x, y, 5) * .8 - .4, y + rn(x, y, 9) * .8 - .4, H, .8 + rn(x, y, 10) * .5);
    else if (c === CELL.FIRE) { const m = mkCampfire(); m.position.set(x + .5, H, y + .5); grp.add(m); ch.flames.push(m.userData.flame); ch.lit.push({ x: x + .5, z: y + .5, c: 0xffa040, r: 7, h: 1, i: 1.4 }); }
    else if (c === CELL.BED) { const m = mkFurn("bed"); m.position.set(x + .5, H, y + .5); grp.add(m); }
    else if (c >= 40 && CODE_FURN(c)) { const id = CODE_FURN(c), m = mkFurn(id); m.position.set(x + .5, H + (FURN[id].wall ? .3 : 0), y + .5); m.rotation.y = Math.round(rn(x, y, 7) * 4) * HALF; grp.add(m); }
    else if (c === CELL.BENCH) { const m = mkWorkbench(); m.position.set(x + .5, H, y + .5); m.rotation.y = rn(x, y, 3) > .5 ? 0 : HALF; grp.add(m); }
    else if (c === CELL.FARM) { const st = cropStage(y * WN + x), m = mkFarm(st); m.position.set(x + .5, H, y + .5); grp.add(m); ch.crops.push({ k: y * WN + x, st }); }
  }
  grp.add(top.build(M_.top)); if (side.p.length) grp.add(side.build(M_.side)); if (water.p.length) { const m = water.build(M_.water, false); grp.add(m); ch.water = m; }
  const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), eu = new THREE.Euler();
  for (const nm in inst) {
    if (REAL && NAT && NATV[nm]) {
      const vs = NATV[nm], by = {};
      for (const it of inst[nm]) { const v = vs[Math.floor(rn(Math.floor(it[0] * 3), Math.floor(it[1] * 3), 11) * vs.length)]; (by[v] ||= []).push(it); }
      for (const v in by) for (const lod of NAT.parts["lod/" + v] ? [0, 1] : [0]) for (const p of NAT.parts[lod ? "lod/" + v : v]) {
        const L = by[v], desert = nm === "rock" && wb(Math.floor(L[0][0]), Math.floor(L[0][1])) === 4, im = new THREE.InstancedMesh(p.g, natMat(desert && p.m === "Rock" ? "RockD" : p.m), L.length);
        L.forEach(([x, y, h, sc], i) => { eu.set(0, rn(Math.floor(x * 3), Math.floor(y * 3), 8) * 6.283, 0); q.setFromEuler(eu); const k = sc * NATS[nm]; sv.set(k, k, k); pv.set(x + .5, h, y + .5); mm.compose(pv, q, sv); im.setMatrixAt(i, mm); });
        im.castShadow = nm !== "tuft" && !lod; im.receiveShadow = true; im.computeBoundingSphere(); grp.add(im);   // 화면(그림자 카메라 포함) 밖이면 그리지 않아요. 먼 간략 나무는 그림자 생략
        if (NAT.parts["lod/" + v]) { (lod ? (ch.lo ||= []) : (ch.hi ||= [])).push(im); im.visible = !lod; }
        if (nm === "tuft") { (ch.grass ||= []).push(im); im.visible = false; ch.gnear = false; }   // 풀은 가까운 구역에서만
      }
      continue;
    }
    const list = inst[nm], im = new THREE.InstancedMesh(baked(nm, MK[nm === "spine" || nm === "pine" || nm === "oak" || nm === "dead" || nm === "willow" ? nm : nm]), (RIGIDN.has(nm) ? M_.rigid : M_.inst), list.length);
    list.forEach(([x, y, h, sc], i) => { eu.set(0, rn(Math.floor(x), Math.floor(y), 8) * 6.283, 0); q.setFromEuler(eu); sv.set(sc, sc, sc); pv.set(x + .5, h, y + .5); if (nm === "tuft") pv.set(x + .5, h, y + .5); mm.compose(pv, q, sv); im.setMatrixAt(i, mm); });
    im.castShadow = nm !== "tuft"; im.computeBoundingSphere(); grp.add(im);
  }
  for (const p of poisNear(x0, y0, x0 + CHK, y0 + CHK)) {
    if (p.x < x0 || p.x >= x0 + CHK || p.y < y0 || p.y >= y0 + CHK) continue;
    const put = (m, ox, oz, ry = 0) => { m.position.set(p.x + ox, 0, p.y + oz); m.rotation.y = ry; grp.add(m); return m; }, night = true;
    if (p.type === "shop") { put(mkShop(), 1.5, 1.1); ch.lit.push({ x: p.x + 1.5, z: p.y + 2.3, c: 0xffd870, r: 5, h: 1, i: 1.3, night }); }
    else if (p.type === "inn") { put(mkHouse(), 1.5, 1.1); ch.lit.push({ x: p.x + 1.5, z: p.y + 2.3, c: 0xffd870, r: 5, h: 1, i: 1.3, night }); }
    else if (p.type === "board") put(mkBoard(), .5, .5); else if (p.type === "portal") { const m = put(mkPortal(), .5, .5); m.scale.setScalar(1.3); ch.spins.push(m); ch.lit.push({ x: p.x + .5, z: p.y + .5, c: 0x6ee7ff, r: 6, h: 1.2, i: 1.2 }); }
    else if (p.type === "shrine") { const m = put(mkShrine(), .5, .5); ch.spins.push(m.userData.spin); ch.lit.push({ x: p.x + .5, z: p.y + .5, c: 0x6ee7ff, r: 6, h: 1.6, i: 1.1 }); }
    else if (p.type === "castle") { if (p.deco) put(mkTower(), 1.5, 1.5); else { put(mkCastle(), 5, 2.5); ch.lit.push({ x: p.x + 5, z: p.y + 6, c: 0xffe0a0, r: 9, h: 3, i: 1, night }); } }
    else if (p.type === "demon") { put(mkDemonCastle(), 4.5, 2); ch.lit.push({ x: p.x + 4.5, z: p.y + 4.2, c: 0xff3a2a, r: 13, h: 2.2, i: 1.7 }); }
    else if (p.type === "cave") put(mkCave(), 1, 1.1);
    else if (p.type === "chest") { put(mkChest(!!S.wopen[p.id]), .5, .5); }
    else if (p.type === "camp") { [[-3, -1, 0xc8553d, .5], [3, -2, 0x3d6ed0, -.6], [-1, 3, 0x4a9a4a, 2.4]].forEach(([ox, oz, c, r]) => put(mkTent(c), ox + .5, oz + .5, r)); const f = put(mkCampfire(), 2.5, 1.5); ch.flames.push(f.userData.flame); ch.lit.push({ x: p.x + 2.5, z: p.y + 1.5, c: 0xffa040, r: 7, h: 1, i: 1.3 }); }
    else if (p.type === "ruin") { for (let i = 0; i < 7; i++) { const a = i * .9; put(mkPillar(i % 3 ? 1.6 : .7), Math.cos(a) * 4 + .5, Math.sin(a) * 4 + .5); } }
    else if (p.type === "lair") { for (let i = 0; i < 8; i++) { const a = i * .785; const m = put(mkPillar(2.2), Math.cos(a) * 6 + .5, Math.sin(a) * 6 + .5); m.traverse(o => { if (o.isMesh) o.material = M(0x5c4a5a); }); } ch.lit.push({ x: p.x + .5, z: p.y + .5, c: 0xff6a3a, r: 9, h: 1.5, i: 1.4 }); }
  }
  return ch;
}
function disposeChunk(ch) { ch.grp.traverse(m => { if (m.geometry && !m.geometry.userData.shared) m.geometry.dispose(); }); }
let LOD_NEAR = 26;   // 이 거리(칸) 안의 구역 중심만 원본 나무(휴대폰은 아래에서 좁혀요)
const GRASS_NEAR = 22;   // 풀은 이 거리 안의 구역만 그려요(멀면 바닥 색으로 충분)
const GRASS_DENS = () => gfxLv === "low" ? .5 : TOUCHDEV || gfxLv === "mid" ? .6 : 1;   // 풀 밀도(휴대폰·보통 화질은 줄여요)
const LITE = () => TOUCHDEV || gfxLv === "low";   // 휴대폰·낮은 화질: 보이는 거리를 줄여 그리는 양을 반쯤으로
if (LITE()) LOD_NEAR = 13;
const WFOG = REAL ? new THREE.Fog(0xdcecf4, LITE() ? 18 : 24, LITE() ? 46 : 64) : new THREE.Fog(0x9fdcf5, LITE() ? 26 : 36, LITE() ? 50 : 70);
function drawWorldTerrain(ox = 0, oz = 0) {
  const W = WORLD, P = player, pcx = Math.floor((P.x / T + ox) / CHK), pcy = Math.floor((P.y / T + oz) / CHK), R = LITE() ? 2 : 3, NC = WN / CHK;
  if (!G.wgrp) { G.wgrp = new THREE.Group(); S3.add(G.wgrp); const sea = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), TOON({ color: 0x4a94d8, gradientMap: gradTex })); sea.rotation.x = -HALF; G.sea = sea; S3.add(sea); }
  G.wgrp.visible = true; G.wgrp.position.set(-ox, 0, -oz); G.sea.visible = true; G.sea.position.set(camT.x, -.2, camT.z);
  const need = []; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const cx = pcx + dx, cy = pcy + dy; if (cx >= 0 && cy >= 0 && cx < NC && cy < NC) need.push([dx * dx + dy * dy, cx, cy]); }
  need.sort((a, b) => a[0] - b[0]); let budget = W.first ? 30 : 2;
  for (const [d2, cx, cy] of need) {
    const key = cy * 100000 + cx; let ch = W.chunks.get(key);
    if (!ch) { if (budget <= 0) continue; budget--; ch = buildChunk(cx, cy); W.chunks.set(key, ch); G.wgrp.add(ch.grp); }
    else if (ch.dirty) { if (d2 > 4 && budget <= 0) continue; budget--; G.wgrp.remove(ch.grp); disposeChunk(ch); ch = buildChunk(cx, cy); W.chunks.set(key, ch); G.wgrp.add(ch.grp); }
  }
  W.first = false; const night = darkness() > .2;
  for (const [key, ch] of W.chunks) {
    if (Math.abs(ch.cx - pcx) > R + 1 || Math.abs(ch.cy - pcy) > R + 1) { G.wgrp.remove(ch.grp); disposeChunk(ch); W.chunks.delete(key); continue; }
    { const dx = ch.cx * CHK + CHK / 2 - ox - camT.x, dz = ch.cy * CHK + CHK / 2 - oz - camT.z; const d2 = dx * dx + dz * dz; ch.grp.visible = d2 < (WFOG.far + CHK) ** 2; if (!ch.grp.visible) continue;
      const near = d2 < LOD_NEAR ** 2; if (ch.hi && ch.near !== near) { ch.near = near; ch.hi.forEach(m => m.visible = near); ch.lo.forEach(m => m.visible = !near); }
      const gn = d2 < GRASS_NEAR ** 2; if (ch.grass && ch.gnear !== gn) { ch.gnear = gn; ch.grass.forEach(m => m.visible = gn); } }   // 가까운 구역만 원본 나무, 먼 구역은 간략 나무   // 안개 너머 구역은 그리지 않아요
    if (ch.water) ch.water.position.y = Math.sin(vtime * 1.6) * .02;
    ch.flames.forEach((f, i) => f.scale.setScalar(1.6 + Math.sin(vtime * 12 + i * 2) * .25)); ch.spins.forEach(s => s.rotation.y += DT * 1.5);
    for (const L of ch.lit) if ((!L.night || night) && Math.abs(L.x - ox - camT.x) < 18 && Math.abs(L.z - oz - camT.z) < 14) light(L.x - ox, L.z - oz, L.r, L.c, L.h, L.i);
    if (ch.crops.length && frameNo % 90 === 0) for (const c of ch.crops) if (cropStage(c.k) !== c.st) ch.dirty = true;
  }
  S3.fog = WFOG; WFOG.color.copy(S3.background);
}
