/* ===== 드래그 앤 드롭 (마우스·터치 공통) ===== */
const DND = { on: false, src: null, ghost: null, over: null, timer: 0, sx: 0, sy: 0, pid: null };
function equipBag(i, want) {
  const it = S.bag[i]; if (!it) return; if (want && it.slot !== want) { say(`${SLOTS[want].n} 칸에는 ${SLOTS[it.slot].n}만 낄 수 있어요.`, 1500); return; }
  const old = S.eq[it.slot]; S.eq[it.slot] = it; S.bag.splice(i, 1); if (old) S.bag.push(old); sfx("gear"); afterGear();
}
function unequip(k) { if (!S.eq[k]) return; if (S.bag.length >= BAGCAP) return say("가방이 가득 찼어요."); S.bag.push(S.eq[k]); S.eq[k] = null; sfx("gear"); afterGear(); }
function afterGear() { player.hp = Math.min(player.hp, pstats().maxhp); if (!$("gear").hidden) renderGear(); if (!$("shop").hidden) renderShop(); hud(); save(); }
function sellPouch(k) { const n = S.inv[k] || 0; if (!n || !ITEMS[k] || !(ITEMS[k].p > 0)) return; S.bells += ITEMS[k].p * n; S.inv[k] = 0; sfx("coin"); hud(); renderShop(); }
function sellBag(i) { const it = S.bag[i]; if (!it) return; S.bag.splice(i, 1); S.bells += it.price; sfx("coin"); hud(); renderShop(); }
function homeTileAt(cx, cy) {   // 화면 좌표 → 집 바닥 타일 (3D 레이캐스트)
  const r = $("c").getBoundingClientRect(); if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return null;
  const rc = new THREE.Raycaster(); rc.setFromCamera(new THREE.Vector2((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), cam);
  const hit = new THREE.Vector3(); if (!rc.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit)) return null; return { x: Math.floor(hit.x), y: Math.floor(hit.z) };
}
const DROP = {   // [드래그 종류][놓는 곳 종류] → 처리
  bag: { slot: (s, d) => equipBag(+s, d), sell: s => sellBag(+s) },
  eq: { bag: s => unequip(s), slot: (s, d) => { if (s !== d) say("같은 종류 칸으로만 옮길 수 있어요.", 1200); } },
  inv: { sell: s => sellPouch(s) },
  furn: { canvas: (id, _, e) => { if (scene !== "home") return; const t = homeTileAt(e.clientX, e.clientY); if (!t) return; if (FURN[id].wall) t.y = 1; if (!(S.fin[id] > 0)) return; if (!canPlace(id, t.x, t.y)) { say("거기에는 놓을 수 없어요.", 1200); return; } sfx("place"); S.room.push({ id, x: t.x, y: t.y }); S.fin[id]--; if (furnSel === id && S.fin[id] <= 0) furnSel = null; hud(); save(); } },
};
function dropTargetAt(x, y) { const el = document.elementFromPoint(x, y); if (!el) return null; const d = el.closest("[data-drop]"); if (d) return d; return el.id === "c" || el.id === "o" || el.closest("#stage") && !el.closest("#gear, #shop, #furn, #inv, #dock, #abar, .pill") ? $("c") : null; }
function dndStart(e) {
  const [type, val] = DND.src.dataset.drag.split(":"); DND.on = true; DND.type = type; DND.val = val; document.body.classList.add("dragging");
  const g = DND.ghost = document.createElement("div"); g.id = "ghost"; g.textContent = DND.src.dataset.icon || DND.src.textContent.trim().slice(0, 2); document.body.appendChild(g); dndMove(e);
  try { navigator.vibrate && navigator.vibrate(15); } catch (_) {} sfx("pick");
}
function dndMove(e) {
  DND.ghost.style.transform = `translate(${e.clientX - 28}px,${e.clientY - 34}px)`;
  const t = dropTargetAt(e.clientX, e.clientY), k = t ? (t.id === "c" ? "canvas" : t.dataset.drop.split(":")[0]) : null, ok = t && DROP[DND.type] && DROP[DND.type][k];
  if (DND.over && DND.over !== t) DND.over.classList.remove("dropok"); DND.over = ok ? t : null; if (ok && t.id !== "c") t.classList.add("dropok"); DND.ghost.classList.toggle("ok", !!ok);
}
function dndEnd(e) {
  clearTimeout(DND.timer); const was = DND.on; DND.pid = null;
  if (!was) { DND.src = null; return; }
  DND.on = false; document.body.classList.remove("dragging"); DND.ghost.remove(); if (DND.over) DND.over.classList.remove("dropok");
  const t = dropTargetAt(e.clientX, e.clientY); if (t) { const [k, d] = t.id === "c" ? ["canvas"] : t.dataset.drop.split(":"), fn = DROP[DND.type] && DROP[DND.type][k]; if (fn) fn(DND.val, d, e); }
  DND.src = null; DND.justDropped = performance.now();
}
addEventListener("pointerdown", e => {
  const s = e.target.closest("[data-drag]"); if (!s || e.button > 0) return; DND.src = s; DND.sx = e.clientX; DND.sy = e.clientY; DND.pid = e.pointerId;
  if (e.pointerType !== "mouse") DND.timer = setTimeout(() => { if (DND.src === s && !DND.on) dndStart(DND.last || e); }, 260);
}, true);
addEventListener("pointermove", e => {
  if (DND.pid !== e.pointerId || !DND.src) return; DND.last = e; const d = Math.hypot(e.clientX - DND.sx, e.clientY - DND.sy);
  if (!DND.on) { if (e.pointerType === "mouse" && d > 6) dndStart(e); else if (e.pointerType !== "mouse" && d > 10) { clearTimeout(DND.timer); DND.src = null; } return; }
  dndMove(e);
}, true);
addEventListener("pointerup", e => { if (DND.pid === e.pointerId) dndEnd(e); }, true);
addEventListener("pointercancel", e => { if (DND.pid === e.pointerId && !DND.on) { clearTimeout(DND.timer); DND.src = null; } }, true);
document.addEventListener("touchmove", e => { if (DND.on) { e.preventDefault(); const t = e.touches[0]; if (t) dndMove({ clientX: t.clientX, clientY: t.clientY }); } }, { passive: false });
document.addEventListener("touchend", e => { if (DND.on) { const t = e.changedTouches[0]; dndEnd({ clientX: t.clientX, clientY: t.clientY }); } }, { passive: false });
addEventListener("click", e => { if (DND.justDropped && performance.now() - DND.justDropped < 300) { e.stopPropagation(); e.preventDefault(); } }, true);
/* 모바일 시트: 손잡이를 아래로 끌어서 닫기 */
for (const id of ["gear", "shop"]) { const el = $(id); let y0 = null;
  el.addEventListener("pointerdown", e => { if (e.target.closest(".grip")) { y0 = e.clientY; try { el.setPointerCapture(e.pointerId); } catch (_) {} } });
  el.addEventListener("pointermove", e => { if (y0 === null) return; const dy = Math.max(0, e.clientY - y0); el.style.transform = `translateY(${dy}px)`; });
  const up = e => { if (y0 === null) return; const dy = e.clientY - y0; y0 = null; el.style.transform = ""; if (dy > 70 && !(id === "gear" && gearTab === "perk")) closeShop(); };
  el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); }
