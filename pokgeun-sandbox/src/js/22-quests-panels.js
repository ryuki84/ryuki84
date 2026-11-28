/* ----- 퀘스트 ----- */
const QMATS = ["wood", "stone", "fiber", "hide", "bone", "meat", "ore", "berry"];
function genOffers() {
  const o = [], mk = (type, need, label, reward) => ({ id: uid(), type, need, have: 0, label, reward });
  const n1 = 6 + ri(8); o.push(mk("kill", n1, `몬스터 ${n1}마리 처치`, { bells: n1 * 22, xp: n1 * 10 }));
  const n2 = 4 + ri(5); o.push(mk("dino", n2, `야생 공룡 ${n2}마리 사냥`, { bells: n2 * 35, xp: n2 * 14 }));
  const mt = QMATS[ri(QMATS.length)], n3 = 10 + ri(14); o.push(mk("mat:" + mt, n3, `${MAT[mt][1]} ${n3}개 모으기`, { bells: n3 * 12, xp: n3 * 6 }));
  if (ri(2)) o.push(mk("disc", 2, "새 이동석 2곳 발견하기", { bells: 300, xp: 150, gear: true })); else o.push(mk("lair", 1, "몬스터 소굴 1곳 소탕하기", { bells: 600, xp: 300, gear: true }));
  return o;
}
function qEvent(type, a, n = 1) {
  sEvent(type, a, n); let ch = false;
  for (const q of S.quests) {
    if (q.have >= q.need) continue; let ok = false;
    if (q.type === "kill" && type === "kill") ok = true; else if (q.type === "dino" && type === "kill" && a && a.wild) ok = true; else if (q.type === "disc" && type === "disc") ok = true;
    else if (q.type === "lair" && type === "lair") ok = true; else if (q.type.startsWith("mat:") && type === "mat" && q.type.slice(4) === a) ok = true;
    if (ok) { q.have = Math.min(q.need, q.have + n); ch = true; if (q.have >= q.need) { say(`✅ 퀘스트 완료: ${q.label} — J 의뢰창에서 보상을 받으세요!`, 3500); sfx("gear"); } }
  }
  if (ch) hud();
}
function turnIn(id) {
  const i = S.quests.findIndex(q => q.id === id), q = S.quests[i]; if (!q || q.have < q.need) return;
  S.quests.splice(i, 1); addFame(8); S.bells += q.reward.bells; sfx("coin"); gainXp(q.reward.xp);
  if (q.reward.gear) { if (S.bag.length < BAGCAP) { const it = genGear(Math.max(2, Math.round(S.lv * 1.2 + 3)), 1.5); S.bag.push(it); say(`🎁 보상: ${it.e} ${it.n}!`, 3000); } else say("가방이 가득 차서 장비 보상은 받지 못했어요.", 2500); }
  else say(`🔔 ${q.reward.bells}벨 · 경험치 ${q.reward.xp} 보상!`, 2500);
  hud(); save();
}
function questLine() {
  const out = [], st = STORY[S.story.stage];
  if (st && FEAT.story) { const idx = st.obj.findIndex((o, i) => (o.k === "lv" ? S.lv : S.story.p[i] || 0) < o.n), o = st.obj[idx < 0 ? 0 : idx], i = idx < 0 ? 0 : idx, have = o.k === "lv" ? Math.min(S.lv, o.n) : S.story.p[i] || 0;
    out.push(storyReady() ? `📖 ${st.t}: 왕에게 보고하세요 ❗` : `📖 ${st.t}: ${o.label} (${have}/${o.n})`); }
  const q = S.quests[0]; if (q) out.push(`📜 ${q.label} (${q.have}/${q.need})`); return out.join("<br>");
}

