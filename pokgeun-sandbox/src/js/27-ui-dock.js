/* ===== UI/UX 개편: 설정 메뉴 · 메뉴 독 · 스킬 바 · 상황 안내 · 조작 도움말 · 모바일 조이스틱 ===== */
const tapKey = code => { press(code); setTimeout(() => release(code), 90); };
/* 설정(⚙️): 소리 · 화질 · 그래픽 스타일 · 시점을 한곳에 */
function renderCfg() {
  const it = (id, lab) => `<button data-cfg="${id}"><span>${lab}</span><b>${$(id).textContent.replace(/^\S+\s*/, "") || $(id).textContent}</b></button>`;
  $("cfg").innerHTML = `<h3>⚙️ 설정</h3>${it("snd", "🔊 소리")}${it("gfx", "🎨 화질")}${it("view", "🎥 시점")}<button data-cfg="keys"><span>⌨️ 조작 방법</span><b>H</b></button><button data-cfg="savebox"><span>💾 저장 관리</span><b>›</b></button><button data-cfg="stylebox"><span>🎨 그래픽 스타일</span><b>${VIEW2D ? "귀여운 2D" : STY_N[RSTYLE]}</b></button>`;
  const sb = $("cfg").querySelector('[data-cfg="snd"] b'); if (sb) sb.textContent = muted ? "꺼짐" : "켜짐";
}
$("cfgbtn").onclick = e => { e.stopPropagation(); const c = $("cfg"); c.hidden = !c.hidden; if (!c.hidden) renderCfg(); sfx("ui"); };
$("cfg").addEventListener("click", e => { const b = e.target.closest("[data-cfg]"); if (!b) return; e.stopPropagation(); const id = b.dataset.cfg; if (id === "keys") { $("cfg").hidden = true; return toggleKeys(); } if (id === "savebox") { $("cfg").hidden = true; return openSaveBox(); } if (id === "stylebox") { const cur = VIEW2D ? "2d" : RSTYLE, opt = [["real", "🌄 듀랑고풍", "실사 조명·안개·그림자"], ["cel", "✨ 원신풍", "애니 셀 셰이딩·외곽선·밝은 색"], ["toon", "🍭 파스텔 툰", "둥글고 부드러운 툰"], ["pbr", "🪵 부드러운 3D", "실사와 툰 사이"], ["2d", "🧸 귀여운 2D", "위에서 보는 도트 그림(가장 가벼움)"]];
      $("cfg").innerHTML = `<h3>🎨 그래픽 스타일</h3>` + opt.map(([k, n, d]) => `<button data-cfg="st:${k}"${k === cur ? ' style="outline:3px solid #ff8f5e"' : ""}><span>${n}<br><small style="opacity:.75">${d}</small></span><b>${k === cur ? "✓" : ""}</b></button>`).join("") + `<button data-cfg="back"><span>‹ 돌아가기</span></button>`; return; }
    if (id === "back") return renderCfg();
    if (id.startsWith("st:")) { const k = id.slice(3); try { if (k === "2d") localStorage.setItem("pokgeun-view", "2d"); else { localStorage.setItem("pokgeun-view", "3d"); localStorage.setItem("pokgeun-style", k); localStorage.removeItem("pokgeun-safe"); } } catch (e) {} save(); say("🎨 스타일을 바꾸는 중…", 2000);
      try { const u = new URL(location.href); u.searchParams.delete("style"); u.searchParams.delete("view"); u.hash = ""; history.replaceState(null, "", u); } catch (e) {} return setTimeout(() => location.reload(), 150); } $(id).click(); setTimeout(renderCfg, 60); });
