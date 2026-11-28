/* ----- 장면 소품 ----- */
const WIN = Mu(0xa8dcf5); WIN.emissive = new THREE.Color(0xffd870); WIN.emissiveIntensity = 0;
const FLM = HDR(0xffa534), FLM2 = HDR(0xffe27a);
function flame(par, x, y, z, s = 1) { const g = new THREE.Group(); g.position.set(x, y, z); const a = new THREE.Mesh(geo("fa", () => new THREE.ConeGeometry(.09, .26, 6)), FLM), b = new THREE.Mesh(geo("fb", () => new THREE.ConeGeometry(.05, .16, 6)), FLM2); b.position.y = -.03; g.add(a, b); g.scale.setScalar(s); par.add(g); return g; }
const flames = [];
function mkHouse() {
  const g = new THREE.Group();
  B(g, 2.7, 1.1, 1.8, 0xf3e3c0, 0, .55, 0, { rs: true }); B(g, 2.74, .12, 1.84, 0xd9c49a, 0, .06, 0);
  for (const s of [-1, 1]) B(g, 1.7, .1, 2.2, s > 0 ? 0xc8553d : 0xb04a34, s * .72, 1.5, 0, { r: [0, 0, -s * .62] });
  B(g, .1, .16, 2.25, 0x7a2e22, 0, 1.93, 0); B(g, .3, .8, .3, 0x8a8e9e, .8, 1.9, -.3);
  for (const s of [-1, 1]) { B(g, 1.8, .08, .1, 0xc8553d, s * .75, 1.46 + s * 0, 1.0, { cs: false, r: [0, 0, -s * .62] }); }
  B(g, .52, .85, .1, 0x5a3a22, 0, .43, .92); B(g, .44, .78, .06, 0x8a5a34, 0, .43, .96); Sp(g, .035, 0xf5d142, .15, .42, 1.0);
  for (const s of [-1, 1]) { B(g, .5, .5, .1, 0x5a3a22, s * .9, .65, .92); B(g, .4, .4, .08, 0xffffff, s * .9, .65, .96).material = WIN; B(g, .06, .4, .09, 0x5a3a22, s * .9, .65, .98); }
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
}
function mkShop() {
  const g = new THREE.Group();
  B(g, 2.8, 1.25, 1.8, 0xe9eef5, 0, .62, 0, { rs: true }); B(g, 2.86, .22, 1.9, 0x3d6ed0, 0, 1.3, 0);
  B(g, 2.9, .06, .75, 0xe8505a, 0, 1.05, 1.1, { r: [.55, 0, 0] }); for (let i = 0; i < 7; i++) B(g, .2, .065, .76, 0xfff3d6, -1.2 + i * .4, 1.052, 1.1, { r: [.55, 0, 0] });
  B(g, 1.3, .5, .1, 0xfff3d6, 0, 1.75, .6); B(g, 1.4, .06, .12, 0xa87645, 0, 2.02, .6); B(g, 1.4, .06, .12, 0xa87645, 0, 1.48, .6); Sp(g, .17, 0xa87645, 0, 1.75, .68); K(g, .06, .1, 0x5a3a22, 0, 1.92, .68, 5);
  B(g, .8, .6, .1, 0xffffff, -.75, .65, .92).material = WIN; B(g, .06, .6, .11, 0x2c3e78, -.75, .65, .94);
  B(g, .62, .9, .1, 0xa8dcf5, .75, .5, .92).material = WIN; B(g, .06, .9, .11, 0x2c3e78, .75, .5, .94);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
}
function mkCave() {
  const g = new THREE.Group();
  K(g, 1.35, 2.5, 0x8a8e9e, 0, 1.25, 0, 7, { s: [1, 1, .9] }); K(g, .55, .8, 0xf0f4fa, 0, 2.3, 0, 7, { s: [1, 1, .9] });
  I(g, .5, 0x6c7080, -.9, .3, .8, { s: [1, .7, 1] }); I(g, .4, 0x6c7080, 1, .25, .7, { s: [1, .7, 1] });
  Sp(g, .52, 0x14121c, 0, .5, .78, { s: [1, 1.15, .45] }); B(g, .12, .8, .12, 0x5c5f6e, -.55, .4, .86); B(g, .12, .8, .12, 0x5c5f6e, .55, .4, .86);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
}
function mkGate() {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { C(g, .1, .12, 1.9, 0x7d5433, s * .75, .95, 0, 6); const f = flame(g, s * .75, 2.05, 0, 1.2); flames.push(f); }
  B(g, 1.9, .18, .2, 0x7d5433, 0, 1.8, 0); B(g, .8, .42, .08, 0xd9b07c, 0, 1.45, .1); B(g, .1, .24, .09, 0xa8323c, -.15, 1.45, .15); B(g, .1, .24, .09, 0xa8323c, .05, 1.45, .15); B(g, .1, .24, .09, 0xa8323c, .25, 1.45, .15);
  for (let i = 0; i < 7; i++) Sp(g, .15, i % 2 ? 0x4a9a4a : 0x2f6b3a, -.8 + i * .27, 1.92 + (i % 2) * .05, 0);
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
}
function mkTreeBody(t) {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  if (t.age < 20) { C(inner, .025, .035, .2, 0x4a9a4a, 0, .1, 0, 5); Sp(inner, .09, 0x6dbb4f, -.08, .22, 0, { s: [1.3, .5, .8] }); Sp(inner, .09, 0x6dbb4f, .08, .24, 0, { s: [1.3, .5, .8] }); }
  else if (t.age < 60) { C(inner, .05, .07, .55, 0x7d5433, 0, .28, 0, 6); Sp(inner, .38, 0x4a9a4a, 0, .8, 0); Sp(inner, .26, 0x6dbb4f, -.1, .95, .1); }
  else if (REAL && NAT) {
    inner.add(natModel(NATV.oak[(t.x * 7 + t.y * 3) % 3], .36));
    const col = { apple: 0xe8505a, orange: 0xf0a23c, peach: 0xf6a8c8 }[t.kind];
    t.fruitMeshes = []; [[-.55, 1.55, .45], [.2, 1.35, .62], [.6, 1.7, .2]].forEach((p, i) => { const f = Sp(inner, .1, col, p[0], p[1], p[2]); f.visible = i < t.fruit; t.fruitMeshes.push(f); });
  }
  else {
    C(inner, .13, .19, .9, 0x7d5433, 0, .45, 0, 7);
    const cn = new THREE.Group(); cn.position.y = 1.2; inner.add(cn);
    Sp(cn, .72, 0x3d8444, 0, .1, 0, { s: [1, .9, 1] }); Sp(cn, .55, 0x4a9a4a, -.35, .45, .15); Sp(cn, .5, 0x4a9a4a, .38, .35, -.1); Sp(cn, .45, 0x6dbb4f, .05, .75, .05); Sp(cn, .22, 0x9be070, -.2, .95, .3);
    const col = { apple: 0xe8505a, orange: 0xf0a23c, peach: 0xf6a8c8 }[t.kind];
    t.fruitMeshes = []; [[-.6, .0, .45], [.1, -.15, .72], [.62, .1, .3]].forEach((p, i) => { const f = Sp(cn, .1, col, p[0], p[1], p[2]); f.visible = i < t.fruit; t.fruitMeshes.push(f); });
  }
  return { g, inner, key: "" };
}
function mkPine() { if (REAL && NAT) return natModel(NATV.pine[Math.floor(Math.random() * 3)], .5); const g = new THREE.Group(); C(g, .09, .13, .5, 0x7d5433, 0, .25, 0, 6); for (let k = 0; k < 3; k++) K(g, .62 - k * .14, .75, k % 2 ? 0x3d8444 : 0x2f6b3a, 0, .8 + k * .5, 0, 7); g.scale.setScalar(.95); g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g; }
function mkRock() { if (REAL && NAT) return natModel(NATV.rock[Math.floor(Math.random() * 4)], .7); const g = new THREE.Group(); I(g, .42, 0x8a8e9e, 0, .22, 0, { s: [1.1, .7, 1], r: [.2, .6, 0] }); I(g, .22, 0xb8bcc8, -.2, .2, .15, { s: [1, .7, 1] }); return g; }
function mkBush() { if (REAL && NAT) return natModel(NATV.bush[Math.floor(Math.random() * 4)], .75); const g = new THREE.Group(); Sp(g, .38, 0x3d8444, 0, .25, 0, { s: [1.2, .75, 1] }); Sp(g, .28, 0x6dbb4f, -.1, .38, .1); for (const [x, y, z] of [[.3, .3, .25], [-.25, .25, .3], [.1, .5, .2], [.35, .2, -.1]]) Sp(g, .06, 0x6b4a9e, x, y, z); return g; }
const FLC = { "🌷": [0xe8505a, 0xf5d142], "🌼": [0xfff3d6, 0xf5b942], "🌸": [0xf6a8c8, 0xfff3d6], "🌺": [0xd9408a, 0xf5d142] };
function mkFlower(em) { const [c, c2] = FLC[em] || FLC["🌷"], g = new THREE.Group(); C(g, .015, .015, .3, 0x3d8444, 0, .15, 0, 4); for (let i = 0; i < 5; i++) { const a = i * 1.2566; Sp(g, .06, c, Math.cos(a) * .08, .32, Math.sin(a) * .08, { s: [1, .6, 1] }); } Sp(g, .045, c2, 0, .34, 0); return g; }
const FRC = { apple: 0xe8505a, orange: 0xf0a23c, peach: 0xf6a8c8 };
function mkGearModel(em) {
  const g = new THREE.Group();
  if (em === "🛡️") { B(g, .34, .4, .06, 0xb8bcc8, 0, 0, 0); B(g, .2, .24, .08, 0x3d6ed0, 0, .02, 0); }
  else if (em === "🥋") { B(g, .4, .4, .22, 0xa87645, 0, 0, 0); B(g, .1, .12, .24, 0x5a3a22, 0, .12, 0); B(g, .14, .14, .2, 0xa87645, -.27, .1, 0); B(g, .14, .14, .2, 0xa87645, .27, .1, 0); }
  else if (em === "💍") { TR(g, .13, .045, 0xf5d142, 0, 0, 0); Sp(g, .06, 0x6ee7ff, 0, .14, 0); }
  else { const w = weaponModel(em); w.children[0].rotation.x = 0; w.children[0].position.set(0, -.3, 0); w.rotation.z = .6; g.add(w); }
  return g;
}
function mkFurn(id) {
  const g = new THREE.Group(), W1 = 0x7d5433, W2 = 0xa87645;
  switch (id) {
    case "chair": B(g, .5, .08, .5, W2, 0, .45, 0); B(g, .5, .6, .08, W2, 0, .78, -.21); for (const [x, z] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) B(g, .07, .45, .07, W1, x, .22, z); break;
    case "sofa": B(g, .95, .3, .6, 0xc8553d, 0, .25, 0); B(g, .95, .5, .18, 0xa8402e, 0, .6, -.22); B(g, .16, .4, .6, 0xa8402e, -.5, .38, 0); B(g, .16, .4, .6, 0xa8402e, .5, .38, 0); B(g, .4, .1, .5, 0xe07a5a, -.2, .46, .05); B(g, .4, .1, .5, 0xe07a5a, .22, .46, .05); break;
    case "bed": B(g, .9, .28, 1.05, W1, 0, .2, 0); B(g, .84, .16, .95, 0xf6f2ea, 0, .4, 0); B(g, .84, .12, .62, 0x3d6ed0, 0, .48, .2); B(g, .6, .1, .24, 0xffffff, 0, .5, -.3); B(g, .9, .6, .08, W2, 0, .45, -.5); break;
    case "tv": B(g, .8, .08, .5, W1, 0, .35, 0); for (const x of [-.3, .3]) B(g, .08, .35, .5, W1, x, .17, 0); B(g, .78, .55, .08, 0x2a2433, 0, .74, 0); B(g, .68, .45, .06, 0x3d6ed0, 0, .74, .05).material = Mu(0x6f9af0); break;
    case "shelf": B(g, .85, 1.3, .35, W1, 0, .65, 0); for (let s = 0; s < 3; s++) { B(g, .75, .04, .3, W2, 0, .15 + s * .42, 0.02); for (let b = 0; b < 6; b++) B(g, .09, .26 - (b % 2) * .03, .2, [0xe8505a, 0x3d6ed0, 0xf5d142, 0x4a9a4a, 0xf28cb0, 0x6b4a9e][(b + s) % 6], -.3 + b * .12, .3 + s * .42, .04); } break;
    case "plant": C(g, .2, .15, .3, 0xc8553d, 0, .15, 0, 8); Sp(g, .3, 0x2f6b3a, 0, .55, 0); Sp(g, .2, 0x4a9a4a, -.1, .72, .05); Sp(g, .15, 0x6dbb4f, .12, .8, 0); break;
    case "lamp": C(g, .18, .2, .06, 0x5c5f6e, 0, .03, 0, 8); C(g, .03, .03, 1, 0x8a8e9e, 0, .5, 0, 5); K(g, .28, .32, 0xf5d98a, 0, 1.12, 0, 8); Sp(g, .1, 0xfff3d6, 0, 1.0, 0).material = HDR(0xfff3d6); break;
    case "teddy": Sp(g, .2, 0xa87645, 0, .22, 0, { s: [1, 1.1, .9] }); Sp(g, .17, 0xa87645, 0, .55, 0); Sp(g, .07, 0x8a5a34, -.14, .68, 0); Sp(g, .07, 0x8a5a34, .14, .68, 0); Sp(g, .08, 0xd9b07c, 0, .5, .13); Sp(g, .03, INK, -.06, .58, .15); Sp(g, .03, INK, .06, .58, .15); break;
    case "piano": B(g, .95, .5, .55, 0x2a2433, 0, .6, -.05); B(g, .85, .06, .2, 0xffffff, 0, .55, .2); for (const x of [-.4, .4]) B(g, .08, .5, .08, 0x2a2433, x, .25, .15); for (let k = 0; k < 7; k++) B(g, .05, .04, .12, INK, -.36 + k * .12, .58, .16); B(g, .9, .5, .1, 0x2a2433, 0, 1, -.28); break;
    case "frame": B(g, .6, .5, .06, 0xe8b84a, 0, 0, 0); B(g, .5, .4, .07, 0x8fd3f0, 0, 0, 0); B(g, .5, .16, .08, 0x4a9a4a, 0, -.12, 0); Sp(g, .08, 0xf5d142, .13, .08, .05); break;
    case "clock": C(g, .26, .26, .08, W1, 0, 0, 0, 14, { r: [HALF, 0, 0] }); C(g, .21, .21, .1, 0xfff3d6, 0, 0, 0, 14, { r: [HALF, 0, 0] }); B(g, .03, .16, .12, INK, 0, .06, .05); B(g, .12, .03, .12, INK, .05, 0, .05); break;
    case "window": B(g, .7, .7, .06, 0xf6f2ea, 0, 0, 0); B(g, .6, .6, .08, 0x8fd3f0, 0, 0, 0).material = WIN; B(g, .05, .6, .09, 0xf6f2ea, 0, 0, 0); B(g, .6, .05, .09, 0xf6f2ea, 0, 0, 0); break;
    case "rugR": case "rugB": B(g, .92, .03, .92, FURN[id].rug === "#d9534f" ? 0xd9534f : 0x4a8fd6, 0, .02, 0, { cs: false, rs: true }); B(g, .62, .035, .62, FURN[id].rug === "#d9534f" ? 0xe8807c : 0x7ab0e8, 0, .025, 0, { cs: false }); break;
  }
  g.traverse(m => { if (m.isMesh && m.castShadow) m.receiveShadow = false; }); return g;
}
function mkPortal() { const g = new THREE.Group(); const r = TR(g, .55, .08, 0x6ee7ff, 0, .8, 0, { cs: false }); r.material = HDR(0x6ee7ff); const r2 = TR(g, .35, .06, 0xffffff, 0, .8, 0, { cs: false }); r2.material = HDR(0xffffff); const d = new THREE.Mesh(geo("pd", () => new THREE.CircleGeometry(.5, 20)), new THREE.MeshBasicMaterial({ color: 0xa8f0ff, transparent: true, opacity: .5, side: THREE.DoubleSide })); d.position.y = .8; g.add(d); g.userData.parts = [r, r2, d]; return g; }
function mkStairs() { const g = new THREE.Group(); B(g, .9, .1, .9, 0x14121c, 0, .02, 0, { cs: false }); for (let k = 0; k < 4; k++) B(g, .8 - k * .15, .04, .2, 0x6c7080, 0, .06 + 0, -.3 + k * .2, { cs: false }); return g; }
function mkBug(id) {
  const g = new THREE.Group();
  if (id === "firefly") { const s = new THREE.Mesh(geo("ff", () => new THREE.SphereGeometry(.07, 8, 6)), HDR(0xf5ff8a)); g.add(s); return { g, wings: [], ff: s }; }
  const bm = new THREE.MeshBasicMaterial({ color: 0xf28cb0, side: THREE.DoubleSide }), wl = new THREE.Group(), wr = new THREE.Group();
  const w1 = new THREE.Mesh(geo("bw", () => new THREE.PlaneGeometry(.2, .16)), bm); w1.position.x = -.1; wl.add(w1); const w2 = w1.clone(); w2.position.x = .1; wr.add(w2); g.add(wl, wr); Sp(g, .03, INK, 0, 0, 0);
  return { g, wings: [wl, wr] };
}
const mkBobber = () => { const g = new THREE.Group(); Sp(g, .08, 0xe8505a, 0, 0, 0); Sp(g, .06, 0xffffff, 0, -.05, 0); return g; };

