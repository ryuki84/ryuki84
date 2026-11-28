/* ----- 3인칭 카메라 ----- */
let lookYaw = .3, lookManT = -99, camYaw = 0, camManT = -99, TPV_ON = true, camZoom = 1; try { camZoom = clamp(+localStorage.getItem("pokgeun-zoom") || 1, .55, 1.7); } catch (e) {} try { TPV_ON = localStorage.getItem("pokgeun-tpv") !== "0"; } catch (e) {}
const TPV = () => TPV_ON && started && !lookMode() && (scene === "out" || (scene === "home" && WORLD && WORLD.vreg) || (scene === "dun" && dun && (dun.kind === "world" || dun.kind === "wild") && !dun.arena));
const lookSig = () => { const L = cbOf(S.cb), q = S.eq; return [KAY.ready, JSON.stringify(L), q.armor ? q.armor.id : 0, q.ring ? q.ring.id : 0, q.weapon ? q.weapon.e : 0, q.armor ? q.armor.e + q.armor.rar : 0].join(","); };
const mkPlayer = o => { const armed = o === PK.d; const e = KAY.ready ? mkChibi(S.cb, S.eq, armed) : mkHeroFromLook(S.look, 0, S.eq); e.sig = lookSig() + (armed ? "A" : ""); return e; };
let curPE = null;
function refreshLook(e) {
  curPE = e; const armed = e.key0 === PK.d, sig = lookSig() + (armed ? "A" : "");
  if (e.sig !== sig) { swapInto(e, mkPlayer(e.key0)); e.sig = sig; }
  kayEvents(e); return e;
}
function swapInto(e, n) {
  e.g.traverse(m => { if (m.isMesh && m.material && !Array.isArray(m.material) && m.material.userData.own) m.material.dispose(); });
  e.g.clear(); n.g.children.slice().forEach(c => e.g.add(c));
  for (const k of Object.keys(e)) if (!["g", "par", "key0", "seen", "sig", "osig", "evk"].includes(k)) delete e[k];
  for (const k of Object.keys(n)) if (k !== "g") e[k] = n[k]; e.wk = undefined; e.wm = null; e.fl = false;
}
const netLook = () => { if (NET.on) NET.send({ t: "look", look: netLookOf() }); };
const netLookOf = () => ({ ...cbOf(S.cb), cbk: 1 });   // 멀티플레이: 치비 외형을 보내요(서버 cleanLook 허용 키)
const lookMode = () => modal && gearTab === "look" && !$("gear").hidden;
function bodyLook() {   // 치비 캐릭터 꾸미기: 기본 3종 + 부위 섞기 + 망토·모자 색
  const L = cbOf(S.cb), hex = v => "#" + v.toString(16).padStart(6, "0");
  const chips = (k, names) => `<div style="display:flex;gap:7px;flex-wrap:wrap;margin:4px 0 8px">${names.map((n, i) => `<button style="margin:0;padding:4px 10px;outline:${L[k] === i ? "3px solid #ff8f5e" : "1px solid rgba(0,0,0,.18)"};outline-offset:2px" data-cb="${k}:${i}">${n}</button>`).join("")}</div>`;
  const cols = k => `<div style="display:flex;gap:7px;flex-wrap:wrap;margin:4px 0 8px">${CB_COL.map((c, i) => `<button style="margin:0;width:34px;height:34px;padding:0;border-radius:50%;background:${c < 0 ? "linear-gradient(135deg,#fff,#ccc)" : hex(c)};outline:${L[k] === i ? "3px solid #ff8f5e" : "1px solid rgba(0,0,0,.18)"};outline-offset:2px" data-cb="${k}:${i}" title="${c < 0 ? "원래 색" : ""}">${c < 0 ? "<small style=\"font-size:10px\">원래</small>" : ""}</button>`).join("")}</div>`;
  const sec = (t, body) => `<div class="lsec"><h3>${t}</h3>${body}</div>`;
  const head = `<h2>🧑 외형</h2><div><small>바로 적용돼요. 부위를 섞어서 나만의 캐릭터를 만들어 보세요.</small></div>`;
  if (!KAY.ready) return head + (KAY.failed ? "<div><small>⚠️ 캐릭터 모델을 불러오지 못했어요.</small></div>" : "<div><small>⏳ 캐릭터를 불러오는 중이에요…</small></div>");
  return head + `<div class="lrow"><button data-cbrand>🎲 무작위</button><small>${TOUCHY ? "위쪽 캐릭터를 끌어서 돌려 보세요" : "왼쪽 캐릭터를 드래그해서 돌려 보세요"}</small></div>` +
    sec("✨ 기본 캐릭터", `<div style="display:flex;gap:7px;flex-wrap:wrap;margin:4px 0 8px">${CB_PRESET.map((p, i) => `<button style="margin:0;padding:4px 10px" data-cbpre="${i}">${p.n}</button>`).join("")}</div>`) +
    sec(`🙂 얼굴 · ${CB_HEAD[L.head]}`, chips("head", CB_HEAD)) + sec(`👕 옷 · ${CB_BODY[L.body]}`, chips("body", CB_BODY)) + sec(`👖 바지 · ${CB_BODY[L.legs]}`, chips("legs", CB_BODY)) +
    sec(`🎩 모자 · ${CB_HAT[L.hat][0]}`, chips("hat", CB_HAT.map(h => h[0])) + (L.hat ? cols("hc") : "")) +
    sec(`🧣 망토 · ${CB_CAPE[L.cape][0]}`, chips("cape", CB_CAPE.map(c => c[0])) + (L.cape ? cols("cc") : "")) +
    `<div><small>⚔️ 무기와 🛡️ 방패는 던전·오픈월드에서 손에 들려요.</small></div>`;
}
function weaponModel(e) {
  const g = new THREE.Group();
  if (e === "🪓") { C(g, .035, .035, .62, 0x7d5433, 0, .3, 0); B(g, .28, .2, .05, 0xb8bcc8, .12, .52, 0); }
  else if (e === "🔨") { C(g, .035, .035, .6, 0x7d5433, 0, .3, 0); B(g, .32, .2, .2, 0x8a8e9e, 0, .6, 0); }
  else { B(g, .08, .7, .03, 0xd8dce8, 0, .5, 0); B(g, .28, .06, .06, 0xe8b84a, 0, .15, 0); C(g, .035, .035, .2, 0x7d5433, 0, .02, 0); K(g, .045, .1, 0xd8dce8, 0, .9, 0, 4); }
  g.rotation.x = .9; g.position.set(0, -.38, .05); const w = new THREE.Group(); w.add(g); return w;
}
function mkAnimal(k) {
  const P = { "🐶": { c: 0xd9a45c, d: 0x8a5a2c, w: 0xfff3d6 }, "🐱": { c: 0xf0a23c, d: 0xc9742a, w: 0xfff3d6 }, "🐰": { c: 0xf6f2ea, d: 0xf28cb0, w: 0xffffff }, "🐔": { c: 0xf6f2ea, d: 0xe8503a, w: 0xffffff }, "🐮": { c: 0xf6f2ea, d: 0x3a3a40, w: 0xffffff }, "🐻": { c: 0x8a5a34, d: 0x5a3a22, w: 0xd9b07c } }[k];
  return uq(() => {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    Sp(body, .34, P.c, 0, .5, 0, { s: [1, 1.05, .9] }); Sp(body, .24, P.w, 0, .46, .14, { s: [1, 1, .6] });
    const head = new THREE.Group(); head.position.set(0, 1.06, 0); body.add(head); Sp(head, .36, P.c, 0, 0, 0);
    Sp(head, .13, P.w, 0, -.1, .3, { s: [1.2, .8, .9] }); Sp(head, .045, INK, 0, -.05, .4);
    if (k === "🐶") { B(head, .12, .3, .16, P.d, -.34, -.04, 0, { r: [0, 0, .3] }); B(head, .12, .3, .16, P.d, .34, -.04, 0, { r: [0, 0, -.3] }); }
    if (k === "🐱") { K(head, .12, .26, P.c, -.2, .36, 0, 4); K(head, .12, .26, P.c, .2, .36, 0, 4); }
    if (k === "🐰") { Sp(head, .09, P.c, -.12, .52, 0, { s: [1, 3, .8] }); Sp(head, .09, P.c, .12, .52, 0, { s: [1, 3, .8] }); Sp(head, .05, P.d, -.12, .5, .05, { s: [1, 3, .5] }); Sp(head, .05, P.d, .12, .5, .05, { s: [1, 3, .5] }); }
    if (k === "🐻") { Sp(head, .13, P.c, -.25, .3, 0); Sp(head, .13, P.c, .25, .3, 0); Sp(head, .07, P.w, -.25, .3, .06); Sp(head, .07, P.w, .25, .3, .06); }
    Sp(body, .1, P.c, -.34, .5, .05); Sp(body, .1, P.c, .34, .5, .05);
    const l1 = leg(body, -.14, .22, 0, .16, .22, P.d), l2 = leg(body, .14, .22, 0, .16, .22, P.d);
    const tailG = new THREE.Group(); tailG.position.set(0, .34, -.34); body.add(tailG);
    if (k === "🐱") C(tailG, .05, .05, .6, P.c, 0, .06, -.06, 6, { r: [-1, 0, 0] }); else Sp(tailG, .11, P.w, 0, -.04, -.03);
    outline(g); const blinkG = new THREE.Group(), hi = HDR(0xffffff, 1.8); head.add(blinkG);
    for (const s of [-1, 1]) {
      const e = new THREE.Group(); e.position.set(s * .13, .05, .3); e.rotation.y = s * .3; blinkG.add(e);
      Sq(e, .075, 0x1a1420, 0, 0, 0, { s: [1, 1.15, .6], cs: false }, 14).userData.ol = 1;
      for (const [x, y, r] of [[-.02, .03, .026], [.02, -.025, .013]]) { const m = new THREE.Mesh(geo("ah" + r, () => new THREE.SphereGeometry(r, 8, 6)), hi); m.position.set(x, y, .05); m.userData.ol = 1; e.add(m); }
      if (k !== "🐻") Sq(head, .05, 0xff8a9a, s * .22, -.07, .26, { s: [1, .6, .3], cs: false }, 8).userData.ol = 1;
    }
    g.scale.setScalar(.82); return { g, body, legs: [l1, l2], head, h: 1.45, blinkG, tailG, seed: Math.random() * 10 };
  });
}
const mkRat = () => uq(() => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b); const c = 0x8a8e9e;
  Sp(b, .22, c, 0, .24, 0, { s: [1, .8, 1.5] }); Sp(b, .14, c, 0, .26, .34); K(b, .09, .2, c, 0, .24, .5, 6, { r: [HALF, 0, 0] });
  Sp(b, .035, INK, .06, .33, .42); Sp(b, .035, INK, -.06, .33, .42); Sp(b, .08, 0xf28cb0, .12, .42, .28, { s: [1, 1, .4] }); Sp(b, .08, 0xf28cb0, -.12, .42, .28, { s: [1, 1, .4] });
  C(b, .02, .02, .5, 0xf28cb0, 0, .12, -.45, 5, { r: [HALF * .8, 0, 0] });
  const l = [leg(b, -.1, .14, .1, .08, .14, c), leg(b, .1, .14, .1, .08, .14, c), leg(b, -.1, .14, -.1, .08, .14, c), leg(b, .1, .14, -.1, .08, .14, c)];
  outline(g); return { g, body: b, legs: l, h: 1 }; });
