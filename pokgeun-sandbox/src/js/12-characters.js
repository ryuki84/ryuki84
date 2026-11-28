/* ----- 모델: 사람 / 동물 / 몬스터 / 공룡 ----- */
const leg = (par, x, y, z, w, h, col, d = w) => { const p = new THREE.Group(); p.position.set(x, y, z); B(p, w, h, d, col, 0, -h / 2, 0); par.add(p); return p; };
/* ----- 모던 캐릭터: 부드러운 체형 · 표정 있는 얼굴 · 헤어 4종 · 장비 외형 ----- */
const LOOK = { hair: [0x3a2a22, 0x1c1c28, 0xe8c070, 0xc8503a, 0x6a4ac8, 0x4a9ad8, 0xf0f0f4], skin: [0xffe0c8, 0xf2c79a, 0xd9a273, 0x9a6a46, 0x6a4430], eye: [0x4a7ad8, 0x3a9a5a, 0x8a5a34, 0xd8503a, 0x8a5ad0], out: [0x3d6ed0, 0xd9534f, 0x4a9a4a, 0x8a5ad0, 0x2fb0b0, 0x2e2e3e, 0xe8a23c, 0xf2ede0], hs: ["단발", "긴 머리", "포니테일", "삐죽머리", "올림머리", "민머리"], pants: [0x3a3a48, 0x4a3a2a, 0x2c3e78, 0x6a6a5a, 0x8a7a5a, 0xe8e4d8], boots: [0x3a2a20, 0x1c1c22, 0x7a5a3a, 0x8a2a2a], ot: ["셔츠", "조끼", "긴 코트", "로브"], hats: ["없음", "투구", "밀짚모자", "두건", "왕관"], bd: ["보통", "큰 키", "작은 키", "다부진"], br: ["없음", "콧수염", "턱수염"] };
const lookOf = l => { const g = (k, n) => (((l && l[k]) | 0) % n + n) % n; return { av: g("av", 4), h: g("h", 6), hc: g("hc", 7), sk: g("sk", 5), ey: g("ey", 5), tp: g("tp", 8), c: g("c", 5), hat: g("hat", 5), cc: g("cc", 9), pc: g("pc", 6), bc: g("bc", 4), ot: g("ot", 4), bd: g("bd", 4), br: g("br", 3) }; };
const shade = (hex, f) => new THREE.Color(hex).multiplyScalar(f).getHex();
const RTINT = [0xb8bcc8, 0x6fa8ff, 0xffd34d, 0xff8a2b, 0x5be37d];
const Sq = (p, r, c, x, y, z, o, sg = 20) => addM(p, geo(`q${r},${sg}`, () => new THREE.SphereGeometry(r, sg, Math.round(sg * .7))), c, x, y, z, o);
const noOl = m => { m.userData.ol = 1; return m; };
function addHair(head, st, col, lite) {
  if (st === 5 && !lite) return null;   // 민머리
  const hl = new THREE.Color(col).lerp(new THREE.Color(0xffffff), .28).getHex();
  addM(head, geo("hcap", () => new THREE.SphereGeometry(.325, 22, 14, 0, Math.PI * 2, 0, Math.PI * .56)), col, 0, .035, -.045, { r: [-.32, 0, 0] });
  if (lite) return null;
  for (let i = 0; i < 5; i++) { const d = Math.abs(i - 2); K(head, .06, .17 - d * .02, col, (i - 2) * .095, .2, .262 - d * .02, 5, { r: [Math.PI - .35, 0, (i - 2) * .12] }); }
  for (const s of [-1, 1]) K(head, .06, .26, col, s * .295, 0, .05, 5, { r: [Math.PI, 0, -s * .12] });
  addM(head, geo("hhl", () => new THREE.SphereGeometry(.12, 10, 6)), hl, -.06, .3, .12, { s: [1, .3, .6], cs: false });
  let tail = null;
  if (st === 1) { C(head, .22, .12, .62, col, 0, -.3, -.2, 10); K(head, .12, .25, col, 0, -.66, -.2, 8, { r: [Math.PI, 0, 0] }); }
  else if (st === 2) { tail = new THREE.Group(); tail.position.set(0, .13, -.3); head.add(tail); Sq(tail, .08, col, 0, 0, 0, undefined, 10); K(tail, .09, .5, col, 0, -.28, -.04, 8, { r: [Math.PI, 0, 0] }); }
  else if (st === 4) { Sq(head, .15, col, 0, .3, -.18, undefined, 12); TR(head, .09, .03, shade(col, .8), 0, .26, -.13, { r: [HALF * .6, 0, 0] }); }
  else if (st === 3) for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; K(head, .07, .3, col, Math.cos(a) * .18, .3 + (i % 2) * .04, Math.sin(a) * .18 - .03, 5, { r: [Math.sin(a) * .6, 0, -Math.cos(a) * .6] }); }
  return tail;
}
function heroFace(head, o) {
  const eyeC = o.eye ?? 0x4a7ad8, grp = new THREE.Group(); head.add(grp); const hi = HDR(0xffffff, 1.7);
  for (const s of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(s * .118, -.015, .255); e.rotation.y = s * .22; grp.add(e);
    noOl(Sq(e, .078, 0xffffff, 0, 0, 0, { s: [1, 1.18, .5], cs: false }, 14)); noOl(Sq(e, .057, eyeC, 0, -.008, .018, { s: [1, 1.2, .45], cs: false }, 12)); noOl(Sq(e, .03, 0x14101c, 0, -.01, .03, { s: [1, 1.2, .4], cs: false }, 10));
    for (const [hx, hy, r] of [[-.018, .03, .017], [.016, -.024, .009]]) { const m = new THREE.Mesh(geo("eh" + r, () => new THREE.SphereGeometry(r, 8, 6)), hi); m.position.set(hx, hy, .04); m.userData.ol = 1; e.add(m); }
    noOl(B(head, .085, .014, .02, o.hair, s * .122, .125, .27, { r: [0, s * .2, -s * .16], cs: false })); noOl(Sq(head, .05, 0xff8a9a, s * .175, -.1, .225, { s: [1, .6, .3], cs: false }, 8));
  }
  noOl(addM(head, geo("smile", () => new THREE.TorusGeometry(.04, .009, 6, 12, Math.PI)), 0x8a3a3a, 0, -.105, .285, { r: [-.15, 0, Math.PI], cs: false }));
  return grp;
}
function skullFace(head) {
  const eye = HDR(0x6ee7ff, 2.4);
  for (const s of [-1, 1]) { noOl(Sq(head, .08, 0x14101c, s * .115, -.01, .24, { s: [1, 1.2, .5], cs: false }, 12)); const m = new THREE.Mesh(geo("sk_e", () => new THREE.SphereGeometry(.026, 8, 6)), eye); m.position.set(s * .115, -.02, .275); m.userData.ol = 1; head.add(m); }
  for (let i = -2; i <= 2; i++) noOl(B(head, .03, .05, .02, 0xf2eee0, i * .036, -.14, .282, { cs: false })); noOl(B(head, .06, .045, .02, 0x14101c, 0, -.065, .292, { cs: false }));
}
function zombieFace(head, ogre) {
  const eye = HDR(ogre ? 0xffd34d : 0xff3a3a, 2.4);
  for (const s of [-1, 1]) {
    noOl(Sq(head, .07, 0xf0f0e0, s * .115, -.01, .245, { s: [1, 1, .5], cs: false }, 10)); const m = new THREE.Mesh(geo("zb_e", () => new THREE.SphereGeometry(.03, 8, 6)), eye); m.position.set(s * .115, -.012, .278); m.userData.ol = 1; head.add(m);
    noOl(B(head, .1, .02, .02, 0x1a1420, s * .115, .1, .28, { r: [0, 0, -s * (ogre ? .45 : .15)], cs: false }));
  }
  noOl(B(head, .13, .03, .02, 0x1a1420, 0, -.12, .285, { cs: false })); if (ogre) for (const s of [-1, 1]) noOl(K(head, .025, .08, 0xffffff, s * .05, -.14, .285, 4, { r: [Math.PI, 0, 0], cs: false }));
}
function mkHuman(o) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body); const face = o.face || "hero", skin = o.skin, jacket = o.shirt, pants = o.pants, boots = o.boots || 0x3a2a20, belt = o.belt || 0x4a3426, eq = o.eq || {}, sg = o.lite ? 10 : 14;
  const mkLeg = x => { const p = new THREE.Group(); p.position.set(x, .62, 0); C(p, .085, .068, .5, pants, 0, -.25, 0, 10); Sq(p, .082, pants, 0, -.01, 0, undefined, 10); Sq(p, .1, boots, 0, -.55, .035, { s: [1, .62, 1.4] }, 10); body.add(p); return p; };
  const ll = mkLeg(-.115), rl = mkLeg(.115);
  C(body, .2, .17, .44, jacket, 0, .86, 0, sg); C(body, .17, .235, .17, jacket, 0, .65, 0, sg); C(body, .182, .182, .055, belt, 0, .71, 0, sg); B(body, .075, .055, .02, 0xf5d142, 0, .71, .185);
  if (!o.lite) TR(body, .125, .03, jacket, 0, 1.07, 0, { r: [HALF, 0, 0] }); C(body, .06, .07, .1, skin, 0, 1.1, 0, 8);
  const head = new THREE.Group(); head.position.set(0, 1.27, 0); body.add(head);
  Sq(head, .3, skin, 0, 0, 0, { s: [1, .96, .98] }, o.lite ? 14 : 22); if (!o.lite) for (const s of [-1, 1]) Sq(head, .055, skin, s * .29, -.02, -.01, { s: [.6, 1, .8] }, 8);
  const arm = s => { const p = new THREE.Group(); p.position.set(s * .27, 1.0, 0); Sq(p, .085, jacket, 0, 0, 0, undefined, 10); C(p, .065, .055, .3, jacket, 0, -.17, 0, 10); Sq(p, .066, o.glove || skin, 0, -.35, 0, undefined, 10); body.add(p); return p; };
  const la = arm(-1), ra = arm(1);
  if (eq.armor) { const t = RTINT[eq.armor.rar] ?? RTINT[0]; C(body, .215, .19, .24, t, 0, .95, 0, 14); for (const p of [la, ra]) Sq(p, .125, t, 0, .02, 0, { s: [1, .62, 1] }, 10); if (eq.armor.rar >= 2) { const gm = Sq(body, .035, 0xffffff, 0, .96, .205, undefined, 8); gm.material = HDR(t, 2.2); gm.userData.ol = 1; } }
  if (eq.ring) { const rr = TR(ra, .05, .013, 0xf5d142, 0, -.37, 0, { r: [0, HALF, 0] }); rr.material = HDR(0xf5d142, 2); rr.userData.ol = 1; }
  let tail = null; if (face === "hero") tail = addHair(head, o.hs | 0, o.hair, o.lite); else if (face === "zombie" || face === "ogre") addHair(head, 0, o.hair, true);
  outline(g); let blinkG = null;
  if (face === "hero") blinkG = o.lite ? null : heroFace(head, o); else if (face === "skull") skullFace(head); else zombieFace(head, face === "ogre");
  return { g, body, head, la, ra, legs: [ll, rl], hum: true, h: 1.95, blinkG, tail, seed: Math.random() * 10 };
}
function mkHeroFromLook(look, col, eq) {
  if (MAN.ready) return mkMan(look, eq, false);
  if (KAY.ready) return mkKay(look, eq, false);
  const L = lookOf(look), tp = look ? LOOK.out[L.tp] : (col || LOOK.out[0]);
  return uq(() => mkHuman({ shirt: tp, pants: shade(tp, .45), skin: LOOK.skin[L.sk], hair: LOOK.hair[L.hc], eye: LOOK.eye[L.ey], hs: L.h, eq: eq || {} }));
}
/* ----- 3D 캐릭터 에셋: KayKit Adventurers (Kay Lousberg, CC0) — 뼈대 애니메이션 ----- */
const KCLS = [["knight", "기사"], ["barbarian", "바바리안"], ["mage", "마법사"], ["rogue", "도적"], ["rogue_hooded", "후드 도적"]];
const KW = { "🗡️": "sword_1handed", "🪓": "axe_1handed" }, KSH = ["shield_round", "shield_square", "shield_badge", "shield_spikes", "shield_badge_color"];
const KEXT = "glb";            // 아티팩트 사본은 json(glTF) 로 바뀜
const KAY = { ready: false, failed: false, started: false, src: {}, clips: {}, wpn: {}, sc: 1 };
const KOUT = new THREE.MeshBasicMaterial({ color: RSTYLE === "cel" ? 0x3e2a44 : INK, side: THREE.BackSide });
const KOW = RSTYLE === "cel" ? "0.034" : "0.03";
KOUT.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace("#include <skinning_vertex>", "#include <skinning_vertex>\n#ifdef USE_SKINNING\n transformed += normalize(objectNormal) * " + KOW + ";\n#else\n transformed += normalize(normal) * " + KOW + ";\n#endif"); };
KOUT.customProgramCacheKey = () => "kout";
function loadKay() {
  if (KAY.started || !R3) return; KAY.started = true;
  const L = new THREE.GLTFLoader(), WS = [...Object.values(KW), ...KSH];
  const raw = sc => { sc.traverse(o => { if (o.isMesh && o.material && o.material.map) o.material.map.colorSpace = REAL ? THREE.SRGBColorSpace : THREE.NoColorSpace; }); return sc; };
  Promise.all([...KCLS.map(c => L.loadAsync(`assets/chars/${c[0]}.${KEXT}`)), L.loadAsync(`assets/anims.${KEXT}`), ...WS.map(w => L.loadAsync(`assets/weapons/${w}.${KEXT}`))]).then(r => {
    KCLS.forEach((c, i) => { KAY.src[c[0]] = raw(r[i].scene); });
    r[KCLS.length].animations.forEach(a => { KAY.clips[a.name] = a; });
    WS.forEach((w, i) => { KAY.wpn[w] = raw(r[KCLS.length + 1 + i].scene); });
    const bb = new THREE.Box3().setFromObject(KAY.src.rogue); KAY.sc = 1.9 / Math.max(.5, bb.max.y - bb.min.y); KAY.ready = true;
  }).catch(err => { KAY.failed = true; console.warn("캐릭터 모델을 불러오지 못해 기본 캐릭터로 표시해요.", err); });
}
function kMat(m) { const t = toonPatch(TOON({ map: m.map || null, color: m.color ? m.color.clone() : 0xffffff, gradientMap: gradTex })); t.userData.own = 1; return t; }
function kOutline(root) {
  if (PBRL) return;
  const L = []; root.traverse(o => { if (o.isMesh && !o.userData.ol && !/Cape/.test(o.name)) L.push(o); });
  for (const m of L) {
    let o; if (m.isSkinnedMesh) { o = new THREE.SkinnedMesh(m.geometry, KOUT); o.bind(m.skeleton, m.bindMatrix); o.position.copy(m.position); o.quaternion.copy(m.quaternion); o.scale.copy(m.scale); m.parent.add(o); }
    else { o = new THREE.Mesh(m.geometry, KOUT); m.add(o); }
    o.userData.ol = 1; o.frustumCulled = false; o.visible = m.visible; m.userData.olm = o;
  }
}
function kAttach(par, src) {
  const w = src.clone(true); w.traverse(o => { if (o.isMesh) { o.material = kMat(o.material); o.castShadow = true; } }); par.add(w); return w;
}
function mkKay(look, eq, armed) {
  const L = lookOf(look), root = THREE.SkeletonUtils.clone(KAY.src[KCLS[L.c][0]]), g = new THREE.Group(), body = new THREE.Group(); g.add(body); body.add(root); root.scale.setScalar(KAY.sc);
  const bones = {}, meshes = []; root.traverse(o => { bones[o.name] = o; if (o.isMesh) meshes.push(o); });
  for (const m of meshes) {
    m.material = kMat(m.material); m.castShadow = true; m.frustumCulled = false;
    if (/Helmet|Hat$/.test(m.name) && L.hat) m.visible = false;
    if (/Cape/.test(m.name) && L.cc) { m.material.map = null; m.material.color.setHex(LOOK.out[L.cc - 1]); }
  }
  const hr = bones.handslotr, hl = bones.handslotl, wp = armed && eq && eq.weapon ? eq.weapon.e : null;
  if (wp && hr) { if (KW[wp]) kAttach(hr, KAY.wpn[KW[wp]]); else { const w = weaponModel(wp), k = 1 / KAY.sc; w.children[0].rotation.x = 0; w.children[0].position.set(0, -.12, 0); w.scale.setScalar(k * .9); w.traverse(o => { if (o.isMesh) o.material = Mu(o.material.color.getHex()); }); hr.add(w); } }
  if (armed && eq && eq.armor && eq.armor.e === "🛡️" && hl) kAttach(hl, KAY.wpn[KSH[Math.min(4, eq.armor.rar | 0)]]);
  kOutline(root);
  if (eq && eq.ring && bones.handl) { const r = new THREE.Mesh(geo("kring", () => new THREE.TorusGeometry(.07, .018, 6, 14)), HDR(0xf5d142, 2)); r.rotation.x = HALF; r.userData.ol = 1; bones.handl.add(r); }
  const mixer = new THREE.AnimationMixer(root), acts = {};
  const act = n => acts[n] || (KAY.clips[n] ? (acts[n] = mixer.clipAction(KAY.clips[n])) : null);
  return { g, body, root, la: new THREE.Group(), ra: new THREE.Group(), legs: [], h: 2.15, kay: true, armed: !!armed, mixer, act, base: null, baseA: null, one: null, seed: Math.random() * 10 };
}
/* 동작 이벤트: 게임 로직이 pAnim("이름", 길이)를 부르면 플레이어 모델이 한 번 재생 */
const PEV = { n: null, d: 0, k: 0 };
const pAnim = (n, d = 0) => { PEV.n = n; PEV.d = d; PEV.k++; };
const MTRIM = { Sword_Attack: [.1, .82], Punch_Cross: [.15, .7], Roll: [.05, 1.2], Spell_Simple_Shoot: [0, .5] };   // 동작의 핵심 구간만 재생
function kayPlay(e, n, dur) {
  const a = e.act(n); if (!a) return; const cn = a.getClip().name, tr = e.man ? MTRIM[cn] : null, len = tr ? tr[1] - tr[0] : a.getClip().duration;
  if (e.one === a && tr && e.oneEnd && (a.time - tr[0]) / len < .78) return;   // 연타해도 베는 순간이 끊기지 않게
  if (e.one && e.one !== a) e.one.fadeOut(.06);
  a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.timeScale = dur ? clamp(len / dur, .7, 2.4) : 1; if (tr) a.time = tr[0]; a.setEffectiveWeight(1); a.fadeIn(.05).play();
  if (e.baseA) e.baseA.fadeOut(.08); e.one = a; e.oneEnd = tr ? tr[1] : 0; e.base = null;
}
function kayTick(e, mv) {
  if (e.one && (!e.one.isRunning() || e.one.time >= (e.oneEnd || e.one.getClip().duration) - .02)) { e.one.fadeOut(.16); e.one = null; }
  const want = e.pose || (mv ? e.walk || "Running_A" : e.armed ? "Idle" : "Unarmed_Idle");
  if (!e.one && e.base !== want) { const a = e.act(want); if (a) { if (e.baseA && e.baseA !== a) e.baseA.fadeOut(.2); a.reset().setEffectiveWeight(1).fadeIn(.2).play(); e.baseA = a; e.base = want; } }
  if (e.baseA) e.baseA.timeScale = e.base === "Running_A" ? 1.05 : 1;
  e.mixer.update(Math.min(DT, .1)); if (e.vrm) e.vrm.update(Math.min(DT, .1));   // 애니 캐릭터: 머리카락·옷 흔들림, 표정
}
function kayEvents(e) { if (!e.kay) return; if (e.evk === undefined) e.evk = PEV.k; if (e.evk !== PEV.k) { e.evk = PEV.k; if (PEV.n) kayPlay(e, PEV.n, PEV.d); } }
/* ----- 정상 비율 캐릭터: Quaternius Universal Animation Library 마네킹(CC0) + 옷 색 칠하기 + 장비 ----- */
const MAN = { ready: false, failed: false, started: false, src: null, clips: {}, head: null };
const MCLIP = { Idle: "Sword_Idle", Unarmed_Idle: "Idle_Loop", Running_A: "Jog_Fwd_Loop", "1H_Melee_Attack_Slice_Diagonal": "Sword_Attack", "1H_Melee_Attack_Slice_Horizontal": "Sword_Attack", "1H_Melee_Attack_Chop": "Sword_Attack", "2H_Melee_Attack_Chop": "Sword_Attack", "2H_Melee_Attack_Spin": "Sword_Attack", Dodge_Forward: "Roll", Spellcast_Shoot: "Spell_Simple_Shoot", Use_Item: "Interact", Hit_A: "Hit_Chest", Cheer: "Dance_Loop", Interact: "Interact", Throw: "Spell_Simple_Shoot", PickUp: "PickUp_Table", Sit_Chair_Idle: "Sitting_Idle_Loop" };
function loadMan() {
  if (MAN.started || !R3) return; MAN.started = true;
  new THREE.GLTFLoader().loadAsync(`assets/human/mannequin.${KEXT}`).then(gl => {
    MAN.src = gl.scene; gl.animations.forEach(a => { a.tracks = a.tracks.filter(t => !/^root\.(position|scale)/.test(t.name)); MAN.clips[a.name] = a; });
    const hb = new THREE.Box3(); let n = 0; gl.scene.updateMatrixWorld(true);
    gl.scene.traverse(o => { if (!o.isSkinnedMesh) return; const bn = o.skeleton.bones.map(b => b.name), si = o.geometry.attributes.skinIndex, sw = o.geometry.attributes.skinWeight, p = o.geometry.attributes.position, v = new THREE.Vector3(), reg = new Uint8Array(p.count);
      for (let i = 0; i < p.count; i++) { let bi = 0, bw = -1; for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; bi = si.getComponent(i, k); } } const name = bn[bi] || "", y = p.getY(i);
        reg[i] = /head|neck/.test(name) ? 0 : /hand|f_|thumb/.test(name) ? 5 : /foot|toe/.test(name) || (/shin/.test(name) && y < .42) ? 3 : /thigh|shin/.test(name) ? 2 : /hips/.test(name) ? (y > .93 ? 4 : 2) : /forearm/.test(name) ? 6 : /upper_arm|shoulder/.test(name) ? 7 : 1;
        if (/head/.test(name)) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld); hb.expandByPoint(v); n++; } }
      o.geometry.userData.reg = reg; });
    MAN.head = n ? { c: hb.getCenter(new THREE.Vector3()), r: hb.getSize(new THREE.Vector3()).y / 2 } : { c: new THREE.Vector3(0, 1.66, .02), r: .13 };
    MAN.ready = true;
  }).catch(err => { MAN.failed = true; console.warn("정상 비율 캐릭터를 불러오지 못해 기존 캐릭터로 표시해요.", err); });
}
/* ----- 애니풍 캐릭터: pixiv VRoid 샘플 아바타(무료 이용·상업 이용 가능·표기 불필요, CC0 아님) + three-vrm(MToon 애니 셰이더) -----
   고른 캐릭터 하나만 불러와서 다시 써요. 동작은 마네킹(Quaternius UAL) 19종을 VRM 뼈대로 옮겨 써요(공격·구르기·피격 그대로). */
