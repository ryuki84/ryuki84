/* ---------- 오픈월드 ---------- */
const WN = 1048576, CHK = 16;   // 사실상 무한 (가운데에서 시작)
const BIO = { OCEAN: 0, BEACH: 1, PLAINS: 2, FOREST: 3, DESERT: 4, SNOW: 5, SWAMP: 6, HIGH: 7, TOWN: 8, ROAD: 9, DEMON: 10 };
const BIO_N = ["바다", "해변", "초원", "숲", "사막", "설원", "늪", "고원", "마을", "길", "마왕령"];
const BIO_E = ["🌊", "🏖️", "🌾", "🌲", "🏜️", "❄️", "🪷", "⛰️", "🏘️", "🛤️", "😈"];
const BIO_C = [0xb9a56c, 0xead9a0, 0x78c455, 0x4f9a3e, 0xe6cf8a, 0xeaf2f8, 0x5f7f4a, 0x8f939f, 0x9ad070, 0xcfa870, 0x3d3248];
const BIO_CS = BIO_C.map(c => "#" + c.toString(16).padStart(6, "0"));
const CELL = { TREE: 1, ROCK: 2, BUSH: 3, ORE: 4, CACT: 5, STRUCT: 10, PILLAR: 11, WALL: 12, FLOOR: 13, FIRE: 14, BED: 15, CHEST: 16, BOARD: 17, FARM: 18, CLIFF: 20, SWALL: 21 };
const SOLIDC = new Uint8Array(256); [1, 2, 4, 5, 10, 11, 12, 14, 15, 16, 17, 20, 21].forEach(c => SOLIDC[c] = 1);
const TOWN_NAMES = ["포근 왕국 왕도", "이끼 언덕", "바람 항구", "솔잎 마을", "붉은 모래촌", "눈꽃 마을", "달무리 나루", "구름 정거장", "노을 마을", "은행나무 촌", "금빛 들판", "고래 포구"];
const BIOSPAWN = {
  1: { d: [["d", 0]], n: [["m", 0], ["m", 2]] },
  2: { d: [["d", 0], ["d", 1], ["m", 0]], n: [["m", 4], ["m", 2], ["m", 1]] },
  3: { d: [["d", 1], ["d", 4], ["m", 2]], n: [["m", 4], ["m", 3], ["m", 2]] },
  4: { d: [["d", 0], ["m", 2], ["d", 4]], n: [["m", 3], ["m", 2], ["m", 5]] },
  5: { d: [["d", 2], ["d", 1], ["m", 3]], n: [["m", 3], ["m", 5], ["m", 1]] },
  6: { d: [["d", 3], ["m", 4], ["m", 2]], n: [["m", 4], ["m", 1], ["m", 3]] },
  7: { d: [["d", 4], ["m", 5], ["m", 1]], n: [["m", 5], ["m", 3], ["m", 1]] },
  9: { d: [["d", 0]], n: [["m", 0]] },
  10: { d: [["m", 5], ["m", 3], ["m", 4]], n: [["m", 5], ["m", 3], ["m", 4]] },
};
const BUILD = [
  { id: "wall", n: "나무 벽", e: "🧱", code: 12, cost: { wood: 2 } }, { id: "swall", n: "돌 벽", e: "🪨", code: 21, cost: { stone: 3 } },
  { id: "floor", n: "나무 바닥", e: "🟫", code: 13, cost: { wood: 1 } }, { id: "fire", n: "모닥불", e: "🔥", code: 14, cost: { wood: 3, stone: 2 } },
  { id: "bed", n: "침대 (리스폰)", e: "🛏️", code: 15, cost: { hide: 3, fiber: 4 } }, { id: "farm", n: "밭", e: "🌱", code: 18, cost: { fiber: 2 } },
];

/* ----- 노이즈 ----- */
function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, s, o = 4) { let a = .5, f = 1, t = 0, n = 0; for (let i = 0; i < o; i++) { t += a * vnoise(x * f, y * f, s + i * 31); n += a; a *= .5; f *= 2; } return t / n; }