const mkBat = () => uq(() => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b); const c = 0x3a2a5c, w = 0x6b4a9e; b.position.y = .9;
  Sp(b, .17, c, 0, 0, 0, { s: [1, 1, 1.2] }); K(b, .06, .15, c, -.09, .2, .05, 4); K(b, .06, .15, c, .09, .2, .05, 4); Sp(b, .03, 0xf5d142, -.06, .05, .17); Sp(b, .03, 0xf5d142, .06, .05, .17);
  const wing = s => { const p = new THREE.Group(); p.position.set(s * .15, 0, 0); B(p, .32, .025, .22, w, s * .17, 0, 0); B(p, .2, .025, .14, w, s * .4, 0, -.04); b.add(p); return p; };
  const wings = [wing(1), wing(-1)]; outline(g); return { g, body: null, wings, legs: [], fly: true, h: 1.5, b }; });
const mkSpider = () => uq(() => { const g = new THREE.Group(), b = new THREE.Group(); g.add(b); const c = 0x2a2433;
  Sp(b, .2, c, 0, .32, -.1, { s: [1, .8, 1.2] }); Sp(b, .13, 0x4a3f58, 0, .34, .2); Sp(b, .03, 0xe03a3a, -.05, .38, .31); Sp(b, .03, 0xe03a3a, .05, .38, .31);
  const legs = []; for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const p = new THREE.Group(); p.position.set(0, .32, .15 - i * .13); p.rotation.y = s * (.2 + i * .1) + (s > 0 ? 0 : 0); const m = C(p, .02, .02, .5, c, s * .25, 0, 0, 5, { r: [0, 0, s * 1.1] }); b.add(p); legs.push(p); }
  outline(g); return { g, body: b, legs: [], sp: legs, h: 1.1 }; });
