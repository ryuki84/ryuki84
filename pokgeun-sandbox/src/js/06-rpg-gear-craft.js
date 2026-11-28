/* ---------- RPG: 장비 · 캐릭터 · 제작 ---------- */
const xpNeed = l => Math.round(25 * Math.pow(l, 1.6));
const r1 = v => Math.round(v * 10) / 10;
function genGear(ilvl, boost = 0, opt = {}) {
  let rar, slot, setId = null;
  if (opt.rar === undefined && Math.random() < .012 + boost * .01) { setId = Object.keys(SETS)[ri(2)]; slot = ["weapon", "armor", "ring"][ri(3)]; rar = 4; }
  else {
    slot = opt.slot || ["weapon", "weapon", "armor", "armor", "ring"][ri(5)];
    const r0 = Math.random() + boost * .15; rar = opt.rar ?? (r0 > .98 ? 3 : r0 > .88 ? 2 : r0 > .6 ? 1 : 0);
  }
  const sd = SLOTS[slot], m = RARITY[rar].m, bi = ri(sd.es.length), st = {};
  if (slot === "weapon") st.dmg = Math.round((3 + ilvl * 2) * (.85 + Math.random() * .3) * m);
  if (slot === "armor") { st.armor = Math.round((2 + ilvl * 1.5) * (.85 + Math.random() * .3) * m); st.hp = Math.round((6 + ilvl * 3) * m); }
  if (slot === "ring") st.crit = Math.round(1 + ilvl * .2);
  const pool = AFFIX.slice().sort(() => Math.random() - .5), na = [0, 1, 2 + ri(2), 4, 3][rar];
  for (let i = 0; i < na; i++) { const a = pool[i]; st[a.k] = (st[a.k] || 0) + Math.max(1, Math.round(a.f(ilvl) * (.7 + Math.random() * .6) * (rar === 3 ? 1.4 : 1))); }
  const n = setId ? SETS[setId].names[slot] : opt.pre ? `${opt.pre} ${sd.base[bi]}` : rar === 3 ? LEG[slot][ri(LEG[slot].length)] : rar === 2 ? `${RPRE[ri(4)]} ${sd.base[bi]}` : rar === 1 ? `${MPRE[ri(4)]} ${sd.base[bi]}` : `낡은 ${sd.base[bi]}`;
  return { id: uid(), slot, e: sd.es[bi], n, rar, ilvl, st, set: setId, price: Math.round((8 + ilvl * 6) * [1, 3, 8, 25, 40][rar]) };
}
function statTxt(st) {
  const L = { dmg: "공격력", hp: "체력", armor: "방어", crit: "치명타", as: "공속", ms: "이속", ls: "흡혈" };
  return Object.entries(st).filter(([, v]) => v).map(([k, v]) => `${L[k]} +${r1(v)}${["crit", "as", "ms", "ls"].includes(k) ? "%" : ""}`).join(" · ");
}
const activePet = () => S.pets[S.petA] || null;
const skLv = k => S.sk[k] || 0;
function setCounts() { const c = {}; for (const it of Object.values(S.eq)) if (it?.set) c[it.set] = (c[it.set] || 0) + 1; return c; }
function pstatsBase() {
  const t = { dmg: 0, hp: 0, armor: 0, crit: 0, as: 0, ms: 0, ls: 0 }, cnt = setCounts();
  for (const it of Object.values(S.eq)) if (it) for (const k in it.st) t[k] += it.st[k];
  for (const id in cnt) if (cnt[id] >= 2) for (const k in SETS[id].bonus) t[k] += SETS[id].bonus[k] * (cnt[id] >= 3 ? 1 : .5);
  const { str, dex, vit } = S.st, mount = player.mounted && activePet() ? 1.5 : 1;
  t.dmg += str * 2; t.crit += dex * .4; t.as += dex * .5; t.hp += vit * 8; t.armor += vit;
  return { maxhp: Math.round((80 + S.lv * 20 + t.hp) * (1 + .05 * skLv("tough"))), dmg: 6 + S.lv * 2 + t.dmg, armor: S.lv * 2 + t.armor, crit: r1(Math.min(60, 5 + t.crit)), as: 1 + t.as / 100, ms: (1 + Math.min(40, t.ms) / 100) * mount, ls: r1(t.ls) };
}
function gearRow(it, attr) { return `<div class="g" ${attr}><span style="color:${RD[it.rar]};font-weight:700">${it.e} ${it.n} <small style="display:inline;opacity:.6">[${RARITY[it.rar].n} iLv${it.ilvl}]</small><small>${statTxt(it.st) || "능력치 없음"}</small></span></div>`; }
const SKILLS = {
  whirl: ["🌀", "회전베기 (Q)", "주변 적에게 큰 피해. 레벨당 피해·범위↑ 쿨타임↓"],
  fire: ["🔥", "화염구 (R)", "직선으로 날아가는 불덩이. Lv5부터 관통 · 캐릭터 Lv3 필요"],
  tough: ["🛡️", "강인함", "최대 체력 +5% / Lv"],
  tamer: ["🐾", "조련술", "길들이기 추가 성공 확률↑ · 동료 공격력 +10% / Lv"],
};
const craftIlvl = () => Math.max(2, Math.round(S.lv * 1.2 + 2));
const RECIPES = [
  { e: "🪓", n: "원시 무기 (마법)", cost: { wood: 3, stone: 4 }, make: () => genGear(craftIlvl(), 0, { slot: "weapon", rar: 1, pre: "원시" }) },
  { e: "🦴", n: "뼈 무기 (희귀)", cost: { bone: 6, stone: 4, hide: 2 }, make: () => genGear(craftIlvl(), 0, { slot: "weapon", rar: 2, pre: "뼈" }) },
  { e: "🥋", n: "가죽 갑옷 (마법)", cost: { hide: 4, fiber: 4 }, make: () => genGear(craftIlvl(), 0, { slot: "armor", rar: 1, pre: "가죽" }) },
  { e: "🛡️", n: "뼈 갑옷 (희귀)", cost: { hide: 6, bone: 6, fiber: 4 }, make: () => genGear(craftIlvl(), 0, { slot: "armor", rar: 2, pre: "뼈" }) },
  { e: "💍", n: "뼈 반지 (희귀)", cost: { bone: 4, fiber: 2 }, make: () => genGear(craftIlvl(), 0, { slot: "ring", rar: 2, pre: "뼈" }) },
  { e: "🧪", n: "약초 물약", cost: { berry: 3, fiber: 1 }, make: null },
  { e: "⚔️", n: "철 무기 (희귀)", cost: { ore: 6, wood: 2 }, make: () => genGear(craftIlvl() + 1, 0, { slot: "weapon", rar: 2, pre: "철" }) },
  { e: "🛡️", n: "철 갑옷 (희귀)", cost: { ore: 8, hide: 4 }, make: () => genGear(craftIlvl() + 1, 0, { slot: "armor", rar: 2, pre: "철" }) },
  { e: "👑", n: "공룡왕의 장비 (전설)", cost: { hide: 12, bone: 12, stone: 10, wood: 10 }, make: () => genGear(craftIlvl() + 2, 0, { rar: 3, pre: "공룡왕의" }) },
];
function craft(i) {
  const r = RECIPES[i];
  if (!Object.entries(r.cost).every(([k, v]) => (S.mat[k] || 0) >= v)) return;
  if (r.make && S.bag.length >= BAGCAP) return say("가방이 가득 찼어요.");
  for (const k in r.cost) S.mat[k] -= r.cost[k];
  if (r.make) { const it = r.make(); S.bag.push(it); say(`${it.e} ${it.n} 제작 완료! (${RARITY[it.rar].n})`, 2500); } else { S.potions++; say("🧪 약초 물약을 만들었어요!"); }
  hud(); renderGear();
}
let gearTab = "equip";
function bodyEquip() {
  const st = pstats(), cnt = setCounts();
  const sets = Object.entries(cnt).map(([id, n]) => `<div style="color:${RD[4]}">🌿 ${SETS[id].n} 세트 ${n}/3${n >= 3 ? " (전체 효과)" : n >= 2 ? " (절반 효과)" : ""} — ${statTxt(SETS[id].bonus)}</div>`).join("");
  return `<h2>⚔️ 장비 · Lv.${S.lv}</h2>
    <div>경험치 ${S.xp}/${xpNeed(S.lv)} · 최고 ${S.best}층</div>
    <div>체력 ${st.maxhp} · 공격력 ${st.dmg} · 방어 ${st.armor}<br>치명타 ${st.crit}% · 공속 ×${st.as.toFixed(2)} · 이속 ×${st.ms.toFixed(2)} · 흡혈 ${st.ls}%</div>${sets}
    <h3>착용 중 <small class="hintsm">${TOUCHY ? "길게 눌러 " : ""}끌어서 가방에 놓거나 눌러서 해제</small></h3>
    <div class="slots">${["weapon", "armor", "ring"].map(k => { const it = S.eq[k]; return `<div class="slot g" data-drop="slot:${k}" ${it ? `data-un="${k}" data-drag="eq:${k}" data-icon="${it.e}"` : ""} style="${it ? `--rc:${RD[it.rar]}` : ""}"><b>${it ? it.e : { weapon: "🗡️", armor: "🛡️", ring: "💍" }[k]}</b><span>${it ? it.n : SLOTS[k].n + " 비어 있음"}</span>${it ? `<small>${statTxt(it.st) || ""}</small>` : ""}</div>`; }).join("")}</div>
    <h3>가방 ${S.bag.length}/${BAGCAP} <small class="hintsm">눌러서 착용 · ${TOUCHY ? "길게 눌러 " : ""}장비 칸으로 끌어 놓기</small></h3>
    <div class="bagg" data-drop="bag:">${S.bag.map((it, i) => `<div class="tile g" data-eq="${i}" data-drag="bag:${i}" data-icon="${it.e}" style="--rc:${RD[it.rar]}" title="${it.n} · ${statTxt(it.st)}"><b>${it.e}</b><span>${it.n}</span><small>${RARITY[it.rar].n} · iLv${it.ilvl}</small></div>`).join("") || "<div class='empty'>비어 있어요. 던전·야생에서 장비를 찾거나 제작해 보세요!</div>"}</div>`;
}
function bodyChar() {
  const row = (l, r) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:2px 0"><span>${l}</span>${r}</div>`;
  const btn = (attr, ok, txt = "+") => `<button style="margin:0;padding:0 12px" ${attr} ${ok ? "" : "disabled"}>${txt}</button>`;
  const STAT = [["str", "💪 힘", "공격력 +2"], ["dex", "🏹 민첩", "치명타 +0.4% · 공속 +0.5%"], ["vit", "❤️ 체력", "체력 +8 · 방어 +1"]];
  return `<h2>📜 Lv.${S.lv} 캐릭터 <small>· ${rankName()}</small></h2><div>능력치 포인트 <b>${S.pts}</b> · 스킬 포인트 <b>${S.sp}</b> <small>(레벨업마다 +5 / +1)</small></div>
    <h3>능력치</h3>${STAT.map(([k, n, d]) => row(`${n} <b>${S.st[k]}</b> <small>${d} / pt</small>`, btn(`data-stat="${k}"`, S.pts > 0))).join("")}
    <h3>스킬</h3>${Object.entries(SKILLS).map(([k, [e, n, d]]) => row(`${e} ${n} <b>Lv.${S.sk[k]}</b>/10<br><small>${d}</small>`, btn(`data-skill="${k}"`, S.sp > 0 && S.sk[k] < 10 && (k !== "fire" || S.lv >= 3)))).join("")}
    <h3>동료 (${S.pets.length}/4)</h3>${S.pets.map((p, i) => { const b = DINOS[p.idx]; return row(`${b.e} ${b.n} Lv.${p.lv} <small>공격 ${Math.round(b.dmg * (.8 + .25 * p.lv))}${b.ride ? " · 탈것" : ""}</small>`, btn(`data-pet="${i}"`, true, S.petA === i ? "동행 중" : "동행")); }).join("") || "<div><small>야생 지대에서 공룡에게 V키로 먹이(🫐/🥩)를 주면 길들일 수 있어요.</small></div>"}`;
}
function bodyCraft() {
  const own = Object.entries(MAT).map(([k, [e, n]]) => `${e} ${n} ${S.mat[k] || 0}`).join(" · ");
  return `<h2>🔨 제작</h2><div><small>${own}</small></div>` + RECIPES.map((r, i) => {
    const ok = Object.entries(r.cost).every(([k, v]) => (S.mat[k] || 0) >= v);
    const cost = Object.entries(r.cost).map(([k, v]) => `<span style="color:${(S.mat[k] || 0) >= v ? "inherit" : "#c0392b"}">${MAT[k][0]}${v}</span>`).join(" ");
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:3px 0"><span>${r.e} ${r.n}<br><small>${cost}</small></span><button style="margin:0;padding:2px 12px" data-craft="${i}" ${ok ? "" : "disabled"}>제작</button></div>`;
  }).join("");
}
function renderGear() {
  const tabs = [["equip", "⚔️ 장비 (I)"], ["char", "📜 캐릭터 (K)"], ["craft", "🔨 제작 (C)"], ["build", "🏗️ 건설 (B)"], ["quest", "📜 의뢰 (J)"], ["map", "🗺️ 지도 (N)"], ["king", "👑 왕국 (L)"], ["arena", "⚔️ 아레나 (Y)"], ["look", "🧑 외형 (O)"]].filter(([k]) => (k !== "king" || FEAT.story) && (k !== "arena" || FEAT.arena)).map(([k, l]) => `<button data-tab="${k}" style="margin:0 6px 8px 0;padding:3px 10px;${gearTab === k ? "background:#fff" : ""}">${l}</button>`).join("");
  $("gear").classList.toggle("side", gearTab === "look" && innerWidth >= 700); $("gear").classList.toggle("lookt", gearTab === "look");
  $("gear").innerHTML = `<div class="grip"></div>` + (gearTab === "perk" ? "" : `<button id="closeX" class="x" title="닫기 (Esc)">✕</button>`) + `<div class="gtabs">` + (["ending", "perk", "arenaend"].includes(gearTab) ? "" : tabs) + `</div>` + (gearTab === "char" ? bodyChar() : gearTab === "craft" ? bodyCraft() : gearTab === "build" ? bodyBuild() : gearTab === "quest" ? bodyQuest() : gearTab === "map" ? bodyMap() : gearTab === "king" ? bodyKing() : gearTab === "ending" ? bodyEnding() : gearTab === "arena" ? bodyArena() : gearTab === "look" ? bodyLook() : gearTab === "perk" ? bodyPerk() : gearTab === "arenaend" ? bodyArenaEnd() : bodyEquip()) + (gearTab === "perk" ? "" : `<button id="closeGear">닫기</button>`);
  if (gearTab === "map") drawWorldMap();
}
$("gear").addEventListener("click", e => {
  const t = e.target, d = t.dataset || {};
  if (t.id === "closeGear" || t.id === "closeX") return closeShop();
  if (t.closest("[data-lookrand]")) { const R = n => Math.floor(Math.random() * n); S.look = { h: R(6), hc: R(7), sk: R(5), ey: R(5), tp: R(8), pc: R(6), bc: R(4), ot: R(4), bd: R(4), br: Math.random() < .7 ? 0 : 1 + R(2), hat: Math.random() < .6 ? 0 : R(5), cc: Math.random() < .5 ? 0 : 1 + R(8), c: 0 }; sfx("ui"); save(); netLook(); return renderGear(); }
  if (t.closest("[data-cbrand]")) { const R = n => Math.floor(Math.random() * n), b = R(5); S.cb = { head: R(5), body: b, legs: Math.random() < .7 ? b : R(5), hat: Math.random() < .7 ? 0 : R(CB_HAT.length), cape: R(CB_CAPE.length), cc: R(CB_COL.length), hc: R(CB_COL.length) }; save(); netLook(); return renderGear(); }
  if (d.cbpre) { S.cb = { ...CB_PRESET[+d.cbpre] }; delete S.cb.n; save(); netLook(); return renderGear(); }
  if (d.cb) { const [k, v] = d.cb.split(":"); S.cb = { ...cbOf(S.cb), [k]: +v }; save(); netLook(); return renderGear(); }
  if (d.look) { const [k, v] = d.look.split(":"); S.look = { ...lookOf(S.look), [k]: +v }; save(); netLook(); return renderGear(); }
  if (d.tab) { gearTab = d.tab; return renderGear(); }
  if (d.craft !== undefined) return craft(+d.craft);
  if (t.id === "qreroll") { S.qoffer = genOffers(); return renderGear(); }
  if (d.build !== undefined) { if (!(scene === "dun" && dun.kind === "world")) return say("🏗️ 건설은 오픈월드에서만 할 수 있어요.", 1800); buildSel = BUILD[+d.build]; closeShop(); say(`${buildSel.e} ${buildSel.n} — 스페이스: 놓기 · X: 철거 · B: 끄기 · 1~6: 조각 변경`, 3500); return; }
  if (d.qacc) { const q = S.qoffer.find(o => o.id == d.qacc); if (q && S.quests.length < 4) { S.quests.push(q); S.qoffer = S.qoffer.filter(o => o !== q); sfx("pick"); hud(); } return renderGear(); }
  if (d.qturn) { turnIn(+d.qturn); return renderGear(); }
  if (d.warp) return warpTo(d.warp);
  if (d.sreport !== undefined) { reportStory(); return renderGear(); }
  if (d.kwarp !== undefined) return warpTo("t0w");
  if (d.astart !== undefined) return startArena();
  if (d.aend !== undefined) return closeShop();
  if (d.apick) { S.arena.start = +d.apick; return renderGear(); }
  if (d.astyle) { const st = STYLES[d.astyle]; if (S.arena.own.includes(d.astyle)) S.arena.style = d.astyle; else if (S.bells >= st.cost) { S.bells -= st.cost; S.arena.own.push(d.astyle); S.arena.style = d.astyle; sfx("coin"); hud(); } return renderGear(); }
  if (d.aup) { const k = d.aup, lv = S.arena.up[k], cost = upCost(lv); if (lv < 20 && S.bells >= cost) { S.bells -= cost; S.arena.up[k]++; sfx("gear"); hud(); } return renderGear(); }
  if (d.aidle !== undefined) { const st = idleStored(); if (st > 0) { S.bells += st; S.idleT = Date.now(); sfx("coin"); say(`💤 방치 보상 ${st}벨을 받았어요!`, 2500); hud(); } return renderGear(); }
  if (d.adaily !== undefined) { const i = +d.adaily, dl = dailyTouch(), m = DAILY[i]; if (!dl.claimed[i] && m.get(dl) >= m.need) { dl.claimed[i] = 1; S.bells += m.bells; sfx("coin"); hud(); } return renderGear(); }
  if (d.end) { const home = d.end === "home" && scene === "dun" && dun.demon; closeShop(); if (home) leaveDungeon(false); return; }
  if (d.stat) { if (S.pts > 0) { S.st[d.stat]++; S.pts--; } }
  else if (d.skill) { if (S.sp > 0 && S.sk[d.skill] < 10 && (d.skill !== "fire" || S.lv >= 3)) { S.sk[d.skill]++; S.sp--; } }
  else if (d.pet !== undefined) { const i = +d.pet; S.petA = S.petA === i ? -1 : i; if (scene === "dun" && dun) dun.pet = activePet() ? { x: player.x, y: player.y, cd: 0 } : null; }
  else {
    const g = t.closest(".g"); if (!g) return;
    if (g.dataset.eq !== undefined) { const it = S.bag[+g.dataset.eq]; const old = S.eq[it.slot]; S.eq[it.slot] = it; S.bag.splice(+g.dataset.eq, 1); if (old) S.bag.push(old); }
    else if (g.dataset.un) { if (S.bag.length >= BAGCAP) return say("가방이 가득 찼어요."); S.bag.push(S.eq[g.dataset.un]); S.eq[g.dataset.un] = null; }
    else if (g.dataset.perk) { choosePerk(g.dataset.perk); return; }
    else return;
  }
  player.hp = Math.min(player.hp, pstats().maxhp); renderGear(); hud();
});
function togglePanel(tab) {
  if (!started) return;
  if (gearTab === "perk" && !$("gear").hidden) return;
  if (!$("gear").hidden) { if (gearTab === tab) return closeShop(); gearTab = tab; return renderGear(); }
  if (modal) return;
  gearTab = tab; modal = true; renderGear(); $("gear").hidden = false;
}
