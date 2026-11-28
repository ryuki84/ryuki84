/* ----- 마을 ----- */
let VBUILT = false;
function buildVillage() {
  VBUILT = true; const g = G.village;
  g.add(G.vterr = terrainGroup(W, H, (x, y) => terrain[y] && terrain[y][x], "village"));
  const put = (m, r, ox = 0) => { m.position.set(r.x + r.w / 2 + ox, 0, r.y + r.h / 2 + .1); g.add(m); return m; };
  put(mkHouse(), HOUSE); put(mkShop(), SHOP); put(mkCave(), CAVE); put(mkGate(), WILDG, .0); if (FEAT.arena) put(mkArena(), ARENA);
  G.gateX = WILDG.x + WILDG.w / 2; G.gateZ = WILDG.y + WILDG.h / 2 + .1;
}
function drawVillageEnts(act) {
  const g = G, P = player, night = darkness() > .25;
  g.vterr.userData.water.position.y = Math.sin(vtime * 1.6) * .02;
  flames.forEach((f, i) => { f.scale.setScalar(1.2 + Math.sin(vtime * 12 + i * 2) * .15); });
  for (const t of trees) {
    const e = ent(t, mkTreeBody, g.vdyn), st = t.age < 20 ? 0 : t.age < 60 ? 1 : 2, key = st + t.kind;
    if (e.key !== key) { g.vdyn.remove(e.g); LIVE.delete(e); ENT.delete(t); const n = ent(t, mkTreeBody, g.vdyn); n.key = key; n.g.position.set(t.x + .5, 0, t.y + .5); continue; }
    e.g.position.set(t.x + .5, 0, t.y + .5);
    if (t.fruitMeshes) t.fruitMeshes.forEach((f, i) => f.visible = i < t.fruit);
    if (t.sh > 0) t.sh -= DT; e.inner.rotation.z = t.sh > 0 ? Math.sin(vtime * 45) * .07 : Math.sin(vtime * 1.2 + t.x * 2) * .012;
  }
  for (const r of rocks) { const e = ent(r, mkRock0, g.vdyn); e.g.position.set(r.x + .5, 0, r.y + .5); }
  for (const f of flowers) { const e = ent(f, () => ({ g: mkFlower(f.e) }), g.vdyn); e.g.position.set(f.x + .5, 0, f.y + .5); e.g.visible = !(f.back > 0); }
  for (const it of ground) { const e = ent(it, () => { const m = Sp(new THREE.Group(), .13, FRC[it.k] || 0xe8505a, 0, 0, 0); return { g: m.parent }; }, g.vdyn); e.g.position.set(it.x + .5, .2 + Math.abs(Math.sin(vtime * 4 + it.x)) * .12, it.y + .5); }
  for (const v of villagers) {
    const e = entM(v, () => mkVilEnt(v), g.vdyn), mv = v.talk <= 0 && (v.vx || v.vy); e.emote = v.talk > 0 ? "Wave" : null; if (e.vrm) e.pose = v.talk > 0 ? "Idle_Talking_Loop" : null;
    e.g.position.set(v.x / T, 0, (v.y + 8) / T); if (mv) face(e.g, v.vx, v.vy); else if (act && v.talk > 0) face(e.g, P.x - v.x, P.y - v.y);
    animE(e, mv, e.mon ? 5 : 8, .5); if (act && Math.hypot(v.x - P.x, v.y - P.y) < 80) labelT(v.name, v.x / T, (v.y + 8) / T, 2, "#fff3d6");
  }
  if (MONM.ready) for (const c of critters) { const e = ent(c, () => mkMonG(c.k), g.vdyn), mv = !!(c.vx || c.vy); e.g.position.set(c.x / T, 0, (c.y + 8) / T); if (mv) face(e.g, c.vx, c.vy, 6); animE(e, mv, Math.hypot(c.vx, c.vy) > 40 ? 9 : 5, .5); }
  for (const b of bugs) {
    const e = ent(b, () => mkBug(b.id), g.vdyn); e.g.position.set(b.x / T, .7 + Math.sin(vtime * 6 + b.a) * .1, (b.y + 8) / T); face(e.g, Math.cos(b.a), Math.sin(b.a));
    if (e.ff) { const on = Math.sin(vtime * 5 + b.a) > -.3; e.ff.material.color.setHex(on ? 0xf5ff8a : 0x6a7030).multiplyScalar(on ? 3 : 1); if (act && on && night) light(b.x / T, (b.y + 8) / T, 2.5, 0xe8ff8a, .8, 1); }
    else e.wings.forEach((w, i) => w.rotation.z = (i ? -1 : 1) * (.2 + Math.abs(Math.sin(vtime * 14 + b.a)) * 1.1));
  }
}
function drawVillage() {
  const g = groups(); if (!VBUILT) buildVillage(); showScene("village"); setEnv("village");
  const P = player, dk = darkness(), night = dk > .25, D = 22 / (Z > 1 ? 1.55 : 1);
  drawVillageEnts(true); if (SEAM()) { drawWorldTerrain(ORIGIN[0], ORIGIN[1]); drawHomeEnts(false); }
  const pe = refreshLook(ent(PK.v, mkPlayer, g.vdyn)), pz = (P.y + 8) / T; pe.g.position.set(P.x / T, 0, pz); face(pe.g, P.dx, P.dy, 16);
  animE(pe, P.mv && !modal, 10, .75); pe.ra.rotation.x = pe.ra.rotation.x; flash(pe, false);
  if (fishing) {
    const be = ent(fishing, () => ({ g: mkBobber() }), g.vdyn); be.g.position.set(fishing.tx + .5, -.05 + (fishing.state === "bite" ? Math.abs(Math.sin(vtime * 20)) * .2 : Math.sin(vtime * 3) * .03), fishing.ty + .7);
    labelT(fishing.state === "bite" ? "❗" : "…", P.x / T, pz, 2.4, fishing.state === "bite" ? "#ff6a6a" : "#ffffff");
  }
  if (night) { for (const wx of [-.9, .9]) light(HOUSE.x + HOUSE.w / 2 + wx, HOUSE.y + HOUSE.h / 2 + 1.1, 4.5, 0xffd870, .8, 1.3); light(SHOP.x + SHOP.w / 2, SHOP.y + SHOP.h / 2 + 1.2, 5, 0xffd870, 1, 1.4); light(G.gateX - .75, G.gateZ, 4, 0xffa534, 2, 1.3); light(G.gateX + .75, G.gateZ, 4, 0xffa534, 2, 1.3); }
  PL0.x = P.x / T; PL0.z = pz; PL0.r = night ? 6 : 3; PL0.i = night ? 1.5 : .0; PL0.h = 1.8; PL0.c = 0xffd9a0;
  labelT("내 집", HOUSE.x + HOUSE.w / 2, HOUSE.y + HOUSE.h + .3, .3); labelT("다람쥐 상점", SHOP.x + SHOP.w / 2, SHOP.y + SHOP.h + .3, .3); labelT("던전 입구", CAVE.x + CAVE.w / 2, CAVE.y + CAVE.h + .35, .3); labelT("🏠 내 집 ←", G.gateX, G.gateZ + .3, .3); labelT("🏰 왕도 ↑", 15, -.6, .3); if (FEAT.arena) labelT("서바이벌 아레나", ARENA.x + 1.5, ARENA.y + ARENA.h + .3, .3);
  if (started && !modal) { const { tx, ty } = target(); cursorAt(tx, ty, terrain[ty] && terrain[ty][tx] === "w" ? -.1 : .03); } else G.cursor.visible = false;
  follow(P.x / T, pz, W, H, D); finish(D); overlay();
}
const mkRock0 = () => ({ g: mkRock() });

