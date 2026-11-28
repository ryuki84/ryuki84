/* ---------- 입력 ---------- */
const keys = new Set();
function press(code) {
  if (keys.has(code)) return;
  keys.add(code);
  if (!started) { if (code === "Space" || code === "Enter") begin(); return; }
  if (code === "Escape" && !$("keys").hidden) return toggleKeys();
  if (code === "Escape" && modal && gearTab !== "perk") closeShop();
  else if (code === "Space" || code === "KeyZ") act();
  else if (scene === "dun" && code === "KeyQ") whirl();
  else if (scene === "dun" && code === "KeyE") dash();
  else if (scene === "dun" && code === "KeyF") drinkPotion();
  else if (code === "KeyI") togglePanel("equip");
  else if (code === "KeyK") togglePanel("char");
  else if (code === "KeyC") togglePanel("craft");
  else if (scene === "dun" && code === "KeyR") fireball();
  else if (scene === "dun" && code === "KeyV") feed();
  else if (scene === "dun" && code === "KeyG") toggleMount();
  else if (code === "Enter") openChat();
  else if (code === "KeyB") { if (buildSel) { buildSel = null; say("건설 모드를 껐어요.", 1200); } else togglePanel("build"); }
  else if (code === "KeyJ") togglePanel("quest");
  else if (code === "KeyL") togglePanel("king");
  else if (code === "KeyY") togglePanel("arena");
  else if (code === "KeyP") toggleView();
  else if (code === "KeyH") toggleKeys();
  else if (code === "KeyO") togglePanel("look");
  else if (code === "KeyN") togglePanel("map");
  else if (code === "KeyX" && scene === "dun" && dun.kind === "world") worldRemove();
  else if (code === "KeyX" && scene === "home") { const { tx, ty } = target(); if (pickUp(tx, ty)) save(); }
  else if (code === "KeyM") { setMute(!muted); sfx("ui"); }
  else if (code === "KeyT") { fast = !fast; if (!fast) { const d = new Date(); clock = d.getHours() + d.getMinutes() / 60; } say(fast ? "⏩ 시간이 빨리 흘러요 (T로 해제)" : "⏱️ 현재 시각으로 돌아왔어요"); }
  else if (buildSel && scene === "dun" && /^Digit[1-6]$/.test(code)) { buildSel = BUILD[+code.slice(5) - 1]; say(`${buildSel.e} ${buildSel.n}`, 1200); }
  else if (/^Digit[1-5]$/.test(code)) { player.tool = +code.slice(5) - 1; cancelFish(); hud(); }
}
function release(code) { keys.delete(code); }
addEventListener("keydown", e => {
  if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
  if (e.repeat) return;
  press(e.code);
});
addEventListener("keyup", e => release(e.code));
addEventListener("blur", () => keys.clear());
document.querySelectorAll("#touch [data-k]").forEach(b => {
  const codes = b.dataset.k.split(" ");
  b.addEventListener("pointerdown", e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} b.classList.add("down"); codes.forEach(press); });
  const up = () => { b.classList.remove("down"); codes.forEach(release); };
  b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
});
$("tinv").onclick = () => document.body.classList.toggle("showinv");
let resetArmed = false;
$("reset").onclick = () => {
  if (!resetArmed) { resetArmed = true; $("reset").textContent = "정말 지울까요? 한 번 더 누르세요"; setTimeout(() => { resetArmed = false; $("reset").textContent = "새로 시작"; }, 4000); return; }
  save(); backupNow(true); resetting = true; try { localStorage.removeItem(SAVE_KEY); } catch (e) {} location.reload();
};
addEventListener("visibilitychange", () => { if (document.hidden) save(); });
addEventListener("pagehide", save);
function begin() { started = true; $("help").hidden = true; hud(); say("나무를 흔들고, 낚시하고, 곤충을 잡아 보세요!", 3500); setTimeout(idleToast, 4000); }
$("start").onclick = begin;