/* ----- 월드 생성 (시드 고정: 항상 같은 대륙) ----- */
/* ===== 무한(사실상) 월드: 1,048,576칸 정사각형, 64칸 구역을 다가갈 때 좌표로 생성 ===== */
const WSEED = 4242, REG = 64, WC0 = WN / 2;
function bioBase(x, y) {
  const s = WSEED, e = fbm(x / 70, y / 70, s) * .58 + fbm(x / 460, y / 460, s + 3) * .8 - .2, m = fbm(x / 55 + 100, y / 55 + 100, s + 7);
  const t = clamp(fbm(x / 340, y / 340, s + 13) * 1.5 - .25 + (fbm(x / 80, y / 80, s + 17) - .5) * .35, 0, 1);
  if (e < .3) return 0; if (e < .335) return 1; if (e > .74) return e > .85 ? 17 : 7;   // 17 = 고원 절벽
  if (t < .27) return 5; if (t > .68 && m < .5) return 4; if (m > .66 && e < .52) return 6; if (m > .5) return 3; return 2;
}
function cellBase(x, y, b) {
  if (b === 17) return CELL.CLIFF; if (b < 1 || b > 7) return 0;
  const r = hash2(x, y, WSEED + 5), cl = .35 + 1.3 * vnoise(x / 7, y / 7, WSEED + 21);
  switch (b) {
    case 3: return r < .28 * cl ? 1 : r < .3 ? 2 : r < .34 ? 3 : 0;
    case 2: return r < .035 * cl ? 1 : r < .045 ? 2 : r < .08 ? 3 : 0;
    case 4: return r < .03 * cl ? 5 : r < .04 ? 2 : r < .046 ? 1 : 0;
    case 5: return r < .13 * cl ? 1 : r < .15 ? 2 : r < .16 ? 3 : 0;
    case 6: return r < .15 * cl ? 1 : r < .2 ? 3 : r < .21 ? 2 : 0;
    case 7: return r < .07 ? 2 : r < .095 ? 4 : r < .105 ? 1 : 0;
    case 1: return r < .004 ? 2 : r < .02 ? 3 : 0;
  }
  return 0;
}
const isLandB = (x, y) => { const b = bioBase(x, y); return b >= 2 && b !== 7 && b !== 17; };
const okAreaB = (cx, cy, r) => { for (let a = 0; a < 8; a++) if (!isLandB(Math.round(cx + Math.cos(a * .785) * r), Math.round(cy + Math.sin(a * .785) * r))) return false; return isLandB(cx, cy); };
/* 한 구역(64칸)의 장소 후보: 좌표 해시로만 정해져서 어느 구역에서 계산해도 같은 결과 */
function regionPlan(W, rx, ry) {
  const key = ry * 100000 + rx; if (W.plans.has(key)) return W.plans.get(key);
  const pl = { pois: [], ops: [] }; W.plans.set(key, pl);
  const s = WSEED, h = hash2(rx, ry, s + 99), cx = rx * REG + 10 + Math.floor(hash2(rx, ry, s + 1) * (REG - 20)), cy = ry * REG + 10 + Math.floor(hash2(rx, ry, s + 2) * (REG - 20));
  const dist = Math.hypot(cx - W.spawn.x, cy - W.spawn.y); if (dist < 46 || W.noPlan(cx, cy)) return pl;
  const tier = Math.min(4, Math.floor(dist / 55)), id = "p" + rx + "_" + ry, P = p => { pl.pois.push(p); return p; };
  const disc = (r, b) => pl.ops.push({ k: "disc", x: cx, y: cy, r, b }), struct = (x, y, w, hh, poi, code = CELL.STRUCT) => pl.ops.push({ k: "struct", x, y, w, h: hh, poi, code });
  if (h < .2 && (rx + ry) % 2 === 0 && okAreaB(cx, cy, 11)) {
    const nm = TOWN_NAMES[1 + Math.floor(hash2(rx, ry, s + 4) * (TOWN_NAMES.length - 1))], t = P({ id: "t" + rx + "_" + ry, type: "town", name: nm, x: cx, y: cy, r: 12, tier: 0, w: 1, h: 1 }); t.isTown = true;
    disc(11, BIO.TOWN); const sub = (k, type, n2, ox, oy, w, hh, code) => { const p = P({ id: t.id + k, type, name: n2, x: cx + ox, y: cy + oy, w, h: hh, town: t, tier: 0 }); struct(p.x, p.y, w, hh, p, code); return p; };
    sub("s", "shop", "상점", -5, -4, 3, 2); sub("i", "inn", "여관", 2, -4, 3, 2); sub("b", "board", "의뢰 게시판", -1, 3, 1, 1, CELL.BOARD); const sh = sub("w", "shrine", nm + " 이동석", 0, -1, 1, 1, CELL.PILLAR); sh.wp = true; return pl;
  }
  if (h < .26 && okAreaB(cx, cy, 17) && okAreaB(cx - 14, cy - 14, 3) && okAreaB(cx + 14, cy + 14, 3)) {   // 걸어 들어가는 고대 미궁
    const p = P({ id, type: "maze", name: "고대 미궁", x: cx, y: cy, w: 1, h: 1, tier, guard: true, r: 16 }); const c = P({ id: id + "c", type: "chest", name: "미궁의 보물", x: cx, y: cy, w: 1, h: 1, tier, par: p });
    pl.ops.push({ k: "maze", x: cx - 16, y: cy - 16, g: genMaze(hash2(rx, ry, s + 55)) }); struct(cx, cy, 1, 1, c, CELL.CHEST); return pl;
  }
  if (!okAreaB(cx, cy, 5)) return pl;
  if (h < .44) { disc(3); const p = P({ id, type: "cave", name: "동굴", x: cx, y: cy, w: 2, h: 2, tier }); struct(cx, cy, 2, 2, p); }
  else if (h < .64) { disc(5); const p = P({ id, type: "camp", name: "몬스터 야영지", x: cx, y: cy, w: 1, h: 1, tier, guard: true }); const c = P({ id: id + "c", type: "chest", name: "보물상자", x: cx, y: cy, w: 1, h: 1, tier, par: p }); struct(cx, cy, 1, 1, c, CELL.CHEST); }
  else if (h < .76) { disc(5); const p = P({ id, type: "ruin", name: "고대 유적", x: cx, y: cy, w: 1, h: 1, tier, guard: true }); const c = P({ id: id + "c", type: "chest", name: "유적 상자", x: cx, y: cy, w: 1, h: 1, tier, par: p }); struct(cx, cy, 1, 1, c, CELL.CHEST); }
  else if (h < .9) { disc(2); const p = P({ id, type: "shrine", name: `이동석 (${cx - WC0}, ${cy - WC0})`, x: cx, y: cy, w: 1, h: 1, tier, wp: true }); struct(cx, cy, 1, 1, p, CELL.PILLAR); }
  else if (h < .97 && dist > 80) { disc(7); const p = P({ id, type: "lair", name: "용의 소굴", x: cx, y: cy, w: 1, h: 1, tier: 4, guard: true }); const c = P({ id: id + "c", type: "chest", name: "용의 보물", x: cx, y: cy, w: 1, h: 1, tier: 4, par: p }); struct(cx, cy, 1, 1, c, CELL.CHEST); }
  return pl;
}
/* 마을 사이 길: 각 마을은 반경 2구역 안의 가장 가까운 마을(또는 왕도)과 ㄱ자 길로 연결 (바다는 둑길) */
function planRoads(W, rx, ry) {
  const pl = regionPlan(W, rx, ry); if (pl.roads) return pl.roads; pl.roads = [];
  const t = pl.pois.find(p => p.isTown); if (!t) return pl.roads; let best = null, bd = 1e9;
  for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { if (!dx && !dy) continue; const o = regionPlan(W, rx + dx, ry + dy).pois.find(p => p.isTown); if (o) { const d = Math.hypot(o.x - t.x, o.y - t.y); if (d < bd) { bd = d; best = o; } } }
  const cap = W.fixed[0], dc = Math.hypot(cap.x - t.x, cap.y - t.y); if (dc < bd && dc < 3.6 * REG) best = { x: cap.x, y: cap.y + 12 };
  if (best) pl.roads.push({ a: t, b: best }); return pl.roads;
}
function capRoads(W) { if (W.capR) return W.capR; W.capR = []; const c = W.fixed[0], crx = Math.floor(c.x / REG), cry = Math.floor(c.y / REG); let best = null, bd = 1e9;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const o = regionPlan(W, crx + dx, cry + dy).pois.find(p => p.isTown); if (o) { const d = Math.hypot(o.x - c.x, o.y - c.y); if (d < bd) { bd = d; best = o; } } }
  if (best) W.capR.push({ a: { x: c.x, y: c.y - 12 }, b: best }); return W.capR; }
