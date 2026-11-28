/* ---------- 서바이벌 아레나 (XP 히어로식: 웨이브 · 자동 공격 · 경험치 구슬 · 3택1 강화) ---------- */
const ARENA = { x: 21, y: 1, w: 3, h: 3 };
const PERKS = {
  atk: { e: "⚔️", n: "공격력 강화", d: "공격력 +20%" }, spd: { e: "⚡", n: "공격 속도", d: "공격 속도 +15%" }, hp: { e: "❤️", n: "체력 강화", d: "최대 체력 +25% (즉시 회복)" },
  move: { e: "🏃", n: "이동 속도", d: "이동 속도 +10%" }, multi: { e: "🎯", n: "다중 타격/사격", d: "근접: 범위 +12 · 원거리: 발사체 +1" }, orbit: { e: "🌀", n: "회전 칼날", d: "나를 도는 칼날 +1 (닿으면 피해)" },
  bolt: { e: "🌩️", n: "번개", d: "주기적으로 적에게 번개 (간격↓ 피해↑)" }, magnet: { e: "🧲", n: "경험치 자석", d: "구슬 흡수 범위 +50%" }, crit: { e: "💥", n: "치명타", d: "치명타 확률 +10%" }, vamp: { e: "🩸", n: "흡혈", d: "피해의 4% 회복" },
};
const STYLES = { sword: { e: "⚔️", n: "검", d: "근접 광역 · 자동 베기", cost: 0 }, bow: { e: "🏹", n: "활", d: "관통 화살 · 중거리", cost: 800 }, gun: { e: "🔫", n: "총", d: "빠른 연사 · 장거리", cost: 1500 } };
const DAILY = [
  { n: "몬스터 50마리 처치", need: 50, get: d => d.kills, bells: 150 }, { n: "아레나 웨이브 8 도달", need: 8, get: d => d.wave, bells: 250 }, { n: "아레나 3회 도전", need: 3, get: d => d.runs, bells: 200 },
];
const upCost = lv => Math.round(100 * Math.pow(lv + 1, 1.6));
function pstats() {
  const b = pstatsBase(), u = S.arena.up, pk = dun && dun.arena && dun.run ? dun.run.perk : null;
  b.dmg = Math.round(b.dmg * (1 + .04 * u.atk)); b.maxhp = Math.round(b.maxhp * (1 + .04 * u.hp));
  if (pk) { b.dmg = Math.round(b.dmg * (1 + .2 * (pk.atk || 0))); b.as *= 1 + .15 * (pk.spd || 0); b.maxhp = Math.round(b.maxhp * (1 + .25 * (pk.hp || 0))); b.ms *= 1 + .1 * (pk.move || 0); b.crit = Math.min(80, r1(b.crit + 10 * (pk.crit || 0))); b.ls = r1(b.ls + 4 * (pk.vamp || 0)); }
  return b;
}
function dailyTouch() { const today = new Date().toLocaleDateString("sv"); if (!S.daily || S.daily.d !== today) S.daily = { d: today, kills: 0, wave: 0, runs: 0, claimed: [0, 0, 0] }; return S.daily; }
const idleRate = () => 3 + 1.5 * S.arena.best + S.lv;
const idleStored = () => Math.floor(Math.min(480, Math.max(0, Date.now() - S.idleT) / 60000) * idleRate());
function idleToast() { const st = idleStored(); if (st >= 100) say(`💤 방치 보상 ${st}벨이 쌓였어요! (Y: 아레나 창에서 받기)`, 4500); }

