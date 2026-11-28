/* ----- 월드 게임플레이 ----- */
/* ----- 멀티플레이 (server/server.js 와 통신) ----- */
const NET = {
  rank: null, on: false, ws: null, id: null, col: 0x3d6ed0, name: "", others: new Map(), ed: {}, away: true, posT: 0, retryT: 0, count: 1, mySay: "", mySayT: 0,
  url: (() => { try { const q = new URLSearchParams(location.search), sv = q.get("server"); if (sv) return sv; if (q.has("online") && /^https?:/.test(location.protocol)) return location.origin.replace(/^http/, "ws"); } catch (e) {} return null; })(),
  send(m) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); },
};
function useEdits(o) { if (!WORLD) return; WORLD.ed = o; for (const ch of WORLD.chunks.values()) ch.dirty = true; }
function addChat(name, text, sys) {
  const el = document.createElement("div"); el.textContent = sys ? text : `${name}: ${text}`; if (sys) el.style.opacity = ".75";
  const log = $("chatlog"); log.appendChild(el); while (log.children.length > 8) log.firstChild.remove(); setTimeout(() => el.remove(), 14000); $("chat").hidden = false;
}
function netPlayer(p) {
  let o = NET.others.get(p.id);
  if (!o) { o = { id: p.id, name: p.name, look: p.look, col: p.col, x: p.x, y: p.y, tx: p.x, ty: p.y, dx: p.dx, dy: p.dy, mv: 0, say: "", sayT: 0 }; NET.others.set(p.id, o); }
  o.name = p.name ?? o.name; if (p.look) o.look = p.look; o.col = p.col ?? o.col; o.tx = p.x; o.ty = p.y; o.dx = p.dx; o.dy = p.dy; o.mv = p.mv;
}
function netMsg(m) {
  switch (m.t) {
    case "hello": NET.on = true; NET.id = m.id; NET.col = m.col; NET.name = m.name; NET.ed = m.edits || {}; NET.rank = m.rank || []; NET.count = m.count || 1; NET.others.clear(); for (const p of m.players) netPlayer(p);
      useEdits(NET.ed); $("online").hidden = false; addChat("", `🌐 ${m.name}(으)로 접속했어요 · ${NET.count}명 접속 중`, true); break;
    case "state": for (const p of m.ps) netPlayer(p); break;
    case "away": NET.others.delete(m.id); break;
    case "count": NET.count = m.n; break;
    case "rank": NET.rank = m.list || []; if (gearTab === "arena" && !$("gear").hidden) renderGear(); break;
    case "chat": addChat(m.name, m.text, !!m.sys); { const o = NET.others.get(m.id); if (o && !m.sys) { o.say = m.text; o.sayT = 6; } } break;
    case "edit": if (m.c === null) delete NET.ed[m.k]; else NET.ed[m.k] = m.c; if (WORLD) markDirty(m.k % WN, Math.floor(m.k / WN)); break;
  }
}
function netConnect() {
  if (!NET.url || NET.ws) return; let ws; try { ws = new WebSocket(NET.url); } catch (e) { return; } NET.ws = ws;
  ws.onopen = () => { let nm = ""; try { nm = ($("nick").value || localStorage.getItem("pokgeun-nick") || "").trim(); localStorage.setItem("pokgeun-nick", nm); } catch (e) {} NET.send({ t: "join", name: nm, look: netLookOf() }); };
  ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } netMsg(m); };
  ws.onclose = () => { const was = NET.on; NET.ws = null; NET.on = false; NET.others.clear(); NET.away = true; useEdits(S.wedits); NET.retryT = 4; $("online").hidden = true; if (was) { addChat("", "서버 연결이 끊겼어요. 다시 연결하는 중…", true); say("🌐 서버 연결이 끊겼어요 (혼자 하기 모드로 전환)", 3000); } };
  ws.onerror = () => {};
}
function netTick(dt) {
  if (!NET.url || !started) return;
  if (!NET.ws && !NET.on) { NET.retryT -= dt; if (NET.retryT <= 0) { NET.retryT = 5; netConnect(); } return; }
  if (!NET.on) return;
  const inWorld = scene === "dun" && dun && dun.kind === "world";
  if (inWorld) { NET.away = false; NET.posT -= dt; if (NET.posT <= 0) { NET.posT = .1; const P = player; NET.send({ t: "pos", x: Math.round(P.x), y: Math.round(P.y), dx: Math.round(P.dx * 100) / 100, dy: Math.round(P.dy * 100) / 100, mv: P.mv ? 1 : 0 }); } }
  else if (!NET.away) { NET.away = true; NET.send({ t: "away" }); }
  const k = Math.min(1, dt * 10); for (const o of NET.others.values()) { o.x += (o.tx - o.x) * k; o.y += (o.ty - o.y) * k; if (o.sayT > 0) o.sayT -= dt; }
  if (NET.mySayT > 0) NET.mySayT -= dt; $("online").textContent = `🌐 ${NET.count}명 접속 중`;
}
function openChat() {
  if (!NET.on || !(scene === "dun" && dun && dun.kind === "world") || modal) return;
  const i = $("chatin"); $("chat").hidden = false; i.hidden = false; i.value = ""; i.focus(); keys.clear();
}
$("chatin").addEventListener("keydown", e => {
  e.stopPropagation();
  if (e.key === "Enter") { const v = e.target.value.trim(); if (v) { NET.send({ t: "chat", text: v.slice(0, 120) }); NET.mySay = v.slice(0, 120); NET.mySayT = 6; } e.target.hidden = true; e.target.blur(); }
  else if (e.key === "Escape") { e.target.hidden = true; e.target.blur(); }
});
$("tchat").onclick = openChat;
if (NET.url) { $("nickrow").hidden = false; try { $("nick").value = localStorage.getItem("pokgeun-nick") || ""; } catch (e) {} }
function newWorldDun() { return newDun({ kind: "world", exit: null, stairs: null, vil: [], pet: null, areaB: -1, tick: 0, spawnT: 0, discT: 0, saveT: 0, regT: 0, healT: 0, guardT: 0 }); }
function townVil(t, i) { for (let k = 0; k < 2; k++) { const v = VILLAGERS[[0, 3][k]], x = (t.x + (k ? 4 : -4) + .5) * T, y = (t.y + 2.5) * T; dun.vil.push({ ...v, x, y, hx: x, hy: y, vx: 0, vy: 0, t: 0, talk: 0, line: 0 }); } }
function enterWorld(pos, msg) {
  const W = getWorld(); cancelFish(); scene = "dun"; dun = newWorldDun(); W.first = true; camInit = false; sfx("portal");
  if (!S.wspawn) S.wspawn = { x: (W.spawn.x + .5) * T, y: (W.spawn.y + 4.5) * T };
  const P = player, p = pos || S.wpos || { x: (W.spawn.x + .5) * T, y: (W.spawn.y + 4.5) * T };
  P.x = p.x; P.y = p.y; P.dx = 0; P.dy = 1; P.mounted = false; P.atkCd = P.qCd = P.eCd = P.fCd = P.rCd = P.dash = P.inv = 0; P.hp = Math.max(P.hp, 1);
  if (wsolid(Math.floor(P.x / T), Math.floor((P.y + 8) / T))) { for (let r = 1; r < 8; r++) { let ok = false; for (let a = 0; a < 8 && !ok; a++) { const x = Math.floor(P.x / T + Math.cos(a * .785) * r), y = Math.floor((P.y + 8) / T + Math.sin(a * .785) * r); if (!wsolid(x, y)) { P.x = (x + .5) * T; P.y = (y + .5) * T - 8; ok = true; } } if (ok) break; } }
  W.towns.forEach((t, i) => townVil(t, i));
  { const c = W.towns[0], mkv = (nm, model, ox, oy, lines, e) => { const x = (c.x + ox + .5) * T, y = (c.y + oy + .5) * T - 8; dun.vil.push({ name: nm, e, model, fixed: true, lines, x, y, hx: x, hy: y, vx: 0, vy: 0, t: 0, talk: 0, line: 0 }); };
    mkv(FEAT.story ? "국왕 폰드" : "촌장 폰드", "king", 0, -8, FEAT.story ? [] : ["허허, 포근 마을에 온 걸 환영하오.", "백성들이 집을 짓고 밭을 가꾸는 모습이 보기 좋구려.", "멀리 나가면 귀한 재료가 많다 하오. 조심히 다녀오시게."], "👑"); mkv("근위병", "guard", -2, -8, GUARD_LINES, "🛡️"); mkv("근위병", "guard", 2, -8, GUARD_LINES, "🛡️"); mkv("성문 경비병", "guard", -7, -3, GUARD_LINES2, "🛡️"); mkv("성문 경비병", "guard", 7, -3, GUARD_LINES2, "🛡️");
    if (!S.wp[c.id + "w"]) S.wp[c.id + "w"] = 1; }
  dun.pet = activePet() ? { x: P.x - 20, y: P.y, cd: 0 } : null; S.wpos = { x: P.x, y: P.y }; WDUN = dun; storyCheck(); hud();
  say(msg || "🌍 오픈월드 — 어디로든 갈 수 있어요. 마을·동굴·이동석을 찾아보세요! (B 건설 · N 지도 · J 의뢰)", 4500);
}
function mkMonT(i, depth, x, y) { const b = MONS[i], sc = 1 + .3 * (depth - 1), hp = Math.round(b.hp * sc); return eliteify({ ...b, x, y, hp, mhp: hp, dmg: Math.round(b.dmg * sc), xp: Math.round(b.xp * sc), cd: 0, flash: 0, kb: 0, kx: 0, ky: 0, boss: false, dpt: depth, tier: Math.floor((depth - 1) / 2), world: true }); }
function spawnNear() {
  const P = player, a = Math.random() * 6.283, d = 16 + Math.random() * 11, x = Math.floor(P.x / T + Math.cos(a) * d), y = Math.floor((P.y + 8) / T + Math.sin(a) * d);
  if (x < 2 || y < 2 || x >= WN - 2 || y >= WN - 2) return; const b = wb(x, y); if (b < 1 || b === 8 || wsolid(x, y)) return;
  if (WORLD.towns.some(t => Math.hypot(t.x - x, t.y - y) < 19)) return; { const v = WORLD.vreg, h = WORLD.hreg; if (v && x > v.x - 4 && x < v.x + W + 4 && y > v.y - 4 && y < v.y + H + 4) return; if (h && x > h.x - 3 && x < h.x + RW + 3 && y > h.y - 3 && y < h.y + RH + 3) return; }   // 마을·집 바로 바깥까지 몬스터가 나와요
  const tier = wTier(x, y), night = darkness() > .25, tb = BIOSPAWN[b] || BIOSPAWN[2], list = night ? tb.n : tb.d, [kind, idx] = list[ri(list.length)], px = (x + .5) * T, py = (y + .5) * T - 8;
  // 마을 근처(40칸 안)에서는 낮에도 약한 새 몬스터(슬라임·말벌·버섯돌이)가 자주 나와요 — 시작하자마자 전투를 맛볼 수 있게
  const v = WORLD.vreg, nearV = v && Math.hypot(x - (v.x + W / 2), y - (v.y + H / 2)) < 40;
  const m = nearV && Math.random() < .7 ? mkMonT(ri(3), 1, px, py) : kind === "d" ? mkDino(idx, tier, px, py, false) : mkMonT(idx, 1 + tier * 2, px, py); m.world = true; m.tier = nearV ? 0 : tier; if (nearV) m.nearV = true; dun.mons.push(m);
}
function spawnGuards(p) {
  if (p.type === "maze") { const tier = p.tier, x0 = p.x - 16, y0 = p.y - 16, n = 7 + tier * 2; let k = 0;
    for (let t = 0; t < 400 && k < n; t++) { const x = x0 + 1 + ri(31), y = y0 + 1 + ri(26); if (wsolid(x, y) || Math.hypot(x - p.x, y - p.y) < 5) continue; const m = Math.random() < .6 ? mkMonT([0, 1, 2, 3, 4, 5][ri(6)], 1 + tier * 2 + 1, (x + .5) * T, (y + .5) * T - 8) : mkDino(Math.min(4, 1 + ri(4)), tier, (x + .5) * T, (y + .5) * T - 8, false); m.hostile = true; m.world = true; m.poi = p.id; m.tier = tier; dun.mons.push(m); k++; }
    const b = mkMon(5 + tier * 2, (p.x + .5) * T, (p.y - 2.5) * T, true); b.world = true; b.poi = p.id; b.tier = tier; b.dpt = 5 + tier * 2; dun.mons.push(b); return; }
  if (p.type === "demon") { for (let i = 0; i < 10; i++) { const a = i / 10 * 6.283, m = mkMonT([3, 4, 5, 5, 2][ri(5)], 7, (p.x + p.w / 2) * T + Math.cos(a) * 6.5 * T, (p.y + p.h + 3) * T + Math.sin(a) * 3.2 * T); m.hostile = true; m.world = true; m.poi = p.id; m.tier = 4; dun.mons.push(m); } return; }
  const cx = (p.x + .5) * T, cy = (p.y + .5) * T, tier = p.tier, n = p.type === "lair" ? 3 : 4 + tier;
  if (p.type === "lair") { const b = mkMon(6 + tier, cx, cy - 40, true); b.world = true; b.poi = p.id; b.tier = 4; b.dpt = 6 + tier; dun.mons.push(b); }
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283, x = cx + Math.cos(a) * (3.5 * T), y = cy + Math.sin(a) * (3.5 * T) - 8; let m;
    if (p.type === "ruin" || p.type === "lair") m = mkMonT([3, 4, 2, 5][ri(4)], 1 + tier * 2 + 1, x, y); else { m = Math.random() < .5 ? mkDino(Math.min(4, 1 + ri(4)), tier, x, y, false) : mkMonT([2, 3, 5][ri(3)], 1 + tier * 2, x, y); }
    m.hostile = true; m.world = true; m.poi = p.id; m.tier = tier; dun.mons.push(m);
  }
}
function clearPoi(pid) {
  const p = WORLD.byId.get(pid); if (!p || S.wcl[pid]) return; S.wcl[pid] = 1; say(`🏆 ${p.name} 소탕 완료! 상자를 열어 보세요.`, 3500); sfx("lvl"); if (p.type !== "demon") { qEvent("lair", null); sEvent("clear"); if (p.type === "lair") sEvent("lair"); addFame(10 + p.tier * 5); }
  const P = player; dun.loot.push({ t: "gear", it: genGear(Math.max(2, 3 + p.tier * 3 + Math.round(S.lv * .4)), 2), x: (p.x + .5) * T + 30, y: (p.y + .5) * T }); gainXp(40 + p.tier * 30);
}
function discoverWp(poi) {
  if (S.wp[poi.id]) return; S.wp[poi.id] = 1; sfx("lvl"); say(`📍 ${poi.name} 발견! (N 지도에서 이동할 수 있어요)`, 3000); burst(player.x, player.y, 24, ["#6ee7ff", "#fff"], 100, .9, -40, 1.2);
  gainXp(25 + (poi.tier || 0) * 20); qEvent("disc", null);
}
function worldTick(dt) {
  const P = player, W = WORLD, px = Math.floor(P.x / T), py = Math.floor((P.y + 8) / T);
  dun.spawnT += dt; const cap = darkness() > .25 ? 30 : 22;
  if (dun.spawnT > 1.6) { dun.spawnT = 0; if (dun.mons.length < cap) spawnNear(); }
  dun.mons = dun.mons.filter(m => !m.world || m.poi || Math.hypot(m.x - P.x, m.y - P.y) < 46 * T);
  dun.guardT += dt; if (dun.guardT > .5) {
    dun.guardT = 0;
    const NP = poisNear(px - 100, py - 100, px + 100, py + 100);
    for (const p of NP) { if (!p.guard && p.type !== "demon") continue; if (S.wcl[p.id]) continue; const d = Math.hypot((p.x + .5) * T - P.x, (p.y + .5) * T - P.y) / T; if (d < 30 && !p.spawned) { p.spawned = true; spawnGuards(p); say(`⚠️ ${p.name}이(가) 가까워요!`, 2200); } else if (d > 75 && p.spawned) { p.spawned = false; dun.mons = dun.mons.filter(m => m.poi !== p.id); } }
    for (const p of NP) if (p.wp && !S.wp[p.id] && Math.hypot(p.x - px, p.y - py) < 4) discoverWp(p);
    const tw = inTown(px, py); if (tw && dun.inTown !== tw.id) say(`🏘️ ${tw.name} — 안전지대예요`, 2500); dun.inTown = tw ? tw.id : null;
    const mz = NP.find(q => q.type === "maze" && Math.abs(q.x - px) <= 16 && Math.abs(q.y - py) <= 16); if ((mz ? mz.id : null) !== dun.inMaze) { dun.inMaze = mz ? mz.id : null; if (mz) say(`🏛️ ${mz.name} · 위험도 ${"★".repeat(mz.tier + 1)}${S.wcl[mz.id] ? " (소탕 완료)" : " — 가운데 방의 보스를 쓰러뜨리세요"}`, 3000); dun.areaB = -2; }
    const b = wb(px, py); if (b !== dun.areaB && !tw && !dun.inMaze) { dun.areaB = b; if (b > 0) say(`${BIO_E[b]} ${BIO_N[b]} · 위험도 ${"★".repeat(wTier(px, py) + 1)}`, 2200); }
  }
  dun.discT += dt; if (dun.discT > .5) { dun.discT = 0; const cx = px >> 2, cy = py >> 2; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (i * i + j * j <= 10) W.disc.add(DKEY(cx + i, cy + j)); }
  dun.regT += dt; if (dun.regT > 2) { dun.regT = 0; const now = Date.now(); for (let i = W.regrow.length - 1; i >= 0; i--) { const r = W.regrow[i]; if (now > r.t) { if (W.ed[r.k] === 0) { delete W.ed[r.k]; markDirty(r.k % WN, Math.floor(r.k / WN)); } delete S.wreg[r.k]; W.regrow.splice(i, 1); } } }
  dun.healT += dt; if (dun.healT > .5) { dun.healT = 0; let near = false; for (const ch of W.chunks.values()) for (const L of ch.lit) if (L.c === 0xffa040 && Math.hypot(L.x * T - P.x, L.z * T - P.y) < 4 * T) near = true; if (near && P.hp < pstats().maxhp) heal(2); }
  dun.saveT += dt; if (dun.saveT > 5) { dun.saveT = 0; S.wpos = { x: P.x, y: P.y }; save(); }
  for (const v of dun.vil) {
    if (Math.hypot(v.x - P.x, v.y - P.y) > 40 * T) continue; if (v.talk > 0) { v.talk -= dt; continue; }
    v.t -= dt; if (v.t <= 0) { v.t = 1 + Math.random() * 2.5; const a = Math.random() < .35 ? null : Math.random() * 6.283; v.vx = a === null ? 0 : Math.cos(a) * 28; v.vy = a === null ? 0 : Math.sin(a) * 28; if (Math.hypot(v.x - v.hx, v.y - v.hy) > 6 * T) { const b2 = Math.atan2(v.hy - v.y, v.hx - v.x); v.vx = Math.cos(b2) * 28; v.vy = Math.sin(b2) * 28; } }
    tryMove(v, v.vx * dt, v.vy * dt);
  }
  if (fishing) { fishing.t -= dt; if (fishing.t <= 0) { if (fishing.state === "wait") { fishing.state = "bite"; fishing.t = .9; sfx("ui"); } else { say("놓쳤어요…"); fishing = null; } } }
}
function worldGather() {
  const P = player;
  for (const o of [26, 38]) {
    const tx = Math.floor((P.x + P.dx * o) / T), ty = Math.floor((P.y + 8 + P.dy * o) / T), c = wc(tx, ty);
    if (c < 1 || c > 5) continue; const key = ty * WN + tx, hp = (dun.nhp[key] ?? (c === 3 ? 2 : c === 4 ? 5 : 3)) - 1, b = wb(tx, ty);
    sfx("chop"); shake = Math.max(shake, 1); burst((tx + .5) * T, (ty + .5) * T - 8, 6, c === 2 || c === 4 ? ["#b8bcc8", "#8a8e9e"] : c === 1 ? ["#a87645", "#7d5433", "#3d8444"] : ["#6dbb4f", "#3d8444"], 80, .4, 160, 1);
    if (hp > 0) { dun.nhp[key] = hp; return; }
    delete dun.nhp[key]; setCell(tx, ty, 0, true);
    if (c === 1) { matAdd("wood", 2 + ri(2)); if (b === 5 && Math.random() < .2) matAdd("hide", 1); } else if (c === 2) { matAdd("stone", 2 + ri(2)); if (Math.random() < .15) matAdd("bone", 1); }
    else if (c === 3) { matAdd("fiber", 1 + ri(2)); if (Math.random() < .6) matAdd("berry", 1 + ri(2)); } else if (c === 4) { matAdd("ore", 1 + ri(2)); matAdd("stone", 1); } else { matAdd("fiber", 2); if (Math.random() < .5) matAdd("berry", 1); }
    return;
  }
}
function worldAct() {
  if (dun.kind !== "world") return false;   // 월드가 아닐 때(동굴 등) 호출되면 무시
  const P = player, fx_ = P.x + P.dx * 26, fy_ = P.y + 8 + P.dy * 26, tx = Math.floor(fx_ / T), ty = Math.floor(fy_ / T);
  if (fishing) { if (fishing.state === "bite") catchFish(); else say("너무 일렀어요… 찌가 움직일 때까지 기다려요."); fishing = null; return true; }
  const v = dun.vil.find(v => Math.hypot(v.x - fx_, v.y + 8 - fy_) < 40); if (v) { if (v.model === "king" && FEAT.story) openKing(); else talk(v); return true; }
  if (buildSel) { buildPlace(tx, ty); return true; }
  if (winteract(tx, ty)) return true;
  if (wb(tx, ty) === 0 && !inTown(tx, ty)) { fishing = { tx, ty, state: "wait", t: 1.5 + R() * 3 }; sfx("splash"); burst((tx + .5) * T, (ty + .6) * T, 6, ["#a8dcf5", "#fff"], 40, .3, 160, .3); say("찌를 던졌어요…", 1200); return true; }
  return false;
}
function sleepAt(pos, name) {
  S.wspawn = pos; player.hp = pstats().maxhp; sfx("potion"); const night = clock >= 19 || clock < 6;
  if (night) { clock = 7; say(`😴 ${name}에서 푹 잤어요. 아침이 밝았어요! (리스폰 지점 저장)`, 3000); } else say(`🛏️ ${name} — 체력을 회복하고 리스폰 지점을 저장했어요.`, 2800); save();
}
function winteract(tx, ty) {
  const k = ty * WN + tx, poi = interAt(tx, ty), c = wc(tx, ty);
  if (poi) {
    if (poi.type === "shop") { openShop(); return true; }
    if (poi.type === "inn") { sleepAt({ x: (poi.x + 1.5) * T, y: (poi.y + 3) * T }, "여관"); return true; }
    if (poi.type === "board") { togglePanel("quest"); return true; }
    if (poi.type === "shrine") { discoverWp(poi); togglePanel("map"); return true; }
    if (poi.type === "portal") { leaveDungeon(false, true); return true; }
    if (poi.type === "cave") { const depth = clamp(1 + Math.floor(Math.hypot(poi.x - WORLD.spawn.x, poi.y - WORLD.spawn.y) / 45), 1, 12), ret = { x: (poi.x + 1) * T, y: (poi.y + 3) * T }; S.wpos = ret; save(); enterDungeon(depth, false, undefined, ret); return true; }
    if (poi.type === "castle") { say("🏰 포근성 — 국왕 폐하는 앞뜰에서 기다리고 계세요. (L: 왕국)", 3000); return true; }
    if (poi.type === "demon" && FEAT.demon) { say("😈 마왕성에 들어갑니다… 모든 각오를 하세요!", 2500); enterDemon(poi); return true; }
    if (poi.type === "chest") { openChest(poi); return true; }
    return false;
  }
  if (c === CELL.BED) { sleepAt({ x: (tx + .5) * T, y: (ty + 1.5) * T }, "내 침대"); return true; }
  if (c === CELL.FARM) { farmAct(tx, ty); return true; }
  if (c === CELL.FIRE) { say("🔥 모닥불 — 가까이 있으면 체력이 천천히 회복돼요.", 2200); return true; }
  return false;
}
function openChest(p) {
  if (S.wopen[p.id]) return say("텅 빈 상자예요.", 1500);
  S.wopen[p.id] = 1; markDirty(p.x, p.y); sfx("gear"); burst((p.x + .5) * T, (p.y + .5) * T, 20, ["#f5d142", "#fff", "#f0a23c"], 110, .8, 100, 1);
  const tier = p.tier || 0, n = 1 + (tier >= 2 ? 1 : 0) + (p.par && p.par.type === "lair" ? 2 : 0), ilvl = Math.max(2, 3 + tier * 3 + Math.round(S.lv * .4));
  for (let i = 0; i < n; i++) dun.loot.push({ t: "gear", it: genGear(ilvl, 1.5), x: (p.x + .5) * T + (i - n / 2) * 24, y: (p.y + 1.6) * T });
  dun.loot.push({ t: "bell", n: 60 + tier * 60 + ri(60), x: (p.x + .5) * T, y: (p.y + 1.4) * T }); dun.loot.push({ t: "pot", x: (p.x - .3) * T, y: (p.y + 1.5) * T });
  say(`🎁 ${p.name}를 열었어요!`, 2500);
}
function farmAct(tx, ty) {
  const k = ty * WN + tx, st = cropStage(k);
  if (st < 0) { if ((S.mat.berry || 0) < 1) return say("🌱 열매 1개를 씨앗으로 심을 수 있어요. 덤불에서 열매를 구해 보세요.", 2500); S.mat.berry--; S.crops[k] = { t0: Date.now() }; sfx("place"); markDirty(tx, ty); hud(); say("🌱 씨앗을 심었어요! 약 2분 뒤에 수확해요.", 2200); }
  else if (st < 2) say("🌿 아직 자라는 중이에요.", 1500);
  else { delete S.crops[k]; sfx("coin"); markDirty(tx, ty); matAdd("berry", 3 + ri(2)); matAdd("fiber", 1); burst((tx + .5) * T, (ty + .5) * T, 10, ["#e8508a", "#6dbb4f"], 70, .5, 120, .6); say("🧺 수확했어요!", 1500); }
}
const PIECE_OWN = new Set([12, 13, 14, 15, 18, 21]);
function canAfford(cost) { return Object.entries(cost).every(([k, v]) => (S.mat[k] || 0) >= v); }
function buildPlace(tx, ty) {
  const b = buildSel; if (!b) return;
  if (tx < 1 || ty < 1 || tx >= WN - 1 || ty >= WN - 1 || wb(tx, ty) === 0 || wc(tx, ty) !== 0) return say("여기에는 지을 수 없어요.", 1400);
  if (inTown(tx, ty)) return say("마을 안에는 지을 수 없어요.", 1400);
  const ptx = Math.floor(player.x / T), pty = Math.floor((player.y + 8) / T);
  if (SOLIDC[b.code] && ptx === tx && pty === ty) return say("서 있는 자리에는 지을 수 없어요.", 1400);
  if (SOLIDC[b.code] && dun.mons.some(m => Math.floor(m.x / T) === tx && Math.floor((m.y + 8) / T) === ty)) return say("몬스터가 있어요!", 1200);
  if (!canAfford(b.cost)) return say("재료가 부족해요. (I 키가 아니라 상단 주머니의 재료를 확인하세요)", 2000);
  for (const k in b.cost) S.mat[k] -= b.cost[k]; setCell(tx, ty, b.code, false); sfx("place"); burst((tx + .5) * T, (ty + .5) * T, 8, ["#d9b07c", "#fff"], 60, .4, 160, .5); hud(); save();
}
function worldRemove() {
  const P = player, tx = Math.floor((P.x + P.dx * 26) / T), ty = Math.floor((P.y + 8 + P.dy * 26) / T), c = wc(tx, ty);
  if (!PIECE_OWN.has(c)) return say("직접 지은 건물만 철거할 수 있어요.", 1400);
  const b = BUILD.find(b => b.code === c); if (b) for (const k in b.cost) S.mat[k] = (S.mat[k] || 0) + Math.floor(b.cost[k] / 2);
  delete S.crops[ty * WN + tx]; setCell(tx, ty, 0, false); sfx("pick"); burst((tx + .5) * T, (ty + .5) * T, 8, ["#d9b07c", "#fff"], 60, .4, 160, .5); hud(); save();
}
function worldCursor() {
  const c = G.cursor; if (!buildSel || modal) { c.visible = false; return; }
  const P = player, tx = Math.floor((P.x + P.dx * 26) / T), ty = Math.floor((P.y + 8 + P.dy * 26) / T), ok = wb(tx, ty) !== 0 && wc(tx, ty) === 0 && !inTown(tx, ty) && canAfford(buildSel.cost);
  cursorAt(tx, ty, .06); c.material.color.setHex(ok ? 0x9bff9b : 0xff6a6a);
}