/* ----- 엔티티 동기화 ----- */
const ENT = new WeakMap(), LIVE = new Set(), PK = { v: {}, h: {}, d: {} };
// 모델 파일이 늦게 도착하면, 먼저 만들어 둔 코드 모델(e.proc)을 버리고 새로 만들어요
function dropEnt(o) { const e = ENT.get(o); if (!e) return; e.par.remove(e.g); e.g.traverse(m => { if (m.isMesh && m.material && !Array.isArray(m.material) && m.material.userData.own) m.material.dispose(); if (m.isMesh && m.userData.ownGeo) m.geometry.dispose(); }); LIVE.delete(e); ENT.delete(o); }
function entM(o, make, parent) {   // 모델 파일이 늦게 오면 임시 모델(proc)을 버리고 다시 만들어요
  const rd = o.cb || o.model ? KAY.ready : MONM.ready, e = ENT.get(o); if (e && e.proc && rd) dropEnt(o); const n = ent(o, make, parent); if (!rd && !(n.mon || n.cbk)) n.proc = true; return n; }
function ent(o, make, parent) {
  let e = ENT.get(o);
  if (!e) { e = make(o); e.par = parent; e.key0 = o; parent.add(e.g); ENT.set(o, e); LIVE.add(e); }
  e.seen = frameNo; return e;
}
function sweep() {
  for (const e of LIVE) if (e.seen !== frameNo) {
    e.par.remove(e.g); e.g.traverse(m => { if (m.isMesh && m.material && !Array.isArray(m.material) && m.material.userData.own) m.material.dispose(); if (m.isMesh && m.userData.ownGeo) m.geometry.dispose(); });
    LIVE.delete(e); ENT.delete(e.key0);
  }
}

