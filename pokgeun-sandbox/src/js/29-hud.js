/* ===== 모바일 개편 v2 (2026-11-28) =====
   - 휴대폰(터치·좁은 화면): 마을·월드·집·동굴 어디서나 같은 HUD
     왼쪽 위 상태 카드(체력·시간·벨) · 오른쪽 위 주머니·메뉴·설정 · 왼쪽 아래 어디든 누르면 나오는 아날로그 조이스틱
     오른쪽 아래 상황 행동 버튼(앞에 있는 것에 따라 아이콘·이름이 바뀜) + 장면별 보조 버튼
   - 모든 화면: 월드에서 앞에 있는 것을 알려 주는 행동 안내, 동굴·이동석 이동 때 화면 전환, 새 지역에 들어서면 지역 이름 */
const M2 = TOUCHY || matchMedia("(max-width:760px)").matches;
document.body.classList.toggle("m2", M2);

/* ---- 월드 행동 안내: 바라보는 칸에 무엇이 있는지 ---- */
const POI_ACT = { shop: "🏪 상점 열기", inn: "🛏️ 여관에서 쉬기", board: "📋 의뢰 게시판", shrine: "🔷 이동석", portal: "🌀 마을로 돌아가기", cave: "🕳️ 동굴 들어가기", chest: "🎁 상자 열기", castle: "🏰 성", demon: "😈 마왕성" };
const CELL_ACT = { 1: "🪓 나무 베기", 2: "⛏️ 바위 캐기", 3: "🌿 덤불 채집", 4: "⛏️ 광석 캐기", 5: "🌵 선인장 채집" };
function ctxWorld() {
  const P = player, fx = P.x + P.dx * 26, fy = P.y + 8 + P.dy * 26, tx = Math.floor(fx / T), ty = Math.floor(fy / T);
  if (buildSel) return `🏗️ ${buildSel.n} 설치`;
  if (fishing) return fishing.state === "bite" ? "🎣 지금! 낚아채기" : "🎣 입질을 기다리는 중…";
  const v = dun.vil.find(v => Math.hypot(v.x - fx, v.y + 8 - fy) < 40); if (v) return `💬 ${v.name}${v.job ? " (" + v.job + ")" : ""}와 이야기`;
  const poi = interAt(tx, ty); if (poi && POI_ACT[poi.type] && (poi.type !== "demon" || FEAT.demon)) return poi.type === "chest" && S.wopen[poi.id] ? "📦 빈 상자" : POI_ACT[poi.type];
  const c = wc(tx, ty);
  if (c === CELL.BED) return "🛏️ 침대에서 쉬기"; if (c === CELL.FIRE) return "🔥 모닥불 쬐기";
  if (c === CELL.FARM) { const st = cropStage(ty * WN + tx); return st < 0 ? "🌱 씨앗 심기" : st < 2 ? "🌿 자라는 중" : "🧺 수확하기"; }
  if (dun.mons.some(m => !(m.wild && !m.hostile) && Math.hypot(m.x - P.x, m.y - P.y) < 72)) return "⚔️ 공격";
  for (const o of [26, 38]) { const gx = Math.floor((P.x + P.dx * o) / T), gy = Math.floor((P.y + 8 + P.dy * o) / T), g = wc(gx, gy); if (CELL_ACT[g]) return CELL_ACT[g]; }
  if (wb(tx, ty) === 0 && !inTown(tx, ty)) return "🎣 낚시하기";
  return "✋ 행동";
}
{ const base = ctxHint; ctxHint = function () { if (started && !modal && scene === "dun" && dun && dun.kind === "world") return ctxWorld(); return base(); }; }

/* ---- 상태 카드 ---- */
const HST = document.createElement("div"); HST.id = "hst"; $("stage").appendChild(HST);
function renderHst() {
  const st = pstats(), hp = clamp(player.hp / st.maxhp, 0, 1);
  const h = `<div class="hp${hp < .3 ? " low" : ""}"><i style="width:${(hp * 100).toFixed(1)}%"></i><span>❤️ ${Math.max(0, Math.ceil(player.hp))}/${st.maxhp}</span></div><div class="row"><span>${clockText()}</span><span>🔔 ${S.bells.toLocaleString()}</span><span class="lv">Lv.${S.lv}</span></div>`;
  if (h !== HST.__h) { HST.__h = h; HST.innerHTML = h; }
}

