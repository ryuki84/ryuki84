/* ===== 귀여운 2D 화면 (설정에서 3D ↔ 2D) — Ninja Adventure 도트 그림(Pixel-boy, CC0) =====
   게임 내용(마을·월드·전투·저장)은 그대로, 보이는 것만 위에서 내려다보는 2D로 그려요. 3D 렌더링은 건너뛰어서 휴대폰에서 훨씬 가벼워요.
   마을·오픈월드·동굴·던전·마왕성·아레나·야생·집 안 모두 2D로 그려요. */
const V2 = { ready: false, started: false, img: {}, st: new WeakMap(), k: 1, cx: 0, cy: 0, W: 0, H: 0, atk: 0, evk: -1 };
const V2CH = ["Boy", "Woman", "Princess", "Knight", "Noble", "Villager", "OldMan", "GoldKnight", "Monk"];
const V2MO = ["Slime", "Slime2", "Butterfly", "ButterflyBlue", "Mushroom", "Mushroom2", "Spirit", "Spirit2", "Cyclope", "Cyclope2", "Beast", "Beast2", "Dragon", "Lizard", "Lizard2", "Reptile", "Reptile2", "Mole", "Snake", "Skull"];
const V2AN = { Dog: 2, Dog2: 2, Cat: 2, Cow: 3, Pig: 2 };
// 타일: [그림, 칸x, 칸y, 가로칸, 세로칸]
const V2T = { grass: ["floor", 0, 12], grass2: ["floor", 1, 12], grass3: ["floor", 3, 12], dgrass: ["floor", 11, 12], dirt: ["floor", 1, 8], sand: ["floor", 0, 5], psand: ["floor", 11, 5], snow: ["floor", 0, 19], mud: ["floor", 11, 19],
  water: ["water", 11, 0], water2: ["water", 11, 2], plank: ["water", 1, 13],
  treeR: ["nature", 0, 0, 2, 2], pine: ["nature", 2, 0, 2, 2], dead: ["nature", 4, 0, 2, 2], tree2: ["nature", 6, 0, 2, 2], snowp: ["nature", 8, 0, 2, 2], pink: ["nature", 14, 0, 2, 2], palm: ["desert", 10, 4, 2, 2],
  bush: ["nature", 0, 10], bush2: ["nature", 2, 10], flower: ["nature", 0, 11], rockB: ["nature", 16, 9], rockG: ["nature", 18, 9], ore: ["nature", 1, 15], stump: ["nature", 0, 8, 2, 1],
  house: ["house", 0, 0, 3, 3], shop: ["house", 16, 0, 3, 3], inn: ["house", 19, 0, 3, 3], dojo: ["house", 13, 0, 3, 3], cave: ["house", 4, 8, 2, 2], torii: ["house", 1, 5, 2, 2], fence: ["house", 8, 4, 2, 1] };