function genArena(w0) {
  const w = 40, h = 28, map = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? "#" : "."));
  for (let i = 0; i < 8; i++) { const x = 4 + ri(w - 9), y = 4 + ri(h - 9); if (Math.hypot(x - w / 2, y - h / 2) < 6 || y > h - 6) continue; map[y][x] = map[y][x + 1] = map[y + 1][x] = map[y + 1][x + 1] = "#"; }
  const d = newDun({ arena: true, depth: 1, map, exit: { x: w / 2 | 0, y: h - 3 }, stairs: null });
  d.run = { lv: 1, xp: 0, need: 8, perk: {}, kills: 0, gold: 0, pending: 0, choices: [] }; d.wave = { n: w0, toSpawn: 0, t: 1, clearT: 0, boss: false }; d.cleared = w0 - 1; return d;
}
function arenaInfo() {
  const w = dun.wave, r = dun.run, pk = Object.entries(r.perk).map(([k, v]) => PERKS[k].e + v).join(" ");
  return `⚔️ 웨이브 ${w.n}${w.boss ? " 👑" : ""} · 남은 ${dun.mons.length + w.toSpawn} · 런 Lv.${r.lv} (${r.xp}/${r.need})${pk ? "<br>" + pk : ""}`;
}
function startWave(n) {
  const w = dun.wave; w.n = n; w.boss = n % 10 === 0; w.clearT = 0; w.t = 1.2; w.toSpawn = w.boss ? 8 + (n >> 1) : 6 + 2 * n + (n / 3 | 0);
  sfx(w.boss ? "die" : "ui"); say(w.boss ? `👑 웨이브 ${n} — 보스가 나타났다!` : `⚔️ 웨이브 ${n} 시작`, 2200);
  if (w.boss) {
    const P = player, a = Math.random() * 6.283, x = clamp(P.x + Math.cos(a) * 280, 80, 38 * T), y = clamp(P.y + Math.sin(a) * 200, 80, 26 * T), depth = 1 + Math.floor(n * .45);
    const b = n % 30 === 0 ? mkDemon(x, y) : mkMon(depth + 1, x, y, true); b.hunt = 9999; b.arenaBoss = true; dun.mons.push(b);
  }
}
function spawnArena() {
  const P = player, n = dun.wave.n, depth = 1 + Math.floor(n * .45), map = dun.map;
  for (let k = 0; k < 30; k++) {
    const x = 1 + ri(map[0].length - 2), y = 1 + ri(map.length - 2); if (map[y][x] !== ".") continue; const px = (x + .5) * T, py = (y + .5) * T - 8; if (Math.hypot(px - P.x, py - P.y) < 9 * T) continue;
    const m = mkMonT(ri(Math.min(MONS.length, 2 + (n >> 2))), depth, px, py); m.hunt = 9999; m.hostile = true; m.tier = Math.min(4, n >> 3); dun.mons.push(m); return;
  }
}
function autoFight() {
  const P = player, sty = S.arena.style, range = sty === "sword" ? 100 : sty === "bow" ? 320 : 380; if (P.atkCd > 0 || P.dash > 0) return;
  let tgt = null, bd = range; for (const m of dun.mons) { const d = Math.hypot(m.x - P.x, m.y - P.y); if (d < bd) { bd = d; tgt = m; } }
  if (!tgt) return; const a = Math.atan2(tgt.y - P.y, tgt.x - P.x); P.dx = Math.cos(a); P.dy = Math.sin(a);
  if (sty === "sword") { attack(true); return; }
  const st = pstats(), n = 1 + (dun.run.perk.multi || 0), gun = sty === "gun"; P.atkCd = (gun ? .2 : .46) / st.as; sfx("swing");
  for (let i = 0; i < n; i++) { const aa = a + (i - (n - 1) / 2) * .16, sp = gun ? 520 : 420; dun.proj.push({ x: P.x, y: P.y, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, m: gun ? .5 : 1.25, life: gun ? .8 : .9, pierce: !gun, hit: new Set(), col: gun ? 0xffe08a : 0xe8d890, sz: gun ? .5 : .7 }); }
}
function arenaTick(dt) {
  const d = dun, w = d.wave, P = player, run = d.run, pk = run.perk;
  for (const m of d.mons) if (m.obT > 0) m.obT -= dt;
  if (w.toSpawn > 0) { w.t -= dt; if (w.t <= 0 && d.mons.length < 36) { w.t = Math.max(.22, 1 - .025 * w.n); spawnArena(); w.toSpawn--; } }
  else if (d.mons.length === 0) {
    w.clearT += dt;
    if (w.clearT > 1.5) { const n = w.n, gold = 8 + 2 * n; S.bells += gold; run.gold += gold; d.cleared = n; const dl = dailyTouch(); dl.wave = Math.max(dl.wave, n); fx(P.x, P.y - 40, `웨이브 ${n} 클리어! +${gold}🔔`, "#ffe27a"); sfx("coin"); heal(Math.round(pstats().maxhp * .15)); hud(); startWave(n + 1); }
  }
  autoFight();
  const ob = pk.orbit || 0; d.orbA = (d.orbA || 0) + dt * 3.4;
  for (let i = 0; i < ob; i++) { const a = d.orbA + i * 6.283 / ob, bx = P.x + Math.cos(a) * 64, by = P.y + Math.sin(a) * 64; for (const m of [...d.mons]) if (!(m.obT > 0) && Math.hypot(m.x - bx, m.y - by) < 28) { m.obT = .5; hitMon(m, .8 + .15 * ob); } }
  if (pk.bolt) { run.boltT = (run.boltT ?? 2) - dt; if (run.boltT <= 0) { run.boltT = Math.max(1, 3.4 - .5 * pk.bolt); const c = d.mons.filter(m => Math.hypot(m.x - P.x, m.y - P.y) < 380); if (c.length) { const m = c[ri(c.length)]; (d.bolts ||= []).push({ x: m.x, y: m.y, t: .3 }); sfx("fire"); hitMon(m, 2.2 + .3 * pk.bolt); } } }
  if (d.bolts) { for (const b of d.bolts) b.t -= dt; d.bolts = d.bolts.filter(b => b.t > 0); }
}
function gemGain(n) {
  const r = dun.run; r.xp += n;
  while (r.xp >= r.need) { r.xp -= r.need; r.lv++; r.need = Math.round(r.need * 1.28 + 3); r.pending++; sfx("lvl"); burst(player.x, player.y, 18, ["#5affc8", "#fff"], 100, .7, -30, 1); }
  if (r.pending > 0 && !modal) openPerk();
}
function openPerk() {
  const r = dun.run, ids = Object.keys(PERKS).filter(k => (r.perk[k] || 0) < 5).sort(() => Math.random() - .5); r.choices = ids.slice(0, 3);
  if (!r.choices.length) { r.pending = 0; return; } modal = true; gearTab = "perk"; renderGear(); $("gear").hidden = false; keys.clear();
}
function choosePerk(id) {
  const r = dun.run; if (!r.choices.includes(id)) return; r.perk[id] = (r.perk[id] || 0) + 1; r.pending--; sfx("gear");
  if (id === "hp") heal(Math.round(pstats().maxhp * .3));
  if (r.pending > 0) { openPerk(); renderGear(); } else { modal = false; $("gear").hidden = true; }
}
function arenaKill(m) {
  const r = dun.run, n = Math.max(1, Math.round((m.xp / 6 + 1) * (1 + .05 * S.arena.up.xp))); r.kills++; dun.loot.push({ t: "gem", n, x: m.x, y: m.y, age: 0 });
  if (m.arenaBoss) {
    for (let i = 0; i < 3; i++) dun.loot.push({ t: "gem", n: n * 2, x: m.x + (i - 1) * 30, y: m.y + 20, age: 0 });
    for (let i = 0; i < 2; i++) dun.loot.push({ t: "gear", it: genGear(Math.max(2, 3 + dun.wave.n + Math.round(S.lv * .3)), 2), x: m.x + (i ? 40 : -40), y: m.y + 50 });
    dun.loot.push({ t: "bell", n: 100 + dun.wave.n * 10, x: m.x, y: m.y + 60 });
  } else if (Math.random() < .03) dun.loot.push({ t: "pot", x: m.x, y: m.y });
}
let ARES = null;
function finishArena(dead) {
  const d = dun, A = S.arena, run = d.run, cleared = Math.max(0, d.wave.n - 1), gold = cleared * 15 + run.kills * 2, dl = dailyTouch();
  S.bells += gold; dl.runs++; dl.wave = Math.max(dl.wave, cleared); A.runs++; A.kills += run.kills; const rec = cleared > A.best; if (rec) A.best = cleared;
  A.rank.push({ name: NET.name || "나", wave: cleared, kills: run.kills, ts: Date.now() }); A.rank.sort((a, b) => b.wave - a.wave || b.kills - a.kills); A.rank = A.rank.slice(0, 8);
  if (NET.on && cleared > 0) NET.send({ t: "score", wave: cleared, kills: run.kills });
  ARES = { cleared, kills: run.kills, gold, rec, lv: run.lv, perks: { ...run.perk }, dead, best: A.best };
  setTimeout(() => { gearTab = "arenaend"; modal = true; renderGear(); $("gear").hidden = false; }, 350);
}
function startArena() {
  if (scene === "home") return say("집에서는 시작할 수 없어요.", 1800);
  if (scene === "dun" && !(dun && dun.kind === "world")) return say("지금은 시작할 수 없어요.", 1800);
  const ret = scene === "dun" ? { x: player.x, y: player.y } : null; closeShop(); enterDungeon(S.arena.start || 1, false, "arena", ret);
}