/* ---- 아날로그 조이스틱: 왼쪽 아래 아무 데나 누르면 그 자리에 나타나요 ---- */
const JZ = document.createElement("div"); JZ.id = "jzone"; JZ.innerHTML = '<div id="jbase"><i></i></div>'; $("stage").appendChild(JZ);
{ const base = JZ.firstChild, knob = base.firstChild; let id = null, ox = 0, oy = 0;
  const R = () => base.offsetWidth * .42 || 44;
  const mv = e => { let dx = e.clientX - ox, dy = e.clientY - oy; const l = Math.hypot(dx, dy), r = R(); if (l > r) { dx *= r / l; dy *= r / l; } knob.style.transform = `translate(${dx}px,${dy}px)`; JOY.x = dx / r; JOY.y = dy / r; JOY.on = l > 6; };
  const end = () => { id = null; JOY.on = false; JOY.x = JOY.y = 0; knob.style.transform = ""; JZ.classList.remove("on"); };
  JZ.addEventListener("pointerdown", e => { if (!started || modal || id !== null) return; e.preventDefault(); id = e.pointerId; try { JZ.setPointerCapture(id); } catch (_) {} const r = JZ.getBoundingClientRect(); ox = e.clientX; oy = e.clientY; base.style.left = (ox - r.left) + "px"; base.style.top = (oy - r.top) + "px"; JZ.classList.add("on"); mv(e); });
  JZ.addEventListener("pointermove", e => { if (e.pointerId === id) mv(e); });
  JZ.addEventListener("pointerup", end); JZ.addEventListener("pointercancel", end); JZ.addEventListener("lostpointercapture", end); }

/* ---- 행동 버튼 + 장면별 보조 버튼 ---- */
const ACT = document.createElement("div"); ACT.id = "act2"; ACT.innerHTML = '<div id="actx" hidden></div><div id="subs"></div><button id="abtn" data-k="Space"><b>✋</b><small>행동</small></button>'; $("stage").appendChild(ACT);
const SUBS = {
  out: [["🎒", "주머니", "inv"]],
  home: [["✋", "집기", "KeyX"]],
  dun: [["💨", "구르기", "KeyE"], ["🧪", "물약", "KeyF"], ["🌀", "회전", "KeyQ"], ["🔥", "화염", "KeyR"]],
  wild: [["💨", "구르기", "KeyE"], ["🧪", "물약", "KeyF"], ["🍖", "먹이", "KeyV"], ["🐎", "탈것", "KeyG"], ["⋯", "더보기", "more"]],
  world: [["💨", "구르기", "KeyE"], ["🧪", "물약", "KeyF"], ["🏗️", "건설", "build"], ["⋯", "더보기", "more"]],
  more: [["🌀", "회전", "KeyQ"], ["🔥", "화염", "KeyR"], ["🍖", "먹이", "KeyV"], ["🐎", "탈것", "KeyG"]],
  building: [["🗑️", "철거", "KeyX"], ["✅", "건설 끝", "KeyB"]],
};
let subMore = false;
function subKey() { const s = document.body.dataset.scene; if (s === "world" && buildSel) return "building"; return s; }
function renderSubs() {
  const k = subKey(), list = (SUBS[k] || []).concat(subMore && (k === "world" || k === "wild") ? SUBS.more : []), el = $("subs"), P = player;
  const cd = { KeyE: [P.eCd, 2.5], KeyQ: [P.qCd, P.qMax || 5], KeyR: [P.rCd, 3], KeyF: [P.fCd || 0, 1] };
  const sig = k + subMore + list.map(b => b[2]).join();
  if (el.__s !== sig) { el.__s = sig; el.innerHTML = list.map(([ic, n, a]) => `<button ${/^Key/.test(a) ? `data-k="${a}"` : `data-a="${a}"`} class="${a === "more" && subMore ? "on" : ""}">${ic}<small>${n}</small></button>`).join(""); }
  el.querySelectorAll("[data-k]").forEach(b => { const c = cd[b.dataset.k]; b.style.setProperty("--cd", c && c[0] > 0 ? clamp(c[0] / c[1], 0, 1) * 100 + "%" : "0%"); if (b.dataset.k === "KeyR") b.classList.toggle("dis", skLv("fire") <= 0); if (b.dataset.k === "KeyF") b.classList.toggle("dis", S.potions <= 0); });
}
ACT.addEventListener("pointerdown", e => {
  const b = e.target.closest("button"); if (!b || !started) return; e.preventDefault(); sfx("ui");
  if (b.dataset.k) { try { b.setPointerCapture(e.pointerId); } catch (_) {} b.classList.add("down"); press(b.dataset.k); const up = () => { b.classList.remove("down"); release(b.dataset.k); b.removeEventListener("pointerup", up); b.removeEventListener("pointercancel", up); }; b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); return; }
  const a = b.dataset.a; if (a === "more") { subMore = !subMore; renderSubs(); } else if (a === "inv") document.body.classList.toggle("showinv"); else if (a === "build") togglePanel("build");
});
function renderAct() {
  const h = started && !modal ? ctxHint() : "", ab = $("abtn"), x = $("actx");
  const ic = (h.match(/^\S+/) || ["✋"])[0], tx = h.replace(/^\S+\s*/, "");
  const sig = ic + "|" + tx; if (ab.__s !== sig) { ab.__s = sig; ab.innerHTML = `<b>${ic}</b><small>${tx.split(/[·(]/)[0].trim().split(" ").slice(-1)[0] || "행동"}</small>`; x.hidden = !tx || tx === "행동"; x.textContent = tx; }
  renderSubs();
}

