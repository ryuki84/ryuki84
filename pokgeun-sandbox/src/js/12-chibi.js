/* ===== 치비 캐릭터 셋 — KayKit Adventurers(Kay Lousberg, CC0) =====
   다섯 캐릭터(기사·전사·마법사·소녀·후드)는 뼈대가 같아서 부위를 섞을 수 있어요.
   머리·몸(팔 포함)·다리는 뼈대에 다시 묶고, 모자·망토는 머리·가슴 뼈에 붙여요. 망토·모자는 색을 바꿀 수 있어요.
   플레이어 꾸미기(S.cb), 직업 주민, 촌장·경비 모두 이 한 가지 방식으로 만들어요. */
const CB_CLS = ["knight", "barbarian", "mage", "rogue", "rogue_hooded"];
const CB_HEAD = ["기사", "전사", "마법사", "소녀", "후드"];
const CB_BODY = ["갑옷", "가죽 조끼", "로브", "여행복", "숲지기 옷"];
const CB_HAT = [["없음", null], ["투구", "knight"], ["마법 모자", "mage"], ["뿔 투구", "barbarian"]];
const CB_CAPE = [["없음", null], ["긴 망토", "knight"], ["마법 망토", "mage"], ["짧은 망토", "rogue"], ["숲 망토", "rogue_hooded"], ["털 망토", "barbarian"]];
const CB_COL = [-1, 0xe8746a, 0xf2a35e, 0xf5d36b, 0x8fcf7a, 0x6fb8e0, 0x9a8ae0, 0xe89ac8, 0xf4efe4, 0x5a5a6a];   // -1 = 원래 색
const CB_PRESET = [
  { n: "여행자", head: 3, body: 3, legs: 3, hat: 0, cape: 3, cc: 0, hc: 0 },
  { n: "견습 마법사", head: 2, body: 2, legs: 2, hat: 2, cape: 2, cc: 0, hc: 0 },
  { n: "숲지기", head: 4, body: 4, legs: 4, hat: 0, cape: 4, cc: 0, hc: 0 },
];
const cbOf = o => { const g = (k, n, d) => { const v = o && Number.isInteger(o[k]) ? o[k] : d; return ((v % n) + n) % n; }; return { head: g("head", 5, 3), body: g("body", 5, 3), legs: g("legs", 5, 3), hat: g("hat", CB_HAT.length, 0), cape: g("cape", CB_CAPE.length, 3), cc: g("cc", CB_COL.length, 0), hc: g("hc", CB_COL.length, 0) }; };
function cbPart(cls, re) { let m = null; const s = KAY.src[cls]; if (s) s.traverse(o => { if (!m && o.isMesh && re.test(o.name)) m = o; }); return m; }
// spec: cbOf 형식 + prop(손에 드는 소품: KayKit 무기 파일 이름)
function mkChibi(spec, eq, armed) {
  const sp = cbOf(spec), root = THREE.SkeletonUtils.clone(KAY.src.rogue), g = new THREE.Group(), body = new THREE.Group(); g.add(body); body.add(root); root.scale.setScalar(KAY.sc);
  const nodes = {}, old = []; root.traverse(o => { if (o.name && !nodes[o.name]) nodes[o.name] = o; if (o.isMesh) old.push(o); });
  for (const m of old) m.parent.remove(m);
  const add = (src, tint) => {
    if (!src) return null; const mat = kMat(src.material); if (tint >= 0) { mat.map = null; mat.color.setHex(tint); }
    let m; const par = nodes[src.parent && src.parent.name] || root;
    if (src.isSkinnedMesh) { m = new THREE.SkinnedMesh(src.geometry, mat); par.add(m); m.position.copy(src.position); m.quaternion.copy(src.quaternion); m.scale.copy(src.scale);
      m.bind(new THREE.Skeleton(src.skeleton.bones.map(b => nodes[b.name]), src.skeleton.boneInverses), src.bindMatrix); }
    else { m = new THREE.Mesh(src.geometry, mat); par.add(m); m.position.copy(src.position); m.quaternion.copy(src.quaternion); m.scale.copy(src.scale); }
    m.name = src.name; m.castShadow = true; m.frustumCulled = false; return m;
  };
  const C = CB_CLS, hatCls = CB_HAT[sp.hat][1], capeCls = CB_CAPE[sp.cape][1];
  add(cbPart(C[sp.head], /_Head(_Hooded)?$/)); add(cbPart(C[sp.body], /_Body$/)); add(cbPart(C[sp.body], /_ArmLeft$/)); add(cbPart(C[sp.body], /_ArmRight$/));
  add(cbPart(C[sp.legs], /_LegLeft$/)); add(cbPart(C[sp.legs], /_LegRight$/));
  if (hatCls) add(cbPart(hatCls, /_(Helmet|Hat)$/), CB_COL[sp.hc]);
  if (capeCls) add(cbPart(capeCls, /_Cape$/), CB_COL[sp.cc]);
  const hr = nodes.handslotr, hl = nodes.handslotl, wp = armed && eq && eq.weapon ? eq.weapon.e : null;
  if (wp && hr) { if (KW[wp]) kAttach(hr, KAY.wpn[KW[wp]]); else { const w = weaponModel(wp), k = 1 / KAY.sc; w.children[0].rotation.x = 0; w.children[0].position.set(0, -.12, 0); w.scale.setScalar(k * .9); w.traverse(o => { if (o.isMesh) o.material = Mu(o.material.color.getHex()); }); hr.add(w); } }
  else if (spec && spec.prop && hr && KAY.wpn[spec.prop]) kAttach(hr, KAY.wpn[spec.prop]);
  if (armed && eq && eq.armor && eq.armor.e === "🛡️" && hl) kAttach(hl, KAY.wpn[KSH[Math.min(4, eq.armor.rar | 0)]]);
  else if (spec && spec.prop2 && hl && KAY.wpn[spec.prop2]) kAttach(hl, KAY.wpn[spec.prop2]);
  kOutline(root);
  if (eq && eq.ring && nodes.handl) { const r = new THREE.Mesh(geo("kring", () => new THREE.TorusGeometry(.07, .018, 6, 14)), HDR(0xf5d142, 2)); r.rotation.x = HALF; r.userData.ol = 1; nodes.handl.add(r); }
  const mixer = new THREE.AnimationMixer(root), acts = {};
  const act = n => acts[n] || (KAY.clips[n] ? (acts[n] = mixer.clipAction(KAY.clips[n])) : null);
  return { g, body, root, la: new THREE.Group(), ra: new THREE.Group(), legs: [], h: 2.15, kay: true, cbk: true, armed: !!armed, mixer, act, base: null, baseA: null, one: null, walk: null, seed: Math.random() * 10 };
}
/* 마을 사람들: 직업 주민 6명 + 촌장 + 경비 (GDD 11장 초기 직업) */
const CB_NPC = {
  chief: { head: 1, body: 2, legs: 2, hat: 2, hc: 6, cape: 2, cc: 6, prop: "staff" },
  guard: { head: 0, body: 0, legs: 0, hat: 1, cape: 1, cc: 5, prop: "sword_1handed", prop2: "shield_round" },
};
