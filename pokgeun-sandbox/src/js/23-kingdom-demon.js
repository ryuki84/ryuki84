/* ---------- 왕국 · 메인 퀘스트 · 대마왕 ---------- */
const DEMON_BASE = 6, DEMON_TOP = 8;      // 마왕성 1~3층 = 던전 깊이 6~8
const RANKS = [{ f: 0, n: "평민 모험가" }, { f: 40, n: "견습 기사" }, { f: 120, n: "기사" }, { f: 300, n: "근위 기사" }, { f: 700, n: "왕국의 용사" }];
const GUARD_LINES = ["왕국의 평화는 저희가 지킵니다!", "용사님, 대마왕을 부탁드립니다.", "국왕 폐하께서 용사님을 기다리고 계십니다."];
const GUARD_LINES2 = ["성문 경비 중입니다. 몬스터는 마을 안으로 들어오지 못해요.", "북쪽 끝에 마왕성이 있다는 소문을 들으셨나요?", "밤에는 유령과 오크가 나오니 조심하세요."];
const STORY = [
  { t: "왕의 부름", intro: ["용사여, 잘 와 주었네. 나는 포근 왕국의 국왕 폰드일세.", "북쪽 끝 마왕성에서 대마왕 이블리스가 깨어났다네. 그가 군대를 일으키면 이 왕국은 겨울을 넘기지 못할 걸세.", "그대에게 왕명을 내리겠네. 먼저 왕국을 지킬 준비부터 하세나."],
    obj: [{ k: "talk", n: 1, label: "국왕과 대화하기" }], done: ["좋아, 그 눈빛이 마음에 드는군. 왕실의 검을 하사하겠네!"], reward: { bells: 150, gear: { slot: "weapon", rar: 2, pre: "왕실" }, fame: 10 } },
  { t: "성벽 보수", intro: ["마왕군의 선봉이 곧 닥칠 걸세. 성벽을 고칠 나무와 돌이 필요하네.", "숲과 고원에서 나무 15개와 돌 10개를 모아 오게. 스페이스로 때리면 얻을 수 있다네."], obj: [{ k: "mat:wood", n: 15, label: "나무 모으기" }, { k: "mat:stone", n: 10, label: "돌 모으기" }], done: ["훌륭하네! 성벽이 한결 튼튼해지겠어."], reward: { bells: 250, fame: 15 } },
  { t: "정찰병", intro: ["대륙 곳곳의 이동석을 밝혀 두면 왕국군이 빠르게 움직일 수 있네.", "이동석 3곳을 발견해 오게. 마을과 외딴 곳에 있다네. (왕도의 이동석은 세지 않아)"], obj: [{ k: "disc", n: 3, label: "새 이동석 발견" }], done: ["덕분에 병력 이동 경로가 확보됐네."], reward: { bells: 350, xp: 200, fame: 20 } },
  { t: "소굴 소탕", intro: ["마왕군에 합류한 몬스터 무리가 곳곳에 야영지를 차렸다네.", "야영지, 고대 유적, 용의 소굴 중 두 곳을 소탕해 주게. 수호 몬스터를 모두 쓰러뜨리면 된다네."], obj: [{ k: "clear", n: 2, label: "야영지·유적·소굴 소탕" }], done: ["자네의 칼솜씨가 소문대로군!"], reward: { bells: 500, gear: { rar: 2, boost: 1 }, fame: 25 } },
  { t: "용사의 시험", intro: ["대마왕을 상대하려면 더 단련해야 하네.", "몬스터 30마리를 쓰러뜨리고 레벨 6에 도달하게."], obj: [{ k: "kill", n: 30, label: "몬스터 처치" }, { k: "lv", n: 6, label: "레벨 6 달성" }], done: ["이제 어엿한 용사의 기운이 느껴지네."], reward: { bells: 600, potions: 5, fame: 30 } },
  { t: "용을 사냥하라", intro: ["대마왕의 오른팔인 용이 어딘가의 소굴에 웅크리고 있다네…", "지도에서 멀리 떨어진 '용의 소굴'을 찾아 소탕하게. 용의 보물이 자네를 도울 걸세."], obj: [{ k: "lair", n: 1, label: "용의 소굴 소탕" }], done: ["용을 쓰러뜨리다니! 이제 마왕성으로 갈 수 있겠어. 지도에 위치를 표시해 두었네."], reward: { bells: 1000, gear: { rar: 3 }, fame: 60, reveal: true } },
  { t: "대마왕을 물리쳐라", intro: ["마왕성은 북쪽 끝 얼어붙은 땅 위에 있네. 입구 앞 이동석을 발견하면 언제든 갈 수 있지.", "성 안은 3층일세. 마지막 층에서 대마왕 이블리스가 기다리고 있을 걸세… 부디 살아 돌아오게!"], obj: [{ k: "demon", n: 1, label: "대마왕 처치" }], done: ["해냈군… 해냈어! 자네가 왕국을 구했네. 오늘부터 자네는 '왕국의 용사'일세!"], reward: { bells: 5000, gear: { rar: 3, boost: 3, count: 2 }, fame: 500, title: true } },
];
function rankIdx(f) { let r = 0; RANKS.forEach((k, i) => { if (f >= k.f) r = i; }); return r; }
const rankName = () => S.title || RANKS[rankIdx(S.fame)].n;
function addFame(n) { const r0 = rankIdx(S.fame); S.fame += n; const r1 = rankIdx(S.fame); if (r1 > r0) { S.bells += 200 * r1; say(`🎖️ 승급! 이제 당신은 「${RANKS[r1].n}」 (+${200 * r1}벨)`, 4000); sfx("lvl"); } }
function sEvent(type, a, n = 1) {
  const st = STORY[S.story.stage]; if (!st) return; let ch = false;
  st.obj.forEach((o, i) => { if (o.k === "lv" || o.k === "talk") return; if (o.k === type || (type === "mat" && o.k === "mat:" + a)) { const v = S.story.p[i] || 0; if (v < o.n) { S.story.p[i] = Math.min(o.n, v + n); ch = true; } } });
  if (ch) storyCheck();
}
function storyReady() { if (!FEAT.story) return false; const st = STORY[S.story.stage]; return !!st && st.obj.every((o, i) => o.k === "lv" ? S.lv >= o.n : (S.story.p[i] || 0) >= o.n); }
function storyCheck() { const r = storyReady(); if (r && !S.story.notified) { S.story.notified = true; say("👑 왕명 완료! 왕도의 국왕에게 보고하세요.", 4500); sfx("gear"); } hud(); }
const kingNpc = () => scene === "dun" && dun && dun.kind === "world" ? dun.vil.find(v => v.model === "king") : null;
function nearKing() { const k = kingNpc(); return !!k && Math.hypot(k.x - player.x, k.y - player.y) < 8 * T; }
function openKing() {
  const st = STORY[S.story.stage]; if (st && st.obj[0].k === "talk" && !S.story.p[0]) { S.story.p[0] = 1; storyCheck(); }
  sfx("talk"); if ($("gear").hidden) togglePanel("king"); else { gearTab = "king"; renderGear(); }
}
function revealDemon() {
  S.story.known = true; const d = getWorld().demon; if (!d) return;
  for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) WORLD.disc.add(DKEY((d.x >> 2) + i, (d.y >> 2) + j));
  say("🗺️ 지도에 마왕성이 표시되었어요! (N)", 4000);
}
function reportStory() {
  const st = STORY[S.story.stage]; if (!st || !storyReady() || !nearKing()) return; const rw = st.reward;
  S.bells += rw.bells || 0; if (rw.xp) gainXp(rw.xp); if (rw.potions) S.potions += rw.potions; if (rw.fame) addFame(rw.fame);
  if (rw.gear) for (let i = 0; i < (rw.gear.count || 1); i++) { if (S.bag.length >= BAGCAP) { say("가방이 가득 차서 장비 보상 일부를 받지 못했어요."); break; } const o = {}; if (rw.gear.slot) o.slot = rw.gear.slot; if (rw.gear.rar != null) o.rar = rw.gear.rar; if (rw.gear.pre) o.pre = rw.gear.pre; S.bag.push(genGear(Math.max(3, Math.round(S.lv * 1.2 + 4)), rw.gear.boost || 0, o)); }
  if (rw.reveal) revealDemon(); if (rw.title) { S.title = "왕국의 용사"; say("🏅 칭호 「왕국의 용사」를 받았어요!", 5000); }
  S.story.stage++; S.story.p = {}; S.story.notified = false; sfx("lvl"); burst(player.x, player.y, 40, ["#ffd34d", "#fff3d6", "#e8505a"], 140, 1, 60, 1.2); hud(); save();
  if (storyReady()) storyCheck();
}
function bodyKing() {
  const stg = S.story.stage, st = STORY[stg], ready = storyReady(), near = nearKing(), fin = stg >= STORY.length, rk = rankIdx(S.fame), next = RANKS[rk + 1];
  let h = `<h2>👑 포근 왕국</h2><div>${S.title ? "🏅 " + S.title + " · " : ""}계급 <b>${RANKS[rk].n}</b> · 명성 ${S.fame}${next ? ` / 다음 ${next.f} (${next.n})` : ""}</div>`;
  h += `<div style="margin:8px 0;padding:8px 10px;border:2px solid var(--ink);border-radius:10px;background:#fff"><b>👑 국왕 폰드</b><br>`;
  if (fin) h += `"${S.story.demon > 1 ? "마왕이 또 나타났다고? 자네라면 걱정 없지!" : "왕국의 용사여, 그대 덕분에 우리 땅에 봄이 왔네. 언제든 왕궁을 찾아 주게."}"`;
  else h += (ready ? st.done : st.intro).map(l => `"${l}"`).join("<br>");
  h += `</div>`;
  if (!fin) {
    h += `<h3>📖 ${stg + 1}/${STORY.length} · ${st.t}</h3>` + st.obj.map((o, i) => { const have = o.k === "lv" ? Math.min(S.lv, o.n) : (S.story.p[i] || 0); return `<div>${have >= o.n ? "✅" : "⬜"} ${o.label} <small>(${have}/${o.n})</small></div>`; }).join("");
    h += `<div style="margin-top:6px"><button style="margin:0" data-sreport ${ready && near ? "" : "disabled"}>왕에게 보고하기</button> ${ready && !near ? "<small>왕도의 국왕 앞에서 보고할 수 있어요.</small>" : ""}</div>`;
  }
  h += `<h3>왕명 기록</h3>` + STORY.map((s, i) => `<div style="opacity:${i > stg ? .45 : 1}">${i < stg ? "✅" : i === stg ? "▶" : "🔒"} ${s.t}</div>`).join("");
  if (S.story.known) h += `<div style="margin-top:6px">😈 마왕성의 위치가 지도에 표시되어 있어요.</div>`;
  return h + `<div><button style="margin:8px 0 0" data-kwarp>왕도로 이동</button></div>`;
}
function bodyEnding() {
  return `<h2>🎉 대마왕을 물리쳤다!</h2><div>어둠이 걷히고, 마왕성 위로 오랜만에 해가 떠올랐어요… 왕국의 모든 사람이 당신의 이름을 외치고 있어요.</div>
    <div style="margin:8px 0">😈 처치한 대마왕: <b>${S.story.demon}회</b><br>⚔️ 레벨 ${S.lv} · 🎖️ ${rankName()}</div>
    <div>전리품(전설 장비)이 바닥에 떨어져 있어요. 챙긴 뒤 왕도의 국왕에게 승전을 보고하세요.</div><button data-end="stay">계속 모험하기</button><button data-end="home">오픈월드로 귀환</button>`;
}
function bossBar() { const m = dun.mons.find(m => m.demon); if (!m) return ""; const pc = Math.max(0, Math.round(m.hp / m.mhp * 100)); return `<div class="bar" style="margin-top:5px"><i style="width:${pc}%;background:#9a2ad0"></i><span>😈 ${m.n} ${pc}%</span></div>`; }

