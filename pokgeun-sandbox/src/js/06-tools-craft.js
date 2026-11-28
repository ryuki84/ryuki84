/* ===== GDD P1 (2026-11-28): 도구 · 작업대 · 생활 제작 · 숙련도 =====
   채집 → 도구 제작 → 작업대 설치 → 판자·가구 제작 → 집 꾸미기 흐름(GDD 19.2 MVP 2~6단계).
   도구는 따로 고르지 않아도 맞는 자원을 캘 때 자동으로 써요. 내구도는 가볍게(작업대에서 한 번에 고치기). */
MAT.plank = ["🟫", "판자"];
const TOOLDEF = {
  axe: { n: "도끼", e: "🪓", tiers: [null, { n: "돌도끼", dur: 120 }, { n: "철도끼", dur: 260 }] },
  pick: { n: "곡괭이", e: "⛏️", tiers: [null, { n: "돌곡괭이", dur: 120 }, { n: "철곡괭이", dur: 260 }] },
};
const CELL_TOOL = { 1: "axe", 5: "axe", 2: "pick", 4: "pick" };   // 덤불(3)은 맨손
const toolOf = k => { const o = S.tools[k]; return o && o.t > 0 && o.d > 0 ? o.t : 0; };
function toolUse(k) {
  const o = k && S.tools[k]; if (!o || o.t <= 0 || o.d <= 0) return;
  o.d--; const n = TOOLDEF[k].tiers[o.t].n;
  if (o.d === 0) say(`🔧 ${n}이(가) 망가졌어요. 작업대에서 고칠 수 있어요.`, 3200); else if (o.d === 15) say(`🔧 ${n}이(가) 많이 닳았어요.`, 2000);
}
// 몇 번 두드려야 하는지: 맨손 4 · 돌 도구 2 · 철 도구 1 (철광석은 곡괭이가 있어야 해요)
function gatherHp(c) { if (c === 3) return 2; const t = toolOf(CELL_TOOL[c]); if (c === 4) return t ? (t >= 2 ? 2 : 3) : 0; return [4, 2, 1][t]; }
/* 숙련도: 실제로 한 활동만큼 올라요(GDD 4.2). 레벨마다 10% 확률로 한 개 더 */
const PROF = { chop: ["🪓", "벌목"], mine: ["⛏️", "채굴"], gather: ["🌿", "채집"], craft: ["🔨", "제작"], build: ["🏗️", "건설"] };
const profLv = k => Math.min(10, Math.floor(Math.sqrt((S.prof[k] || 0) / 4)));
function profAdd(k, n = 1) { const a = profLv(k); S.prof[k] = (S.prof[k] || 0) + n; const b = profLv(k); if (b > a) { sfx("lvl"); say(`${PROF[k][0]} ${PROF[k][1]} 숙련도 ${b}! 더 잘하게 됐어요.`, 2600); } }
const profBonus = k => Math.random() < profLv(k) * .1 ? 1 : 0;
// 자원 칸을 다 캤을 때 얻는 것(월드·야생 공통). b = 바이옴
function gatherYield(c, b) {
  const t = toolOf(CELL_TOOL[c]);
  if (c === 1) { matAdd("wood", 2 + ri(2) + t + profBonus("chop")); if (b === 5 && Math.random() < .2) matAdd("hide", 1); profAdd("chop"); }
  else if (c === 2) { matAdd("stone", 2 + ri(2) + t + profBonus("mine")); if (Math.random() < .15) matAdd("bone", 1); profAdd("mine"); }
  else if (c === 3) { matAdd("fiber", 1 + ri(2) + profBonus("gather")); if (Math.random() < .6) matAdd("berry", 1 + ri(2)); profAdd("gather"); }
  else if (c === 4) { matAdd("ore", 1 + ri(2) + (t >= 2 ? 1 : 0) + profBonus("mine")); matAdd("stone", 1); profAdd("mine", 2); }
  else { matAdd("fiber", 2 + profBonus("gather")); if (Math.random() < .5) matAdd("berry", 1); profAdd("gather"); }
}
/* 생활 제작법. bench: 작업대 근처에서만 */
const CRAFT2 = [
  { id: "stone_axe", g: "tool", e: "🪓", n: "돌도끼", cost: { wood: 3, stone: 2, fiber: 1 }, tool: ["axe", 1], d: "나무를 두 번 만에 베고 목재를 더 얻어요" },
  { id: "stone_pick", g: "tool", e: "⛏️", n: "돌곡괭이", cost: { wood: 3, stone: 3, fiber: 1 }, tool: ["pick", 1], d: "바위를 빨리 캐고 철광석도 캘 수 있어요" },
  { id: "iron_axe", g: "tool", bench: 1, e: "🪓", n: "철도끼", cost: { plank: 2, ore: 4 }, tool: ["axe", 2], d: "한 번에 쓰러뜨리고 목재를 많이" },
  { id: "iron_pick", g: "tool", bench: 1, e: "⛏️", n: "철곡괭이", cost: { plank: 2, ore: 5 }, tool: ["pick", 2], d: "광석을 빨리, 더 많이" },
  { id: "repair", g: "tool", bench: 1, e: "🔧", n: "도구 고치기", cost: { wood: 1, stone: 1 }, repair: true, d: "닳은 도구를 모두 새것처럼" },
  { id: "plank", g: "mat", bench: 1, e: "🟫", n: "판자 ×2", cost: { wood: 2 }, give: { plank: 2 }, d: "나무 벽·바닥과 가구의 재료" },
  { id: "plank10", g: "mat", bench: 1, e: "🟫", n: "판자 ×10", cost: { wood: 10 }, give: { plank: 10 }, d: "한 번에 많이" },
  { id: "f_chair", g: "furn", bench: 1, e: "🪑", n: "의자", cost: { plank: 3 }, furn: "chair" },
  { id: "f_bed", g: "furn", bench: 1, e: "🛏️", n: "침대", cost: { plank: 6, fiber: 4, hide: 2 }, furn: "bed" },
  { id: "f_shelf", g: "furn", bench: 1, e: "📚", n: "책장", cost: { plank: 6 }, furn: "shelf" },
  { id: "f_lamp", g: "furn", bench: 1, e: "💡", n: "램프", cost: { plank: 1, ore: 1, fiber: 1 }, furn: "lamp" },
  { id: "f_plant", g: "furn", bench: 1, e: "🪴", n: "화분", cost: { stone: 2, fiber: 3 }, furn: "plant" },
  { id: "f_frame", g: "furn", bench: 1, e: "🖼️", n: "액자", cost: { plank: 2, fiber: 1 }, furn: "frame" },
  { id: "f_rugR", g: "furn", bench: 1, e: "🟥", n: "빨간 러그", cost: { fiber: 6, berry: 2 }, furn: "rugR" },
  { id: "f_rugB", g: "furn", bench: 1, e: "🟦", n: "파란 러그", cost: { fiber: 6, berry: 2 }, furn: "rugB" },
];
// 작업대 근처(4칸 안, 월드)
function nearBench(r = 4) {
  if (!(scene === "dun" && dun && dun.kind === "world")) return false;
  const px = Math.floor(player.x / T), py = Math.floor((player.y + 8) / T);
  for (let y = py - r; y <= py + r; y++) for (let x = px - r; x <= px + r; x++) if (wc(x, y) === CELL.BENCH) return true;
  return false;
}
const hasCost = c => Object.entries(c).every(([k, v]) => (S.mat[k] || 0) >= v);
function craftState(r) {
  if (r.bench && !nearBench()) return "bench";
  if (r.fire && !nearFire()) return "fire";
  if (r.fish && !FISHES.some(k => (S.inv[k] || 0) > 0)) return "cost";
  if (r.tool) { const o = S.tools[r.tool[0]]; if (o.t > r.tool[1] || (o.t === r.tool[1] && o.d > 0)) return "have"; }
  if (r.repair && !Object.entries(S.tools).some(([k, o]) => o.t > 0 && o.d < TOOLDEF[k].tiers[o.t].dur)) return "full";
  return hasCost(r.cost) ? "ok" : "cost";
}
function craft2(id) {
  const r = CRAFT2.find(r => r.id === id); if (!r) return; const st = craftState(r);
  if (st === "bench") return say("🧰 작업대 가까이에서 만들 수 있어요. 건설(B)에서 작업대를 지어 보세요.", 2600);
  if (st === "fire") return say("🔥 모닥불 옆에서 요리할 수 있어요. 건설(B)에서 모닥불(목재 3·돌 2)을 지어 보세요.", 2600);
  if (st !== "ok") return;
  if (r.fish) { const k = FISHES.find(k => (S.inv[k] || 0) > 0); S.inv[k]--; }
  for (const k in r.cost) S.mat[k] -= r.cost[k];
  if (r.tool) { const [k, t] = r.tool; S.tools[k] = { t, d: TOOLDEF[k].tiers[t].dur }; say(`${r.e} ${r.n}을(를) 만들었어요! 맞는 자원을 캘 때 자동으로 써요.`, 2600); }
  else if (r.repair) { for (const k in S.tools) { const o = S.tools[k]; if (o.t > 0) o.d = TOOLDEF[k].tiers[o.t].dur; } say("🔧 도구를 모두 고쳤어요.", 1800); }
  else if (r.give) { for (const k in r.give) S.mat[k] = (S.mat[k] || 0) + r.give[k]; say(`${r.e} ${r.n} 완성!`, 1500); }
  else if (r.furn) { S.fin[r.furn] = (S.fin[r.furn] || 0) + 1; say(`${r.e} ${r.n}을(를) 만들었어요! 내 집에서 놓을 수 있어요.`, 2600); }
  sfx("gear"); profAdd("craft"); hud(); save(); renderGear();
}
function bodyCraft2() {
  const chips = Object.entries(MAT).map(([k, [e, n]]) => `<span class="mchip${S.mat[k] ? "" : " zero"}">${e} ${n} <b>${S.mat[k] || 0}</b></span>`).join("");
  const tl = Object.entries(TOOLDEF).map(([k, d]) => { const o = S.tools[k], tr = d.tiers[o.t]; return `<div class="tcard${o.t && !o.d ? " broken" : ""}"><b>${d.e}</b><span>${tr ? tr.n : d.n + " 없음"}</span>${tr ? `<i style="--w:${(o.d / tr.dur * 100).toFixed(0)}%"></i><small>${o.d ? `${o.d}/${tr.dur}` : "망가짐 · 작업대에서 고치기"}</small>` : `<small>맨손으로 느리게</small>`}</div>`; }).join("");
  const pf = Object.entries(PROF).map(([k, [e, n]]) => `<span class="mchip">${e} ${n} <b>Lv.${profLv(k)}</b></span>`).join("");
  const bench = nearBench(), row = r => {
    const st = craftState(r), cost = Object.entries(r.cost).map(([k, v]) => `<span style="color:${(S.mat[k] || 0) >= v ? "inherit" : "#c0392b"}">${MAT[k][0]}${v}</span>`).join(" ") + (r.fish ? `<span style="color:${FISHES.some(k => (S.inv[k] || 0) > 0) ? "inherit" : "#c0392b"}">🐟1</span>` : "");
    const lab = { ok: r.g === "food" ? "요리하기" : "만들기", cost: "재료 부족", bench: "작업대 필요", fire: "모닥불 필요", have: "가지고 있음", full: "고칠 것 없음" }[st];
    return `<div class="crow"><span class="ci">${r.e}</span><span class="cn"><b>${r.n}</b>${r.d ? `<small>${r.d}</small>` : ""}<small>${cost}</small></span><button data-craft2="${r.id}" ${st === "ok" || st === "bench" || st === "fire" ? "" : "disabled"} class="${st === "bench" || st === "fire" ? "need" : ""}">${lab}</button></div>`;
  };
  const sec = (g, t) => `<h3>${t}</h3>` + CRAFT2.filter(r => r.g === g).map(row).join("");
  const old = RECIPES.map((r, i) => { const ok = hasCost(r.cost), cost = Object.entries(r.cost).map(([k, v]) => `<span style="color:${(S.mat[k] || 0) >= v ? "inherit" : "#c0392b"}">${MAT[k][0]}${v}</span>`).join(" ");
    return `<div class="crow"><span class="ci">${r.e}</span><span class="cn"><b>${r.n}</b><small>${cost}</small></span><button data-craft="${i}" ${ok ? "" : "disabled"}>만들기</button></div>`; }).join("");
  return `<h2>🔨 제작</h2><div class="mchips">${chips}</div><h3>🧰 내 도구</h3><div class="tcards">${tl}</div>
    <div class="benchst ${bench ? "on" : ""}">${bench ? "🧰 작업대 옆이에요 — 모든 제작법을 쓸 수 있어요" : "🧰 작업대 없음 — 건설(B)에서 작업대(목재 6·돌 2)를 지으면 판자·가구를 만들 수 있어요"}</div>
    ${sec("tool", "🪓 도구")}${sec("mat", "🟫 재료")}${sec("furn", "🛋️ 가구 (내 집에 놓기)")}${sec("food", nearFire() ? "🍳 요리 — 🔥 모닥불 옆이에요" : "🍳 요리 (모닥불 옆에서)")}
    <h3>📈 숙련도</h3><div class="mchips">${pf}</div>
    <details class="oldc"><summary>⚔️ 모험 장비</summary>${old}</details>`;
}
bodyCraft = bodyCraft2;
