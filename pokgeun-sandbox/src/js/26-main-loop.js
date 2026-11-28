/* ---------- 메인 루프 ---------- */
let last = performance.now(), hudT = 0, rpgT = 0, hintT = 0;
function frame(now) {
  const dt = clamp((now - last) / 1000, 0, .05); last = now;
  update(dt); netTick(dt); stepParts(dt); draw();
  if ((hudT += dt) > .5) { hudT = 0; $("clock").textContent = clockText(); }
  if ((hintT += dt) > .15) { hintT = 0; updHint(); renderBar(); }
  if (scene === "dun" && (rpgT += dt) > .1) { rpgT = 0; renderRpg(); }
  requestAnimationFrame(frame);
}
player.hp = pstats().maxhp;
resize(); hud(); loadKay(); loadDinos(); loadMonsters(); load2D();
if (SAVE.from.startsWith(SAVE_KEY + ".bak")) setTimeout(() => say("⚠️ 저장 파일이 손상돼서 가장 최근 백업으로 불러왔어요. (깨진 원본은 따로 보관했어요)", 7000), 1200); $("clock").textContent = clockText(); setMute(muted);
$("snd").onclick = () => { setMute(!muted); sfx("ui"); };
const STY_N = { toon: "파스텔 툰", cel: "원신풍", pbr: "부드러운 3D", real: "듀랑고풍" };
$("sty").textContent = "🖌️ " + STY_N[RSTYLE];
$("sty").onclick = () => {
  const nx = { real: "toon", toon: "cel", cel: "pbr", pbr: "real" }[RSTYLE]; save(); sfx("ui"); say(`🖌️ ${STY_N[nx]} 스타일로 바꾸는 중…`, 3000);
  try { localStorage.setItem("pokgeun-style", nx); } catch (e) {}
  try { const u = new URL(location.href); u.searchParams.delete("style"); u.hash = "style=" + nx; history.replaceState(null, "", u); } catch (e) { location.hash = "style=" + nx; }
  setTimeout(() => location.reload(), 150);
};
function toggleView() { TPV_ON = !TPV_ON; try { localStorage.setItem("pokgeun-tpv", TPV_ON ? "1" : "0"); } catch (e) {} $("view").textContent = TPV_ON ? "🎥 3인칭" : "🎥 탑뷰"; sfx("ui"); say(TPV_ON ? "🎥 3인칭 시점 — 마우스 드래그(또는 , . 키)로 카메라를 돌려요" : "🎥 위에서 보는 시점", 2200); }
$("view").textContent = TPV_ON ? "🎥 3인칭" : "🎥 탑뷰"; $("view").onclick = toggleView;
{ let drag = null; const cv0 = $("c"), pts = new Map(); let pinch0 = 0, zoom0 = 1;
  const setZoom = z => { camZoom = clamp(z, .55, 1.7); try { localStorage.setItem("pokgeun-zoom", camZoom.toFixed(2)); } catch (e) {} };
  const pd = () => { const [a, b] = [...pts.values()]; return Math.hypot(a.x - b.x, a.y - b.y); };
  cv0.addEventListener("pointerdown", e => { pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2) { pinch0 = pd(); zoom0 = camZoom; drag = null; } else drag = { x: e.clientX, id: e.pointerId }; });
  addEventListener("pointermove", e => { if (pts.has(e.pointerId)) pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pts.size === 2 && pinch0) { setZoom(zoom0 * pinch0 / Math.max(20, pd())); return; } if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x; drag.x = e.clientX; if (lookMode()) { lookYaw += dx * .012; lookManT = vtime; } else if (TPV()) { camYaw -= dx * .008; camManT = vtime; } });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch0 = 0; if (drag && e.pointerId === drag.id) drag = null; };
  addEventListener("pointerup", up); addEventListener("pointercancel", up);
  cv0.addEventListener("wheel", e => { e.preventDefault(); setZoom(camZoom * (e.deltaY > 0 ? 1.08 : 1 / 1.08)); }, { passive: false });
  cv0.style.touchAction = "none"; }
$("gfx").onclick = () => { applyQuality({ high: "mid", mid: "low", low: "high" }[gfxLv]); sfx("ui"); say(`🎨 그래픽 품질: ${QUAL.n}`, 1600); };
requestAnimationFrame(frame);