/* ----- 집 안 ----- */
let HBUILT = false;
function buildHome() {
  HBUILT = true; const g = G.home, fl = new GB(), wl = new GB();
  for (let y = 2; y < RH; y++) for (let x = 0; x < RW; x++) fl.quad([x, 0, y], [x, 0, y + 1], [x + 1, 0, y + 1], [x + 1, 0, y], new THREE.Color((x + y) % 2 ? 0xc89b66 : 0xc2945e).offsetHSL(0, 0, (rn(x, y, 9) - .5) * .05), [0, 1, 0]);
  fl.quad([5, .005, RH - 1], [5, .005, RH], [7, .005, RH], [7, .005, RH - 1], new THREE.Color(0xd9505a), [0, 1, 0]);
  g.add(fl.build(VMAT()));
  const H2 = 2.4, wc = new THREE.Color(0xf0dcb8), wd = new THREE.Color(0xb98a55), dark = new THREE.Color(0x7d5433);
  wl.quad([0, 0, 2], [0, H2, 2], [RW, H2, 2], [RW, 0, 2], wc, [0, 0, 1]); wl.quad([0, 0, 2.001], [0, .9, 2.001], [RW, .9, 2.001], [RW, 0, 2.001], wd, [0, 0, 1]);
  for (const x of [0, RW]) { wl.quad([x, 0, 2], [x, H2, 2], [x, H2, RH], [x, 0, RH], wc, [x ? -1 : 1, 0, 0]); wl.quad([x, 0, 2], [x, .9, 2], [x, .9, RH], [x, 0, RH], wd, [x ? -1 : 1, 0, 0]); }
  g.add(wl.build(VMAT())); B(g, RW + .4, .15, .15, dark, RW / 2, H2 + .07, 2); B(g, .15, .15, RH - 2, dark, 0, H2 + .07, 2 + (RH - 2) / 2); B(g, .15, .15, RH - 2, dark, RW, H2 + .07, 2 + (RH - 2) / 2);
  const out = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), TOON({ color: 0x2a1c14, gradientMap: gradTex })); out.rotation.x = -HALF; out.position.set(RW / 2, -.01, RH / 2); g.add(out); G.homeOut = out;
  const sh = new THREE.Group(), roof = new THREE.Group(), wcol = 0xf3e3c0, tcol = 0x8a5a34;   // 바깥에서 보이는 집 외벽 · 지붕 (안에 들어가면 지붕과 앞벽이 사라짐)
  B(sh, RW + .44, H2, .2, wcol, RW / 2, H2 / 2, 1.88); for (const x of [-.12, RW + .12]) B(sh, .2, H2, RH - 2 + .24, wcol, x, H2 / 2, 2 + (RH - 2) / 2);
  B(sh, RW + .5, .22, RH - 2 + .5, 0x9a8a78, RW / 2, .11 - .2, 2 + (RH - 2) / 2, { rs: true });
  for (const [x0, x1] of [[-.22, 5], [7, RW + .22]]) B(roof, x1 - x0, H2, .2, wcol, (x0 + x1) / 2, H2 / 2, RH + .12);
  B(roof, 2, H2 - 1.75, .2, wcol, 6, 1.75 + (H2 - 1.75) / 2, RH + .12); B(roof, 2.2, .12, .3, tcol, 6, 1.75, RH + .14);
  for (const x of [2, 9.5]) { B(roof, 1, .8, .05, 0x5a3a22, x, 1.4, RH + .24); B(roof, .84, .64, .04, 0xa8dcf5, x, 1.4, RH + .27); }
  const rl = Math.hypot((RH - 2) / 2 + .5, 1.5), ra = Math.atan2(1.5, (RH - 2) / 2 + .5);
  for (const sgn of [-1, 1]) B(roof, RW + .9, .16, rl, 0xc8553d, RW / 2, H2 + .75, 2 + (RH - 2) / 2 + sgn * ((RH - 2) / 4 + .25), { r: [sgn * ra, 0, 0] });
  for (const x of [-.12, RW + .12]) { const tri = new THREE.Mesh(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, -(RH - 2) / 2 - .1), new THREE.Vector3(0, 1.5, 0), new THREE.Vector3(0, 0, (RH - 2) / 2 + .1)]), TOON({ color: wcol, side: THREE.DoubleSide, gradientMap: gradTex })); tri.geometry.computeVertexNormals(); tri.position.set(x, H2, 2 + (RH - 2) / 2); roof.add(tri); }
  B(roof, .4, 1, .4, 0x8a8e9e, RW - 2.5, H2 + 1.4, 3.2);
  sh.add(roof); sh.traverse(m => { if (m.isMesh) m.castShadow = true; }); g.add(sh); G.homeRoof = roof; sh.visible = true; G.homeShell = sh;
}
function drawHomeEnts(act) {
  const g = G, dk = darkness();
  if (!act && SEAM()) { const hx = WORLD.hreg.x - ORIGIN[0], hz = WORLD.hreg.y - ORIGIN[1]; if (Math.hypot(hx + 6 - player.x / T, hz + RH - (player.y + 8) / T) < 18) labelT("🏠 내 집", hx + 6, hz + RH + .6, .3); }
  for (const r of S.room) {
    const f = FURN[r.id], e = ent(r, () => ({ g: mkFurn(r.id) }), g.hdyn);
    if (f.wall) e.g.position.set(r.x + .5, 1.9 - r.y * .55, 2 + .05); else e.g.position.set(r.x + .5, 0, r.y + .5);
    if (act) if (r.id === "lamp") light(r.x + .5, r.y + .5, 5, 0xffd9a0, 1.3, .9); else if (r.id === "tv") light(r.x + .5, r.y + 1.2, 3, 0x8fb0ff, .8, 1); else if (r.id === "window" && dk > .2) light(r.x + .5, 2.8, 4, 0x8fa0ff, 1.5, .8);
  }
}
function drawHome() {
  const g = groups(); if (!HBUILT) buildHome(); showScene("home"); setEnv(SEAM() ? "village" : "home");
  const P = player, D = 19 / (Z > 1 ? 1.2 : 1), dk = darkness();
  drawHomeEnts(true); if (SEAM()) { drawWorldTerrain(ORIGIN[0], ORIGIN[1]); drawVillageEnts(false); }
  const pe = refreshLook(ent(PK.h, mkPlayer, g.hdyn)); pe.g.position.set(P.x / T, 0, (P.y + 8) / T); face(pe.g, P.dx, P.dy, 16); animE(pe, P.mv && !modal, 10, .75);
  PL0.x = P.x / T; PL0.z = (P.y + 8) / T; PL0.r = 5; PL0.i = .5 + dk * .5; PL0.h = 2; PL0.c = 0xffe6c0; light(6, RH - .3, 3, 0xffd9a0, 1.2, .8);
  labelT("⬇ 출구", 6, RH + .6, .2);
  if (!modal) { const { tx, ty } = target(); cursorAt(tx, ty, .04); } else G.cursor.visible = false;
  follow(6, 4.9, RW, RH + 2, D); finish(D); overlay();
}