function applyRoad(R, rd, x0, y0) {
  const { a, b } = rd, ry = a.y + 2, put = (x, y) => { if (x < x0 || y < y0 || x >= x0 + REG || y >= y0 + REG) return; const i = (y - y0) * REG + (x - x0); if (R.bio[i] === BIO.TOWN || R.inter.has(i) || R.cell[i] === CELL.SWALL) return; R.bio[i] = BIO.ROAD; R.cell[i] = 0; };
  for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) { put(x, ry); put(x, ry + 1); }
  for (let y = Math.min(ry, b.y + 2); y <= Math.max(ry, b.y + 2); y++) { put(b.x, y); put(b.x + 1, y); }
}
function genMaze(seed) {   // 33x33: 8x8 방 미로 + 가운데 큰 방 + 남쪽 입구 (1 = 벽)
  const n = 8, S = 33, g = new Uint8Array(S * S).fill(1), r = mulberry32(Math.floor(seed * 1e9)), seen = new Uint8Array(n * n), open = (x, y) => { if (x > 0 && y > 0 && x < S - 1 && y < S - 1) g[y * S + x] = 0; };
  const carveCell = (i, j) => { for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) open(1 + i * 4 + x, 1 + j * 4 + y); };
  const st = [[3, 7]]; seen[7 * n + 3] = 1; carveCell(3, 7);
  while (st.length) { const [i, j] = st[st.length - 1], nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n && !seen[b * n + a]);
    if (!nb.length) { st.pop(); continue; } const [a, b] = nb[Math.floor(r() * nb.length)]; seen[b * n + a] = 1; carveCell(a, b);
    if (a !== i) { const wx = 1 + Math.max(a, i) * 4 - 1; for (let y = 0; y < 3; y++) open(wx, 1 + j * 4 + y); } else { const wy = 1 + Math.max(b, j) * 4 - 1; for (let x = 0; x < 3; x++) open(1 + i * 4 + x, wy); }
    st.push([a, b]); }
  for (let k = 0; k < 6; k++) { const i = Math.floor(r() * (n - 1)), j = Math.floor(r() * n), wx = 1 + (i + 1) * 4 - 1; for (let y = 0; y < 3; y++) open(wx, 1 + j * 4 + y); }   // 고리 길 몇 개
  for (let y = 12; y <= 20; y++) for (let x = 12; x <= 20; x++) open(x, y);   // 가운데 보스 방
  for (let x = 13; x <= 15; x++) g[(S - 1) * S + x] = 0;   // 남쪽 입구
  return g;
}
function registerPlan(W, pl) { if (pl.reg) return; pl.reg = true; for (const p of pl.pois) { W.pois.push(p); W.byId.set(p.id, p); if (p.isTown) { W.towns.push(p); if (typeof dun !== "undefined" && dun && dun.kind === "world" && dun.vil) townVil(p, W.towns.length - 1); } if (p.guard) W.guard.push(p); if (p.type !== "town" && p.type !== "chest" && !p.town) p.dist = Math.hypot(p.x - W.spawn.x, p.y - W.spawn.y); } }
function applyOps(R, ops, x0, y0) {
  const inR = (x, y) => x >= x0 && y >= y0 && x < x0 + REG && y < y0 + REG, ix = (x, y) => (y - y0) * REG + (x - x0);
  for (const o of ops) {
    if (o.k === "disc") { for (let y = Math.max(y0, o.y - o.r); y <= Math.min(y0 + REG - 1, o.y + o.r); y++) for (let x = Math.max(x0, o.x - o.r); x <= Math.min(x0 + REG - 1, o.x + o.r); x++) { if ((x - o.x) ** 2 + (y - o.y) ** 2 > o.r * o.r) continue; const i = ix(x, y); if (o.force) { R.bio[i] = o.b; R.cell[i] = 0; continue; } if (R.bio[i] === 0) continue; if (o.b != null) R.bio[i] = o.b; if (R.cell[i] !== CELL.CLIFF) R.cell[i] = 0; } }
    else if (o.k === "rect") { for (let y = Math.max(y0, o.y); y < Math.min(y0 + REG, o.y + o.h); y++) for (let x = Math.max(x0, o.x); x < Math.min(x0 + REG, o.x + o.w); x++) { const i = ix(x, y); if (o.b != null) R.bio[i] = o.b; R.cell[i] = 0; R.inter.delete(i); } }
    else if (o.k === "struct") { for (let j = 0; j < o.h; j++) for (let i = 0; i < o.w; i++) { const x = o.x + i, y = o.y + j; if (!inR(x, y)) continue; R.cell[ix(x, y)] = o.code; R.inter.set(ix(x, y), o.poi); } }
    else if (o.k === "maze") { for (let y = Math.max(y0, o.y); y < Math.min(y0 + REG, o.y + 33); y++) for (let x = Math.max(x0, o.x); x < Math.min(x0 + REG, o.x + 33); x++) { const i = ix(x, y); R.bio[i] = 7; R.cell[i] = o.g[(y - o.y) * 33 + (x - o.x)] ? CELL.SWALL : 0; R.inter.delete(i); } }
    else if (o.k === "trees") { for (let y = Math.max(y0, o.y - o.r); y <= Math.min(y0 + REG - 1, o.y + o.r); y++) for (let x = Math.max(x0, o.x - o.r); x <= Math.min(x0 + REG - 1, o.x + o.r); x++) { const i = ix(x, y); if (R.bio[i] === BIO.DEMON && !R.cell[i] && hash2(x, y, WSEED + 77) < .045) R.cell[i] = CELL.TREE; } }
  }
}
function genRegion(W, rx, ry) {
  const x0 = rx * REG, y0 = ry * REG, R = { bio: new Uint8Array(REG * REG), cell: new Uint8Array(REG * REG), inter: new Map() };
  for (let j = 0; j < REG; j++) for (let i = 0; i < REG; i++) { let b = bioBase(x0 + i, y0 + j); const c = cellBase(x0 + i, y0 + j, b); if (b === 17) b = 7; R.bio[j * REG + i] = b; R.cell[j * REG + i] = c; }
  const near = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const pl = regionPlan(W, rx + dx, ry + dy); registerPlan(W, pl); near.push(pl); }
  for (const pl of near) applyOps(R, pl.ops.filter(o => o.k === "disc"), x0, y0);
  for (const pl of near) applyOps(R, pl.ops.filter(o => o.k === "maze"), x0, y0);
  applyOps(R, W.spec.filter(o => o.k !== "struct" && o.k !== "trees" && o.x - (o.r || 0) < x0 + REG && (o.x + (o.w || 0) + (o.r || 0)) >= x0 && o.y - (o.r || 0) < y0 + REG && (o.y + (o.h || 0) + (o.r || 0)) >= y0), x0, y0);
  applyOps(R, W.spec.filter(o => o.k === "trees"), x0, y0);
  const bbox = rd => Math.min(rd.a.x, rd.b.x) - 2 < x0 + REG && Math.max(rd.a.x, rd.b.x) + 2 >= x0 && Math.min(rd.a.y, rd.b.y) - 2 < y0 + REG && Math.max(rd.a.y, rd.b.y) + 4 >= y0;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) for (const rd of planRoads(W, rx + dx, ry + dy)) if (bbox(rd)) applyRoad(R, rd, x0, y0);
  for (const rd of capRoads(W)) if (bbox(rd)) applyRoad(R, rd, x0, y0);
  for (const pl of near) applyOps(R, pl.ops.filter(o => o.k === "struct"), x0, y0);
  applyOps(R, W.spec.filter(o => o.k === "struct"), x0, y0);
  return R;
}
let lastReg = null, lastRegK = -1;
function regAt(x, y) {
  const rx = Math.floor(x / REG), ry = Math.floor(y / REG), k = ry * 100000 + rx; if (k === lastRegK) return lastReg;
  const W = WORLD; let R = W.regs.get(k);
  if (!R) { R = genRegion(W, rx, ry); W.regs.set(k, R); if (W.regs.size > 700) { const px = player.x / T, py = player.y / T; for (const [kk] of W.regs) { const ax = kk % 100000, ay = Math.floor(kk / 100000); if (Math.abs(ax * REG - px) > 900 || Math.abs(ay * REG - py) > 900) W.regs.delete(kk); if (W.regs.size < 500) break; } } }
  lastReg = R; lastRegK = k; return R;
}
const baseCell = (x, y) => { const R = regAt(x, y); return R.cell[(y - Math.floor(y / REG) * REG) * REG + (x - Math.floor(x / REG) * REG)]; };
const interAt = (x, y) => { const R = regAt(x, y); return R.inter.get((y - Math.floor(y / REG) * REG) * REG + (x - Math.floor(x / REG) * REG)); };
function genWorld() {
  if (S.wver !== 2) { S.wver = 2; S.wedits = {}; S.crops = {}; S.wpos = null; S.wspawn = null; S.disc = ""; S.disc2 = ""; S.wp = {}; S.wcl = {}; S.wopen = {}; S.wreg = {}; }
  S.wedits = S.wedits || {};
  let sx = WC0, sy = WC0;
  for (let r = 0, found = false; r < 3000 && !found; r += 6) for (let a = 0; a < 16 && !found; a++) { const px = Math.round(WC0 + Math.cos(a * .3927) * r), py = Math.round(WC0 + Math.sin(a * .3927) * r); if ([2, 3].includes(bioBase(px, py)) && [2, 3].includes(bioBase(px, py + 25)) && [2, 3].includes(bioBase(px - 40, py + 20)) && [2, 3].includes(bioBase(px + 40, py)) && okAreaB(px, py, 14) && okAreaB(px, py - 12, 8) && okAreaB(px, py + 25, 14)) { sx = px; sy = py; found = true; } }
  const W = { N: WN, pois: [], towns: [], guard: [], byId: new Map(), plans: new Map(), regs: new Map(), spec: [], spawn: { x: sx, y: sy }, ed: NET.on ? NET.ed : S.wedits, chunks: new Map(), disc: new Set(), regrow: [], first: true };
  const spec = W.spec, add = p => { W.pois.push(p); W.byId.set(p.id, p); return p; }, struct = (x, y, w, h, poi, code = CELL.STRUCT) => spec.push({ k: "struct", x, y, w, h, poi, code });
  const VOX = sx - 15, VOY = sy + 15, HOX = VOX - 15, HOY = VOY + 1; W.vreg = { x: VOX, y: VOY }; W.hreg = { x: HOX, y: HOY };
  W.noPlan = (x, y) => (x > HOX - 30 && x < VOX + 50 && y > sy - 40 && y < VOY + 40);
  spec.push({ k: "disc", x: sx, y: sy, r: 11, b: BIO.TOWN, force: true }, { k: "disc", x: sx, y: sy - 10, r: 9, b: BIO.TOWN, force: true });
  const cap = add({ id: "t0", type: "town", name: TOWN_NAMES[0], x: sx, y: sy, r: 17, tier: 0, w: 1, h: 1, capital: true }); W.towns.push(cap);
  const sub = (k, type, nm, ox, oy, w, h, code) => { const p = add({ id: "t0" + k, type, name: nm, x: sx + ox, y: sy + oy, w, h, town: cap, tier: 0 }); struct(p.x, p.y, w, h, p, code); return p; };
  sub("s", "shop", "상점", -5, -4, 3, 2); sub("i", "inn", "여관", 2, -4, 3, 2); sub("b", "board", "의뢰 게시판", -1, 3, 1, 1, CELL.BOARD); sub("w", "shrine", TOWN_NAMES[0] + " 이동석", 0, -1, 1, 1, CELL.PILLAR).wp = true;
  const keep = add({ id: "castle", type: "castle", name: "포근성", x: sx - 5, y: sy - 15, w: 10, h: 5, town: cap, tier: 0 }); struct(keep.x, keep.y, 10, 5, keep);
  for (const ox of [-10, 8]) { const tw = add({ id: "tower" + ox, type: "castle", name: "포근성", x: sx + ox, y: sy - 14, w: 3, h: 3, town: cap, tier: 0, deco: true }); struct(tw.x, tw.y, 3, 3, tw); }
  { const p = add({ id: "portal", type: "portal", name: "포근 마을 포털", x: sx + 6, y: sy + 3, w: 1, h: 1, town: cap, tier: 0 }); struct(p.x, p.y, 1, 1, p, CELL.PILLAR); }
  spec.push({ k: "rect", x: HOX - 3, y: VOY - 3, w: VOX + 33 - (HOX - 3), h: 26, b: BIO.PLAINS }, { k: "rect", x: sx - 1, y: sy + 10, w: 2, h: VOY - sy - 10, b: BIO.ROAD });
  // 마왕성: 왕도에서 북쪽으로 멀리
  if (FEAT.demon) { const dx = sx + 30, dy = sy - 175; spec.push({ k: "disc", x: dx, y: dy, r: 26, b: BIO.DEMON, force: true }, { k: "trees", x: dx, y: dy, r: 24 });
    const d = add({ id: "demon", type: "demon", name: "마왕성", x: dx - 4, y: dy - 6, w: 9, h: 4, tier: 4 }); struct(d.x, d.y, 9, 4, d); W.guard.push(d); W.demon = d; d.dist = Math.hypot(d.x - sx, d.y - sy);
    const wp = add({ id: "demonwp", type: "shrine", name: "마왕성 입구 이동석", x: dx, y: dy + 5, w: 1, h: 1, tier: 4, wp: true, keepName: true }); struct(wp.x, wp.y, 1, 1, wp, CELL.PILLAR);
    for (let k = 0; k < 14; k++) { const y = sy - 12 - k * 12; spec.push({ k: "disc", x: sx + Math.round(k * 30 / 14), y, r: 3, b: null }); } }   // 마왕성으로 가는 길목은 막히지 않게
  W.fixed = W.pois.slice();
  for (const k of (S.disc2 || "").split(",")) if (k) W.disc.add(+k);
  for (const k in S.wreg) W.regrow.push({ k: +k, t: S.wreg[k] });
  return W;
}
function wc(x, y) { if (x < 0 || y < 0 || x >= WN || y >= WN) return 255; const k = y * WN + x, e = WORLD.ed[k]; return e !== undefined ? e : baseCell(x, y); }
function wb(x, y) { if (x < 0 || y < 0 || x >= WN || y >= WN) return 0; const R = regAt(x, y); return R.bio[(y - Math.floor(y / REG) * REG) * REG + (x - Math.floor(x / REG) * REG)]; }
const DKEY = (bx, by) => by * (WN / 4) + bx;
function getWorld() { return WORLD || (WORLD = genWorld()); }
function poisNear(x0, y0, x1, y1) {   // 주변 구역의 장소만 (월드 전체를 훑지 않게)
  const W = WORLD, m = 12, out = W.fixed.filter(p => p.x >= x0 - m && p.x < x1 + m && p.y >= y0 - m && p.y < y1 + m);
  for (let ry = Math.floor((y0 - m) / REG); ry <= Math.floor((y1 + m) / REG); ry++) for (let rx = Math.floor((x0 - m) / REG); rx <= Math.floor((x1 + m) / REG); rx++) { const pl = regionPlan(W, rx, ry); registerPlan(W, pl); for (const p of pl.pois) out.push(p); }
  return out;
}
function resolvePoi(id) { const W = getWorld(); let p = W.byId.get(id); if (p) return p; const m = /^[tp](\d+)_(\d+)/.exec(id); if (!m) return null; registerPlan(W, regionPlan(W, +m[1], +m[2])); return W.byId.get(id) || null; }

