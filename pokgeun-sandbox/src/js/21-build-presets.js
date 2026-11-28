/* ===== GDD P2-1 (2026-11-28): 완성형 건물 · 밖에 가구 놓기 =====
   완성형 건물은 기존 블록 조각(벽·돌벽·바닥·작업대·모닥불·밭)을 한 번에 찍는 틀이에요.
   그래서 저장(S.wedits)·충돌·멀티플레이 공유·조각별 철거가 블록 건축과 똑같이 동작해요(GDD 7.4 공통 모델의 첫 단계).
   미리보기: 바라보는 쪽으로 건물 모양이 칸마다 초록(가능)/빨강(막힘)으로 보이고, 🔄로 돌릴 수 있어요.
   가구: 제작한 가구(S.fin)를 지은 집 바닥이나 땅에 놓아요(칸 코드 40+). 철거하면 가구로 돌아와요. */
const FURN_KEYS = Object.keys(FURN);
const FURN_CODE = id => 40 + FURN_KEYS.indexOf(id), CODE_FURN = c => c >= 40 && c < 40 + FURN_KEYS.length ? FURN_KEYS[c - 40] : null;
FURN_KEYS.forEach((k, i) => { if (!FURN[k].rug && !FURN[k].wall) SOLIDC[40 + i] = 1; });
const PCELL = { "#": CELL.WALL, S: CELL.SWALL, ".": CELL.FLOOR, B: CELL.BENCH, F: CELL.FIRE, f: CELL.FARM, b: CELL.BED };
// 첫 줄이 먼 쪽, 마지막 줄이 내 앞(문) 쪽
const PRESETS = [
  { id: "hut", n: "작은 오두막", e: "🏠", d: "나무 벽 · 바닥 · 앞쪽 문", rows: ["#####", "#...#", "#...#", "##.##"] },
  { id: "house", n: "아늑한 집", e: "🏡", d: "침대가 있는 넓은 집(리스폰 지점)", rows: ["#######", "#b....#", "#.....#", "#.....#", "###.###"] },
  { id: "stone", n: "돌집", e: "🪨", d: "튼튼한 돌벽 집", rows: ["SSSSSS", "S....S", "S....S", "SS..SS"] },
  { id: "workshop", n: "작업장", e: "🛠️", d: "작업대와 모닥불, 앞이 트인 공간", rows: ["#####", "#B.F#", "#...#", "#...#"] },
  { id: "field", n: "밭 3×2", e: "🌱", d: "작물 6칸", rows: ["fff", "fff"] },
];
const codeCost = c => (BUILD.find(b => b.code === c) || { cost: {} }).cost;
PRESETS.forEach(p => { const cost = {}; for (const r of p.rows) for (const ch of r) { const c = PCELL[ch]; if (c) for (const [k, v] of Object.entries(codeCost(c))) cost[k] = (cost[k] || 0) + v; } p.cost = cost; p.kind = "preset"; p.cells = p.rows.join("").replace(/ /g, "").length; });
let bRot = 0;   // 미리보기 추가 회전(🔄)
function presetCells(p) {   // [{x,y,c}] 월드 칸
  const P = player, ax = Math.abs(P.dx) >= Math.abs(P.dy), fd = ax ? [Math.sign(P.dx) || 1, 0] : [0, Math.sign(P.dy) || 1];
  let f = fd; for (let i = 0; i < bRot; i++) f = [-f[1], f[0]];
  const r = [-f[1], f[0]], h = p.rows.length, w = p.rows[0].length;
  const ftx = Math.floor((P.x + fd[0] * 26) / T), fty = Math.floor((P.y + 8 + fd[1] * 26) / T), out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const c = PCELL[p.rows[j][i]]; if (!c) continue; const a = i - Math.floor(w / 2), bb = h - 1 - j; out.push({ x: ftx + r[0] * a + f[0] * bb, y: fty + r[1] * a + f[1] * bb, c }); }
  return out;
}
const cellFree = (x, y) => x > 0 && y > 0 && x < WN - 1 && y < WN - 1 && wb(x, y) !== 0 && wc(x, y) === 0 && !inTown(x, y) && !dun.mons.some(m => Math.floor(m.x / T) === x && Math.floor((m.y + 8) / T) === y);
function placePreset(p) {
  const cs = presetCells(p), bad = cs.filter(q => !cellFree(q.x, q.y));
  if (bad.length) return say(`🚧 ${bad.length}칸이 막혀 있어요(나무·바위·물·마을). 빨간 칸을 치우거나 🔄로 방향을 바꿔 보세요.`, 2600);
  if (!canAfford(p.cost)) return say(`재료가 부족해요: ${Object.entries(p.cost).map(([k, v]) => `${MAT[k][0]}${S.mat[k] || 0}/${v}`).join(" ")}`, 2600);
  for (const k in p.cost) S.mat[k] -= p.cost[k];
  for (const q of cs) setCell(q.x, q.y, q.c, false);
  sfx("place"); shake = Math.max(shake, 2); for (const q of cs) if (Math.random() < .35) burst((q.x + .5) * T, (q.y + .5) * T, 4, ["#d9b07c", "#fff"], 60, .4, 160, .5);
  profAdd("build", Math.ceil(p.cells / 3)); say(`${p.e} ${p.n}을(를) 지었어요! 안에 가구를 놓아 보세요(건설 → 가구 놓기).`, 3000); buildSel = null; hud(); save();
}
function placeFurnOut(id) {
  const P = player, tx = Math.floor((P.x + P.dx * 26) / T), ty = Math.floor((P.y + 8 + P.dy * 26) / T), c = wc(tx, ty);
  if (!(S.fin[id] > 0)) { buildSel = null; return say("이 가구가 더 없어요. 작업대에서 만들어 보세요.", 2000); }
  if (!(c === 0 || c === CELL.FLOOR) || wb(tx, ty) === 0 || inTown(tx, ty)) return say("빈 땅이나 바닥 위에 놓을 수 있어요.", 1600);
  S.fin[id]--; setCell(tx, ty, FURN_CODE(id), false); if (c === CELL.FLOOR) S.wfloor[ty * WN + tx] = 1;
  sfx("place"); burst((tx + .5) * T, (ty + .5) * T, 6, ["#f5d142", "#fff"], 60, .4, 160, .5);
  if (!(S.fin[id] > 0)) buildSel = null; hud(); save();
}
S.wfloor = S.wfloor || {};   // 바닥 위에 놓은 가구 자리(치우면 바닥으로 돌아가요)
/* 기존 건설 함수 감싸기 */
{ const bp = buildPlace; buildPlace = function (tx, ty) { if (buildSel && buildSel.kind === "preset") return placePreset(buildSel); if (buildSel && buildSel.kind === "furn") return placeFurnOut(buildSel.id); return bp.call(this, tx, ty); }; }
{ const wr = worldRemove; worldRemove = function () {
  const P = player, tx = Math.floor((P.x + P.dx * 26) / T), ty = Math.floor((P.y + 8 + P.dy * 26) / T), id = CODE_FURN(wc(tx, ty));
  if (!id) return wr.call(this);
  const k = ty * WN + tx; S.fin[id] = (S.fin[id] || 0) + 1; setCell(tx, ty, S.wfloor[k] ? CELL.FLOOR : 0, false); delete S.wfloor[k];
  sfx("pick"); say(`${FURN[id].e} ${FURN[id].n}을(를) 집었어요.`, 1400); hud(); save(); }; }