/* ----- 씬 그룹 ----- */
let G = null;
function groups() {
  if (G || !R3) return G;
  const mk = () => { const g = new THREE.Group(); g.visible = false; S3.add(g); return g; };
  G = { village: mk(), vdyn: new THREE.Group(), home: mk(), hdyn: new THREE.Group(), dyn: mk(), cur: null };
  G.village.add(G.vdyn); G.home.add(G.hdyn);
  if (REAL && RX) { const sk = new RX[0].Sky(); sk.material.fragmentShader = sk.material.fragmentShader.replace("gl_FragColor = vec4( texColor, 1.0 );", "gl_FragColor = vec4( clamp( texColor, 0.0, 40.0 ), 1.0 );"); sk.scale.setScalar(400); Object.assign(sk.material.uniforms, {}); sk.material.uniforms.turbidity.value = 4.5; sk.material.uniforms.rayleigh.value = 1.6; sk.material.uniforms.mieCoefficient.value = .004; sk.material.uniforms.mieDirectionalG.value = .82; sk.frustumCulled = false; G.sky = sk; G.physSky = true; S3.add(sk);
    const es = new THREE.Scene(), sk2 = new RX[0].Sky(); sk2.scale.setScalar(50); es.add(sk2); G.envSky = { scene: es, sky: sk2, pm: new THREE.PMREMGenerator(R3), t: -99, rt: null };
    const ns = new THREE.Mesh(new THREE.SphereGeometry(140, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: false, uniforms: { top: { value: new THREE.Color() }, hor: { value: new THREE.Color() }, glow: { value: new THREE.Color() }, sd: { value: new THREE.Vector3() } },
      vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }",
      fragmentShader: "uniform vec3 top, hor, glow, sd; varying vec3 vD; void main(){ float h = clamp(vD.y, 0.0, 1.0); vec3 c = mix(hor, top, pow(h, .5)); float g = pow(max(dot(normalize(vec3(vD.x, 0.0, vD.z)), normalize(vec3(sd.x, 0.0, sd.z))), 0.0), 3.0) * (1.0 - h); c += glow * g; gl_FragColor = vec4(c, 1.0); }" }));
    ns.renderOrder = -11; ns.frustumCulled = false; ns.visible = false; G.nightSky = ns; S3.add(ns);
    const sp = new Float32Array(900), rr = mulberry32(5); for (let i = 0; i < 300; i++) { const a = rr() * 6.283, y = .08 + rr() * .92, r = Math.sqrt(1 - y * y); sp[i * 3] = Math.cos(a) * r * 130; sp[i * 3 + 1] = y * 130; sp[i * 3 + 2] = Math.sin(a) * r * 130; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3)); G.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.3, sizeAttenuation: false, transparent: true, depthWrite: false, fog: false, toneMapped: false })); G.stars.frustumCulled = false; G.stars.renderOrder = -10; S3.add(G.stars); }
  else if (REAL) { const sk = new THREE.Mesh(new THREE.SphereGeometry(120, 24, 12), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: new THREE.Color(0x5d9fe0) }, hor: { value: new THREE.Color(0xdcecf4) }, sun: { value: new THREE.Vector3(-.5, .6, .4).normalize() } },
    vertexShader: "varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 top, hor, sun; varying vec3 vD; void main(){ float h = clamp(vD.y, 0.0, 1.0); vec3 c = mix(hor, top, pow(h, .55)); c += vec3(1.0, .86, .6) * pow(max(dot(vD, sun), 0.0), 24.0) * .5; c = mix(c, hor * .92, smoothstep(0.02, -0.25, vD.y)); gl_FragColor = vec4(c, 1.0); }" }));
    sk.renderOrder = -10; sk.frustumCulled = false; G.sky = sk; S3.add(sk); }
  const far = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), TOON({ color: 0x5aa83e, gradientMap: gradTex })); far.rotation.x = -HALF; far.position.set(15, -.34, 10); far.receiveShadow = true; G.far = far; S3.add(far);
  const cm = document.createElement("canvas"); cm.width = cm.height = 64; const cx = cm.getContext("2d"); cx.fillStyle = "#fff"; for (const [x, y, sx, sy] of [[3, 3, 1, 1], [61, 3, -1, 1], [3, 61, 1, -1], [61, 61, -1, -1]]) { cx.fillRect(Math.min(x, x + sx * 18), Math.min(y, y + sy * 5), 18, 5); cx.fillRect(Math.min(x, x + sx * 5), Math.min(y, y + sy * 18), 5, 18); }
  const ct = new THREE.CanvasTexture(cm); G.cursor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false })); G.cursor.rotation.x = -HALF; G.cursor.visible = false; S3.add(G.cursor);
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(600 * 3), 3)); pg.setAttribute("color", new THREE.BufferAttribute(new Float32Array(600 * 3), 3));
  G.pts = new THREE.Points(pg, new THREE.PointsMaterial({ size: .24, vertexColors: true, sizeAttenuation: true, transparent: true, depthWrite: false, map: softTex(), alphaTest: .01 })); G.pts.frustumCulled = false; S3.add(G.pts);
  const mg = new THREE.BufferGeometry(); mg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MOTE_N * 3), 3)); mg.setAttribute("color", new THREE.BufferAttribute(new Float32Array(MOTE_N * 3), 3));
  G.motes = new THREE.Points(mg, new THREE.PointsMaterial({ size: .12, vertexColors: true, sizeAttenuation: true, transparent: true, depthWrite: false, map: softTex(), blending: THREE.AdditiveBlending })); G.motes.frustumCulled = false; G.motes.visible = false; S3.add(G.motes);
  G.cloud = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ map: cloudTex(), transparent: true, depthWrite: false })); G.cloud.rotation.x = -HALF; G.cloud.position.y = .1; G.cloud.visible = false; S3.add(G.cloud);
  return G;
}
let ORIGIN = [0, 0];
const SEAM = () => !!(WORLD && WORLD.vreg) && (scene === "out" || scene === "home" || (scene === "dun" && dun && dun.kind === "world"));
function showScene(k) { const g = groups();
  if (SEAM()) { if (!VBUILT) buildVillage(); if (!HBUILT) buildHome(); if (g.cur !== k) g.cur = k; const V = WORLD.vreg, Hr = WORLD.hreg; ORIGIN = k === "village" ? [V.x, V.y] : k === "home" ? [Hr.x, Hr.y] : [0, 0];
    g.village.visible = true; g.home.visible = true; g.village.position.set(V.x - ORIGIN[0], 0, V.y - ORIGIN[1]); g.home.position.set(Hr.x - ORIGIN[0], 0, Hr.y - ORIGIN[1]); g.dyn.visible = k === "dun"; g.far.visible = false;
    if (G.homeRoof) G.homeRoof.visible = k !== "home"; if (G.homeOut) G.homeOut.visible = false; return; }
  ORIGIN = [0, 0]; g.village.position.set(0, 0, 0); g.home.position.set(0, 0, 0); if (G.homeRoof) G.homeRoof.visible = false; if (G.homeOut) G.homeOut.visible = true;
  if (g.wgrp) { g.wgrp.visible = false; g.sea.visible = false; } if (g.cur !== k) { g.cur = k; camInit = false; } g.village.visible = k === "village"; g.home.visible = k === "home"; g.dyn.visible = k === "dun"; g.far.visible = k === "village" || k === "wild"; }