renderDock();
window.__game = { RSTYLE, get V2() { return V2; }, VIEW2D, v2on, critters, get VRMV() { return VRMV; }, get NAT() { return NAT; }, get R3() { return R3; }, get VRMS() { return VRMS; }, spawnNearV: () => spawnNear(), VILM, get hitStop() { return hitStop; }, get MONM() { return MONM; }, ENT, MON_WIND, ELITE, eliteify, eliteAI, saveApi: { save, exportSave, importSave, listBackups, restoreBackup, backupNow, SAVE, SAVE_VER },  get DINOM() { return DINOM; }, wsolid, bioBase,  equipBag, unequip, homeTileAt, openShop, enterHome: () => enterHome(), get furnSel() { return furnSel; }, ctxHint, renderBar,  get sun() { return sun; }, get GRD() { return GRD; }, get S3() { return S3; }, setYaw: v => { camYaw = v; camManT = vtime + 999; }, get MAN() { return MAN; }, get KAY() { return KAY; }, get curPE() { return curPE; }, pAnim, WX, setWeather: t => { WX.type = t; WX.t = 9999; }, startArena, arenaTick, startWave, gemGain, choosePerk, finishArena, openPerk, autoFight, idleStored, dailyTouch, genArena, mkMonT, get PERKS() { return PERKS; }, get ARES() { return ARES; }, sEvent, storyReady, reportStory, openKing, nearKing, demonAI, finalizeDemon, enterDemon, onDemonDefeat, mkDemon, damageP, addFame, get STORY() { return STORY; }, NET, spawnNear, worldTick, killMon, setBuild: i => { buildSel = i == null ? null : BUILD[i]; }, farmAct, winteract, genOffers, turnIn, warpTo, worldAct, enterWorld, getWorld, get WORLD() { return WORLD; }, get dun() { return dun; }, wc, wb, setClock: v => { clock = v; }, fireball, feed, toggleMount, craft, togglePanel, enterDungeon, get dun() { return dun; }, pstats, genGear, attack, scene: () => scene, furnSelSet: v => { furnSel = v; renderFurn(); }, player, trees, S, keys, act, get fishing() { return fishing; }, bugs, villagers }; // 디버그/테스트용