function wsolid(x, y) { const h = WORLD.hreg; if (h && x >= h.x && x < h.x + RW && y >= h.y + 2 && y < h.y + RH) return !(y === h.y + RH - 1 && (x === h.x + 5 || x === h.x + 6)); return x < 0 || y < 0 || x >= WN || y >= WN || wb(x, y) === 0 || SOLIDC[wc(x, y)] === 1; }
function markDirty(x, y) { for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const ch = WORLD.chunks.get(Math.floor((y + dy) / CHK) * 100000 + Math.floor((x + dx) / CHK)); if (ch) ch.dirty = true; } }
function setCell(x, y, code, regrow) {
  const k = y * WN + x, bc = baseCell(x, y); if (bc === code) delete WORLD.ed[k]; else WORLD.ed[k] = code;
  if (regrow && !NET.on) { const t = Date.now() + 420000 + Math.random() * 120000; S.wreg[k] = t; WORLD.regrow.push({ k, t }); }
  if (NET.on) NET.send({ t: "edit", k, c: bc === code ? null : code, rg: regrow ? 1 : 0 });
  markDirty(x, y);
}
const wTier = (x, y) => Math.min(4, Math.floor(Math.hypot(x - WORLD.spawn.x, y - WORLD.spawn.y) / 55));
function inTown(x, y) { return WORLD.towns.find(t => Math.hypot(t.x - x, t.y - y) < t.r) || null; }