const V2BIO = ["water", "sand", "grass", "dgrass", "psand", "snow", "mud", "mud", "grass", "dirt", "mud"];   // 바이옴 → 바닥
const V2TREE = { 1: "treeR", 2: "treeR", 3: "pine", 4: "palm", 5: "snowp", 6: "dead", 7: "pine", 8: "treeR", 9: "treeR", 10: "dead" };
const V2MON = { "🐀": "Slime", "🦇": "Butterfly", "🕷️": "Mushroom", "💀": "Spirit", "🧟": "Cyclope", "👹": "Beast", "🐲": "Dragon", "😈": "Beast2", spiky: "Slime2", hornet: "ButterflyBlue", mushking: "Mushroom2", skullghost: "Spirit2", skullorc: "Cyclope2" };
const V2DINO = ["Lizard", "Mole", "Reptile2", "Reptile", "Lizard2"];
const V2VIL = { "🐶": ["Dog", 1], "🐮": ["Cow", 1], "🐱": ["Villager", 0], "🐰": ["OldMan", 0], "🐔": ["Pig", 1], "🐻": ["Dog2", 1] };
const v2Player = () => ["Woman", "Princess", "Boy", "Knight"][lookOf(S.look).av] || "Boy";
function load2D() {
  if (!VIEW2D || V2.started) return; V2.started = true; const jobs = [], add = (k, src) => jobs.push(new Promise(res => { const im = new Image(); im.onload = () => { V2.img[k] = im; res(); }; im.onerror = () => { console.warn("2D 그림을 못 불러왔어요:", src); res(); }; im.src = src; }));
  for (const [k, f] of [["floor", "TilesetFloor"], ["nature", "TilesetNature"], ["house", "TilesetHouse"], ["water", "TilesetWater"], ["desert", "TilesetDesert"], ["shadow", "shadow"]]) add(k, `assets/2d/${f}.png`);
  V2CH.forEach(n => add("c:" + n, `assets/2d/chars/${n}.png`)); V2MO.forEach(n => add("m:" + n, `assets/2d/mons/${n}.png`)); Object.keys(V2AN).forEach(n => add("a:" + n, `assets/2d/animals/${n}.png`));
  Promise.all(jobs).then(() => { V2.ready = !!(V2.img.floor && V2.img.nature); });
}
const v2on = () => VIEW2D && V2.ready && (scene === "out" || scene === "home" || (scene === "dun" && !!dun));
const v2hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function v2tile(c, key, wx, wy, scale = 1) {   // wx,wy: 타일 왼쪽 위(월드 칸)
  const t = V2T[key], im = t && V2.img[t[0]]; if (!im) return; const w = t[3] || 1, h = t[4] || 1, k = V2.k * T;
  c.drawImage(im, t[1] * 16, t[2] * 16, w * 16, h * 16, Math.round((wx * T - V2.cx) * V2.k + V2.W / 2), Math.round((wy * T - V2.cy) * V2.k + V2.H / 2), Math.ceil(w * k * scale), Math.ceil(h * k * scale));
}
function v2obj(c, key, cx, by, scale = 1) {   // 아래 가운데 기준(월드 칸)
  const t = V2T[key]; if (!t) return; const w = (t[3] || 1) * scale, h = (t[4] || 1) * scale; v2tile(c, key, cx - w / 2, by - h, scale);
}
// 캐릭터·몬스터 한 장: kind "c"(4방향×7줄), "m"(4방향×4프레임), "a"(옆모습 2~3프레임)
function v2sprite(c, name, kind, px, py, o, scale = 1) {   // px,py: 월드 픽셀(발 위치)
  const im = V2.img[kind + ":" + name]; if (!im) return;
  let s = V2.st.get(o); if (!s) { s = { dir: 0, ft: Math.random() * 4, lx: px, ly: py, fl: 0 }; V2.st.set(o, s); }
  const dx = o.vdx ?? (px - s.lx), dy = o.vdy ?? (py - s.ly), mv = o.vmv ?? (Math.abs(dx) + Math.abs(dy) > .05);
  if (Math.abs(dx) + Math.abs(dy) > .01) s.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
  s.lx = px; s.ly = py; s.ft += DT * (mv ? (o.vfast ? 12 : 8) : 2);
  const k = V2.k, sz = 16 * scale * k * 2, X = Math.round((px - V2.cx) * k + V2.W / 2), Y = Math.round((py - V2.cy) * k + V2.H / 2);
  if (V2.img.shadow) c.drawImage(V2.img.shadow, X - sz * .32, Y - sz * .1, sz * .64, sz * .22);
  let sx = 0, sy = 0, sw = 16, flip = false;
  if (kind === "a") { const n = V2AN[name] || 2; sw = im.width / n; sx = ((mv ? s.ft : s.ft * .5) | 0) % n * sw; flip = s.dir === 3; }
  else { sx = s.dir * 16; sy = kind === "c" ? (o.vatk > 0 ? 4 : mv ? (s.ft | 0) % 4 : 0) * 16 : (mv || o.vatk > 0 ? (s.ft | 0) % 4 : 0) * 16; }
  const bob = o.vemote ? -Math.abs(Math.sin(vtime * 9)) * sz * .15 : 0, dw = sw / 16 * sz, dh = sz;
  c.save(); if (o.vflash) c.filter = "brightness(3)"; if (o.vdying) { c.globalAlpha = .6; }
  if (flip) { c.translate(X, 0); c.scale(-1, 1); c.drawImage(im, sx, sy, sw, 16, -dw / 2, Y - dh + bob, dw, dh); }
  else c.drawImage(im, sx, sy, sw, 16, X - dw / 2, Y - dh + bob, dw, dh);
  c.restore();
}
function draw2D() {
  const c = ctx; c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  const Wd = ov.width, Ht = ov.height, TS = Math.max(32, Math.round(Ht / 12 / 16) * 16), k = TS / T;
  const local = scene === "out", home = scene === "home", mapd = scene === "dun" && dun && dun.kind !== "world" ? dun : null, V = !home && !mapd && WORLD && WORLD.vreg, ox = local && V ? V.x * T : 0, oy = local && V ? V.y * T : 0, P = player;
  const sh = shake > 0 ? (Math.random() - .5) * shake * .6 : 0;
  Object.assign(V2, { k, W: Wd, H: Ht, cx: P.x + ox + sh, cy: P.y + oy + 8 + sh, ox, oy });
  c.fillStyle = "#4a94d8"; c.fillRect(0, 0, Wd, Ht);
  const x0 = Math.floor((V2.cx - Wd / 2 / k) / T) - 1, x1 = Math.ceil((V2.cx + Wd / 2 / k) / T) + 1, y0 = Math.floor((V2.cy - Ht / 2 / k) / T) - 1, y1 = Math.ceil((V2.cy + Ht / 2 / k) / T) + 3;
  const objs = [], push = (y, f) => objs.push([y, f]);
  const inV = (x, y) => V && x >= V.x && x < V.x + W && y >= V.y && y < V.y + H, Hr = WORLD && WORLD.hreg;
  if (home) {   // 집 안: 위 2줄 벽, 나머지 나무 바닥
    c.fillStyle = "#2a2230"; c.fillRect(0, 0, Wd, Ht);
    for (let ty = 0; ty < RH; ty++) for (let tx = 0; tx < RW; tx++) { const X = Math.round((tx * T - V2.cx) * k + Wd / 2), Y = Math.round((ty * T - V2.cy) * k + Ht / 2);
      if (ty < 2) { c.fillStyle = ty === 0 ? "#c9a27a" : "#b88a5e"; c.fillRect(X, Y, Math.ceil(TS), Math.ceil(TS)); c.fillStyle = "rgba(0,0,0,.12)"; c.fillRect(X, Y + TS - 3, Math.ceil(TS), 3); } else v2tile(c, "plank", tx, ty); }
    for (const it of S.room) { const fu = FURN[it.id]; if (!fu) continue; push(it.y + 1, () => { c.font = `${TS * .85}px sans-serif`; c.textAlign = "center"; c.fillText(fu.e, ((it.x + .5) * T - V2.cx) * k + Wd / 2, ((it.y + 1) * T - V2.cy) * k + Ht / 2 - TS * .18); }); }
    push(RH, () => { c.font = `${TS * .7}px sans-serif`; c.textAlign = "center"; c.fillText("🚪", ((RW / 2) * T - V2.cx) * k + Wd / 2, (RH * T - V2.cy) * k + Ht / 2 - TS * .1); });
  } else if (mapd) {   // 동굴·던전·마왕성·아레나·야생: 글자 지도
    const M = mapd.map, wildm = mapd.kind === "wild", arena = !!mapd.arena, demon = !!mapd.demon, floor = wildm ? "grass" : arena ? "sand" : "mud";
    c.fillStyle = wildm ? "#3f6e34" : "#1c1824"; c.fillRect(0, 0, Wd, Ht);
    for (let ty = Math.max(0, y0); ty <= Math.min(M.length - 1, y1); ty++) for (let tx = Math.max(0, x0); tx <= Math.min(M[0].length - 1, x1); tx++) {
      const ch = M[ty][tx], X = Math.round((tx * T - V2.cx) * k + Wd / 2), Y = Math.round((ty * T - V2.cy) * k + Ht / 2);
      if (ch === "#") { if (wildm) { v2tile(c, "grass", tx, ty); push(ty + 1, () => v2obj(c, "pine", tx + .5, ty + 1.15)); } else { c.fillStyle = demon ? "#3a2440" : arena ? "#8a6a4a" : "#4a4256"; c.fillRect(X, Y, Math.ceil(TS), Math.ceil(TS)); c.fillStyle = demon ? "#5a3a64" : arena ? "#a8845e" : "#6a6078"; c.fillRect(X, Y, Math.ceil(TS), Math.ceil(TS * .3)); } continue; }
      v2tile(c, ch === "w" ? (((vtime * 1.5 + v2hash(tx, ty) * 4) | 0) % 4 ? "water" : "water2") : floor, tx, ty);
      if (demon) { c.fillStyle = "rgba(60,20,70,.35)"; c.fillRect(X, Y, Math.ceil(TS), Math.ceil(TS)); }
      if (ch === "T") push(ty + 1, () => v2obj(c, "pine", tx + .5, ty + 1.15)); else if (ch === "R") push(ty + 1, () => v2obj(c, "rockG", tx + .5, ty + 1)); else if (ch === "B") push(ty + 1, () => v2obj(c, "bush", tx + .5, ty + 1));
    }
    if (mapd.exit) push(mapd.exit.y + 1, () => v2obj(c, "torii", mapd.exit.x + .5, mapd.exit.y + 1));
    if (mapd.stairs) push(mapd.stairs.y + 1, () => { c.font = `${TS * .8}px sans-serif`; c.textAlign = "center"; c.fillText("🪜", ((mapd.stairs.x + .5) * T - V2.cx) * k + Wd / 2, ((mapd.stairs.y + 1) * T - V2.cy) * k + Ht / 2 - TS * .2); labelT("다음 층", mapd.stairs.x + .5, mapd.stairs.y + .5, 1, "#ffd34d"); });
  } else
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (inV(tx, ty) || (!WORLD && local)) { const lx = V ? tx - V.x : tx, ly = V ? ty - V.y : ty, ch = terrain[ly] && terrain[ly][lx]; if (ch === undefined) continue;
      const g = ch === "w" ? (((vtime * 1.5 + v2hash(tx, ty) * 4) | 0) % 4 ? "water" : "water2") : ch === "s" ? "sand" : ch === "p" ? "dirt" : v2hash(tx, ty) < .82 ? "grass" : v2hash(tx, ty) < .91 ? "grass2" : "grass3"; v2tile(c, g, tx, ty); continue; }
    if (!WORLD) continue; const b = wb(tx, ty); if (b === undefined) continue; const cc = wc(tx, ty);
    let g = V2BIO[b] || "grass"; if (g === "grass" && v2hash(tx, ty) > .86) g = v2hash(tx, ty) > .93 ? "grass3" : "grass2"; if (b === 0) g = ((vtime * 1.5 + v2hash(tx, ty) * 4) | 0) % 4 ? "water" : "water2";
    if (cc === CELL.FLOOR) g = "plank"; else if (cc === CELL.FARM) g = "dirt"; else if (cc === CELL.CLIFF) g = "mud";
    v2tile(c, g, tx, ty); if (b === 10) { c.fillStyle = "rgba(40,20,60,.45)"; c.fillRect(Math.round((tx * T - V2.cx) * k + Wd / 2), Math.round((ty * T - V2.cy) * k + Ht / 2), Math.ceil(TS), Math.ceil(TS)); }
    const cxm = tx + .5, by = ty + 1;
    if (cc === CELL.TREE) { const key = V2TREE[b] || "treeR"; push(by, () => v2obj(c, key, cxm, by + .15)); }
    else if (cc === CELL.ROCK) push(by, () => v2obj(c, b === 4 || b === 7 ? "rockB" : "rockG", cxm, by));
    else if (cc === CELL.BUSH) push(by, () => v2obj(c, b === 3 ? "bush2" : "bush", cxm, by));
    else if (cc === CELL.ORE) push(by, () => v2obj(c, "ore", cxm, by));
    else if (cc === CELL.CACT) push(by, () => v2obj(c, "palm", cxm, by + .1, .8));
    else if (cc === CELL.WALL || cc === CELL.SWALL || cc === CELL.PILLAR || cc === CELL.STRUCT) push(by, () => v2obj(c, "rockG", cxm, by, 1.1));
    else if (cc === CELL.FARM) { const st = cropStage(ty * WN + tx); if (st >= 0) push(by, () => { c.font = `${TS * .7}px sans-serif`; c.textAlign = "center"; c.fillText(st >= 2 ? "🍅" : "🌱", (cxm * T - V2.cx) * k + Wd / 2, (by * T - V2.cy) * k + Ht / 2 - TS * .2); }); }
    else if (cc === CELL.FIRE) push(by, () => { c.font = `${TS * .8}px sans-serif`; c.textAlign = "center"; c.fillText("🔥", (cxm * T - V2.cx) * k + Wd / 2, (by * T - V2.cy) * k + Ht / 2 - TS * .15); });
    else if (cc === CELL.BED) push(by, () => { c.font = `${TS * .8}px sans-serif`; c.textAlign = "center"; c.fillText("🛏️", (cxm * T - V2.cx) * k + Wd / 2, (by * T - V2.cy) * k + Ht / 2 - TS * .15); });
  }
  // 마을(지역) 물체 — 월드에서도 이어 보여요
  const vx = V ? V.x : 0, vy = V ? V.y : 0, vpx = vx * T, vpy = vy * T;
  if (!home && !mapd && (V || local)) {
    for (const t of trees) { const st = t.age < 20 ? .5 : t.age < 60 ? .75 : 1, by = vy + t.y + 1; push(by, () => { v2obj(c, "treeR", vx + t.x + .5, by + .15, st); if (t.fruit > 0 && t.age >= 60) { c.fillStyle = "#e8505a"; for (let i = 0; i < t.fruit; i++) { const X = ((vx + t.x + .3 + i * .22) * T - V2.cx) * k + Wd / 2, Y = ((by - 1.2 + (i % 2) * .2) * T - V2.cy) * k + Ht / 2; c.beginPath(); c.arc(X, Y, TS * .09, 0, 6.28); c.fill(); } } }); }
    for (const r of rocks) { const by = vy + r.y + 1; push(by, () => v2obj(c, "rockG", vx + r.x + .5, by)); }
    for (const f of flowers) if (!(f.back > 0)) { const by = vy + f.y + 1; push(by - .5, () => v2obj(c, "flower", vx + f.x + .5, by - .1)); }
    for (const it of ground) { const by = vy + it.y + 1; push(by, () => { c.fillStyle = FRC[it.k] ? "#" + FRC[it.k].toString(16).padStart(6, "0") : "#e8505a"; c.beginPath(); c.arc(((vx + it.x + .5) * T - V2.cx) * k + Wd / 2, ((by - .45) * T - V2.cy) * k + Ht / 2 - Math.abs(Math.sin(vtime * 4 + it.x)) * TS * .12, TS * .14, 0, 6.28); c.fill(); }); }
    const bld = (key, r, ox2 = 0) => { const by = vy + r.y + r.h + .2; push(by, () => v2obj(c, key, vx + r.x + r.w / 2 + ox2, by)); };
    bld("house", HOUSE); bld("shop", SHOP); bld("cave", CAVE); if (FEAT.arena) bld("dojo", ARENA); { const r = WILDG; const by = vy + r.y + r.h; push(by, () => v2obj(c, "torii", vx + r.x + r.w / 2, by)); }
    for (const v of villagers) { const [nm, an] = V2VIL[v.e] || ["Villager", 0]; const o = v; o.vdx = v.vx; o.vdy = v.vy; o.vmv = v.talk <= 0 && !!(v.vx || v.vy); o.vemote = v.talk > 0; push((vpy + v.y + 8) / T, () => { v2sprite(c, nm, an ? "a" : "c", vpx + v.x, vpy + v.y + 8, o); }); if (local && Math.hypot(v.x - P.x, v.y - P.y) < 80) labelT(v.name, vx + v.x / T, vy + (v.y + 8) / T, 1.6, "#fff3d6"); }
    for (const cr of critters) { const o = cr; o.vdx = cr.vx; o.vdy = cr.vy; o.vmv = !!(cr.vx || cr.vy); o.vfast = Math.hypot(cr.vx, cr.vy) > 40; push((vpy + cr.y + 8) / T, () => v2sprite(c, cr.k === "v/fox" ? "Cat" : "Dog2", "a", vpx + cr.x, vpy + cr.y + 8, o, .8)); }
  }
  if (Hr && !home && !mapd) { const by = Hr.y + RH + .2; push(by, () => v2obj(c, "house", Hr.x + RW / 2, by, 1.2)); }
  // 월드 물체
  if (scene === "dun" && dun) {
    if (!mapd) for (const p of poisNear(x0, y0, x1, y1)) { const cx2 = p.x + (p.w || 1) / 2, by = p.y + (p.h || 1);
      const key = p.type === "shop" ? "shop" : p.type === "inn" ? "inn" : p.type === "castle" ? (p.deco ? "rockG" : "dojo") : p.type === "demon" ? "dojo" : p.type === "cave" ? "cave" : p.type === "portal" || p.type === "shrine" ? "torii" : null;
      if (key) push(by, () => { c.save(); if (p.type === "demon") c.filter = "hue-rotate(220deg) brightness(.6)"; v2obj(c, key, p.type === "castle" && !p.deco ? p.x + 5 : cx2, p.type === "castle" && !p.deco ? p.y + 5 : by, p.type === "castle" && !p.deco ? 2.4 : p.type === "demon" ? 2.6 : 1); c.restore(); });
      else if (p.type === "chest") push(by, () => { c.font = `${TS * .8}px sans-serif`; c.textAlign = "center"; c.fillText(S.wopen[p.id] ? "📭" : "🎁", (cx2 * T - V2.cx) * k + Wd / 2, (by * T - V2.cy) * k + Ht / 2 - TS * .2); });
      else if (p.type === "board") push(by, () => { c.font = `${TS * .8}px sans-serif`; c.textAlign = "center"; c.fillText("📋", (cx2 * T - V2.cx) * k + Wd / 2, (by * T - V2.cy) * k + Ht / 2 - TS * .2); });
    }
    for (const l of dun.loot) push((l.y + 8) / T, () => { c.font = `${TS * .6}px sans-serif`; c.textAlign = "center"; c.fillText(l.t === "bell" ? "🔔" : l.t === "gear" ? "✨" : l.t === "pot" ? "🧪" : l.t === "furn" ? "🪑" : "🎁", (l.x - V2.cx) * k + Wd / 2, (l.y + 8 - V2.cy) * k + Ht / 2 - Math.abs(Math.sin(vtime * 3 + l.x)) * TS * .12); });
    if (!mapd) for (const v of dun.vil || []) { const o = v; o.vdx = v.vx; o.vdy = v.vy; o.vmv = v.talk <= 0 && !!(v.vx || v.vy); o.vemote = v.talk > 0; const nm = v.model === "king" ? "Noble" : v.model === "guard" ? "Knight" : (V2VIL[v.e] || ["Villager"])[0], an = !v.model && (V2VIL[v.e] || [0, 0])[1];
      push((v.y + 8) / T, () => v2sprite(c, nm, an ? "a" : "c", v.x, v.y + 8, o, v.model === "king" ? 1.15 : 1)); if (v.model === "king") labelT("👑 " + v.name, v.x / T, (v.y + 8) / T, 1.9, "#ffe27a"); else if (Math.hypot(v.x - P.x, v.y - P.y) < 90) labelT(v.name, v.x / T, (v.y + 8) / T, 1.6, "#fff3d6"); }
    for (const m of dun.mons) { if (Math.abs(m.x / T - V2.cx / T) > 24 || Math.abs(m.y / T - V2.cy / T) > 16) continue;
      const o = m, dx = P.x - m.x, dy = P.y - m.y, chase = !(m.wild && !m.hostile); o.vdx = chase ? dx : m.wvx; o.vdy = chase ? dy : m.wvy; o.vmv = undefined; o.vatk = (m.wind > 0 || m.cw > 0) ? 1 : 0; o.vflash = m.flash > 0; o.vfast = m.spd >= 90;
      const nm = m.wild ? (m.boss ? "Beast2" : V2DINO[m.idx] || "Lizard") : V2MON[m.elite || m.e] || "Slime", sc = m.demon ? 2 : m.boss ? 1.8 : m.elite ? 1.3 : 1;
      push((m.y + 8) / T, () => v2sprite(c, nm, "m", m.x, m.y + 8, o, sc));
      const top = .9 * sc + .2; if (m.hp < m.mhp || m.boss || m.elite) labelT("▮".repeat(Math.max(1, Math.round(8 * m.hp / m.mhp))) + "▯".repeat(8 - Math.max(1, Math.round(8 * m.hp / m.mhp))), m.x / T, (m.y + 8) / T, top, m.boss ? "#f5b942" : m.wild && !m.hostile ? "#7be07b" : "#ff6a6a");
      if (m.wind > 0 || m.cw > 0) labelT("❗", m.x / T, (m.y + 8) / T, top + .6, "#ff9a3c"); if (m.boss) labelT(m.n, m.x / T, (m.y + 8) / T, top + .35, "#f5b942"); else if (m.elite) labelT(m.n, m.x / T, (m.y + 8) / T, top + .35, "#c79bff"); }
    if (dun.pet && activePet()) { const pet = dun.pet, pe = activePet(), o = pet; push((pet.y + 8) / T, () => v2sprite(c, V2DINO[pe.idx] || "Lizard", "m", pet.x, pet.y + 8, o)); }
    for (const t of dun.tele) { const X = (t.x - V2.cx) * k + Wd / 2, Y = (t.y - V2.cy) * k + Ht / 2, R = t.r * k; c.fillStyle = "rgba(255,80,40,.22)"; c.beginPath(); c.ellipse(X, Y, R, R * .7, 0, 0, 6.28); c.fill(); c.fillStyle = "rgba(255,90,40,.45)"; c.beginPath(); c.ellipse(X, Y, R * (1 - t.t / t.t0), R * .7 * (1 - t.t / t.t0), 0, 0, 6.28); c.fill(); }
    for (const q of [...dun.proj, ...dun.eproj]) push((q.y + 8) / T, () => { const X = (q.x - V2.cx) * k + Wd / 2, Y = (q.y - V2.cy) * k + Ht / 2 - TS * .4; c.fillStyle = q.col ? "#f5d040" : q.hit ? "#ff9a3c" : "#c03aff"; c.beginPath(); c.arc(X, Y, TS * .16, 0, 6.28); c.fill(); });
    if (NET.on) for (const o of NET.others.values()) push((o.y + 8) / T, () => { o.vmv = !!o.mv; v2sprite(c, "Boy", "c", o.x, o.y + 8, o); labelT(o.name, o.x / T, (o.y + 8) / T, 1.6, "#bfe3ff"); });
  }
  // 플레이어
  if (V2.evk !== PEV.k) { V2.evk = PEV.k; if (/Attack|Slice|Chop|Spin|Spellcast|Use_Item|Interact|PickUp|Throw/.test(PEV.n || "")) V2.atk = .28; }
  V2.atk -= DT; const po = player; po.vdx = P.dx; po.vdy = P.dy; po.vmv = P.mv && !modal; po.vatk = V2.atk > 0 ? 1 : 0; po.vflash = P.flash > 0;
  push((V2.cy) / T, () => v2sprite(c, v2Player(), "c", V2.cx - sh, V2.cy - sh, po, 1.05));
  objs.sort((a, b) => a[0] - b[0]); for (const o of objs) o[1]();
  // 휘두르기 호, 파티클
  if (dun && dun.arcs) for (const a of dun.arcs) { const X = (P.x + ox - V2.cx) * k + Wd / 2, Y = (P.y + oy - V2.cy) * k + Ht / 2; c.strokeStyle = "rgba(255,255,255,.8)"; c.lineWidth = TS * .12; c.beginPath(); if (a.whirl) c.arc(X, Y, a.r * k, 0, 6.28); else c.arc(X, Y, a.r * k * .8, a.a - 1, a.a + 1); c.stroke(); }
  for (const p of parts) { c.fillStyle = "#" + p.c.getHexString(); const X = ((p.x * T + (local ? ox : 0)) - V2.cx) * k + Wd / 2, Y = ((p.z * T + (local ? oy : 0)) - V2.cy) * k + Ht / 2 - p.h * TS * .6; c.fillRect(X - TS * .05, Y - TS * .05, TS * .1, TS * .1); }
  // 밤
  const dk = mapd && !mapd.arena && mapd.kind !== "wild" ? Math.max(.42, darkness()) : home ? 0 : darkness(); if (dk > .05) { const X = Wd / 2, Y = Ht / 2 - TS * .4, gr = c.createRadialGradient(X, Y, TS * 1.5, X, Y, TS * 6); gr.addColorStop(0, `rgba(20,24,60,0)`); gr.addColorStop(1, `rgba(20,24,60,${Math.min(.72, dk * 1.1)})`); c.fillStyle = gr; c.fillRect(0, 0, Wd, Ht); }
  if (local && started && !modal) { const { tx, ty } = target(); c.strokeStyle = `rgba(255,255,255,${.5 + .35 * Math.sin(vtime * 6)})`; c.lineWidth = Math.max(2, TS * .06); c.strokeRect(((vx + tx) * T - V2.cx) * k + Wd / 2 + 2, ((vy + ty) * T - V2.cy) * k + Ht / 2 + 2, TS - 4, TS - 4); }
}
// 라벨 좌표(칸 단위)는 장면 기준이에요: 마을에서는 이미 월드 칸으로 넘겨요
function v2proj(x, z, h) { return [(x * T - V2.cx) * V2.k + V2.W / 2, (z * T - V2.cy) * V2.k + V2.H / 2 - h * T * V2.k * .62]; }
function frame2D() {
  if (cv.style.visibility !== "hidden") cv.style.visibility = "hidden";
  if (scene === "dun" && dun) for (const f of dun.fx) otextT(f.txt, f.x / T, (f.y + 8) / T, 1.2 + (.9 - f.t) * 1.2, f.col, Math.min(1, f.t * 2), 15);
  drawParts2D(); weatherTick();
  overlay(scene === "dun" ? drawMini : null, true);
}
function drawParts2D() {}
function draw() { if (!R3) return; frameNo++; groups(); if (started && !WORLD) getWorld(); if (v2on()) { camYaw = 0; return frame2D(); } if (cv.style.visibility === "hidden") cv.style.visibility = ""; G.cursor.visible = false; if (scene === "home") drawHome(); else if (scene === "dun") drawDun(); else drawVillage(); }
