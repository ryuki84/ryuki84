/* ---------- 유틸 ---------- */
function mulberry32(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const rnd = mulberry32(20260506);          // 맵 생성용 (항상 같은 마을)
const R = Math.random;
const $ = id => document.getElementById(id);
const inRect = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

/* ---------- 맵 ---------- */
const terrain = [];
for (let y = 0; y < H; y++) { terrain[y] = []; for (let x = 0; x < W; x++) {
  const ex = (x - 22) / 6, ey = (y - 13) / 3.6;
  terrain[y][x] = ex * ex + ey * ey < 1 ? "w" : "g";
} }
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (terrain[y][x] === "g") {
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (terrain[y + j]?.[x + i] === "w") terrain[y][x] = "s";
}
for (let x = 3; x <= 15; x++) terrain[5][x] = "p";
for (let y = 5; y <= 9; y++) terrain[y][8] = "p";

const flowers = [];   // {x,y,e,back}
const rocks = [];
const freeGrass = (x, y) => terrain[y]?.[x] === "g" && !inRect({x:HOUSE.x-1,y:HOUSE.y-1,w:HOUSE.w+2,h:HOUSE.h+3}, x, y) && !inRect({x:SHOP.x-1,y:SHOP.y-1,w:SHOP.w+2,h:SHOP.h+3}, x, y) && Math.hypot(x - 8, y - 8) > 2.5;
function scatter(n, fn) { let tries = 0; while (n > 0 && tries++ < 2000) { const x = rnd() * W | 0, y = rnd() * H | 0; if (freeGrass(x, y) && fn(x, y)) n--; } }
const seedTrees = [];
scatter(10, (x, y) => { if (seedTrees.some(t => Math.hypot(t.x - x, t.y - y) < 3)) return false; seedTrees.push({ x, y, age: 99, fruit: 3, kind: FRUITS[rnd() * 3 | 0], t: 0 }); return true; });
scatter(28, (x, y) => { if (seedTrees.some(t => t.x === x && t.y === y)) return false; flowers.push({ x, y, e: ["🌷", "🌼", "🌸", "🌺"][rnd() * 4 | 0], back: 0 }); return true; });
scatter(6, (x, y) => { if (seedTrees.some(t => t.x === x && t.y === y) || flowers.some(f => f.x === x && f.y === y)) return false; rocks.push({ x, y }); return true; });
