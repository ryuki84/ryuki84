/* ---------- RPG: 던전 · 야생 지대 ---------- */
function matRow() { const s = Object.entries(MAT).filter(([k]) => S.mat[k] > 0).map(([k, [e]]) => `${e}${S.mat[k]}`).join(" "); return s ? `<div>${s}</div>` : ""; }
function renderRpg() {
  const el = $("rpg");
  if (scene !== "dun" || !dun) { el.hidden = true; return; }
  const st = pstats(), P = player, cd = v => v > 0 ? v.toFixed(1) + "s" : "준비", world = dun.kind === "world", wild = dun.kind === "wild" || world;
  el.hidden = false;
  el.innerHTML = `<div class="bar"><i class="hp" style="width:${clamp(P.hp / st.maxhp * 100, 0, 100)}%"></i><span>❤️ ${Math.max(0, Math.ceil(P.hp))}/${st.maxhp}</span></div>
    <div class="bar"><i class="xp" style="width:${S.xp / xpNeed(S.lv) * 100}%"></i><span>Lv.${S.lv} · ${S.xp}/${xpNeed(S.lv)}</span></div>
    <div class="bar"><i class="fd" style="width:${S.surv.food}%"></i><span>🍙 배부름 ${Math.round(S.surv.food)} · ⚡ ${Math.round(P.sta)} <small>(T 먹기)</small></span></div>
    <div class="sk"><b>스페이스</b> 공격${wild ? "·채집" : ""} · <b>Q</b> 회전 ${cd(P.qCd)}<br><b>E</b> 구르기 ${cd(P.eCd)} · <b>R</b> 화염구 ${skLv("fire") ? cd(P.rCd) : "미습득"}<br><b>F</b> 🧪×${S.potions}${wild ? " · <b>V</b> 먹이주기 · <b>G</b> 탈것" : ""}<br><b>I</b> 장비 · <b>K</b> 캐릭터 · <b>C</b> 제작${world ? " · <b>B</b> 건설 · <b>N</b> 지도 · <b>J</b> 의뢰" : ""}</div>
    <div>${dun.arena ? arenaInfo() : world ? worldInfo() : wild ? "🌴 야생 지대" : dun.demon ? `😈 마왕성 ${dun.depth - DEMON_BASE + 1}층` : `🕳️ 지하 ${dun.depth}층`} · 몬스터 ${dun.mons.length}마리${S.pts + S.sp > 0 ? " · ✨포인트!" : ""}</div>${questLine() ? `<div>${questLine()}</div>` : ""}${dun.demon ? bossBar() : ""}`;
}
function newDun(o) { return { depth: 1, mons: [], loot: [], fx: [], arcs: [], proj: [], tele: [], eproj: [], nhp: {}, regrow: [], spawnT: 0, stairs: null, pet: null, ...o }; }
function genDun(depth) {
  const map = Array.from({ length: DH }, () => Array(DW).fill("#")), rooms = [];
  for (let i = 0; i < 90 && rooms.length < 9; i++) {
    const w = 6 + ri(6), h = 5 + ri(5), x = 1 + ri(DW - w - 2), y = 1 + ri(DH - h - 2);
    if (rooms.some(r => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y)) continue;
    rooms.push({ x, y, w, h });
  }
  if (rooms.length < 4) return genDun(depth);
  for (const r of rooms) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) map[y][x] = ".";
  const carve = (x, y) => { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const xx = x + i, yy = y + j; if (xx > 0 && yy > 0 && xx < DW - 1 && yy < DH - 1) map[yy][xx] = "."; } };
  const c = r => [r.x + (r.w >> 1), r.y + (r.h >> 1)];
  for (let i = 1; i < rooms.length; i++) {
    let [x1, y1] = c(rooms[i - 1]); const [x2, y2] = c(rooms[i]);
    while (x1 !== x2) { carve(x1, y1); x1 += Math.sign(x2 - x1); }
    while (y1 !== y2) { carve(x1, y1); y1 += Math.sign(y2 - y1); }
    carve(x1, y1);
  }
  const [ex, ey] = c(rooms[0]), [sx, sy] = c(rooms[rooms.length - 1]);
  const d = newDun({ depth, map, exit: { x: ex, y: ey }, stairs: { x: sx, y: sy } });
  for (let i = 1; i < rooms.length; i++) {
    const r = rooms[i], n = 2 + ri(3) + (depth / 3 | 0);
    for (let k = 0; k < n; k++) {
      const x = r.x + ri(r.w), y = r.y + ri(r.h);
      if (Math.abs(x - sx) + Math.abs(y - sy) < 3) continue;
      d.mons.push(mkMon(depth, (x + .5) * T, (y + .5) * T, false));
    }
  }
  if (depth % 5 === 0) d.mons.push(mkMon(depth, (sx - 1.5) * T, (sy + .5) * T, true));
  return d;
}
function mkMon(depth, x, y, boss) {
  const base = boss ? { e: "🐲", n: "대왕 용", hp: 130, dmg: 18, spd: 70, xp: 26 } : MONS[Math.min(MONS.length - 1, ri(Math.min(MONS.length, 2 + (depth >> 1))))];
  const sc = 1 + .3 * (depth - 1), hp = Math.round(base.hp * sc * (boss ? 7 : 1));
  return eliteify({ ...base, x, y, hp, mhp: hp, dmg: Math.round(base.dmg * sc * (boss ? 1.5 : 1)), xp: Math.round(base.xp * sc * (boss ? 8 : 1)), cd: 0, flash: 0, kb: 0, kx: 0, ky: 0, boss, dpt: depth });
}
function mkDino(idx, tier, x, y, boss) {
  const b = DINOS[idx], sc = 1 + .25 * tier, hp = Math.round(b.hp * sc * (boss ? 6 : 1));
  return { ...b, n: boss ? "티라노 왕" : b.n, tame: boss ? 0 : b.tame, idx, tier, boss, wild: true, hostile: !!b.aggro || boss, tp: 0, hp, mhp: hp, dmg: Math.round(b.dmg * sc * (boss ? 1.5 : 1)), xp: Math.round(b.xp * sc * (boss ? 8 : 1)), x, y, cd: 0, flash: 0, kb: 0, kx: 0, ky: 0, wt: 0, wvx: 0, wvy: 0 };
}
function spawnWild(d, avoid) {
  const h = d.map.length, w = d.map[0].length;
  for (let k = 0; k < 40; k++) {
    const x = 2 + ri(w - 4), y = 2 + ri(h - 4);
    if (d.map[y][x] !== ".") continue;
    const px = (x + .5) * T, py = (y + .5) * T;
    if (Math.hypot(x - d.exit.x, y - d.exit.y) < 10 || (avoid && Math.hypot(px - avoid.x, py - avoid.y) < 300)) continue;
    const tier = Math.min(4, (Math.hypot(x - d.exit.x, y - d.exit.y) / 14) | 0), idx = clamp(tier - 1 + ri(2), 0, DINOS.length - 1);
    d.mons.push(mkDino(idx, tier, px, py, false)); return;
  }
}
function genWild() {
  const w = 64, h = 44, ex = 3, ey = h - 4;
  const map = Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (x === 0 || y === 0 || x === w - 1 || y === h - 1) ? "#" : "."));
  for (let n = 0; n < 4; n++) {
    const cx = 10 + ri(w - 20), cy = 6 + ri(h - 16), rx = 3 + ri(4), ry = 2 + ri(3);
    if (Math.hypot(cx - ex, cy - ey) < rx + 8) continue;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) map[y][x] = "w";
  }
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) map[5 + dy][w - 6 + dx] = ".";
  const put = (c, n) => { for (let i = 0, k = 0; i < n && k < 600; k++) { const x = 1 + ri(w - 2), y = 1 + ri(h - 2); if (map[y][x] === "." && Math.hypot(x - ex, y - ey) > 5 && Math.hypot(x - (w - 6), y - 5) > 3) { map[y][x] = c; i++; } } };
  put("T", 90); put("R", 30); put("B", 34);
  const d = newDun({ kind: "wild", map, exit: { x: ex, y: ey } });
  for (let i = 0; i < 30; i++) spawnWild(d, null);
  d.mons.push(mkDino(4, 5, (w - 6 + .5) * T, 5.5 * T, true));
  return d;
}
function enterDungeon(depth, keepHp, kind, ret) {
  cancelFish(); scene = "dun"; dun = kind === "arena" ? genArena(depth) : kind === "wild" ? genWild() : genDun(depth); dun.ret = ret || null; camInit = false; sfx("portal"); if (kind === "demon") { dun.demon = true; if (depth >= DEMON_TOP) finalizeDemon(); }
  const P = player; P.x = (dun.exit.x + 1.5) * T; P.y = (dun.exit.y + .5) * T; P.dx = 1; P.dy = 0; P.mounted = false;
  P.atkCd = P.qCd = P.eCd = P.fCd = P.rCd = P.dash = P.inv = 0;
  if (!keepHp) P.hp = pstats().maxhp;
  dun.pet = activePet() ? { x: P.x - 20, y: P.y, cd: 0 } : null;
  if (kind !== "wild" && kind !== "arena") S.best = Math.max(S.best, depth); if (kind === "arena") startWave(depth);
  hud();
  say(kind === "arena" ? "⚔️ 서바이벌 아레나 — 이동만 하면 자동으로 공격해요! 구슬을 모아 강해지세요" : kind === "demon" ? (depth >= DEMON_TOP ? "😈 마왕성 최상층 — 대마왕이 기다리고 있다!" : `😈 마왕성 ${depth - DEMON_BASE + 1}층`) : kind === "wild" ? "🌴 야생 지대 — 나무·돌을 모으고 공룡을 길들여 보세요!" : depth % 5 === 0 ? `🐲 지하 ${depth}층 — 보스가 있어요!` : `🕳️ 지하 ${depth}층`, 3000);
}
function leaveDungeon(dead, village) {
  const P = player, wild = dun.kind === "wild", world = dun.kind === "world", ret = dun.ret, arena = !!dun.arena;
  if (arena) { finishArena(dead); dead = false; }
  if ((world && !village) || ret) {   // 오픈월드로 복귀 (사망 시 리스폰 지점으로)
    sfx(dead ? "die" : "portal"); P.hp = pstats().maxhp; let pos = ret || undefined;
    if (dead) { S.bells = Math.floor(S.bells * .9); pos = S.wspawn || undefined; }
    enterWorld(pos, dead ? "💀 쓰러졌어요… 벨의 10%를 잃고 리스폰 지점으로 돌아왔어요." : "🌍 오픈월드로 돌아왔어요."); save(); return;
  }
  scene = "out"; dun = null; P.mounted = false;
  if (wild || world) { P.x = 1 * T; P.y = 10.5 * T; } else if (arena) { P.x = (ARENA.x + 1.5) * T; P.y = (ARENA.y + ARENA.h + 1.6) * T; } else { P.x = (CAVE.x + 1) * T; P.y = 4.5 * T; }
  P.dx = 0; P.dy = 1; P.hp = pstats().maxhp;
  sfx(dead ? "die" : "portal");
  if (dead) { S.bells = Math.floor(S.bells * .9); say("💀 쓰러졌어요… 벨의 10%를 잃었어요."); } else say("마을로 돌아왔어요 🏡");
  hud(); save();
}
function fx(x, y, txt, col) { if (!dun) return; dun.fx.push({ x, y, txt, col, t: .9 }); }
function heal(n) { const m = pstats().maxhp; player.hp = Math.min(m, player.hp + n); }
function gainXp(n) {
  S.xp += n;
  while (S.xp >= xpNeed(S.lv)) {
    S.xp -= xpNeed(S.lv); S.lv++; S.pts += 5; S.sp += 1; player.hp = pstats().maxhp;
    sfx("lvl"); pAnim("Cheer", 1.4); burst(player.x, player.y - 10, 30, ["#ffd34d", "#fff3d6", "#f5b942"], 130, .9, 60);
    fx(player.x, player.y - 30, "LEVEL UP!", "#ffd34d"); say(`⚔️ 레벨 ${S.lv}! 능력치 +5, 스킬 +1 포인트 (K 캐릭터창)`, 3000);
  }
  storyCheck(); hud();
}
function petXp(n) {
  const pe = activePet(); if (!pe) return;
  pe.xp += n * .6;
  while (pe.xp >= pe.lv * 40 && pe.lv < 20) { pe.xp -= pe.lv * 40; pe.lv++; say(`🐾 ${DINOS[pe.idx].e} 동료가 Lv.${pe.lv}이 되었어요!`, 2000); }
}
function matAdd(k, n) { S.mat[k] = (S.mat[k] || 0) + n; fx(player.x, player.y - 26 - (dun.fx.length % 4) * 14, `${MAT[k][0]}+${n}`, "#ffffff"); qEvent("mat", k, n); hud(); }
function hitMon(m, mult) {
  const st = pstats(), crit = Math.random() * 100 < st.crit, d = Math.max(1, Math.round(st.dmg * mult * (.85 + Math.random() * .3) * (crit ? 2 : 1)));
  m.hp -= d; m.flash = .12; m.kb = .12; if (m.wild) m.hostile = true; hitStop = Math.max(hitStop, crit ? .1 : .055);
  burst(m.x, m.y, crit ? 9 : 4, crit ? ["#fff", "#ffd34d"] : ["#fff", "#e8e4d8"], 90, .3); sfx(crit ? "crit" : "hit"); if (crit) shake = Math.max(shake, 3);
  const a = Math.atan2(m.y - player.y, m.x - player.x); m.kx = Math.cos(a) * (m.boss ? 80 : 220); m.ky = Math.sin(a) * (m.boss ? 80 : 220);
  fx(m.x, m.y - 18, (crit ? "💥" : "") + d, crit ? "#ffd34d" : "#ffffff");
  if (st.ls > 0) heal(Math.max(1, Math.round(d * st.ls / 100)));
  if (m.hp <= 0) killMon(m);
}
function petHit(m, pe) {
  const d = Math.max(1, Math.round(DINOS[pe.idx].dmg * (.8 + .25 * pe.lv) * (1 + .1 * skLv("tamer"))));
  m.hp -= d; m.flash = .1; m.hostile = true; burst(m.x, m.y, 3, ["#9be39b"], 70, .25); fx(m.x, m.y - 18, String(d), "#9be39b");
  if (m.hp <= 0) killMon(m);
}
function killMon(m) {
  const i = dun.mons.indexOf(m); if (i < 0) return;
  dun.mons.splice(i, 1); { const e = ENT.get(m); if (e && e.mon) (dun.dead ||= []).push({ m, t: 1.6 }); } gainXp(dun.arena ? Math.ceil(m.xp * .3) : m.xp); dailyTouch().kills++; if (dun.pet) petXp(m.xp); qEvent("kill", m); if (m.poi && !dun.mons.some(o => o.poi === m.poi)) clearPoi(m.poi); if (m.demon && !dun.arena) onDemonDefeat(m);
  burst(m.x, m.y, m.boss ? 40 : 14, ["#fff", "#e8505a", "#5c5f6e"], m.boss ? 160 : 110, .6); sfx("kill"); if (m.boss) shake = Math.max(shake, 8);
  if (dun.arena) { arenaKill(m); return; }
  const wild = !!m.wild, sp = () => ({ x: m.x + (Math.random() - .5) * 30, y: m.y + (Math.random() - .5) * 30 });
  dun.loot.push({ t: "bell", n: wild ? Math.round((2 + ri(4)) * (1 + m.tier * .4) * (m.boss ? 6 : 1)) : Math.round((3 + ri(6)) * (1 + (m.dpt || dun.depth) * .3) * (m.boss ? 6 : 1)), ...sp() });
  const ilvl = Math.max(1, Math.round((wild ? 2 + m.tier * 2 : (m.dpt || dun.depth) * 1.5) + S.lv * .5));
  if (m.boss) for (let k = 0; k < 2; k++) dun.loot.push({ t: "gear", it: genGear(ilvl, 3), ...sp() });
  else if (m.elite) dun.loot.push({ t: "gear", it: genGear(ilvl + 2, 2), ...sp() });
  else if (Math.random() < (wild ? .12 : .2)) dun.loot.push({ t: "gear", it: genGear(ilvl), ...sp() });
  if (Math.random() < .07) dun.loot.push({ t: "pot", ...sp() });
  if (Math.random() < .05) dun.loot.push({ t: "furn", id: Object.keys(FURN)[ri(Object.keys(FURN).length)], ...sp() });
  if (wild) {
    matAdd("meat", 1 + ri(2) + (m.big ? 2 : 0) + (m.boss ? 4 : 0));
    if (Math.random() < .55 || m.boss) matAdd("hide", 1 + (m.big ? 1 : 0) + (m.boss ? 3 : 0));
    if (Math.random() < .3 + .1 * m.tier || m.boss) matAdd("bone", 1 + (m.boss ? 3 : 0));
  }
}
function gatherNode() {
  const P = player;
  for (const o of [26, 38]) {
    const tx = Math.floor((P.x + P.dx * o) / T), ty = Math.floor((P.y + 8 + P.dy * o) / T), c = dun.map[ty]?.[tx];
    if (c !== "T" && c !== "R" && c !== "B") continue;
    const cc = { T: 1, R: 2, B: 3 }[c], key = ty * 1000 + tx, hp = (dun.nhp[key] ?? gatherHp(cc)) - 1; toolUse(CELL_TOOL[cc]);
    dun.wob = { x: tx, y: ty, t: .25 }; sfx("chop");
    burst((tx + .5) * T, (ty + .4) * T, 6, c === "R" ? ["#b8bcc8", "#8a8e9e"] : c === "T" ? ["#a87645", "#7d5433", "#3d8444"] : ["#6dbb4f", "#3d8444"], 80, .4);
    if (hp > 0) { dun.nhp[key] = hp; return; }
    delete dun.nhp[key]; dun.map[ty][tx] = "."; dun.regrow.push({ x: tx, y: ty, c, t: 75 });
    gatherYield(cc, 3);
    return;
  }
}
const HIT_AT = .14;   // 공격 버튼 뒤 실제 타격까지(초). 칼이 앞으로 지나가는 순간
let hitStop = 0;      // 타격 순간 아주 잠깐 멈칫(히트스톱)
function swingHit(h) {
  const P = player; let n = 0;
  for (const m of [...dun.mons]) { const dx = m.x - P.x, dy = m.y - P.y, d = Math.hypot(dx, dy); if (d < 58 + (dun.arena ? 12 * (dun.run.perk.multi || 0) : 0) + (m.boss ? 12 : 0) && (dx * h.dx + dy * h.dy) / (d || 1) > .1) { hitMon(m, 1); n++; } }
  if (n) shake = Math.max(shake, 1.5);
}
function attack(held) {
  if (scene !== "dun" || modal) return; const P = player, st = pstats();
  if (dun.kind === "world") { if (!held && worldAct()) return; if (buildSel) return; }
  if (P.atkCd > 0) return; P.atkCd = .42 / st.as; sfx("swing"); P.swingD = -(P.swingD || 1); pAnim(S.eq.weapon && S.eq.weapon.e === "🔨" ? "2H_Melee_Attack_Chop" : S.eq.weapon && S.eq.weapon.e === "🪓" ? "1H_Melee_Attack_Chop" : (P.swingN = (P.swingN || 0) + 1) % 2 ? "1H_Melee_Attack_Slice_Diagonal" : "1H_Melee_Attack_Slice_Horizontal", Math.max(.3, P.atkCd + .05)); dun.arcs.push({ a: Math.atan2(P.dy, P.dx), t: .26, t0: .26, r: 58, whirl: false, dir: P.swingD || 1, yaw: Math.atan2(P.dx, P.dy) });
  P.pendHit = { t: Math.min(HIT_AT, P.atkCd * .45), dx: P.dx, dy: P.dy };   // 휘두르는 동작이 닿는 순간에 판정해요
  if (dun.kind === "wild") gatherNode(); else if (dun.kind === "world") worldGather();
}
function whirl() {
  const P = player; if (scene !== "dun" || P.qCd > 0 || modal) return; const L = skLv("whirl"), r = 84 + 4 * (L - 1);
  P.qCd = Math.max(2, 5 - .3 * (L - 1)); P.qMax = P.qCd; sfx("whirl"); pAnim("2H_Melee_Attack_Spin", .55); shake = Math.max(shake, 2); dun.arcs.push({ a: 0, t: .25, r, whirl: true });
  for (const m of [...dun.mons]) if (Math.hypot(m.x - P.x, m.y - P.y) < r + (m.boss ? 12 : 0)) hitMon(m, 1.8 + .25 * (L - 1));
}
function fireball() {
  const P = player; if (scene !== "dun" || modal) return; const L = skLv("fire");
  if (L < 1) return say("🔥 화염구는 K 캐릭터창에서 스킬 포인트로 배워요 (Lv.3 이상).", 2500);
  if (P.rCd > 0) return; P.rCd = 3; sfx("fire"); pAnim("Spellcast_Shoot", .6); const l = Math.hypot(P.dx, P.dy) || 1;
  dun.proj.push({ x: P.x, y: P.y, vx: P.dx / l * 380, vy: P.dy / l * 380, m: 2 + .35 * (L - 1), life: 1.1, pierce: L >= 5, hit: new Set() });
}
function dash() { const P = player; if (scene !== "dun" || P.eCd > 0 || modal) return; P.eCd = 2.5; P.dash = .16; P.inv = .3; sfx("dash"); pAnim("Dodge_Forward", .5); burst(P.x, P.y + 12, 8, ["#d8dce8", "#b8bcc8"], 50, .3, 0); }
function drinkPotion() {
  const P = player, m = pstats().maxhp; if (scene !== "dun") return;
  if (S.potions <= 0) return say("물약이 없어요. 상점에서 사거나 제작할 수 있어요.", 1500);
  if (P.fCd > 0 || P.hp >= m) return;
  sfx("potion"); pAnim("Use_Item", .7); burst(P.x, P.y, 10, ["#7bd88f", "#fff"], 60, .5, -60); S.potions--; P.fCd = 1; heal(Math.round(m * .45)); fx(P.x, P.y - 24, "+HP", "#7bd88f"); hud();
}
function feed() {
  const P = player; if (scene !== "dun" || modal || !(dun.kind === "wild" || dun.kind === "world")) return;
  const m = dun.mons.filter(m => m.tame && Math.hypot(m.x - P.x, m.y - P.y) < 80).sort((a, b) => Math.hypot(a.x - P.x, a.y - P.y) - Math.hypot(b.x - P.x, b.y - P.y))[0];
  if (!m) return say("가까이에 길들일 수 있는 공룡이 없어요. (V: 먹이주기)", 1800);
  if (m.hostile && m.hp > m.mhp * .5) return say(`${m.e} 너무 난폭해요! 체력을 절반 이하로 줄인 뒤 먹이를 주세요.`, 2500);
  const bait = S.mat.berry > 0 ? "berry" : S.mat.meat > 0 ? "meat" : null;
  if (!bait) return say("먹이(🫐 열매 / 🥩 고기)가 없어요. 덤불과 사냥으로 구할 수 있어요.", 2200);
  sfx("pick"); burst(m.x, m.y - 16, 5, ["#f28cb0", "#fff"], 40, .5, -40); S.mat[bait]--; m.tp += 1 + (Math.random() < .12 * skLv("tamer") ? 1 : 0); m.hostile = false; m.wt = 2; m.wvx = m.wvy = 0;
  fx(m.x, m.y - 24, `${MAT[bait][0]} ${Math.min(m.tp, m.tame)}/${m.tame}`, "#ffd34d"); hud();
  if (m.tp >= m.tame) {
    if (S.pets.length >= 4) { m.tp = m.tame - 1; return say("동료가 가득 찼어요 (최대 4). K 캐릭터창에서 확인하세요."); }
    sfx("tame"); burst(m.x, m.y - 10, 24, ["#f28cb0", "#fff3d6", "#ffd34d"], 110, .9, -30);
    dun.mons.splice(dun.mons.indexOf(m), 1); S.pets.push({ idx: m.idx, lv: 1, xp: 0 });
    if (S.petA < 0) { S.petA = S.pets.length - 1; dun.pet = { x: m.x, y: m.y, cd: 0 }; }
    say(`🎉 ${m.e} ${obj(m.n)} 길들였어요! (K: 동료 관리 · G: 탈것)`, 3500); hud();
  }
}
function toggleMount() {
  const P = player, pe = activePet(); if (scene !== "dun" || modal) return;
  if (!pe || !dun.pet) return say("동행 중인 동료가 없어요. (K 캐릭터창)", 1800);
  if (!DINOS[pe.idx].ride) return say("이 동료는 탈 수 없어요.", 1800);
  P.mounted = !P.mounted; if (P.mounted) { dun.pet.x = P.x; dun.pet.y = P.y; }
  say(P.mounted ? `${DINOS[pe.idx].e} 탑승! 이동속도 ↑ (동료는 공격을 쉬어요)` : "내렸어요.", 1800);
}
const MON_WIND = .4;   // 몬스터 공격 예비 동작 시간(초)
// 정예 패턴. true를 돌려주면 이번 프레임의 일반 이동·공격을 건너뛰어요
function eliteAI(m, dt, d, dx, dy, st) {
  const P = player, ai = ELITE[m.elite].ai; m.sk = (m.sk || 0) - dt;
  if (m.dashT > 0) {   // 돌진 중
    m.dashT -= dt; tryMove(m, m.dvx * dt, m.dvy * dt); if (Math.random() < .5) burst(m.x, m.y + 6, 1, ["#cfe8a0", "#8fbf5a"], 30, .3);
    if (!m.dashHit && d < 30) { m.dashHit = true; damageP(Math.round(m.dmg * 1.3)); }
    return true;
  }
  if (m.cw > 0) {      // 특수 패턴 예비 동작(❗)
    if ((m.cw -= dt) > 0) return true; m.cw = 0;
    if (ai === "charge") { const L = Math.max(1, d); m.dvx = dx / L * 330; m.dvy = dy / L * 330; m.dashT = .45; m.dashHit = false; sfx("dash"); }
    else if (ai === "slam") { dun.tele.push({ x: m.x, y: m.y + 8, r: 85, t: .05, t0: .05, dmg: Math.round(m.dmg * 1.6) }); shake = Math.max(shake, 6); }
    return true;
  }
  if (m.sk > 0 || d > 260) return false;
  if (ai === "charge" && d > 60 && d < 200) { m.cw = .6; m.sk = 4; return true; }
  if (ai === "slam" && d < 60) { m.cw = .8; m.sk = 4.5; m.cd = 1.5; dun.tele.push({ x: m.x, y: m.y + 8, r: 85, t: .8, t0: .8, dmg: 0, warn: true }); return true; }
  if (ai === "shoot" && d > 70) { const L = Math.max(1, d); dun.eproj.push({ x: m.x, y: m.y, vx: dx / L * 190, vy: dy / L * 190, life: 2.5, dmg: Math.round(m.dmg * .9), col: 0xf5d040 }); m.sk = 2.6; m.cw = .25; return false; }
  if (ai === "spore") { dun.tele.push({ x: P.x, y: P.y + 8, r: 65, t: 1.3, t0: 1.3, dmg: Math.round(m.dmg * 1.2) }); m.sk = 4.2; m.cw = .35; return true; }
  if (ai === "blink" && d > 70) { const a = Math.atan2(P.y - m.y, P.x - m.x); burst(m.x, m.y, 12, ["#b8a8ff", "#fff"], 90, .4); const nx = P.x + Math.cos(a) * 40, ny = P.y + Math.sin(a) * 40; if (!blocked(nx, ny + 8, 8, 6)) { m.x = nx; m.y = ny; } burst(m.x, m.y, 12, ["#b8a8ff", "#fff"], 90, .4); m.sk = 5; m.cd = 0; return false; }
  return false;
}
function tryMove(e, vx, vy) { if (!blocked(e.x + vx, e.y + 8, 8, 6)) e.x += vx; if (!blocked(e.x, e.y + 8 + vy, 8, 6)) e.y += vy; }
function updateDun(dt) {
  if (hitStop > 0) { hitStop -= dt; dt *= .12; }   // 히트스톱: 그 순간 전투 시간을 거의 멈춰요
  if (player.pendHit && (player.pendHit.t -= dt) <= 0) { const h = player.pendHit; player.pendHit = null; if (scene === "dun") swingHit(h); }
  const P = player, st = pstats(), wild = dun.kind === "wild", world = dun.kind === "world";
  for (const k of ["atkCd", "qCd", "eCd", "fCd", "rCd", "dash", "inv", "flash"]) P[k] = Math.max(0, P[k] - dt);
  if (!world) { const MW = dun.map[0].length, MH = dun.map.length, R = wild ? 10 : 7, px = P.x / T | 0, py = P.y / T | 0;
    dun.seen ??= new Uint8Array(MW * MH);
    for (let y = Math.max(0, py - R); y <= Math.min(MH - 1, py + R); y++) for (let x = Math.max(0, px - R); x <= Math.min(MW - 1, px + R); x++) if ((x - px) ** 2 + (y - py) ** 2 <= R * R) dun.seen[y * MW + x] = 1; }
  if (keys.has("Space") || keys.has("KeyZ")) attack(true);
  for (const m of dun.mons) {
    m.flash = Math.max(0, m.flash - dt); m.cd = Math.max(0, m.cd - dt); if (m.demon) demonAI(m, dt);
    const dx = P.x - m.x, dy = P.y - m.y, d = Math.hypot(dx, dy);
    if (m.kb > 0) { m.kb -= dt; m.wind = 0; m.cw = 0; tryMove(m, m.kx * dt, m.ky * dt); continue; }
    if (m.elite && eliteAI(m, dt, d, dx, dy, st)) continue;
    if (m.wild && !m.hostile) {
      m.wt -= dt;
      if (m.wt <= 0) { m.wt = 1 + Math.random() * 2.5; const a = Math.random() < .4 ? null : Math.random() * 6.28; m.wvx = a === null ? 0 : Math.cos(a) * 28; m.wvy = a === null ? 0 : Math.sin(a) * 28; }
      tryMove(m, m.wvx * dt, m.wvy * dt); continue;
    }
    if (d < (m.hunt || 260) && d > 24) tryMove(m, dx / d * m.spd * dt, dy / d * m.spd * dt);
    // 공격 예비 동작(❗): 바로 때리지 않고 잠깐 뜸을 들여요. 그 사이 피하거나 밀쳐내면 공격이 취소돼요
    if (d < 32 && m.cd <= 0 && !(m.wind > 0)) { m.wind = MON_WIND; m.cd = 1 + MON_WIND; }
    if (m.wind > 0 && (m.wind -= dt) <= 0) {
      m.wind = 0;
      if (d < 40 && P.inv <= 0) { const n = Math.max(1, Math.round(m.dmg * (100 / (100 + st.armor)) * (.9 + Math.random() * .2))); P.hp -= n; P.inv = .35; P.flash = .15; shake = Math.max(shake, 4); burst(P.x, P.y, 6, ["#e8505a", "#a8323c"], 80, .35); sfx("hurt"); fx(P.x, P.y - 20, "-" + n, "#ff6b6b"); }
    }
  }
  if (P.hp <= 0) return leaveDungeon(true);
  const pet = dun.pet, pe = activePet();
  if (pet && pe) {
    if (P.mounted) { pet.x = P.x; pet.y = P.y; }
    else {
      pet.cd = Math.max(0, pet.cd - dt);
      if (Math.hypot(pet.x - P.x, pet.y - P.y) > 420) { pet.x = P.x; pet.y = P.y; }
      let tgt = null, bd = 220;
      for (const m of dun.mons) { const dd = Math.hypot(m.x - pet.x, m.y - pet.y); if (dd < bd && Math.hypot(m.x - P.x, m.y - P.y) < 300 && !(m.wild && !m.hostile)) { bd = dd; tgt = m; } }
      const goal = tgt || P, dd = Math.hypot(goal.x - pet.x, goal.y - pet.y);
      if (dd > (tgt ? 28 : 50)) tryMove(pet, (goal.x - pet.x) / dd * 140 * dt, (goal.y - pet.y) / dd * 140 * dt);
      if (tgt && dd <= 36 && pet.cd <= 0) { pet.cd = .9; petHit(tgt, pe); }
    }
  } else if (P.mounted) P.mounted = false;
  for (const q of dun.proj) {
    q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt;
    if (solidTile(Math.floor(q.x / T), Math.floor(q.y / T))) { q.life = 0; continue; }
    for (const m of [...dun.mons]) if (!q.hit.has(m) && Math.hypot(m.x - q.x, m.y - q.y) < 22 + (m.boss ? 12 : 0)) { q.hit.add(m); hitMon(m, q.m); if (!q.pierce) { q.life = 0; break; } }
  }
  dun.proj = dun.proj.filter(q => q.life > 0);
  for (const t of dun.tele) { t.t -= dt; if (t.t <= 0) { t.done = true; if (t.warn) continue; burst(t.x, t.y - 8, 24, ["#ff5a2a", "#ffb02a", "#fff"], 130, .6, 80, .6); sfx("kill"); shake = Math.max(shake, 5); if (t.dmg > 0 && Math.hypot(P.x - t.x, P.y + 8 - t.y) < t.r) damageP(t.dmg); } }
  dun.tele = dun.tele.filter(t => !t.done);
  for (const q of dun.eproj) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; if (solidTile(Math.floor(q.x / T), Math.floor(q.y / T))) q.life = 0; else if (Math.hypot(P.x - q.x, P.y - q.y) < 20) { q.life = 0; damageP(q.dmg); } }
  dun.eproj = dun.eproj.filter(q => q.life > 0);
  for (let i = dun.regrow.length - 1; i >= 0; i--) { const r = dun.regrow[i]; r.t -= dt; if (r.t <= 0 && Math.hypot(P.x - (r.x + .5) * T, P.y - (r.y + .5) * T) > 30 && !dun.mons.some(m => Math.hypot(m.x - (r.x + .5) * T, m.y - (r.y + .5) * T) < 30)) { dun.map[r.y][r.x] = r.c; dun.regrow.splice(i, 1); } }
  if (world) worldTick(dt);
  if (dun.arena) arenaTick(dt);
  if (wild && (dun.spawnT += dt) > 20) { dun.spawnT = 0; if (dun.mons.length < 32) spawnWild(dun, P); }
  for (let i = dun.loot.length - 1; i >= 0; i--) {
    const l = dun.loot[i], d = Math.hypot(P.x - l.x, P.y - l.y);
    if (l.t === "gem") { l.age = (l.age || 0) + dt; if (l.age > 1 || d < 140 * (1 + .5 * ((dun.run && dun.run.perk.magnet) || 0))) { l.x += (P.x - l.x) / (d || 1) * 340 * dt; l.y += (P.y - l.y) / (d || 1) * 340 * dt; } }
    if (l.t === "bell" && d < 110) { l.x += (P.x - l.x) / d * 200 * dt; l.y += (P.y - l.y) / d * 200 * dt; }
    if (d > 26) continue;
    if (l.t === "bell") { sfx("coin"); S.bells += l.n; fx(P.x, P.y - 24, `+${l.n}🔔`, "#ffe27a"); }
    else if (l.t === "gem") { sfx("pick"); gemGain(l.n); }
    else if (l.t === "pot") { sfx("pick"); S.potions++; fx(P.x, P.y - 24, "🧪 +1", "#7bd88f"); }
    else if (l.t === "furn") { S.fin[l.id] = (S.fin[l.id] || 0) + 1; say(`${FURN[l.id].e} ${obj(FURN[l.id].n)} 주웠어요! 집에 놓아 보세요.`); }
    else if (l.t === "gear") {
      if (S.bag.length >= BAGCAP) { if (!l.warn) { l.warn = 1; say("가방이 가득 찼어요! (I: 장비창)"); } continue; }
      sfx("gear"); burst(l.x, l.y, 10, [RARITY[l.it.rar].c, "#fff"], 90, .5); S.bag.push(l.it); fx(P.x, P.y - 24, l.it.n, RARITY[l.it.rar].c); if (l.it.rar >= 2) say(`✨ ${RARITY[l.it.rar].n} 장비: ${l.it.e} ${l.it.n}!`, 2500);
    }
    dun.loot.splice(i, 1); hud();
  }
  for (const f of dun.fx) { f.t -= dt; f.y -= 22 * dt; } dun.fx = dun.fx.filter(f => f.t > 0);
  for (const a of dun.arcs) a.t -= dt; dun.arcs = dun.arcs.filter(a => a.t > 0);
  const near = p => Math.hypot(P.x - (p.x + .5) * T, P.y - (p.y + .5) * T) < 26;
  if (dun.exit && near(dun.exit)) leaveDungeon(false);
  else if (dun.stairs && near(dun.stairs)) { save(); enterDungeon(dun.depth + 1, true, dun.demon ? "demon" : undefined, dun.ret); heal(Math.round(pstats().maxhp * .25)); }
}
function catchFish() {
  const r = R();
  const id = r < .04 ? "boot" : r < .05 ? "shark" : r < .15 ? "puffer" : r < .4 ? "tropical" : "crucian";
  if (add(id)) { sfx("gear"); burst(player.x, player.y - 20, 8, ["#a8dcf5", "#fff"], 60, .4); say(`${ITEMS[id].e} ${obj(ITEMS[id].n)} 낚았어요!`); }
}
function talk(v) {
  sfx("talk"); v.talk = 3; player.dx = Math.sign(v.x - player.x) || player.dx;
  const h = Math.floor(clock);
  let line;
  if (R() < .2) { const g = 20 + (R() * 4 | 0) * 10; S.bells += g; hud(); line = `선물이에요! 벨 ${g}개를 드릴게요. 🔔`; }
  else if ((h >= 22 || h < 5) && R() < .6) line = "하암… 너무 늦었어요. 졸려요.";
  else { line = v.lines[v.line++ % v.lines.length]; }
  say(`${v.e} ${v.name}: ${line}`, 3200);
}
