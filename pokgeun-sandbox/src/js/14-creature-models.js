/* ----- 공룡: Quaternius Ultimate Animated Dinosaurs (CC0) — 대기·걷기·달리기·공격 애니메이션 ----- */
const DINOM = { ready: false, started: false, src: {}, clips: {}, sc: {} }, DTGT = { trex: 4.6, velociraptor: 1.8, triceratops: 2.1, parasaurolophus: 2.7 };
function loadDinos() {
  if (DINOM.started || !R3) return; DINOM.started = true; const L = new THREE.GLTFLoader(), ks = Object.keys(DTGT);
  Promise.all(ks.map(k => L.loadAsync(`assets/dinos/${k}.${KEXT}`))).then(r => { ks.forEach((k, i) => { const sc = r[i].scene; DINOM.src[k] = sc; DINOM.clips[k] = r[i].animations; const bb = new THREE.Box3().setFromObject(sc); DINOM.sc[k] = DTGT[k] / Math.max(.1, bb.max.y - bb.min.y); }); DINOM.ready = true; }).catch(e => console.warn("공룡 모델을 불러오지 못해 기본 모델로 표시해요.", e));
}
function mkDinoG(k) {
  const root = THREE.SkeletonUtils.clone(DINOM.src[k]), g = new THREE.Group(), body = new THREE.Group(); g.add(body); body.add(root); root.scale.setScalar(DINOM.sc[k]);
  root.traverse(o => { if (o.isMesh) { const cc = o.material.color ? o.material.color.clone() : new THREE.Color(1, 1, 1); if (!THREE.ColorManagement.enabled) cc.convertLinearToSRGB(); cc.multiplyScalar(1.25); const c = cc.getHex(), m = toonPatch(TOON({ color: c, gradientMap: gradTex, ...(PBRL ? { roughness: .8 } : {}) })); if (GRD) addDetail(m, "plaster", true); m.userData.own = 1; o.material = m; o.castShadow = true; o.frustumCulled = false; } });
  const mixer = new THREE.AnimationMixer(root), acts = {}, act = n => acts[n] || (acts[n] = mixer.clipAction(DINOM.clips[k].find(c => c.name === n) || DINOM.clips[k][0]));
  return { g, body, legs: [], la: new THREE.Group(), ra: new THREE.Group(), h: DTGT[k] + .2, dino: k, mixer, act, cur: null, seed: Math.random() * 10 };
}
function dinoTick(e, mv, fast) {
  if (e.atkT > 0) e.atkT -= DT;
  const want = e.atkT > 0 ? "Attack" : mv ? (fast ? "Run" : "Walk") : "Idle";
  if (e.cur !== want) { const a = e.act(want); if (want === "Attack") { a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; } a.reset().fadeIn(.18).play(); if (e.curA && e.curA !== a) e.curA.fadeOut(.18); e.curA = a; e.cur = want; }
  e.mixer.update(Math.min(DT, .1));
}
const DINO_K = idx => [null, null, "parasaurolophus", "triceratops", "velociraptor"][idx];
const mkWildDino = (idx, boss) => { const k = boss ? "trex" : DINO_K(idx); return DINOM.ready && k ? mkDinoG(k) : boss ? mkTrex() : DINO3[idx](); };
/* ----- 몬스터 모델: Quaternius Ultimate Monsters (CC0) — 대기·걷기·달리기·공격·피격·죽음 ----- */
const MONK = { "🐀": "slime", "🦇": "bee", "🕷️": "mushnub", "💀": "ghost", "🧟": "orc", "👹": "bluedemon", "🐲": "dragon" };
const MTGT = { slime: .95, bee: 1.15, mushnub: 1.05, ghost: 1.5, orc: 1.95, bluedemon: 2.3, dragon: 2.1, spikyslime: 1.15, hornet: 1.35, mushking: 1.35, skullghost: 1.65, skullorc: 2.15, "v/dog": 1.15, "v/cat": 1.15, "v/bunny": 1.55, "v/chicken": 1.2, "v/pug": 1.75, "v/cow": 1.8, "v/shiba": .95, "v/fox": .8 };
const MONCLIP = { Idle: [/^Idle$/, /Flying_Idle/, /Idle/], Walk: [/^Walk$/, /^Flying$/, /Fast_Flying/, /Walk/], Run: [/^Run$/, /^Gallop$/, /Fast_Flying/, /^Walk$/, /Flying/], Attack: [/Bite_Front/, /Headbutt/, /^Punch$/, /Weapon/, /Bite/, /Punch/, /Attack/], Hit: [/Hit/], Death: [/Death/], Wave: [/^Wave$/, /^Victory$/, /^Yes$/, /Dance/, /Idle/], Yes: [/^Yes$/, /^Wave$/, /Idle/] };
const MONM = { ready: false, started: false, src: {}, clips: {}, sc: {}, map: {} };
function loadMonsters() {
  if (MONM.started || !R3) return; MONM.started = true; const L = new THREE.GLTFLoader(), ks = Object.keys(MTGT);
  Promise.all(ks.map(k => L.loadAsync(k.startsWith("v/") ? `assets/villagers/${k.slice(2)}.${KEXT}` : `assets/monsters/${k}.${KEXT}`))).then(r => { ks.forEach((k, i) => {
    const sc = r[i].scene, cl = r[i].animations; MONM.src[k] = sc; MONM.clips[k] = cl; const bb = new THREE.Box3().setFromObject(sc); MONM.sc[k] = MTGT[k] / Math.max(.1, bb.max.y - bb.min.y);
    MONM.map[k] = {}; for (const st in MONCLIP) { let c = null; for (const re of MONCLIP[st]) if ((c = cl.find(a => re.test(a.name)))) break; MONM.map[k][st] = c || cl[0]; }
  }); MONM.ready = true; }).catch(e => console.warn("몬스터 모델을 불러오지 못해 기본 모델로 표시해요.", e));
}
const MONFIX = { "v/pug": { Skin: 0xd8b088 }, "v/cow": { Skin: 0xf0e8e0 } };   // 원본에서 거의 검게 저장된 피부색 바로잡기
function mkMonG(k) {
  const root = THREE.SkeletonUtils.clone(MONM.src[k]), g = new THREE.Group(), body = new THREE.Group(); g.add(body); body.add(root); root.scale.setScalar(MONM.sc[k]);
  const fix = MONFIX[k] || {}; root.traverse(o => { if (o.isMesh) { const src = o.material, col = src.map ? 0xffffff : fix[src.name] ?? (src.color ? src.color.getHex() : 0xffffff), m = toonPatch(TOON({ color: col, map: src.map || null, gradientMap: gradTex, ...(PBRL ? { roughness: .78 } : {}) })); m.userData.own = 1; o.material = m; o.castShadow = true; o.frustumCulled = false; } });   // 텍스처 없는 모델은 원래 재질 색 유지
  const mixer = new THREE.AnimationMixer(root), acts = {}, act = n => acts[n] || (acts[n] = mixer.clipAction(MONM.map[k][n]));
  return { g, body, legs: [], la: new THREE.Group(), ra: new THREE.Group(), h: MTGT[k] + .15, mon: k, mixer, act, cur: null, seed: Math.random() * 10 };
}
// 상태 우선순위: 죽음 > 공격(예비 동작 포함) > 피격 > 이동 > 대기
function monTick(e, mv, fast) {
  if (e.atkT > 0) e.atkT -= DT; if (e.hitT > 0) e.hitT -= DT;
  const want = e.dying ? "Death" : e.emote && !mv ? e.emote : e.atkT > 0 ? "Attack" : e.hitT > 0 ? "Hit" : mv ? (fast ? "Run" : "Walk") : "Idle";
  if (e.cur !== want) { const a = e.act(want), once = want !== "Idle" && want !== "Walk" && want !== "Run"; a.reset(); a.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity); a.clampWhenFinished = once; a.fadeIn(.12).play(); if (e.curA && e.curA !== a) e.curA.fadeOut(.12); e.curA = a; e.cur = want; }
  e.mixer.update(Math.min(DT, .1));
}
// 마을 주민: Quaternius Ultimate Monsters의 동물(CC0). 말을 걸면 손을 흔들어요
const VILM = { "🐶": "v/pug", "🐱": "v/cat", "🐰": "v/bunny", "🐔": "v/chicken", "🐮": "v/cow" };
const mkVilModel = em => MONM.ready && VILM[em] ? mkMonG(VILM[em]) : mkAnimal(em);
const mkMonModel = (em, el) => MONM.ready && (el ? ELITE[el].model : MONK[em]) ? mkMonG(el ? ELITE[el].model : MONK[em]) : MON3[em]();
const MON3 = { "🐀": mkRat, "🦇": mkBat, "🕷️": mkSpider, "💀": mkSkel, "🧟": mkZombie, "👹": mkOgre, "🐲": mkDragon };
const DINO3 = [mkLizard, mkBoar, mkBrachio, mkCroc, mkRaptor];
function animE(e, mv, spd = 9, amp = .6) {
  if (e.dino) return dinoTick(e, mv, spd >= 8);
  if (e.mon) return monTick(e, mv, spd >= 8);
  if (e.kay) return kayTick(e, mv);
  const t = vtime * spd, sd = e.seed || 0;
  if (e.legs) e.legs.forEach((l, i) => { l.rotation.x = mv ? Math.sin(t + (i % 2) * Math.PI + (i > 1 ? 1.2 : 0)) * amp : l.rotation.x * .8; });
  if (e.hum && !e.fixedArms) { e.la.rotation.x = e.legs[1].rotation.x * .9; e.ra.rotation.x = e.legs[0].rotation.x * .9; }
  if (e.hum) {
    e.body.position.y = mv ? Math.abs(Math.sin(t)) * .05 : Math.sin(vtime * 2 + sd) * .008; e.body.rotation.x = mv ? .08 : 0; e.body.rotation.z = mv ? Math.sin(t) * .03 : 0;
    if (e.head) { e.head.rotation.z = Math.sin(vtime * 1.3 + sd) * .03; e.head.rotation.x = mv ? -.05 : 0; }
  } else if (e.body) e.body.position.y = mv ? Math.abs(Math.sin(t)) * .06 : 0;
  if (e.blinkG) e.blinkG.scale.y = (vtime * .9 + sd) % 4 > 3.86 ? .1 : 1;
  if (e.tail) e.tail.rotation.x = Math.sin(vtime * (mv ? 9 : 2.5) + sd) * (mv ? .35 : .12) + (mv ? .3 : 0);
  if (e.tailG) e.tailG.rotation.y = Math.sin(vtime * 7 + sd) * .5;
  if (e.wings) e.wings.forEach((w, i) => { w.rotation.z = (i ? -1 : 1) * Math.sin(vtime * (e.fly ? 24 : 6)) * (e.fly ? .8 : .3); });
  if (e.sp) e.sp.forEach((p, i) => { p.rotation.z = mv ? Math.sin(t * 1.4 + i) * .12 : 0; });
  if (e.fly && e.b) e.b.position.y = .9 + Math.sin(vtime * 6) * .12;
}