addEventListener("pointerdown", e => { if (!e.target.closest("#cfg, #cfgbtn")) $("cfg").hidden = true; });
/* 메뉴 독: 단축키를 몰라도 클릭으로 */
const DOCK = [["equip", "⚔️", "장비", "I"], ["char", "📜", "캐릭터", "K"], ["craft", "🔨", "제작", "C"], ["build", "🏗️", "건설", "B"], ["quest", "📋", "의뢰", "J"], ["map", "🗺️", "지도", "N"], ["king", "👑", "왕국", "L"], ["arena", "🏟️", "아레나", "Y"], ["look", "🧑", "외형", "O"], ["keys", "❓", "도움말", "H"]];
function renderDock() {
  const badge = { char: S.pts + S.sp > 0, king: typeof storyReady === "function" && (() => { try { return storyReady(); } catch (e) { return false; } })() };
  const sig = JSON.stringify(badge) + (!$("gear").hidden && gearTab); if (sig === renderDock.sig) return; renderDock.sig = sig;
  $("dock").innerHTML = DOCK.map(([k, e, n, key]) => `<button data-dock="${k}" title="${n} (${key})" class="${!$("gear").hidden && gearTab === k ? "on" : ""}">${e}<small>${n}</small><i>${key}</i>${badge[k] ? '<em>!</em>' : ""}</button>`).join("");
}
$("menubtn").onclick = e => { e.stopPropagation(); document.body.classList.toggle("showdock"); sfx("ui"); };
$("dock").addEventListener("click", e => { const b = e.target.closest("[data-dock]"); document.body.classList.remove("showdock"); if (!b || !started) return; const k = b.dataset.dock; if (k === "keys") return toggleKeys(); if (k === "build") { if (!(scene === "dun" && dun && dun.kind === "world")) { say("🏗️ 건설은 오픈월드에서 할 수 있어요.", 1600); return; } } sfx("ui"); togglePanel(k); renderDock(); });
/* 조작 도움말 (H) */
function openSaveBox(msg = "") {   // 저장 관리: 내보내기·가져오기·백업 복원
  const k = $("keys"); k.hidden = false; const bk = listBackups(), tm = t => t ? new Date(t).toLocaleString() : "시간 정보 없음";
  k.innerHTML = `<div class="kc"><button class="x" data-close>✕</button><h2>💾 저장 관리</h2><div style="padding:6px 22px 18px">
    <p style="margin:4px 0 10px;font-size:13px">게임은 이 브라우저에 자동 저장돼요(10분마다 이전 저장을 백업 3개까지 보관). 다른 기기로 옮기거나 따로 보관하려면 내보내기를 쓰세요.</p>
    ${SAVE.error ? `<p style="color:#c0392b;font-weight:700">⚠️ 마지막 저장 실패: ${String(SAVE.error.name || SAVE.error).slice(0, 60)}</p>` : ""}${msg ? `<p style="font-weight:700">${msg}</p>` : ""}
    <h3>내보내기</h3><button data-sv="copy">📋 저장 데이터 복사</button><button data-sv="dl">⬇️ 파일로 받기</button>
    <h3>가져오기</h3><textarea id="svtext" rows="4" style="width:100%;font:12px monospace;border-radius:10px;padding:6px" placeholder="내보낸 저장 데이터를 붙여 넣거나 아래에서 파일을 고르세요"></textarea>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input type="file" id="svfile" accept=".json,application/json,text/plain"><button data-sv="imp">📂 가져와서 적용</button></div>
    <h3>백업에서 복원</h3>${bk.length ? bk.map(b => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:4px 0"><span>${tm(b.at)} · Lv.${b.lv} · ${b.bells.toLocaleString()} 벨</span><button data-sv="rst" data-k="${b.key}">복원</button></div>`).join("") : "<div><small>아직 백업이 없어요(10분 이상 플레이하면 생겨요).</small></div>"}
  </div></div>`;
}
$("keys").addEventListener("click", e => {
  const b = e.target.closest("[data-sv]"); if (!b) return; e.stopPropagation(); const a = b.dataset.sv;
  if (a === "copy") { const t = exportSave(); $("svtext").value = t; try { navigator.clipboard.writeText(t).then(() => say("📋 저장 데이터를 복사했어요.", 1800), () => say("아래 칸의 내용을 직접 복사해 주세요.", 2500)); } catch (_) { say("아래 칸의 내용을 직접 복사해 주세요.", 2500); } }
  else if (a === "dl") { const t = exportSave(), u = URL.createObjectURL(new Blob([t], { type: "application/json" })), l = document.createElement("a"); l.href = u; l.download = `pokgeun-save-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); $("svtext").value = t; }
  else if (a === "imp") { const f = $("svfile").files && $("svfile").files[0]; const go = t => { const m = importSave(t); if (m) openSaveBox("⚠️ " + m); else say("📂 저장을 가져왔어요. 다시 불러오는 중…", 2000); }; if (f) f.text().then(go); else go($("svtext").value); }
  else if (a === "rst") { const m = restoreBackup(b.dataset.k); if (m) openSaveBox("⚠️ " + m); else say("↩️ 백업에서 복원했어요. 다시 불러오는 중…", 2000); }
}, true);
function toggleKeys() {
  const k = $("keys"); k.hidden = !k.hidden; sfx("ui"); if (k.hidden) return;
  const row = (a, b) => `<div><kbd>${a}</kbd><span>${b}</span></div>`;
  k.innerHTML = `<div class="kc"><button class="x" data-close>✕</button><h2>⌨️ 조작 방법</h2><div class="kg">
    <section><h3>🕹️ 이동 · 카메라</h3>${row("WASD / 방향키", "이동 (카메라 기준)")}${row("마우스 드래그", "카메라 돌리기")}${row(", .", "카메라 왼쪽/오른쪽")}${row("P", "3인칭 ↔ 위에서 보기")}</section>
    <section><h3>✋ 행동</h3>${row("Space", "화면 아래 안내에 나온 행동")}${row("1~5", "마을 도구 (손·채·낚싯대·삽·묘목)")}${row("X", "집기 / 철거")}${row("Enter", "채팅")}</section>
    <section><h3>⚔️ 전투</h3>${row("Space", "공격 · 채집")}${row("Q", "회전베기")}${row("E", "구르기 (무적)")}${row("R", "화염구")}${row("F", "물약")}${row("V / G", "먹이주기 / 탈것")}</section>
    <section><h3>📋 메뉴</h3>${row("I K C", "장비 · 캐릭터 · 제작")}${row("B J N", "건설 · 의뢰 · 지도")}${row("L Y O", "왕국 · 아레나 · 외형")}${row("Esc", "창 닫기")}</section></div>
    <p class="tip">💡 오른쪽 아이콘 메뉴를 눌러도 돼요. 폰에서는 왼쪽 조이스틱으로 움직이고 오른쪽 버튼으로 행동해요.</p></div>`;
}
$("keys").addEventListener("click", e => { if (e.target.closest("[data-close]") || e.target === $("keys")) toggleKeys(); });
/* 상황 안내: 지금 스페이스를 누르면 무엇을 하는지 */
function ctxHint() {
  if (!started || modal) return "";
  if (scene === "out") {
    if (fishing) return fishing.state === "bite" ? "🎣 지금! 낚아채기" : "🎣 입질을 기다리는 중… (움직이면 취소)";
    const { px, py, tx, ty } = target(), v = villagers.find(v => Math.hypot(v.x - px, v.y - py) < 30);
    if (v) return `💬 ${v.name}와(과) 이야기하기`;
    if (inRect(SHOP, tx, ty)) return "🏪 상점 열기"; if (inRect(ARENA, tx, ty)) return "🏟️ 아레나"; if (inRect(CAVE, tx, ty)) return "🕳️ 던전에 들어가기"; if (inRect(WILDG, tx, ty)) return "🌍 오픈월드로 떠나기"; if (inRect(HOUSE, tx, ty)) return "🏠 집에 들어가기";
    const t = player.tool;
    if (t === 0) { const tr = treeAt(tx, ty); if (tr) return tr.age >= 60 ? (tr.fruit > 0 ? "🍎 나무를 흔들어 열매 따기" : "🌳 나무 흔들기") : "🌱 어린 나무 살펴보기"; return flowerAt(tx, ty) ? "🌷 꽃 꺾기" : ""; }
    if (t === 1) return "🦋 잠자리채 휘두르기"; if (t === 2) return terrain[ty] && terrain[ty][tx] === "w" ? "🎣 낚싯대 던지기" : "🎣 물을 바라보고 낚시"; if (t === 3) return "⛏️ 땅 파기"; if (t === 4) return (S.inv.sapling || 0) > 0 ? "🌱 묘목 심기" : "🌱 묘목이 없어요 (상점)";
  }
  if (scene === "home") return "🛋️ 가구 놓기 · 문 쪽으로 나가기";
  if (scene === "dun" && dun) { if (buildSel) return `🏗️ ${buildSel.n} 설치 · X 철거 · B 끄기`; return dun.kind === "world" ? "⚔️ 공격 · 🪓 채집 · 💬 말 걸기" : dun.arena ? "⚔️ 자동 공격 중 — 움직여서 피하기" : "⚔️ 공격"; }
  return "";
}
const TOUCHY = matchMedia("(pointer:coarse)").matches;
function updHint() { const h = ctxHint(), el = $("hint"); el.hidden = !h; if (h) el.innerHTML = `<kbd>${TOUCHY ? "A" : "Space"}</kbd> ${h}`; renderDock(); }
/* 스킬 바: 아이콘 · 단축키 · 쿨다운 */
function renderBar() {
  const el = $("abar"); if (!(started && scene === "dun" && dun)) { el.hidden = true; return; } el.hidden = false;
  const P = player, world = dun.kind === "world", wild = world || dun.kind === "wild", fire = skLv("fire") > 0;
  const sl = (code, key, ic, name, cd = 0, mx = 1, dis = false, extra = "") => `<button data-k="${code}" class="${dis ? "dis" : ""} ${cd > 0 ? "cd" : ""}" style="--cd:${clamp(cd / mx, 0, 1) * 100}%" title="${name} (${key})">${ic}<i>${key}</i><small>${cd > 0 ? cd.toFixed(1) : name}</small>${extra}</button>`;
  const html = sl("Space", TOUCHY ? "A" : "Space", "⚔️", wild ? "공격·채집" : "공격", P.atkCd > 0 ? P.atkCd : 0, .42 / pstats().as) + sl("KeyQ", "Q", "🌀", "회전베기", P.qCd, P.qMax || 5) + sl("KeyE", "E", "💨", "구르기", P.eCd, 2.5) + sl("KeyR", "R", fire ? "🔥" : "🔒", fire ? "화염구" : "Lv3·스킬", fire ? P.rCd : 0, 3, !fire) + sl("KeyF", "F", "🧪", "물약", P.fCd || 0, 1, S.potions <= 0, `<em>${S.potions}</em>`) + (wild ? sl("KeyV", "V", "🍖", "먹이주기") + sl("KeyG", "G", "🐎", P.mounted ? "내리기" : "탈것") : "");
  if (html !== el.__h) { el.__h = html; el.innerHTML = html; }
}
$("abar").addEventListener("pointerdown", e => { const b = e.target.closest("[data-k]"); if (!b) return; e.preventDefault(); tapKey(b.dataset.k); });
/* 주머니: 접었다 펴기 */
$("inv").addEventListener("click", () => { document.body.classList.toggle("showinv"); sfx("ui"); });
/* 모바일: 아날로그 조이스틱 */
{ const J = $("joy"), K = J && J.querySelector("i"); let id = null, held = new Set();
  const set = (dx, dy) => { const want = new Set(), l = Math.hypot(dx, dy); if (l > 14) { const nx = dx / l, ny = dy / l; if (nx > .38) want.add("ArrowRight"); if (nx < -.38) want.add("ArrowLeft"); if (ny > .38) want.add("ArrowDown"); if (ny < -.38) want.add("ArrowUp"); }
    for (const k of held) if (!want.has(k)) release(k); for (const k of want) if (!held.has(k)) press(k); held = want; };
  const mv = e => { const r = J.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = e.clientX - cx, dy = e.clientY - cy; const l = Math.hypot(dx, dy), m = r.width * .38; if (l > m) { dx *= m / l; dy *= m / l; } K.style.transform = `translate(${dx}px,${dy}px)`; set(dx, dy); };
  if (J) { J.addEventListener("pointerdown", e => { e.preventDefault(); id = e.pointerId; try { J.setPointerCapture(id); } catch (_) {} mv(e); });
    J.addEventListener("pointermove", e => { if (e.pointerId === id) mv(e); });
    const end = () => { id = null; K.style.transform = ""; set(0, 0); }; J.addEventListener("pointerup", end); J.addEventListener("pointercancel", end); J.addEventListener("lostpointercapture", end); } }