const VRMK = ["sample_A", "sample_B", "sample_C"], VRMN = ["애니 · 단발", "애니 · 트윈테일", "애니 · 소년", "커스텀(마네킹)"];
const VRMS = { cur: null, loading: null, failed: {} };
const VBONE = (() => { const m = { "DEF-hips": "hips", "DEF-spine.001": "spine", "DEF-spine.002": "chest", "DEF-spine.003": "upperChest", "DEF-neck": "neck", "DEF-head": "head" };
  for (const [s, d] of [["L", "left"], ["R", "right"]]) Object.assign(m, { [`DEF-shoulder.${s}`]: d + "Shoulder", [`DEF-upper_arm.${s}`]: d + "UpperArm", [`DEF-forearm.${s}`]: d + "LowerArm", [`DEF-hand.${s}`]: d + "Hand", [`DEF-thigh.${s}`]: d + "UpperLeg", [`DEF-shin.${s}`]: d + "LowerLeg", [`DEF-foot.${s}`]: d + "Foot", [`DEF-toe.${s}`]: d + "Toes" });
  const o = {}; for (const k in m) o[THREE.PropertyBinding.sanitizeNodeName(k)] = m[k]; return o; })();
const vrmKey = () => { const a = lookOf(S.look).av; return a < 3 ? VRMK[a] : null; };
function vrmRetarget(clip, vrm) {   // 마네킹 동작 → VRM 정규화 뼈대(three-vrm 공식 예제의 방식)
  const src = MAN.src, tracks = [], qi = new THREE.Quaternion(), qp = new THREE.Quaternion(), q = new THREE.Quaternion(), v = new THREE.Vector3(), m4 = new THREE.Matrix4(), v0 = vrm.meta.metaVersion === "0";
  src.updateMatrixWorld(true); const sh = src.getObjectByName("DEF-hips").getWorldPosition(v).y, vh = vrm.humanoid.getNormalizedBoneNode("hips").getWorldPosition(new THREE.Vector3()).y - vrm.scene.getWorldPosition(new THREE.Vector3()).y, sc = vh / sh;
  for (const t of clip.tracks) { const k = t.name.lastIndexOf("."), node = t.name.slice(0, k), prop = t.name.slice(k + 1), bone = VBONE[node]; if (!bone) continue;
    const dst = vrm.humanoid.getNormalizedBoneNode(bone), rn = src.getObjectByName(node); if (!dst || !rn) continue;
    rn.getWorldQuaternion(qi).invert(); rn.parent.getWorldQuaternion(qp);
    if (prop === "quaternion") { const a = t.values.slice(); for (let i = 0; i < a.length; i += 4) { q.fromArray(a, i).premultiply(qp).multiply(qi); q.toArray(a, i); if (v0) { a[i] *= -1; a[i + 2] *= -1; } } tracks.push(new THREE.QuaternionKeyframeTrack(dst.name + ".quaternion", t.times, a)); }
    else if (prop === "position" && bone === "hips") { m4.copy(rn.parent.matrixWorld); const a = t.values.slice(); for (let i = 0; i < a.length; i += 3) { v.fromArray(a, i).applyMatrix4(m4).multiplyScalar(sc); if (v0) { v.x *= -1; v.z *= -1; } v.toArray(a, i); } tracks.push(new THREE.VectorKeyframeTrack(dst.name + ".position", t.times, a)); } }
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
// VRoid 모델은 조각이 90~130개라 드로우콜이 많아요. 같은 재질·같은 뼈대·표정(모프) 없는 조각을 하나로 합쳐요.
function slimVRM(vrm, opt = {}) {
  const meshes = []; vrm.scene.traverse(o => { if (o.isSkinnedMesh) meshes.push(o); });
  for (const m of meshes) if (Array.isArray(m.material)) {   // 외곽선 재질 정리(opt.noOutline이면 끔)
    const main = m.material.filter(x => !x.isOutline), outl = m.material.filter(x => x.isOutline);
    if (opt.noOutline || !outl.length) { if (main.length === 1) { m.material = main[0]; m.geometry.clearGroups(); } else outl.forEach(x => { x.visible = false; }); }
  }
  const by = new Map();
  for (const m of meshes) { if (Array.isArray(m.material) || m.morphTargetInfluences || m.geometry.morphAttributes.position) continue; const key = m.material.uuid + "|" + m.skeleton.uuid + "|" + Object.keys(m.geometry.attributes).sort().join(","); (by.get(key) || by.set(key, []).get(key)).push(m); }
  let merged = 0;
  for (const list of by.values()) { if (list.length < 2) continue;
    const geos = list.map(m => { const g = m.geometry.index ? m.geometry : m.geometry.toNonIndexed(); return g; }); const mg = mergeGeometries(geos, false); if (!mg) continue;
    const a = list[0], nm = new THREE.SkinnedMesh(mg, a.material); nm.name = a.name + "_merged"; nm.bind(a.skeleton, a.bindMatrix); nm.position.copy(a.position); nm.quaternion.copy(a.quaternion); nm.scale.copy(a.scale);
    a.parent.add(nm); list.forEach(m => m.parent.remove(m)); merged += list.length - 1; }
  vrm.scene.traverse(o => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = !opt.noShadow; o.receiveShadow = true; } });
  return merged;
}
function buildVRM(k, opt = {}) {
  const L = new THREE.GLTFLoader(); L.register(p => new VRMLoaderPlugin(p));
  return L.loadAsync(`assets/vrm/${k}.${KEXT === "json" ? "json" : "vrm"}`).then(gl => {
    const vrm = gl.userData.vrm; if (!vrm) throw new Error("VRM 정보 없음"); VRMUtils.rotateVRM0(vrm);
    try { slimVRM(vrm, { noOutline: opt.npc || LITE(), noShadow: opt.npc }); } catch (e) { console.warn("VRM 조각 합치기 실패(그대로 써요)", e); vrm.scene.traverse(o => { if (o.isMesh) o.frustumCulled = false; }); }
    const body = new THREE.Group(); body.add(vrm.scene); vrm.scene.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(vrm.scene); body.scale.setScalar(1.78 / Math.max(.5, bb.max.y - bb.min.y)); body.updateMatrixWorld(true);
    const clips = {}; for (const n in MAN.clips) clips[n] = vrmRetarget(MAN.clips[n], vrm);
    const mixer = new THREE.AnimationMixer(vrm.scene), acts = {}, act = n => { const c = MCLIP[n] || n; return acts[c] || (clips[c] ? (acts[c] = mixer.clipAction(clips[c])) : null); };
    const P = new THREE.Vector3(), hr = vrm.humanoid.getRawBoneNode("rightHand"), hl = vrm.humanoid.getRawBoneNode("leftHand"), holdR = new THREE.Group(), holdL = new THREE.Group();
    if (hr) { hr.getWorldPosition(P); holdR.position.copy(P); holdR.rotation.set(HALF, 0, 0); attachAt(body, hr, holdR); }
    if (hl) { hl.getWorldPosition(P); holdL.position.copy(P); holdL.rotation.set(0, HALF, 0); attachAt(body, hl, holdL); }
    if (R3.compileAsync && R3.extensions.has("KHR_parallel_shader_compile")) R3.compileAsync(body, cam, S3).catch(() => {});   // 처음 등장할 때 멈칫하지 않게 미리 컴파일(지원 기기만)
    return { k, vrm, body, mixer, act, holdR, holdL };
  });
}
function loadVRM(k) {   // 플레이어용
  if (!k || !R3 || !MAN.ready || VRMS.failed[k] || VRMS.loading === k || (VRMS.cur && VRMS.cur.k === k)) return;
  VRMS.loading = k;
  buildVRM(k).then(c => { if (VRMS.cur) VRMS.cur.mixer.stopAllAction(); VRMS.cur = c; VRMS.loading = null; })
    .catch(e => { VRMS.failed[k] = 1; VRMS.loading = null; console.warn("애니풍 캐릭터를 불러오지 못해 마네킹으로 표시해요.", e); });
}
// 마을 사람 주민(나비·토리): 주민마다 따로 한 벌. 마을(지역 장면)에서만 써요
const VRMV = {};
function vilVRM(v) {
  if (!v.vrm || !R3 || !MAN.ready) return null; const slot = VRMV[v.name] ||= {};
  if (!slot.inst && !slot.loading && !slot.failed) { slot.loading = true; buildVRM(v.vrm, { npc: true }).then(c => { slot.inst = c; slot.loading = false; }).catch(e => { slot.failed = true; slot.loading = false; console.warn("주민 애니 캐릭터를 불러오지 못했어요.", e); }); }
  return slot.inst || null;
}
function mkVilEnt(v) {
  const c = vilVRM(v); if (!c) return mkVilModel(v.e);
  const g = new THREE.Group(); g.add(c.body); c.mixer.stopAllAction();
  return { g, body: c.body, root: c.vrm.scene, la: new THREE.Group(), ra: new THREE.Group(), legs: [], h: 2.0, kay: true, man: true, vrm: c.vrm, armed: false, mixer: c.mixer, act: c.act, base: null, baseA: null, one: null, walk: "Walk_Loop", seed: Math.random() * 10 };
}
function mkVrmEnt(armed) {
  const c = VRMS.cur, g = new THREE.Group(); g.add(c.body); c.mixer.stopAllAction();
  c.holdR.clear(); c.holdL.clear(); const eq = S.eq || {}, wp = armed && eq.weapon ? eq.weapon.e : null;
  if (wp && KAY.ready) { if (KW[wp]) kAttach(c.holdR, KAY.wpn[KW[wp]]).scale.setScalar(.6); else { const ww = weaponModel(wp); ww.children[0].rotation.x = 0; ww.children[0].position.set(0, -.1, 0); c.holdR.add(ww); } }
  if (armed && eq.armor && eq.armor.e === "🛡️" && KAY.ready) kAttach(c.holdL, KAY.wpn[KSH[Math.min(4, eq.armor.rar | 0)]]).scale.setScalar(.55);
  return { g, body: c.body, root: c.vrm.scene, la: new THREE.Group(), ra: new THREE.Group(), legs: [], h: 2.0, kay: true, man: true, vrm: c.vrm, armed: !!armed, mixer: c.mixer, act: c.act, base: null, baseA: null, one: null, seed: Math.random() * 10 };
}
function attachAt(root, bone, obj) { root.updateMatrixWorld(true); obj.updateMatrix(); const m = new THREE.Matrix4().copy(bone.matrixWorld).invert().multiply(obj.matrix); m.decompose(obj.position, obj.quaternion, obj.scale); bone.add(obj); return obj; }
function mkMan(look, eq, armed) {
  const L = lookOf(look), root = THREE.SkeletonUtils.clone(MAN.src), g = new THREE.Group(), body = new THREE.Group(); g.add(body); body.add(root);
  const armorC = eq && eq.armor && eq.armor.e === "🥋", shirt = new THREE.Color(armorC ? RTINT[eq.armor.rar] ?? RTINT[0] : LOOK.out[L.tp]), skin = new THREE.Color(LOOK.skin[L.sk]), linen = new THREE.Color(0xe8e0cc);
  const pants = L.ot === 3 && !armorC ? shirt.clone().multiplyScalar(.85) : new THREE.Color(LOOK.pants[L.pc]), boots = new THREE.Color(LOOK.boots[L.bc]), belt = new THREE.Color(L.ot === 3 ? 0xc8a860 : 0x5a3a22);
  const sleeve = L.ot === 1 && !armorC ? linen : shirt.clone().multiplyScalar(.9);
  const RC = [skin, shirt, pants, boots, belt, eq && eq.armor ? new THREE.Color(0x5a4a3a) : skin, L.ot === 1 && !armorC ? linen.clone().multiplyScalar(.95) : shirt.clone().multiplyScalar(.82), sleeve];
  const bones = {}; root.traverse(o => { if (o.isBone) bones[o.name] = o; });
  root.traverse(o => { if (!o.isSkinnedMesh) return; const reg = o.geometry.userData.reg, geo2 = o.geometry.clone(), col = new Float32Array(reg.length * 3);
    for (let i = 0; i < reg.length; i++) { const c = RC[reg[i]]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    geo2.setAttribute("color", new THREE.BufferAttribute(col, 3)); o.geometry = geo2; o.material = toonPatch(TOON({ vertexColors: true, color: 0xffffff, gradientMap: gradTex, ...(PBRL ? { roughness: .92 } : {}) })); if (GRD) addDetail(o.material, "fabric", true); o.material.userData.own = 1; o.castShadow = true; o.frustumCulled = false; });
  root.updateMatrixWorld(true);
  const hd = bones["DEF-head"], H = MAN.head;
  if (hd) {
    const hg = new THREE.Group(); hg.position.copy(H.c); hg.scale.setScalar(H.r / .3 * 1.02);
    const hc = LOOK.hair[L.hc], tc = LOOK.out[L.tp];
    if (L.hat === 1) { Sq(hg, .345, 0xa8acb8, 0, .05, -.01, { s: [1, .9, 1.04] }); K(hg, .05, .26, 0xd8383a, 0, .4, 0, 5); B(hg, .26, .06, .05, 0x2a2a34, 0, .02, .32); }
    else if (L.hat === 3) { addM(hg, geo("hcap", () => new THREE.SphereGeometry(.325, 22, 14, 0, Math.PI * 2, 0, Math.PI * .56)), shade(tc, .85), 0, .05, -.06, { r: [-.32, 0, 0], s: [1.16, 1.16, 1.16] }); C(hg, .26, .32, .42, shade(tc, .85), 0, -.22, -.2, 12); }
    else { addHair(hg, L.h, hc, false);
      if (L.hat === 2) { C(hg, .62, .62, .03, 0xe8c878, 0, .2, -.02, 20); C(hg, .25, .31, .22, 0xe8c878, 0, .3, -.02, 14); C(hg, .312, .312, .05, 0xc8383a, 0, .22, -.02, 14); }
      else if (L.hat === 4) { C(hg, .23, .27, .14, 0xf5d142, 0, .34, -.02, 12); for (let i = 0; i < 5; i++) { const a = i * 1.2566; K(hg, .045, .14, 0xf5d142, Math.cos(a) * .23, .47, Math.sin(a) * .23 - .02, 4); } const gm = Sq(hg, .04, 0xffffff, 0, .34, .25, undefined, 8); gm.material = HDR(0xe8505a, 1.8); gm.userData.ol = 1; } }
    for (const s of [-1, 1]) { noOl(Sq(hg, .048, 0xfaf6ee, s * .11, .0, .262, { s: [1, 1.1, .45], cs: false }, 10)); noOl(Sq(hg, .03, LOOK.eye[L.ey], s * .11, -.005, .28, { s: [1, 1.15, .4], cs: false }, 8)); noOl(Sq(hg, .016, 0x14101c, s * .11, -.005, .292, { s: [1, 1.1, .4], cs: false }, 6)); noOl(B(hg, .09, .016, .02, hc, s * .11, .085, .28, { r: [0, 0, -s * .12], cs: false })); }
    if (L.br >= 1) { B(hg, .17, .035, .04, hc, 0, -.105, .275, { r: [-.2, 0, 0] }); }
    if (L.br === 2) { Sq(hg, .14, hc, 0, -.21, .17, { s: [1.15, .85, .7] }, 12); }
    attachAt(root, hd, hg);
  }
  const hips = bones["DEF-hips"];
  if (hips && (L.ot === 2 || L.ot === 3) && !armorC) { const k = new THREE.Group(), ln = L.ot === 3 ? .78 : .5; k.position.set(0, .98 - ln / 2, -.005); const m = C(k, .2, L.ot === 3 ? .34 : .29, ln, L.ot === 3 ? shirt.getHex() : shade(LOOK.out[L.tp], .78), 0, 0, 0, 16); m.material = TOON({ color: L.ot === 3 ? shirt.getHex() : shade(LOOK.out[L.tp], .78), side: THREE.DoubleSide, gradientMap: gradTex }); m.geometry = geo("skirt" + ln, () => new THREE.CylinderGeometry(.2, L.ot === 3 ? .34 : .29, ln, 16, 1, true)); attachAt(root, hips, k); }
  if (L.bd) root.scale.set(...[[1, 1, 1], [1, 1.07, 1], [.95, .9, .95], [1.12, 1, 1.1]][L.bd]);
  const chest = bones["DEF-spine003"];
  if (L.cc && chest) { const cp = new THREE.Group(); cp.position.set(0, 1.4, -.13); const m = B(cp, .42, .95, .03, LOOK.out[(L.cc - 1) % LOOK.out.length], 0, -.45, 0, { r: [.12, 0, 0] }); m.material = TOON({ color: LOOK.out[(L.cc - 1) % LOOK.out.length], side: THREE.DoubleSide, gradientMap: gradTex }); attachAt(root, chest, cp); }
  const hr = bones["DEF-handR"], hl = bones["DEF-handL"], wp = armed && eq && eq.weapon ? eq.weapon.e : null, P = new THREE.Vector3();
  if (wp && hr && KAY.ready) {
    const w = new THREE.Group(); hr.getWorldPosition(P); w.position.copy(P).add(new THREE.Vector3(.02, -.03, .02)); w.rotation.set(HALF, 0, 0);
    if (KW[wp]) kAttach(w, KAY.wpn[KW[wp]]).scale.setScalar(.6); else { const ww = weaponModel(wp); ww.children[0].rotation.x = 0; ww.children[0].position.set(0, -.1, 0); w.add(ww); }
    attachAt(root, hr, w);
  }
  if (armed && eq && eq.armor && eq.armor.e === "🛡️" && hl && KAY.ready) { const s = new THREE.Group(); hl.getWorldPosition(P); s.position.copy(P).add(new THREE.Vector3(.04, 0, .06)); s.rotation.set(0, HALF, 0); kAttach(s, KAY.wpn[KSH[Math.min(4, eq.armor.rar | 0)]]).scale.setScalar(.55); attachAt(root, hl, s); }
  if (eq && eq.ring && hl) { const r = new THREE.Mesh(geo("kring", () => new THREE.TorusGeometry(.07, .018, 6, 14)), HDR(0xf5d142, 2)); r.scale.setScalar(.6); hl.getWorldPosition(P); r.position.copy(P); r.userData.ol = 1; attachAt(root, hl, r); }
  kOutline(root);
  const mixer = new THREE.AnimationMixer(root), acts = {};
  const act = n => { const k = MCLIP[n] || n; return acts[k] || (MAN.clips[k] ? (acts[k] = mixer.clipAction(MAN.clips[k])) : null); };
  return { g, body, root, la: new THREE.Group(), ra: new THREE.Group(), legs: [], h: 2.1, kay: true, man: true, armed: !!armed, mixer, act, base: null, baseA: null, one: null, seed: Math.random() * 10 };
}