const mkSkel = () => uq(() => mkHuman({ shirt: 0xe8e4d8, pants: 0xd8d4c8, skin: 0xe8e4d8, hair: 0xe8e4d8, boots: 0xe8e4d8, belt: 0xb8b4a8, face: "skull", lite: true }));
const mkZombie = () => { const e = uq(() => mkHuman({ shirt: 0x6a5a7a, pants: 0x3a3248, skin: 0x8fbf7a, hair: 0x2e3a2a, face: "zombie", lite: true })); e.la.rotation.x = e.ra.rotation.x = -1.4; e.fixedArms = true; return e; };
const mkOgre = () => { const e = uq(() => mkHuman({ shirt: 0x5a3a22, pants: 0x7a3a2a, skin: 0xd9505a, hair: 0xd9505a, belt: 0xf5d142, face: "ogre", lite: true })); e.g.scale.setScalar(1.45); K(e.body, .07, .25, 0xf5d142, -.2, 1.6, 0, 5); K(e.body, .07, .25, 0xf5d142, .2, 1.6, 0, 5); e.h = 2.9; return e; };
function quadruped(o) {
  return uq(() => {
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
    Sp(b, .4, o.c, 0, o.h, 0, { s: [.8 * o.w, .75, 1.4 * o.l] }); if (o.belly) Sp(b, .3, o.belly, 0, o.h - .1, .1, { s: [.75 * o.w, .6, 1.2 * o.l] });
    const hd = new THREE.Group(); hd.position.set(0, o.h + .1, .5 * o.l + .25); b.add(hd); Sp(hd, o.hs || .22, o.c, 0, 0, 0, { s: [1, .9, 1.1] });
    Sp(hd, .04, INK, -.1, .08, .16); Sp(hd, .04, INK, .1, .08, .16); Sp(hd, .1, o.snout || o.c, 0, -.06, .22, { s: [1, .8, 1.2] });
    if (o.tusk) { K(hd, .03, .16, 0xffffff, -.11, -.1, .26, 4, { r: [-.5, 0, .3] }); K(hd, .03, .16, 0xffffff, .11, -.1, .26, 4, { r: [-.5, 0, -.3] }); }
    if (o.ear) { K(hd, .06, .12, o.c, -.15, .2, -.02, 4); K(hd, .06, .12, o.c, .15, .2, -.02, 4); }
    K(b, o.tr || .13, o.tl || .5, o.c, 0, o.h, -.7 * o.l - .2, 6, { r: [-HALF, 0, 0] });
    const lw = o.lw || .14, lh = o.lh || .3, lz = .4 * o.l;
    const l = [leg(b, -.2 * o.w, lh, lz, lw, lh, o.d || o.c), leg(b, .2 * o.w, lh, lz, lw, lh, o.d || o.c), leg(b, -.2 * o.w, lh, -lz, lw, lh, o.d || o.c), leg(b, .2 * o.w, lh, -lz, lw, lh, o.d || o.c)];
    outline(g); return { g, body: b, legs: l, h: o.h + .9 };
  });
}
const mkLizard = () => quadruped({ c: 0x5fbf6a, d: 0x3f9a55, belly: 0xe8e0a0, w: .8, l: 1, h: .26, lh: .14, lw: .09, tl: .7, tr: .1, hs: .16 });
const mkBoar = () => quadruped({ c: 0x8a6040, d: 0x4a3020, w: 1, l: 1, h: .45, lh: .25, lw: .12, tusk: 1, snout: 0xf2a0a8, tl: .15, tr: .05 });
const mkCroc = () => { const e = quadruped({ c: 0x4a7a3a, d: 0x35592a, belly: 0xc8d890, w: .9, l: 1.5, h: .24, lh: .12, lw: .11, tl: 1, tr: .16, hs: .17, snout: 0x4a7a3a }); B(e.body.children[2] || e.body, .22, .1, .6, 0x4a7a3a, 0, .36, 1.15); return e; };
const mkBrachio = () => uq(() => {
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b); const c = 0x6aa8c8;
  Sp(b, .6, c, 0, .95, 0, { s: [.95, .85, 1.35] }); Sp(b, .45, 0xd8e8e8, 0, .8, .1, { s: [.9, .6, 1.1] });
  C(b, .13, .2, 1.4, c, 0, 1.55, .75, 7, { r: [.45, 0, 0] }); Sp(b, .2, c, 0, 2.2, 1.05, { s: [1, .85, 1.3] }); Sp(b, .04, INK, -.1, 2.27, 1.2); Sp(b, .04, INK, .1, 2.27, 1.2);
  K(b, .22, 1.3, c, 0, .95, -1.1, 6, { r: [-HALF - .1, 0, 0] });
  const l = [leg(b, -.4, .7, .5, .26, .7, 0x4f88a8), leg(b, .4, .7, .5, .26, .7, 0x4f88a8), leg(b, -.4, .7, -.5, .26, .7, 0x4f88a8), leg(b, .4, .7, -.5, .26, .7, 0x4f88a8)];
  outline(g); return { g, body: b, legs: l, h: 3 }; });