/* ----- 대마왕 ----- */
function mkDemon(x, y) {
  const k = S.story.demon || 0, sc = 1 + .6 * k, hp = Math.round(2200 * sc);
  return { e: "😈", n: k ? `대마왕 이블리스 (재림 ${k})` : "대마왕 이블리스", hp, mhp: hp, dmg: Math.round(28 * sc), spd: 74, xp: Math.round(2500 * sc), x, y, cd: 0, flash: 0, kb: 0, kx: 0, ky: 0, boss: true, demon: true, phase: 1, cast: 3, orb: 5, dpt: 9, tier: 4 };
}
function finalizeDemon() {
  if (!dun.stairs) return; const sx = dun.stairs.x, sy = dun.stairs.y; dun.mons = dun.mons.filter(m => !m.boss); dun.stairs = null;
  dun.mons.push(mkDemon((sx + .5) * T, (sy + .5) * T - 8));
}
function damageP(n) {
  const P = player; if (P.inv > 0) return; const d = Math.max(1, Math.round(n * (100 / (100 + pstats().armor))));
  P.hp -= d; P.inv = .35; P.flash = .15; pAnim("Hit_A", .4); shake = Math.max(shake, 5); burst(P.x, P.y, 8, ["#e8505a", "#a8323c"], 90, .4); sfx("hurt"); fx(P.x, P.y - 20, "-" + d, "#ff6b6b");
}
function demonAI(m, dt) {
  const P = player, r = m.hp / m.mhp, ph = r > .66 ? 1 : r > .33 ? 2 : 3;
  if (ph !== m.phase) {
    m.phase = ph; say(ph === 2 ? "😈 대마왕: 하찮은 인간이 감히… 어둠의 병사들이여, 일어나라!" : "😈 대마왕: 이 힘을… 전부 불태워 주마!!!", 4000); sfx("die"); shake = Math.max(shake, 10);
    for (let i = 0; i < 4; i++) { const a = i * 1.57 + .6, s = mkMonT([3, 4, 5][ri(3)], 7 + ph, m.x + Math.cos(a) * 90, m.y + Math.sin(a) * 90); s.hostile = true; dun.mons.push(s); }
    burst(m.x, m.y, 40, ["#c03aff", "#ff3a3a", "#fff"], 160, .8, 60, 1.5);
  }
  m.cast -= dt; if (m.cast <= 0) {
    m.cast = [0, 4.2, 3.2, 2.4][ph]; dun.tele.push({ x: P.x, y: P.y + 8, r: 100, t: 1.1, t0: 1.1, dmg: Math.round(m.dmg * 1.6) });
    if (ph >= 3) dun.tele.push({ x: P.x + (Math.random() - .5) * 240, y: P.y + 8 + (Math.random() - .5) * 240, r: 100, t: 1.4, t0: 1.4, dmg: Math.round(m.dmg * 1.6) });
  }
  m.orb -= dt; if (m.orb <= 0 && ph >= 2) {
    m.orb = ph === 2 ? 6 : 4.5; const n = ph === 2 ? 5 : 10, base = Math.atan2(P.y - m.y, P.x - m.x);
    for (let i = 0; i < n; i++) { const a = ph === 2 ? base + (i - 2) * .28 : i / n * 6.283; dun.eproj.push({ x: m.x, y: m.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 4, dmg: Math.round(m.dmg * .8) }); }
  }
}
function onDemonDefeat(m) {
  S.story.demon = (S.story.demon || 0) + 1; sEvent("demon"); addFame(300); sfx("lvl"); shake = 14; burst(m.x, m.y, 80, ["#c03aff", "#ffd34d", "#fff", "#ff3a3a"], 220, 1.2, 40, 1.5);
  const ilvl = Math.max(4, Math.round(S.lv * 1.3 + 6));
  for (let i = 0; i < 3; i++) dun.loot.push({ t: "gear", it: genGear(ilvl, 3, { rar: 3 }), x: m.x + (i - 1) * 40, y: m.y + 40 });
  dun.loot.push({ t: "bell", n: 3000, x: m.x, y: m.y + 60 }); dun.victory = true; save();
  setTimeout(() => { if (scene === "dun" && dun && dun.victory && !modal) { gearTab = "ending"; modal = true; renderGear(); $("gear").hidden = false; } }, 2200);
}
function enterDemon(poi) {
  const ret = { x: (poi.x + poi.w / 2) * T, y: (poi.y + poi.h + 1.5) * T }; S.wpos = ret; save(); enterDungeon(DEMON_BASE, false, "demon", ret);
}