/* ---- 장면 전환: 동굴·이동석·포털로 순간 이동할 때 부드럽게 ---- */
const FADE = document.createElement("div"); FADE.id = "fade"; $("stage").appendChild(FADE);
function fadeIn() { FADE.classList.remove("go"); FADE.style.opacity = "1"; void FADE.offsetWidth; FADE.classList.add("go"); FADE.style.opacity = "0"; }
{ const fw = f => function (...a) { if (started) fadeIn(); return f.apply(this, a); };   // 걸어서 넘는 지역 경계(seamTo…)는 그대로 이어져요
  enterDungeon = fw(enterDungeon); leaveDungeon = fw(leaveDungeon); warpTo = fw(warpTo); }

/* ---- 지역 이름: 새 지역에 1초 넘게 머물면 위에 잠깐 보여 줘요 ---- */
const REGN = { 0: "🌊 바다", 1: "🏖️ 모래 해변", 2: "🌾 초록 초원", 3: "🌲 속삭임 숲", 4: "🏜️ 노을 사막", 5: "❄️ 수정 설원", 6: "🪷 별빛 습지", 7: "⛰️ 수정 산맥", 8: "🏘️ 마을", 9: "🛤️ 길", 10: "😈 마왕령" };
const BAN = document.createElement("div"); BAN.id = "banner"; BAN.hidden = true; $("stage").appendChild(BAN);
const AREA = { cur: "", cand: "", t: 0, hideT: 0 };
function areaName() {
  if (scene === "out") return "🏘️ 포근 마을"; if (scene === "home") return "🏠 내 집";
  if (scene !== "dun" || !dun) return "";
  if (dun.kind === "world") { const px = Math.floor(player.x / T), py = Math.floor((player.y + 8) / T), tw = inTown(px, py); if (tw) return "🏘️ " + tw.name; const b = wb(px, py); return b === 9 ? AREA.cur || REGN[9] : REGN[b] || ""; }
  if (dun.kind === "wild") return "🌿 야생 지대"; if (dun.arena) return "🏟️ 아레나";
  return `🕳️ 동굴 ${dun.depth || 1}층`;
}
function tickArea(dt) {
  const n = started ? areaName() : ""; if (n !== AREA.cand) { AREA.cand = n; AREA.t = 0; } else AREA.t += dt;
  if (n && n !== AREA.cur && AREA.t > (AREA.cur ? 1 : 0)) { AREA.cur = n; BAN.textContent = n; BAN.hidden = false; BAN.classList.remove("show"); void BAN.offsetWidth; BAN.classList.add("show"); AREA.hideT = 2.6; }
  if (AREA.hideT > 0 && (AREA.hideT -= dt) <= 0) BAN.hidden = true;
}

/* ---- 패널: 휴대폰에서는 단축키 표시를 빼고 탭을 아이콘+이름으로 ---- */
{ const base = renderGear; renderGear = function (...a) { const r = base.apply(this, a); if (M2) $("gear").querySelectorAll("[data-tab]").forEach(b => { b.textContent = b.textContent.replace(/\s*\([A-Z]\)\s*$/, ""); }); return r; }; }

/* ---- 미니맵 누르면 지도 ---- */
const MTAP = document.createElement("div"); MTAP.id = "minitap"; $("stage").appendChild(MTAP);
MTAP.addEventListener("click", () => { if (started && !modal) { sfx("ui"); togglePanel("map"); } });
function placeMiniTap() {
  const on = M2 && started && !modal && WORLD && (scene === "out" || (scene === "dun" && dun && dun.kind === "world")); MTAP.hidden = !on; if (!on) return;
  const cw = ov.clientWidth || VW, k = 3 * (cw < 600 ? 1.4 : 1), f = cw / VW; MTAP.style.width = (52 * k * f + 6) + "px"; MTAP.style.height = (36 * k * f + 6) + "px"; MTAP.style.top = (miniTop() * f - 3) + "px";
}

/* ---- 매 프레임(가볍게) ---- */
let hudT2 = 0;
function hudTick(dt) {
  tickArea(dt);
  if ((hudT2 += dt) < .12) return; hudT2 = 0;
  document.body.classList.toggle("playing", started && !modal); document.body.classList.toggle("bmode", !!buildSel);
  if (!M2) return; renderHst(); renderAct(); placeMiniTap();
}
{ let lt = performance.now(); (function loop(now) { const dt = clamp((now - lt) / 1000, 0, .1); lt = now; hudTick(dt); requestAnimationFrame(loop); })(lt); }
Object.assign(window.__game, { JOY, ctxWorld, areaName, AREA, M2, setCell: (...a) => setCell(...a) });