const PV = { g: null, ms: [] };
{ const wcur = worldCursor; worldCursor = function () {
  const sel = buildSel && !modal ? buildSel : null;
  if (!sel || sel.kind !== "preset") { if (PV.g) PV.g.visible = false; return wcur.call(this); }
  G.cursor.visible = false;
  if (!PV.g) { PV.g = new THREE.Group(); PV.mat = [new THREE.MeshBasicMaterial({ color: 0x8cff8c, transparent: true, opacity: .45, depthWrite: false }), new THREE.MeshBasicMaterial({ color: 0xff6a6a, transparent: true, opacity: .55, depthWrite: false })]; PV.geo = new THREE.PlaneGeometry(.92, .92); S3.add(PV.g); }
  const cs = presetCells(sel); PV.g.visible = true;
  while (PV.ms.length < cs.length) { const m = new THREE.Mesh(PV.geo, PV.mat[0]); m.rotation.x = -HALF; PV.g.add(m); PV.ms.push(m); }
  PV.ms.forEach((m, i) => { const q = cs[i]; m.visible = !!q; if (!q) return; m.position.set(q.x + .5, q.c === CELL.FLOOR ? .05 : .08, q.y + .5); m.material = PV.mat[cellFree(q.x, q.y) ? 0 : 1]; m.scale.setScalar(q.c === CELL.FLOOR ? .9 : 1); });
  PV.g.children.forEach(m => m.material.opacity = (m.material === PV.mat[0] ? .4 : .5) + .15 * Math.sin(vtime * 5));
}; }
/* 건설 창: 완성형 건물 · 블록 조각 · 가구 놓기 */
function bodyBuild2() {
  const row = (e, n, d, cost, attr, sel, ok) => `<div class="crow"><span class="ci">${e}</span><span class="cn"><b>${n}</b>${d ? `<small>${d}</small>` : ""}<small>${cost}</small></span><button ${attr} ${ok ? "" : "disabled"}>${sel ? "선택됨" : "고르기"}</button></div>`;
  const pre = PRESETS.map((p, i) => row(p.e, p.n, p.d, costHtml(p.cost), `data-preset="${i}"`, buildSel === p, canAfford(p.cost))).join("");
  const blk = BUILD.map((b, i) => row(b.e, b.n, "", costHtml(b.cost), `data-build="${i}"`, buildSel === b, canAfford(b.cost))).join("");
  const fin = FURN_KEYS.filter(k => S.fin[k] > 0 && !FURN[k].wall).map(k => row(FURN[k].e, FURN[k].n, `가지고 있는 수 ${S.fin[k]}`, "", `data-furnout="${k}"`, buildSel && buildSel.id === k, true)).join("") || `<div class="empty"><small>가지고 있는 가구가 없어요. 제작(C) → 작업대에서 가구를 만들어 보세요.</small></div>`;
  return `<h2>🏗️ 건설</h2><div><small>넓은 세상(마을 밖)에서 고른 뒤 행동 버튼으로 놓아요. 철거하면 재료 절반이 돌아와요.</small></div>
    <h3>🏠 완성형 건물 <small class="hintsm">바라보는 쪽으로 미리보기 · 🔄 돌리기</small></h3>${pre}<h3>🧱 블록 조각</h3>${blk}<h3>🛋️ 가구 놓기</h3>${fin}`;
}
bodyBuild = bodyBuild2;
$("gear").addEventListener("click", e => {
  const t = e.target.closest("[data-preset],[data-furnout]"); if (!t) return;
  if (!(scene === "dun" && dun.kind === "world")) return say("🏗️ 건설은 넓은 세상(마을 밖)에서 할 수 있어요.", 1800);
  if (t.dataset.preset !== undefined) { buildSel = PRESETS[+t.dataset.preset]; bRot = 0; closeShop(); say(`${buildSel.e} ${buildSel.n} — 원하는 곳을 바라보고 행동 버튼(스페이스)으로 짓기 · 🔄(R) 돌리기`, 3500); }
  else { const k = t.dataset.furnout; buildSel = { kind: "furn", id: k, n: FURN[k].n, e: FURN[k].e, cost: {} }; closeShop(); say(`${FURN[k].e} ${FURN[k].n} — 바닥을 바라보고 행동 버튼으로 놓기 · X 집기`, 3000); }
}, true);
addEventListener("keydown", e => { if (e.code === "KeyR" && buildSel && buildSel.kind === "preset" && !e.repeat) { e.stopImmediatePropagation(); bRot = (bRot + 1) % 4; sfx("ui"); } }, true);