/* ----- 패널: 건설 · 의뢰 · 지도 ----- */
function costHtml(cost) { return Object.entries(cost).map(([k, v]) => `<span style="color:${(S.mat[k] || 0) >= v ? "inherit" : "#c0392b"}">${MAT[k][0]}${v}</span>`).join(" "); }
function bodyBuild() {
  return `<h2>🏗️ 건설</h2><div><small>오픈월드에서 조각을 고른 뒤 바라보는 칸에 스페이스로 놓아요 · X: 철거(절반 환급) · B: 건설 모드 끄기 · 마을 안은 지을 수 없어요.</small></div>` +
    BUILD.map((b, i) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:3px 0"><span>${b.e} ${b.n}<br><small>${costHtml(b.cost)}</small></span><button style="margin:0;padding:2px 12px" data-build="${i}" ${canAfford(b.cost) ? "" : "disabled"}>${buildSel === b ? "선택됨" : "선택"}</button></div>`).join("");
}
function bodyQuest() {
  if (!S.qoffer || !S.qoffer.length) S.qoffer = genOffers();
  const act = S.quests.map(q => `<div style="padding:3px 0"><b>${q.label}</b> <small>(${q.have}/${q.need})</small><br><small>🔔${q.reward.bells} · ✨${q.reward.xp}${q.reward.gear ? " · 🎁장비" : ""}</small> ${q.have >= q.need ? `<button style="margin:0 0 0 6px;padding:1px 10px" data-qturn="${q.id}">보상 받기</button>` : ""}</div>`).join("") || "<div><small>진행 중인 의뢰가 없어요.</small></div>";
  const off = S.qoffer.map(q => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:3px 0"><span>${q.label}<br><small>🔔${q.reward.bells} · ✨${q.reward.xp}${q.reward.gear ? " · 🎁장비" : ""}</small></span><button style="margin:0;padding:2px 12px" data-qacc="${q.id}" ${S.quests.length >= 4 ? "disabled" : ""}>수락</button></div>`).join("");
  return `<h2>📜 의뢰 게시판</h2><h3>진행 중 (${S.quests.length}/4)</h3>${act}<h3>새 의뢰</h3>${off}<button id="qreroll" style="margin-top:6px">의뢰 새로고침</button>`;
}
function bodyMap() {
  const W = getWorld(), wps = Object.keys(S.wp).map(resolvePoi).filter(p => p && p.wp);
  return `<h2>🗺️ 월드 맵</h2><canvas id="wmap" width="360" height="360" style="width:100%;max-width:360px;image-rendering:pixelated;border:3px solid var(--ink);border-radius:8px;background:#14121c"></canvas>
    <h3>이동석 (${wps.length}) — 발견한 곳으로 바로 이동</h3>` + (wps.map(p => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:2px 0"><span>${p.town ? "🏘️" : "🔷"} ${p.name}</span><button style="margin:0;padding:1px 12px" data-warp="${p.id}">이동</button></div>`).join("") || "<div><small>이동석에 가까이 가면 발견돼요. 마을마다 하나씩 있어요.</small></div>");
}
function drawWorldMap() {   // 끝없는 월드: 내 주변 480칸(발견한 곳만)
  const cvm = document.getElementById("wmap"); if (!cvm) return; const x = cvm.getContext("2d"), W = getWorld(), k = 3, n = 120; x.fillStyle = "#14121c"; x.fillRect(0, 0, cvm.width, cvm.height);
  const inW = scene === "dun" && dun && dun.kind === "world", cxp = inW ? player.x / T : W.vreg.x + 15, cyp = inW ? player.y / T : W.vreg.y + 10, bx0 = Math.floor(cxp / 4) - n / 2, by0 = Math.floor(cyp / 4) - n / 2;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const d = W.disc.has(DKEY(bx0 + i, by0 + j)); x.globalAlpha = d ? 1 : .22; x.fillStyle = BIO_CS[wb((bx0 + i) * 4 + 2, (by0 + j) * 4 + 2)]; x.fillRect(i * k, j * k, k, k); }   // 안 가 본 곳은 흐리게
  x.globalAlpha = 1;
  for (const p of poisNear(bx0 * 4, by0 * 4, (bx0 + n) * 4, (by0 + n) * 4)) { const i = (p.x >> 2) - bx0, j = (p.y >> 2) - by0; if (i < 0 || j < 0 || i >= n || j >= n || !W.disc.has(DKEY(p.x >> 2, p.y >> 2))) continue; const c = { town: "#ffd34d", cave: "#7a5a9a", maze: "#e0a040", shrine: "#6ee7ff", camp: "#e8505a", ruin: "#b8bcc8", lair: "#ff7a1a", portal: "#6ee7ff", demon: "#c03aff" }[p.type]; if (!c) continue; x.fillStyle = c; x.fillRect(i * k - 2, j * k - 2, 5, 5); }
  { const i = Math.floor(cxp / 4) - bx0, j = Math.floor(cyp / 4) - by0; x.fillStyle = "#fff"; x.fillRect(i * k - 2, j * k - 2, 5, 5); }
  x.fillStyle = "#fff8"; x.font = "11px sans-serif"; x.fillText(`좌표 ${Math.round(cxp - WC0)}, ${Math.round(cyp - WC0)}`, 6, 352);
}
function warpTo(id) {
  const p = resolvePoi(id); if (!p || !S.wp[id]) return;
  if (scene === "dun" && dun.kind !== "world") return say("던전 안에서는 이동할 수 없어요.", 1800);
  closeShop(); const pos = { x: (p.x + .5) * T, y: (p.y + 2.5) * T };
  if (scene === "dun") { player.x = pos.x; player.y = pos.y; camInit = false; dun.mons = dun.mons.filter(m => m.poi); getWorld().first = true; sfx("portal"); burst(pos.x, pos.y, 20, ["#6ee7ff", "#fff"], 100, .7, -30, 1); say(`📍 ${p.name}(으)로 이동했어요.`, 2000); }
  else { S.wpos = pos; enterWorld(pos, `📍 ${p.name}(으)로 이동했어요.`); }
}

/* ----- 월드용 엔티티 그리기 / 미니맵 ----- */
function drawWorldEnts(g, P, pz) {
  for (const v of dun.vil) {
    if (Math.abs(v.x / T - camT.x) > 22 || Math.abs((v.y + 8) / T - camT.z) > 16) continue;
    const e = entM(v, () => v.model === "king" ? mkKingM() : v.model === "guard" ? mkGuardM() : mkVilEnt(v), g.dyn), mv = v.talk <= 0 && (v.vx || v.vy); e.emote = v.talk > 0 ? "Wave" : null; if (e.cbk && !v.model) e.pose = v.talk > 0 ? "Cheer" : null;
    e.g.position.set(v.x / T, 0, (v.y + 8) / T); if (mv) face(e.g, v.vx, v.vy); else if (v.talk > 0 || (v.fixed && Math.hypot(v.x - P.x, v.y - P.y) < 6 * T)) face(e.g, P.x - v.x, P.y - v.y); else if (v.fixed) face(e.g, 0, 1); animE(e, mv, e.mon ? 5 : 8, .5);
    if (v.model === "king") { labelT("👑 " + v.name, v.x / T, (v.y + 8) / T, 2.4, "#ffe27a"); if (FEAT.story && S.story.stage < STORY.length) labelT(storyReady() ? "❗" : "❓", v.x / T, (v.y + 8) / T, 3.1, "#ffd34d"); } else if (Math.hypot(v.x - P.x, v.y - P.y) < 90) labelT(v.name, v.x / T, (v.y + 8) / T, 2, "#fff3d6");
  }
  for (const o of NET.others.values()) {
    const mkO = () => o.look && o.look.cbk && KAY.ready ? Object.assign(mkChibi(o.look, null, false), { walk: null }) : mkHeroFromLook(o.look, o.col || 0x3d6ed0), e = ent(o, mkO, g.dyn); { const sg = KAY.ready + "" + JSON.stringify(o.look || 0); if (e.osig !== undefined && e.osig !== sg) swapInto(e, mkO()); e.osig = sg; } e.g.position.set(o.x / T, 0, (o.y + 8) / T); face(e.g, o.dx || 0, o.dy || 1); animE(e, !!o.mv, 10, .75);
    labelT(o.name || "모험가", o.x / T, (o.y + 8) / T, 2.1, "#9be39b"); if (o.sayT > 0) labelT(o.say, o.x / T, (o.y + 8) / T, 2.7, "#ffffff");
  }
  if (NET.on) { labelT(NET.name, P.x / T, pz, 2.1, "#ffe27a"); if (NET.mySayT > 0) labelT(NET.mySay, P.x / T, pz, 2.7, "#ffffff"); }
  if (fishing) { const be = ent(fishing, () => ({ g: mkBobber() }), g.dyn); be.g.position.set(fishing.tx + .5, -.05 + (fishing.state === "bite" ? Math.abs(Math.sin(vtime * 20)) * .2 : Math.sin(vtime * 3) * .03), fishing.ty + .7); labelT(fishing.state === "bite" ? "❗" : "…", P.x / T, pz, 2.4, fishing.state === "bite" ? "#ff6a6a" : "#ffffff"); }
  for (const p of poisNear(camT.x - 12, camT.z - 26, camT.x + 12, camT.z + 9)) { if (Math.abs(p.x - camT.x) > 12 || Math.abs(p.y - camT.z) > 9) continue; if (p.type === "maze") labelT("🏛️ " + p.name, p.x + .5, p.y + 17.5, .3); else if (p.type === "shop" || p.type === "inn") labelT(p.name, p.x + 1.5, p.y + 2.3, .3); else if (p.type === "board" || p.type === "shrine" || p.type === "portal") labelT(p.name, p.x + .5, p.y + 1.3, .4, p.type === "board" ? "#fff3d6" : "#8fefff"); else if (p.type === "castle" && !p.deco) labelT("🏰 포근성", p.x + 5, p.y + 5.4, .4, "#ffe27a"); else if (p.type === "demon") labelT("😈 마왕성", p.x + 4.5, p.y + 4.4, .4, "#ff6a6a"); else if (p.type === "cave") labelT("동굴 (깊이 " + clamp(1 + Math.floor(p.dist / 45), 1, 12) + ")", p.x + 1, p.y + 2.5, .3); else if (p.type === "chest") labelT(S.wopen[p.id] ? "빈 상자" : p.name, p.x + .5, p.y + 1.2, .3, "#f5d142"); }
}
function drawMiniWorld() {
  const loc = scene !== "dun", o0x = loc ? WORLD.vreg.x * T : 0, o0y = loc ? WORLD.vreg.y * T : 0;   // 마을(지역 장면)에서는 월드 좌표로 바꿔서 그려요
  const W = WORLD, P = { x: player.x + o0x, y: player.y + o0y }, px = Math.floor(P.x / T), py = Math.floor((P.y + 8) / T), hw = 26, hh = 18, k = 3 * (ov.clientWidth < 600 ? 1.4 : 1);
  const ox = VW - hw * 2 * k - 12, oy = MOBUI() ? miniTop() : LVH - hh * 2 * k - 12;
  ctx.fillStyle = "rgba(10,8,20,.7)"; ctx.fillRect(ox - 3, oy - 3, hw * 2 * k + 6, hh * 2 * k + 6);
  for (let j = -hh; j < hh; j++) for (let i = -hw; i < hw; i++) {
    const x = px + i, y = py + j; if (x < 0 || y < 0 || x >= WN || y >= WN) continue; const c = wc(x, y);
    ctx.fillStyle = c === 1 ? "#2f6b2f" : c === 20 || c === 2 || c === 4 || (c >= 10 && c !== 13 && c !== 18) ? "#7a7e8c" : BIO_CS[wb(x, y)]; ctx.fillRect(ox + (i + hw) * k, oy + (j + hh) * k, k + .4, k + .4);
  }
  const dot = (x, y, col, r) => { const sx = ox + (x / T - px + hw) * k, sy = oy + (y / T - py + hh) * k; if (sx < ox || sy < oy || sx > ox + hw * 2 * k || sy > oy + hh * 2 * k) return; ctx.fillStyle = col; ctx.fillRect(sx - r, sy - r, r * 2, r * 2); };
  for (const p of poisNear(px - hw, py - hh, px + hw, py + hh)) { const c = { town: "#ffd34d", cave: "#b58aff", maze: "#e0a040", shrine: "#6ee7ff", camp: "#e8505a", ruin: "#d8dce8", lair: "#ff7a1a", portal: "#6ee7ff", demon: "#c03aff" }[p.type]; if (c) dot((p.x + .5) * T, (p.y + .5) * T, c, k * 1.2); }
  if (!loc) for (const m of dun.mons) dot(m.x, m.y, m.boss ? "#ff9f1c" : m.wild && !m.hostile ? "#7be07b" : "#ff5a5a", k * (m.boss ? 1.3 : .7));
  for (const o of NET.others.values()) dot(o.x, o.y + 8, "#8affb0", k * 1.1);
  dot(P.x, P.y + 8, "#ffffff", k * 1.1);
}
function worldInfo() { const px = Math.floor(player.x / T), py = Math.floor((player.y + 8) / T), b = wb(px, py); return `${BIO_E[b]} ${BIO_N[b]} ${"★".repeat(wTier(px, py) + 1)} (${px - WORLD.spawn.x},${py - WORLD.spawn.y})`; }