function biped(c, d, belly, eye, big) {
  return uq(() => {
    const g = new THREE.Group(), b = new THREE.Group(); g.add(b);
    Sp(b, .42, c, 0, .85, 0, { s: [.8, .9, 1.2], r: [-.35, 0, 0] }); Sp(b, .3, belly, 0, .75, .2, { s: [.7, .8, .7] });
    const hd = new THREE.Group(); hd.position.set(0, 1.35, .55); b.add(hd); Sp(hd, .27, c, 0, 0, 0, { s: [.9, .85, 1.3] }); B(hd, .22, .12, .35, c, 0, -.1, .3); B(hd, .2, .05, .3, 0xffffff, 0, -.15, .3);
    Sp(hd, .05, eye, -.14, .1, .2); Sp(hd, .05, eye, .14, .1, .2); C(b, .17, .2, .5, c, 0, 1.15, .35, 7, { r: [.7, 0, 0] });
    K(b, .22, 1, c, 0, .7, -.7, 6, { r: [-HALF - .25, 0, 0] }); B(b, .06, .16, .06, d, -.22, .75, .45); B(b, .06, .16, .06, d, .22, .75, .45);
    const l = [leg(b, -.22, .65, 0, .17, .65, d, .22), leg(b, .22, .65, 0, .17, .65, d, .22)]; B(l[0], .2, .08, .34, d, 0, -.65, .08); B(l[1], .2, .08, .34, d, 0, -.65, .08);
    outline(g); return { g, body: b, legs: l, h: 2.2, biped: true };
  });
}
const mkRaptor = () => biped(0xd98a3a, 0x8a4a1c, 0xf5e0a0, INK);
const mkTrex = () => { const e = biped(0x8a3a3a, 0x4a1c1c, 0xd9b08a, 0xf5d142); e.g.scale.setScalar(2.1); e.h = 5; return e; };
const mkDragon = () => uq(() => {
  const g = new THREE.Group(), b = new THREE.Group(); g.add(b); const c = 0x3f9a55, w = 0xa8323c;
  Sp(b, .55, c, 0, 1, 0, { s: [.9, .9, 1.3] }); Sp(b, .4, 0xf5d98a, 0, .85, .15, { s: [.8, .8, 1.1] });
  C(b, .15, .22, .7, c, 0, 1.5, .55, 7, { r: [.6, 0, 0] }); const hd = new THREE.Group(); hd.position.set(0, 1.85, .9); b.add(hd); Sp(hd, .26, c, 0, 0, 0, { s: [1, .9, 1.25] }); B(hd, .22, .1, .3, c, 0, -.1, .28);
  Sp(hd, .05, 0xf5d142, -.13, .08, .2); Sp(hd, .05, 0xf5d142, .13, .08, .2); K(hd, .06, .25, 0xf5d142, -.14, .25, -.05, 4); K(hd, .06, .25, 0xf5d142, .14, .25, -.05, 4);
  K(b, .22, 1.1, c, 0, 1, -1, 6, { r: [-HALF, 0, 0] });
  const wing = s => { const p = new THREE.Group(); p.position.set(s * .4, 1.45, -.15); p.rotation.y = s * .35; B(p, .6, .04, .4, w, s * .32, 0, 0); B(p, .35, .04, .3, w, s * .75, 0, -.08); b.add(p); return p; };
  const wings = [wing(1), wing(-1)];
  const l = [leg(b, -.3, .55, .4, .22, .55, c), leg(b, .3, .55, .4, .22, .55, c), leg(b, -.3, .55, -.4, .22, .55, c), leg(b, .3, .55, -.4, .22, .55, c)];
  outline(g); return { g, body: b, legs: l, wings, slow: 1, h: 3.4 }; });