/* ----- 라벨 · 파티클 · 환경 ----- */
function labelT(text, x, z, h, col) { labels.push({ t: text, x, z, h, col: col || "#fff3d6", box: true }); }
function otextT(text, x, z, h, col, a = 1, size = 12) { labels.push({ t: text, x, z, h, col, a, size }); }
const otext = (text, x, y, col, a, size) => otextT(text, x / T, (y + 8) / T, 1.6, col, a, size);
const parts = [];
function burst(x, y, n, cols, spd = 70, life = .45, grav = 160, h = .8) {
  for (let i = 0; i < n && parts.length < 560; i++) {
    const a = Math.random() * 6.28, v = spd * (.4 + Math.random() * .8) / T;
    parts.push({ x: x / T, z: (y + 8) / T, h, vx: Math.cos(a) * v, vz: Math.sin(a) * v, vh: v * .9 + .5, g: grav / T, l: life * (.6 + Math.random() * .6), c: new THREE.Color(cols[i % cols.length]) });
  }
}
function stepParts(dt) {
  DT = dt;
  for (const p of parts) { p.l -= dt; p.x += p.vx * dt; p.z += p.vz * dt; p.h += p.vh * dt; p.vh -= p.g * dt; if (p.h < 0) { p.h = 0; p.vh *= -.3; } }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].l <= 0) parts.splice(i, 1);
  shake = Math.max(0, shake - dt * 40);
}
const MOTE_N = 100, motes = { p: new Float32Array(MOTE_N * 3), ph: new Float32Array(MOTE_N), mode: "" };
let GKIND = "village";
function updateMotes() {
  const g = G.motes, dk = darkness(); if (!g) return; const n = QUAL.motes, night = dk > .25;
  const mode = GKIND === "home" ? "" : GKIND === "dun" ? (dun && dun.demon ? "ember" : dun && dun.arena ? "" : "dust") : (WX.rain > .3 || WX.snow > .3) ? "" : night ? "fly" : "pollen";
  if (!n || !mode) { g.visible = false; return; } g.visible = true;
  if (motes.mode !== mode) { motes.mode = mode; for (let i = 0; i < MOTE_N; i++) { motes.p[i * 3] = camT.x + (Math.random() - .5) * 34; motes.p[i * 3 + 1] = Math.random() * 4; motes.p[i * 3 + 2] = camT.z + (Math.random() - .5) * 24; motes.ph[i] = Math.random() * 6.28; } }
  const pa = g.geometry.attributes.position, ca = g.geometry.attributes.color, p = motes.p, sp = mode === "ember" ? [0, .9, 0] : mode === "dust" ? [.05, .03, .04] : [.25, .08, .12];
  for (let i = 0; i < n; i++) {
    const ph = motes.ph[i]; let x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
    x += (sp[0] + Math.sin(vtime * .7 + ph) * .25) * DT; y += (sp[1] + Math.cos(vtime * .9 + ph) * .12) * DT; z += (sp[2] + Math.sin(vtime * .5 + ph * 2) * .2) * DT;
    if (mode === "ember") { if (y > 5) y = 0; } else { if (y > 4.5) y = .2; if (y < .1) y = 4.2; }
    if (x < camT.x - 17) x += 34; else if (x > camT.x + 17) x -= 34; if (z < camT.z - 12) z += 24; else if (z > camT.z + 12) z -= 24;
    p[i * 3] = x; p[i * 3 + 1] = y; p[i * 3 + 2] = z; pa.setXYZ(i, x, y, z);
    const f = .5 + .5 * Math.sin(vtime * 2.2 + ph * 3);
    if (mode === "fly") ca.setXYZ(i, .8 * (.3 + 2.2 * f), 1 * (.3 + 2.2 * f), .35 * (.3 + 2.2 * f)); else if (mode === "ember") ca.setXYZ(i, 2.4 * (.5 + f), 1.1 * (.5 + f), .3 * (.5 + f)); else if (mode === "dust") ca.setXYZ(i, .32, .36, .6); else ca.setXYZ(i, .75, .7, .45);
  }
  g.geometry.setDrawRange(0, n); pa.needsUpdate = true; ca.needsUpdate = true; g.material.size = mode === "fly" ? .22 : mode === "ember" ? .18 : .1;
}
function drawParts() {
  const g = groups(), pa = g.pts.geometry.attributes.position, ca = g.pts.geometry.attributes.color;
  parts.forEach((p, i) => { pa.setXYZ(i, p.x, p.h, p.z); ca.setXYZ(i, p.c.r, p.c.g, p.c.b); });
  g.pts.geometry.setDrawRange(0, parts.length); pa.needsUpdate = true; ca.needsUpdate = true;
}
function darkness() {
  const h = clock;
  if (h >= 21 || h < 5) return .55;
  if (h < 7) return .55 * (7 - h) / 2;
  if (h >= 17) return .55 * (h - 17) / 4;
  return 0;
}
const RFOG = new THREE.Fog(0xdcecf4, 22, 62), FOGD = new THREE.Fog(0x07050f, 18, 40), GR = { vig: .22, sat: 1.1, con: 1.05 };
function setEnv(kind) {
  const dk = clamp(darkness() / .55, 0, 1), c = new THREE.Color();
  if (kind === "village" || kind === "wild") {
    S3.background = new THREE.Color(REAL ? 0xdcecf4 : 0x9fdcf5).lerp(new THREE.Color(0x0b1230), dk); S3.fog = REAL ? RFOG : null; if (REAL) { RFOG.color.copy(S3.background); }
    amb.color.setHex(0xffffff).lerp(new THREE.Color(0x5a6ab0), dk); amb.intensity = .42 - dk * .12; hemi.intensity = .2 - dk * .1;
    sun.intensity = .72 * (1 - dk * .85); sun.color.setHex(0xfff2d6).lerp(new THREE.Color(0x7a8ad0), dk);
  } else if (kind === "home") {
    S3.background = new THREE.Color(0x1c1420); S3.fog = null; amb.color.setHex(0xffe9cc).lerp(new THREE.Color(0x6a5a9a), dk * .8); amb.intensity = .42 - dk * .12; hemi.intensity = .12; sun.intensity = .34 * (1 - dk * .8); sun.color.setHex(0xfff2d6);
  } else {
    S3.background = new THREE.Color(0x07050f); S3.fog = FOGD; amb.color.setHex(dun && dun.demon ? 0xb07aa8 : 0x8a9ad0); amb.intensity = dun && dun.arena ? .85 : .52; hemi.intensity = .15; sun.intensity = .3; sun.color.setHex(0xaab0ff);
  }
  WIN.emissiveIntensity = kind === "home" ? clamp(dk * 1.2, 0, 1) : clamp(dk * 1.6, 0, 1);
  GKIND = kind; if (kind === "village" || kind === "wild") { GR.vig = .2 + dk * .12; GR.sat = 1.14 - dk * .14; GR.con = 1.06; } else if (kind === "home") { GR.vig = .28; GR.sat = 1.08; GR.con = 1.04; } else { GR.vig = .4; GR.sat = 1.02; GR.con = 1.1; }
}
function follow(tx, tz, mw, mh, D) {
  if (TPV()) { const fx = player.x / T - Math.sin(camYaw) * 4, fz = (player.y + 8) / T - Math.cos(camYaw) * 4; camT.x = fx; camT.z = fz; camInit = true; return; }
  const k = camInit && Math.hypot(camT.x - tx, camT.z - tz) < 20 ? Math.min(1, DT * 7) : 1; camInit = true;
  const hx = Math.min(mw / 2, D * .402 * .72), hz = Math.min(mh / 2, D * .268 * 1.15);
  const cx = clamp(tx, hx, Math.max(hx, mw - hx)), cz = clamp(tz, hz, Math.max(hz, mh - hz));
  camT.x += (cx - camT.x) * k; camT.z += (cz - camT.z) * k;
}