/* ----- 모델: 국왕 · 근위병 · 성 · 마왕성 · 대마왕 ----- */
// 국왕·경비병: 플레이어와 같은 사람 모델(Quaternius UAL 마네킹)에 옷·왕관·투구·무기를 입혀요. 모델이 없으면 예전 코드 모델
function mkKingM() { if (KAY.ready) { const e = mkChibi(CB_NPC.chief, null, false); e.npc = "king"; e.walk = "Walking_A"; return e; } if (!MAN.ready) return mkKing(); const e = mkMan({ tp: 1, ot: 3, hat: 4, br: 2, hc: 6, sk: 1, pc: 5, bc: 3, bd: 3, cc: 2 }, null, false); e.g.scale.multiplyScalar(1.08); e.npc = "king"; return e; }
function mkGuardM() { if (KAY.ready) { const e = mkChibi(CB_NPC.guard, null, false); e.npc = "guard"; e.walk = "Walking_A"; return e; } if (!MAN.ready) return mkGuard(); const e = mkMan({ tp: 0, ot: 0, hat: 1, h: 5, br: 1, hc: 0, sk: 1, pc: 0, bc: 1 }, { weapon: { e: "🗡️" }, armor: { e: "🛡️", rar: 1 } }, true); e.npc = "guard"; return e; }
function mkKing() {
  return uq(() => {
    const e = mkHuman({ shirt: 0xa8202a, pants: 0x5a1018, skin: 0xf2c79a, hair: 0xe8e4d8, belt: 0xf5d142, boots: 0x3a1a10, hs: 0 }), b = e.body;
    C(b, .24, .3, .78, 0xa8202a, 0, .62, 0, 14); C(b, .27, .27, .1, 0xf2f0ea, 0, 1.02, 0, 14); Sp(b, .12, 0xf2f0ea, -.33, 1.02, 0); Sp(b, .12, 0xf2f0ea, .33, 1.02, 0);
    B(b, .5, .85, .05, 0x7a1018, 0, .62, -.27); K(b, .12, .24, 0xf2f0ea, 0, .98, .2, 5, { r: [Math.PI, 0, 0] });
    C(e.head, .22, .25, .17, 0xf5d142, 0, .33, 0, 12); for (let i = 0; i < 5; i++) { const a = i * 1.2566; K(e.head, .045, .15, 0xf5d142, Math.cos(a) * .22, .5, Math.sin(a) * .22, 4); }
    e.g.scale.setScalar(1.12); outline(e.g); return e;
  });
}
function mkGuard() {
  return uq(() => {
    const e = mkHuman({ shirt: 0xb8bcc8, pants: 0x5c6070, skin: 0xf2c79a, hair: 0x5a3a22, belt: 0x8a5a34, boots: 0x3a3a44, hs: 0 }), h = e.head;
    Sq(h, .345, 0xc8ccd8, 0, .04, 0, { s: [1, .82, 1.02] }); K(h, .06, .3, 0xd8383a, 0, .4, 0, 5); B(h, .2, .09, .05, 0x2a2a34, 0, -.02, .33);
    C(e.ra, .025, .025, 1.9, 0x7d5433, 0, -.3, .1, 5); K(e.ra, .06, .22, 0xd8dce8, 0, .72, .1, 4); B(e.la, .06, .4, .3, 0x3d6ed0, -.1, -.3, .1);
    outline(e.g); return e;
  });
}
function mkTower() { const g = new THREE.Group(); C(g, 1, 1.15, 4.2, 0xd8d3c8, 0, 2.1, 0, 10); C(g, 1.25, 1.25, .3, 0xc8c3b8, 0, 4.3, 0, 10); K(g, 1.35, 1.7, 0xc8383a, 0, 5.3, 0, 10); C(g, .04, .04, 1.2, 0x7d5433, 0, 6.6, 0, 5); B(g, .8, .5, .04, 0xe8505a, .4, 6.9, 0); g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g; }
function mkCastle() {
  const g = new THREE.Group(), st = 0xe4dfd6, st2 = 0xd2cdc2, red = 0xc8383a;
  B(g, 10, 3.4, 3.4, st, 0, 1.7, -.6); for (let i = 0; i < 10; i++) { B(g, .7, .5, .5, st2, -4.5 + i, 3.65, 1.0); B(g, .7, .5, .5, st2, -4.5 + i, 3.65, -2.2); }
  B(g, 3.2, 4.6, 2.8, 0xd8d3c8, 0, 2.3, .9); K(g, 2.3, 1.8, red, 0, 5.5, .9, 4, { r: [0, .78, 0] }); B(g, 1.7, 2.1, .2, 0x2a1c14, 0, 1.05, 2.35); B(g, 1.9, .3, .25, 0xe8b84a, 0, 2.2, 2.35);
  for (const s of [-1, 1]) { C(g, .95, 1.05, 4.8, 0xd8d3c8, s * 4.7, 2.4, -.2, 10); K(g, 1.15, 1.6, red, s * 4.7, 5.6, -.2, 10); C(g, .04, .04, 1.3, 0x7d5433, s * 4.7, 6.9, -.2, 5); B(g, .8, .5, .04, 0x3d6ed0, s * 4.7 + .4, 7.1, -.2); }
  for (let i = -3; i <= 3; i++) if (i) B(g, .55, .9, .1, 0x2a3a5a, i * 1.15 + (i > 0 ? .9 : -.9), 2.3, 1.12);
  B(g, 1.8, .03, 7.5, red, 0, .02, 6, { cs: false }); B(g, 2.2, .02, 7.5, 0xe8b84a, 0, .015, 6, { cs: false });
  for (const s of [-1, 1]) for (const z of [3.5, 6, 8.5]) { C(g, .05, .05, 1.4, 0x7d5433, s * 1.6, .7, z, 5); B(g, .7, .45, .04, red, s * 1.6 + .36, 1.2, z); }
  g.traverse(m => { if (m.isMesh) m.castShadow = true; }); return g;
}
function mkDemonCastle() {
  const g = new THREE.Group(), st = 0x2a2236, st2 = 0x3a3048, red = 0xd8283a, glow = HDR(red);
  B(g, 8.4, 2.6, 3.0, st, 0, 1.3, 0); for (let i = 0; i < 9; i++) K(g, .28, .8, st2, -4 + i, 3.0, 1.3, 4);
  B(g, 2.6, 5.2, 2.4, st2, 0, 2.6, -.2); K(g, 1.5, 2.6, 0x1a1424, 0, 6.5, -.2, 4, { r: [0, .78, 0] }); K(g, .1, 1.4, red, 0, 8.6, -.2, 5);
  for (const s of [-1, 1]) { C(g, .8, .95, 4.4, st2, s * 3.8, 2.2, -.6, 8); K(g, 1.05, 1.9, 0x1a1424, s * 3.8, 5.3, -.6, 8); }
  B(g, 1.5, 2, .2, 0x0a0610, 0, 1, 1.55); K(g, .9, 1.4, 0x0a0610, 0, 2.7, 1.5, 4, { r: [0, .78, 0] });
  for (const [x, y, z] of [[-2.4, 1.6, 1.56], [2.4, 1.6, 1.56], [0, 3.6, 1.03], [-3.8, 3.0, .45], [3.8, 3.0, .45], [0, 4.8, 1.03]]) { const w = new THREE.Mesh(geo("dcw", () => new THREE.BoxGeometry(.4, .62, .1)), glow); w.position.set(x, y, z); g.add(w); }
  for (const x of [-1.3, 1.3]) { flame(g, x, 1.6, 1.8, 2.2); } B(g, 1.8, .03, 5.5, 0x4a0a18, 0, .02, 4.3, { cs: false });
  g.traverse(m => { if (m.isMesh && m.material !== glow) m.castShadow = true; }); return g;
}
function mkDemonLord() {
  return uq(() => {
    const g = new THREE.Group(), b = new THREE.Group(), dk = 0x2a1838, dk2 = 0x3a2048, red = 0x8a1830; g.add(b);
    Sp(b, .75, dk, 0, 1.35, 0, { s: [1, 1.15, .85] }); Sp(b, .5, dk2, 0, 1.2, .35, { s: [1, 1, .5] });
    for (const s of [-1, 1]) { Sp(b, .38, 0x4a2858, s * .85, 2.0, 0); K(b, .12, .55, 0xe8d8c0, s * .9, 2.45, 0, 5, { r: [0, 0, -s * .5] }); }
    const hd = new THREE.Group(); hd.position.set(0, 2.55, .1); b.add(hd); Sp(hd, .42, dk2, 0, 0, 0);
    for (const s of [-1, 1]) { K(hd, .1, .95, 0xe8d8c0, s * .3, .55, -.1, 6, { r: [-.3, 0, -s * .55] }); K(hd, .06, .4, 0xe8d8c0, s * .5, .1, .05, 5, { r: [0, 0, -s * 1.2] }); }
    const eye = HDR(0xff2a2a); for (const s of [-1, 1]) { const m = new THREE.Mesh(geo("dem_eye", () => new THREE.SphereGeometry(.075, 8, 6)), eye); m.position.set(s * .17, .06, .37); hd.add(m); }
    B(hd, .3, .08, .1, 0xe8d8c0, 0, -.2, .38); for (let i = 0; i < 5; i++) { const a = (i - 2) * .4; K(hd, .045, .22, 0xf5d142, Math.sin(a) * .36, .4 + Math.cos(a) * .08, -.15, 4); }
    const arm = s => { const p = new THREE.Group(); p.position.set(s * .95, 1.9, 0); B(p, .28, 1.1, .28, dk, 0, -.55, 0); Sp(p, .2, dk2, 0, -1.15, 0); for (let i = -1; i <= 1; i++) K(p, .035, .3, 0xe8d8c0, i * .08, -1.38, .08, 4, { r: [Math.PI, 0, 0] }); b.add(p); return p; };
    const la = arm(-1), ra = arm(1);
    const wing = s => { const p = new THREE.Group(); p.position.set(s * .5, 2.1, -.45); B(p, 1.6, .06, .06, 0x1a0e22, s * .8, .3, 0, { r: [0, 0, s * .35] }); B(p, 1.5, .04, 1.0, red, s * .8, 0, -.3); B(p, 1.0, .04, .8, red, s * 1.6, -.1, -.35); b.add(p); return p; };
    const wings = [wing(1), wing(-1)]; B(b, 1.5, 1.6, .08, 0x5a0f20, 0, 1.0, -.6);
    const l = [leg(b, -.35, .85, 0, .4, .85, dk), leg(b, .35, .85, 0, .4, .85, dk)]; flame(b, -.9, 2.8, 0, 2); flame(b, .9, 2.8, 0, 2);
    outline(g); return { g, body: b, legs: l, wings, la, ra, h: 3.9 };
  });
}
MON3["😈"] = mkDemonLord;