/* ----- 패널 ----- */
function bodyArena() {
  const A = S.arena, dl = dailyTouch(), st = idleStored(), starts = []; for (let w = 1; w <= A.best + 1; w += 10) starts.push(w);
  const row = (l, r) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:2px 0"><span>${l}</span>${r}</div>`, btn = (a, ok, t) => `<button style="margin:0;padding:2px 12px" ${a} ${ok ? "" : "disabled"}>${t}</button>`;
  if (NET.on && NET.rank === null) NET.send({ t: "rank?" });
  let h = `<h2>⚔️ 서바이벌 아레나</h2><div><small>자동 공격으로 몰려오는 웨이브를 버티고, 경험치 구슬로 레벨업해 강화를 고르세요. 10웨이브마다 보스!<br>최고 기록 <b>웨이브 ${A.best}</b> · 누적 처치 ${A.kills} · 도전 ${A.runs}회</small></div>`;
  h += `<h3>도전</h3><div>시작 웨이브: ${starts.map(w => `<button style="margin:0 4px 4px 0;padding:1px 10px;${(A.start || 1) === w ? "background:#fff" : ""}" data-apick="${w}">${w}</button>`).join("")}</div><button style="margin:6px 0 0" data-astart>⚔️ 도전하기 (웨이브 ${A.start || 1}~)</button>`;
  h += `<h3>무기 스타일</h3>` + Object.entries(STYLES).map(([k, s]) => { const own = A.own.includes(k); return row(`${s.e} ${s.n} <small>${s.d}</small>`, btn(`data-astyle="${k}"`, own || S.bells >= s.cost, A.style === k ? "사용 중" : own ? "선택" : `구매 ${s.cost}`)); }).join("");
  h += `<h3>영구 강화</h3>` + [["atk", "⚔️ 공격력", "+4%"], ["hp", "❤️ 체력", "+4%"], ["xp", "💎 구슬 효율", "+5%"]].map(([k, n, e]) => row(`${n} <b>Lv.${A.up[k]}</b>/20 <small>레벨당 ${e}</small>`, btn(`data-aup="${k}"`, A.up[k] < 20 && S.bells >= upCost(A.up[k]), A.up[k] >= 20 ? "최대" : `강화 ${upCost(A.up[k])}`))).join("");
  h += `<h3>💤 방치 보상</h3>` + row(`쌓인 보상 <b>${st}</b>벨 <small>(분당 ${idleRate().toFixed(1)}, 최대 8시간)</small>`, btn("data-aidle", st > 0, "받기"));
  h += `<h3>📅 일일 임무</h3>` + DAILY.map((m, i) => { const v = Math.min(m.need, m.get(dl)); return row(`${v >= m.need ? "✅" : "⬜"} ${m.n} <small>(${v}/${m.need}) 🔔${m.bells}</small>`, btn(`data-adaily="${i}"`, !dl.claimed[i] && v >= m.need, dl.claimed[i] ? "완료" : "받기")); }).join("");
  h += `<h3>🏆 랭킹</h3><div><small>내 기록</small>` + (A.rank.slice(0, 5).map((r, i) => `<div>${i + 1}. ${r.name} — 웨이브 ${r.wave} · 처치 ${r.kills}</div>`).join("") || "<div>아직 기록이 없어요.</div>") + `</div>`;
  if (NET.on) h += `<div style="margin-top:4px"><small>🌐 서버 랭킹</small>` + ((NET.rank || []).slice(0, 8).map((r, i) => `<div>${i + 1}. ${r.name} — 웨이브 ${r.wave} · 처치 ${r.kills}</div>`).join("") || "<div>아직 기록이 없어요.</div>") + `</div>`;
  return h;
}
function bodyPerk() {
  const r = dun.run; return `<h2>⬆️ 레벨 업! Lv.${r.lv}</h2><div><small>강화를 하나 고르세요 (남은 선택 ${r.pending})</small></div>` + r.choices.map(id => { const p = PERKS[id], lv = r.perk[id] || 0; return `<div class="g" data-perk="${id}"><span style="font-weight:700">${p.e} ${p.n} <small style="display:inline;opacity:.7">Lv.${lv} → ${lv + 1}</small><small>${p.d}</small></span></div>`; }).join("");
}
function bodyArenaEnd() {
  const R = ARES; if (!R) return "<div>기록이 없어요.</div>";
  return `<h2>${R.dead ? "💀 쓰러졌어요" : "🚪 아레나를 나왔어요"}</h2><div style="margin:6px 0">${R.rec ? "🎉 <b>신기록!</b><br>" : ""}도달 웨이브 <b>${R.cleared}</b> (최고 ${R.best})<br>처치 ${R.kills}마리 · 런 레벨 ${R.lv}<br>획득 <b>${R.gold}</b>벨</div>
    <div>${Object.entries(R.perks).map(([k, v]) => `${PERKS[k].e}${PERKS[k].n} Lv.${v}`).join(" · ") || "선택한 강화가 없어요."}</div><button data-aend>확인</button>`;
}

/* ----- 모델 ----- */
function mkArena() {
  const g = new THREE.Group(), st = 0xd8c8a0, st2 = 0xb8a880;
  for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; B(g, .85, 1.7 + (i % 2) * .3, .5, i % 2 ? st : st2, Math.cos(a) * 1.35, .85, Math.sin(a) * 1.35, { r: [0, HALF - a, 0] }); }
  C(g, 1.25, 1.25, .1, 0xc8a870, 0, .05, 0, 16); B(g, 1.3, .5, .08, 0x7d5433, 0, 2.5, 1.5);
  for (const s of [-1, 1]) { B(g, .08, .8, .03, 0xd8dce8, s * .18, 2.5, 1.55, { r: [0, 0, s * .7] }); C(g, .04, .04, 1.6, 0x7d5433, s * 1.0, 2.5, 1.5, 5); B(g, .6, .4, .04, 0xc8383a, s * 1.0 + .32, 3.1, 1.5); }
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
}
function mkBlade() { const g = new THREE.Group(), m = B(g, .5, .05, .13, 0xe8f0ff, 0, 0, 0, { cs: false }); m.material = HDR(0xbfefff); return { g }; }