/* ----- 던전 · 야생 ----- */
const MOBUI = () => matchMedia("(max-width:760px), (pointer:coarse)").matches, miniTop = () => 92 * VW / (ov.clientWidth || VW);
function drawMini() {
  if (dun.kind === "world") return drawMiniWorld();
  const MW = dun.map[0].length, MH = dun.map.length, wild = dun.kind === "wild", k = (wild ? 2 : 3) * (ov.clientWidth < 600 ? 1.5 : 1);
  const ox = VW - MW * k - 12, oy = MOBUI() ? miniTop() : LVH - MH * k - 12, seen = dun.seen, at = (x, y) => seen && seen[(y / T | 0) * MW + (x / T | 0)];
  ctx.fillStyle = "rgba(10,8,20,.65)"; ctx.fillRect(ox - 3, oy - 3, MW * k + 6, MH * k + 6);
  if (seen) for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    if (!seen[y * MW + x]) continue; const c = dun.map[y][x];
    ctx.fillStyle = c === "#" ? "#5a5470" : c === "w" ? "#4a9fd0" : c === "T" ? "#2f6b2f" : c === "R" ? "#999" : wild ? "#6aa84f" : "#8a86a8"; ctx.fillRect(ox + x * k, oy + y * k, k + .5, k + .5);
  }
  const dot = (x, y, col, r) => { ctx.fillStyle = col; ctx.fillRect(ox + x / T * k - r, oy + y / T * k - r, r * 2, r * 2); };
  dot((dun.exit.x + .5) * T, (dun.exit.y + .5) * T, "#6ee7ff", k * .9);
  if (dun.stairs && at((dun.stairs.x + .5) * T, (dun.stairs.y + .5) * T)) dot((dun.stairs.x + .5) * T, (dun.stairs.y + .5) * T, "#ffd34d", k * .9);
  for (const m of dun.mons) if (at(m.x, m.y)) dot(m.x, m.y, m.boss ? "#ff9f1c" : m.wild && !m.hostile ? "#7be07b" : "#ff5a5a", k * (m.boss ? 1.3 : .7));
  dot(player.x, player.y, "#ffffff", k);
}
function buildDun() {
  const wild = dun.kind === "wild", MW = dun.map[0].length, MH = dun.map.length, d3 = new THREE.Group(), nodes = [];
  d3.add(terrainGroup(MW, MH, (x, y) => { const c = dun.map[y] && dun.map[y][x]; return c === "T" || c === "R" || c === "B" ? "." : c; }, wild ? "wild" : "dun"));
  dun.terr = d3.children[0];
  if (wild) for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const c = dun.map[y][x]; if (c !== "T" && c !== "R" && c !== "B") continue;
    const m = c === "T" ? mkPine() : c === "R" ? mkRock() : mkBush(); m.position.set(x + .5, 0, y + .5); m.rotation.y = rn(x, y, 7) * 6; d3.add(m); nodes.push({ m, x, y, c });
  }
  dun.nodes = nodes; dun.torches = [];
  if (!wild) for (let y = 0; y < MH - 1; y++) for (let x = 0; x < MW; x++) if (dun.map[y][x] === "#" && dun.map[y + 1][x] === "." && rn(x, y, 11) < .2) {
    const t = new THREE.Group(); t.position.set(x + .5, 1.2, y + 1.06); C(t, .04, .05, .4, 0x7d5433, 0, 0, 0, 6); B(t, .16, .06, .16, 0x5c5f6e, 0, .22, 0); const f = flame(t, 0, .4, 0, 1.3); d3.add(t); dun.torches.push({ x: x + .5, z: y + 1.3, f });
  }
  const ex = new THREE.Group(); ex.add(mkPortal()); ex.position.set(dun.exit.x + .5, 0, dun.exit.y + .5); d3.add(ex); dun.exit3 = ex.children[0];
  if (dun.stairs) { const s = mkStairs(); s.position.set(dun.stairs.x + .5, 0, dun.stairs.y + .5); d3.add(s); }
  const old = G.dyn.getObjectByName("dun3"); if (old) G.dyn.remove(old);
  d3.name = "dun3"; G.dyn.add(d3); dun.g3 = d3; dun.dyn = new THREE.Group(); G.dyn.add(dun.dyn);
}
function drawDun() {
  const g = groups(), P = player, world = dun.kind === "world", MW = world ? WN : dun.map[0].length, MH = world ? WN : dun.map.length, wild = dun.kind === "wild" || world;
  if (!world && !dun.g3) buildDun();
  showScene("dun"); setEnv(wild ? "wild" : "dun");
  const D = (wild ? 21 : 19) / (Z > 1 ? 1.55 : 1), pz = (P.y + 8) / T, dk = darkness(), fr = vtime;
  if (world) { drawWorldTerrain(); if (SEAM()) { drawVillageEnts(false); drawHomeEnts(false); } } else {
  G.dyn.children.forEach(c => { if (c.name === "dun3") c.visible = c === dun.g3; });
  if (dun.terr.userData.water) dun.terr.userData.water.position.y = Math.sin(vtime * 1.6) * .02;
  if (wild) for (const n of dun.nodes) { const on = dun.map[n.y][n.x] === n.c; n.m.visible = on; if (on) { const w = dun.wob && dun.wob.t > 0 && dun.wob.x === n.x && dun.wob.y === n.y; n.m.position.x = n.x + .5 + (w ? Math.sin(vtime * 50) * .06 : 0); } }
  if (dun.wob && dun.wob.t > 0) dun.wob.t -= DT;
  for (const t of dun.torches) { t.f.scale.setScalar(1.3 + Math.sin(vtime * 10 + t.x * 3) * .2); if (Math.abs(t.x - camT.x) < 14 && Math.abs(t.z - camT.z) < 10) light(t.x, t.z, 6, 0xffa850, 1.2, 1.0); }
  const pp = dun.exit3.userData.parts; pp[0].rotation.z = vtime * 2; pp[1].rotation.z = -vtime * 3; pp[2].material.opacity = .4 + .15 * Math.sin(vtime * 5);
  light(dun.exit.x + .5, dun.exit.y + .5, 5, 0x6ee7ff, 1, 1.4); if (dun.stairs) { light(dun.stairs.x + .5, dun.stairs.y + .5, 4, 0xffd34d, .5, 1); labelT("다음 층", dun.stairs.x + .5, dun.stairs.y + .5, 1, "#ffd34d"); }
  labelT("마을", dun.exit.x + .5, dun.exit.y + .5, 2, "#8fefff");
  }
  if (world) drawWorldEnts(g, P, pz);
  for (const l of dun.loot) {
    const e = ent(l, () => {
      const gg = new THREE.Group(), inner = new THREE.Group(); gg.add(inner);
      if (l.t === "gear") { const c = RARITY[l.it.rar].c, col = new THREE.Color(c); inner.add(mkGearModel(l.it.e)); const beam = new THREE.Mesh(geo("beam", () => new THREE.CylinderGeometry(.1, .1, 2.4, 8, 1, true)), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .35, depthWrite: false })); beam.position.y = 1.2; gg.add(beam); const rg = new THREE.Mesh(geo("lring", () => new THREE.RingGeometry(.25, .38, 20)), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .8, side: THREE.DoubleSide })); rg.rotation.x = -HALF; rg.position.y = .03; gg.add(rg); }
      else if (l.t === "gem") { inner.add(new THREE.Mesh(geo("gem", () => new THREE.OctahedronGeometry(.17)), HDR(0x5affc8))); }
      else if (l.t === "bell") { C(inner, .14, .14, .05, 0xf5d142, 0, 0, 0, 12, { r: [HALF, 0, 0] }); C(inner, .09, .09, .06, 0xfff3d6, 0, 0, 0, 12, { r: [HALF, 0, 0] }); }
      else if (l.t === "pot") { Sp(inner, .13, 0xe8505a, 0, 0, 0); C(inner, .04, .05, .12, 0xfff3d6, 0, .15, 0, 6); }
      else { inner.add(mkFurn(l.id)); inner.scale.setScalar(.5); }
      return { g: gg, inner };
    }, g.dyn);
    e.g.position.set(l.x / T, 0, (l.y + 8) / T); e.inner.position.y = .55 + Math.abs(Math.sin(vtime * 3 + l.x)) * .12; e.inner.rotation.y = vtime * 2;
    if (l.t === "gear") { light(l.x / T, (l.y + 8) / T, 2.5, RARITY[l.it.rar].c, 1, .9); labelT(l.it.n, l.x / T, (l.y + 8) / T, 1.6, RARITY[l.it.rar].c); }
  }
  for (const m of dun.mons) {
    if (Math.abs(m.x / T - camT.x) > 20 || Math.abs((m.y + 8) / T - camT.z) > 14) continue;
    const e = (m.wild || m.demon ? ent : entM)(m, () => { const b = m.wild ? mkWildDino(m.idx, m.boss) : mkMonModel(m.e, m.elite); b.g.scale.multiplyScalar(m.demon ? 1.45 : m.boss && !m.wild ? 1.8 : m.elite ? 1.2 : 1); return b; }, g.dyn);
    if (e.mon) { e.mv = e.px !== undefined && Math.hypot(m.x - e.px, m.y - e.py) > 6 * DT; e.px = m.x; e.py = m.y; if ((m.wind > 0 || m.cw > 0) && !(e.atkT > 0)) e.atkT = Math.max(m.wind || 0, m.cw || 0) + .45; if (m.flash > (e.lfl || 0) + .02 && !(e.atkT > 0)) e.hitT = .35; e.lfl = m.flash; }
    const chase = !(m.wild && !m.hostile), dx = P.x - m.x, dy = P.y - m.y, mv = chase ? Math.hypot(dx, dy) < 260 && Math.hypot(dx, dy) > 24 : (m.wvx || m.wvy);
    e.g.position.set(m.x / T, 0, (m.y + 8) / T); if (chase) face(e.g, dx, dy, 10); else if (mv) face(e.g, m.wvx, m.wvy, 6); if (e.dino && m.cd > (e.lcd || 0) + .5) e.atkT = .7; e.lcd = m.cd; animE(e, e.mon ? e.mv || m.kb > 0 : mv, e.mon ? (m.spd >= 90 ? 9 : 5) : m.boss ? 5 : 8, .55); flash(e, m.flash > 0);
    const top = e.h * (m.demon ? 1.45 : m.boss && !m.wild ? 1.8 : m.elite ? 1.2 : 1) + .2;
    if (m.hp < m.mhp || m.boss || m.elite) labelT("▮".repeat(Math.max(1, Math.round(8 * m.hp / m.mhp))) + "▯".repeat(8 - Math.max(1, Math.round(8 * m.hp / m.mhp))), m.x / T, (m.y + 8) / T, top, m.boss ? "#f5b942" : m.wild && !m.hostile ? "#7be07b" : "#ff6a6a");
    if (m.wind > 0 || m.cw > 0) labelT("❗", m.x / T, (m.y + 8) / T, top + .75, "#ff9a3c");
    if (m.boss) labelT(m.n, m.x / T, (m.y + 8) / T, top + .4, "#f5b942"); else if (m.elite) labelT(m.n, m.x / T, (m.y + 8) / T, top + .4, "#c79bff"); else if (m.tame && Math.hypot(m.x - P.x, m.y - P.y) < 90) labelT(`${m.n} 🐾${Math.min(m.tp, m.tame)}/${m.tame}`, m.x / T, (m.y + 8) / T, top + .35, "#fff3d6");
  }
  if (dun.dead) for (let i = dun.dead.length - 1; i >= 0; i--) {   // 쓰러지는 동작을 끝까지 보여 주고 지워요
    const c = dun.dead[i], e = ENT.get(c.m); c.t -= DT; if (c.t <= 0 || !e) { dun.dead.splice(i, 1); continue; }
    ent(c.m, () => e, g.dyn); e.dying = true; flash(e, false); animE(e, false, 8, .55); if (c.t < .35) e.g.position.y = -(.35 - c.t) * 2;
  }
  const pe = activePet(), pet = dun.pet;
  if (pet && pe) {
    const e = ent(pet, () => mkWildDino(pe.idx, false), g.dyn), mvp = Math.hypot(P.x - pet.x, P.y - pet.y) > 55 || P.mounted;
    e.g.position.set(pet.x / T, 0, (pet.y + 8) / T); if (P.mounted) { face(e.g, P.dx, P.dy, 12); e.g.position.set(P.x / T, 0, pz); } else face(e.g, P.x - pet.x, P.y - pet.y, 8); animE(e, mvp, 8, .55);
    if (!P.mounted) labelT(`Lv.${pe.lv}`, pet.x / T, (pet.y + 8) / T, e.h + .1, "#9be39b");
  }
  const e = refreshLook(ent(PK.d, mkPlayer, g.dyn));
  const lift = P.mounted && pet && pe ? (DINOM.ready ? [.8, .9, 1.75, 1.45, 1.05] : [.8, .9, 1.3, .9, 1.4])[pe.idx] : 0;
  e.g.position.set(P.x / T, lift, pz); face(e.g, P.dx, P.dy, 18); animE(e, P.mv && !modal && !P.mounted, 10, .75); flash(e, P.flash > 0);
  e.g.visible = !(P.inv > 0 && Math.floor(vtime * 20) % 2);
  e.pose = P.mounted ? "Sit_Chair_Idle" : null;
  if (!e.kay) { const wp = S.eq.weapon && S.eq.weapon.e; if (e.wk !== wp) { if (e.wm) e.ra.remove(e.wm); e.wk = wp; e.wm = wp ? outline(weaponModel(wp)) : null; if (e.wm) e.ra.add(e.wm); }
  if (e.wm && !P.mounted) { const sw = P.atkCd > 0 ? 1 - P.atkCd / (.42 / pstats().as) : 1; e.ra.rotation.x = P.atkCd > 0 ? -2.3 + sw * 3.2 : e.ra.rotation.x; } }
  for (const q of dun.proj) { const pr = ent(q, () => { const gg = new THREE.Group(), s = new THREE.Mesh(geo("fbs", () => new THREE.SphereGeometry(.2, 10, 8)), HDR(0xffa534)); gg.add(s); const s2 = new THREE.Mesh(geo("fbs2", () => new THREE.SphereGeometry(.11, 8, 6)), HDR(0xfff3a0)); gg.add(s2); return { g: gg }; }, g.dyn); pr.g.position.set(q.x / T, .7, (q.y + 8) / T); if (q.col) pr.g.children[0].material.color.setHex(q.col).multiplyScalar(2.4); if (q.sz) pr.g.scale.setScalar(q.sz); light(q.x / T, (q.y + 8) / T, 5, 0xffa534, .8, 1.6); if (Math.random() < .5) { parts.push({ x: q.x / T, z: (q.y + 8) / T, h: .7, vx: (Math.random() - .5), vz: (Math.random() - .5), vh: .3, g: 0, l: .25, c: new THREE.Color(Math.random() < .5 ? 0xf5d142 : 0xe8913a) }); } }
  if (dun.arena) {
    const ob = dun.run.perk.orbit || 0; for (let i = 0; i < ob; i++) { const o = ((dun.orbObjs ||= [])[i] ||= {}), e = ent(o, mkBlade, g.dyn), a = (dun.orbA || 0) + i * 6.283 / ob; e.g.position.set((P.x + Math.cos(a) * 64) / T, .7, (P.y + 8 + Math.sin(a) * 64) / T); e.g.rotation.y += DT * 12; }
    for (const bl of dun.bolts || []) { const be = ent(bl, () => { const gg = new THREE.Group(), m = new THREE.Mesh(geo("bolt", () => new THREE.BoxGeometry(.18, 7, .18)), HDR(0xbfefff, 2.6, { transparent: true })); m.position.y = 3.5; m.material.userData.own = 1; gg.add(m); return { g: gg, m }; }, g.dyn); be.g.position.set(bl.x / T, 0, (bl.y + 8) / T); be.m.material.opacity = Math.min(1, bl.t * 4); light(bl.x / T, (bl.y + 8) / T, 5, 0xbfefff, 1.5, 1.2); }
  }
  for (const t of dun.tele) { const te = ent(t, () => { const gg = new THREE.Group(), ring = new THREE.Mesh(new THREE.RingGeometry(.92, 1, 40), new THREE.MeshBasicMaterial({ color: 0xff3a2a, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false })), fill = new THREE.Mesh(new THREE.CircleGeometry(1, 36), new THREE.MeshBasicMaterial({ color: 0xff5a2a, transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false })); for (const m of [ring, fill]) { m.geometry.rotateX(-HALF); m.material.userData.own = 1; m.userData.ownGeo = 1; gg.add(m); } fill.position.y = .02; return { g: gg, fill }; }, g.dyn); te.g.position.set(t.x / T, .06, t.y / T); te.g.scale.setScalar(t.r / T); te.fill.scale.setScalar(Math.max(.05, 1 - t.t / t.t0)); light(t.x / T, t.y / T, 5, 0xff4a2a, .6, .8); }
  for (const q of dun.eproj) { const eq = ent(q, () => { const gg = new THREE.Group(); gg.add(new THREE.Mesh(geo("eorb", () => new THREE.SphereGeometry(.24, 10, 8)), HDR(q.col || 0xc03aff))); return { g: gg }; }, g.dyn); eq.g.position.set(q.x / T, .8, (q.y + 8) / T); light(q.x / T, (q.y + 8) / T, 4, 0xc03aff, .8, 1); }
  for (const a of dun.arcs) {
    if (!a.whirl && a.t0) {   // 칼 높이에서 대각선으로 휘두르는 빛 궤적
      const ar = ent(a, () => { const gg = new THREE.Group(), pv = new THREE.Group(); gg.add(pv); const geo2 = geo("slash", () => { const g2 = new THREE.RingGeometry(.45, 1.45, 28, 1, -HALF - 1.2, 2.4); g2.rotateX(-HALF); return g2; });
        const mk = (c, o) => { const m = new THREE.Mesh(geo2, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending })); m.userData.own = 1; m.material.userData.own = 1; pv.add(m); return m; };
        const m1 = mk(new THREE.Color(1.8, 2, 2.4), .9), m2 = mk(new THREE.Color(.6, .9, 1.6), .5); m2.scale.setScalar(1.12); return { g: gg, pv, ms: [m1, m2] }; }, g.dyn);
      const u = 1 - a.t / a.t0; ar.g.position.set(P.x / T, 1.05, pz); ar.g.rotation.set(0, a.yaw + (u - .5) * 1.9 * a.dir, 0); ar.pv.rotation.z = .55 * a.dir; ar.pv.scale.setScalar(.85 + u * .35);
      ar.ms.forEach((m, i) => { m.material.opacity = Math.sin(Math.min(1, u * 1.25) * Math.PI) * (i ? .45 : .95); }); continue;
    }
    const ar = ent(a, () => { const gg = new THREE.Group(), geom = a.whirl ? new THREE.RingGeometry(.8, 1, 36) : new THREE.RingGeometry(.9, 1.55, 20, 1, -Math.atan2(P.dy, P.dx) - .9, 1.8); geom.rotateX(-HALF); const m = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, side: THREE.DoubleSide, depthWrite: false })); m.userData.own = 1; gg.add(m); return { g: gg, m }; }, g.dyn);
    ar.g.position.set(P.x / T, .6, pz); const k = a.whirl ? (a.r / T) * (1.25 - a.t) : 1; ar.g.scale.setScalar(a.whirl ? k : 1); ar.m.material.opacity = Math.min(1, a.t * 6);
  }
  for (const f of dun.fx) otextT(f.txt, f.x / T, (f.y + 8) / T, 1.4 + (.9 - f.t) * 1.2, f.col, Math.min(1, f.t * 2), 15);
  PL0.x = P.x / T; PL0.z = pz; PL0.c = wild ? 0xffe6c0 : 0xffe0b0; PL0.i = wild ? (dk > .25 ? 1.4 : 0) : 1.2; PL0.r = wild ? 9 : 11; PL0.h = 2.4;
  if (started && !modal) G.cursor.visible = false;
  if (world) worldCursor();
  follow(P.x / T, pz, MW, MH, D); finish(D); overlay(drawMini);
}
