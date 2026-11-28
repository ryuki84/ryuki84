/* ---------- 충돌 ---------- */
const treeAt = (x, y) => trees.find(t => t.x === x && t.y === y);
const rockAt = (x, y) => rocks.find(r => r.x === x && r.y === y);
const flowerAt = (x, y) => flowers.find(f => f.x === x && f.y === y && !f.back);
function roomSolid(x, y) {
  if (y >= RH) return !(y === RH && (x === 5 || x === 6));   // 출입구
  if (x < 0 || x >= RW || y < 2) return true;
  return S.room.some(r => r.x === x && r.y === y && !FURN[r.id].rug && !FURN[r.id].wall);
}
function solidTile(x, y) {
  if (scene === "home") return roomSolid(x, y);
  if (scene === "dun" && dun.kind === "world") return wsolid(x, y);
  if (scene === "dun") { const c = dun.map[y]?.[x]; return c === undefined || c === "#" || c === "w" || c === "T" || c === "R"; }
  if (x < 0 || y < 0 || x >= W || y >= H) return WORLD && WORLD.vreg ? wsolid(x + WORLD.vreg.x, y + WORLD.vreg.y) : true;
  return terrain[y][x] === "w" || inRect(HOUSE, x, y) || inRect(SHOP, x, y) || inRect(CAVE, x, y) || (FEAT.arena && inRect(ARENA, x, y)) || !!treeAt(x, y) || !!rockAt(x, y);
}
function blocked(cx, cy, hw, hh) {
  for (const [ox, oy] of [[-hw, -hh], [hw, -hh], [-hw, hh], [hw, hh]])
    if (solidTile(Math.floor((cx + ox) / T), Math.floor((cy + oy) / T))) return true;
  return false;
}

/* ---------- UI ---------- */
function obj(n) { const c = n.charCodeAt(n.length - 1) - 0xAC00; return n + (c >= 0 && c % 28 ? "을" : "를"); }
let msgTimer = 0;
function say(text, ms = 2600) {
  const m = $("msg"); m.textContent = text; m.hidden = false;
  clearTimeout(msgTimer); msgTimer = setTimeout(() => m.hidden = true, ms);
}
function count() { return Object.entries(S.inv).reduce((a, [k, v]) => a + (k === "sapling" ? 0 : v), 0); }
function add(id, n = 1) {
  if (id !== "sapling" && count() + n > CAP) { say("주머니가 가득 찼어요! 상점에서 팔아 보세요."); return false; }
  S.inv[id] = (S.inv[id] || 0) + n; hud(); return true;
}
function hud() {
  document.body.dataset.scene = scene === "dun" && dun ? (dun.kind === "wild" ? "wild" : dun.kind === "world" ? "world" : "dun") : scene;
  $("bells").textContent = `🔔 ${S.bells.toLocaleString()} 벨 · ⚔️ Lv.${S.lv}${S.pts + S.sp > 0 ? " ✨" : ""}`;
  const rows = Object.entries(S.inv).filter(([, v]) => v > 0).map(([k, v]) => `<div><span>${ITEMS[k].e} ${ITEMS[k].n}</span><span>×${v}</span></div>`).join("");
  $("inv").innerHTML = `<b>🎒 <span class="konly">주머니 </span>${count()}/${CAP} <u>▾</u></b><div class="invb">${rows}<div><span>🧪 물약</span><span>×${S.potions}</span></div>${matRow()}</div>`;
  renderFurn(); renderRpg();
  $("tools").style.display = scene === "dun" ? "none" : "flex";
  $("tools").innerHTML = TOOLS.map((t, i) => `<div class="tool ${i === player.tool ? "on" : ""}" data-i="${i}"><i>${i + 1}</i>${t.e}<small>${i === 4 ? "×" + (S.inv.sapling || 0) : t.n}</small></div>`).join("");
}
function renderFurn() {
  const el = $("furn");
  if (scene !== "home") { el.hidden = true; return; }
  const rows = Object.entries(S.fin).filter(([, v]) => v > 0);
  el.innerHTML = `<b>🛋️ 가구 (${S.room.length}개 배치)</b>` +
    (rows.map(([k, v]) => `<div class="it ${furnSel === k ? "on" : ""}" data-k="${k}" data-drag="furn:${k}" data-icon="${FURN[k].e}"><span>${FURN[k].e} ${FURN[k].n}</span><span>×${v}</span></div>`).join("") || "<div>보유 가구가 없어요. 상점에서 사 보세요!</div>") +
    `<small>✋ 가구를 방 화면으로 끌어다 놓기<br>또는 선택 후 스페이스로 놓기 · X 집기<br>아래 출구로 나가기</small>`;
  el.hidden = false;
}
$("furn").addEventListener("click", e => { const t = e.target.closest(".it"); if (t) { furnSel = furnSel === t.dataset.k ? null : t.dataset.k; renderFurn(); } });
$("tools").addEventListener("click", e => { const t = e.target.closest(".tool"); if (t) { player.tool = +t.dataset.i; cancelFish(); hud(); } });
function clockText() {
  const h = Math.floor(clock) % 24, m = Math.floor((clock % 1) * 60);
  return `${WXI[WX.eff] || (h < 6 || h >= 19 ? "🌙" : "☀️")} ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/* ---------- 상점 ---------- */
function openShop() {
  modal = true; cancelFish(); renderShop(); $("shop").hidden = false;
}
function closeShop() { modal = false; $("shop").hidden = true; $("gear").hidden = true; save(); }
function renderShop() {
  const sell = Object.entries(S.inv).filter(([k, v]) => v > 0 && ITEMS[k].p > 0);
  const total = sell.reduce((a, [k, v]) => a + ITEMS[k].p * v, 0);
  $("shop").innerHTML = `<div class="grip"></div><button class="x" id="closeShopX">✕</button><h2>🐿️ 다람쥐 상점</h2>
    <div>어서 오세요! 🔔 ${S.bells.toLocaleString()} 벨</div>
    <div class="sellzone" data-drop="sell:">💰 팔 물건을 여기로 ${TOUCHY ? "길게 눌러 " : ""}끌어 놓으세요 <small>(또는 오른쪽 버튼)</small></div>
    ${sell.map(([k, v]) => `<div class="row drag" data-drag="inv:${k}" data-icon="${ITEMS[k].e}"><span>${ITEMS[k].e} ${ITEMS[k].n} ×${v}</span><span>${(ITEMS[k].p * v).toLocaleString()}</span></div>`).join("") || "<div>팔 물건이 없어요.</div>"}
    <h3>🛋️ 가구</h3>
    ${Object.entries(FURN).map(([k, f]) => `<div class="row"><span>${f.e} ${f.n}${f.wall ? " (벽)" : f.rug ? " (바닥)" : ""}${S.fin[k] ? ` · 보유 ${S.fin[k]}` : ""}</span><button data-buy="${k}" ${S.bells >= f.p ? "" : "disabled"}>${f.p}</button></div>`).join("")}
    <h3>⚔️ 모험</h3>
    <div class="row"><span>🧪 체력 물약 (보유 ${S.potions})</span><button data-pot ${S.bells >= 60 ? "" : "disabled"}>60</button></div>
    ${S.bag.map((it, i) => `<div class="row drag" data-drag="bag:${i}" data-icon="${it.e}"><span style="color:${RD[it.rar]};font-weight:700">${it.e} ${it.n}</span><button data-sell="${i}">${it.price}</button></div>`).join("")}
    ${S.bag.some(it => it.rar < 3) ? `<button id="sellGear">전설 제외 장비 모두 팔기</button>` : ""}
    <button id="sellAll" ${total ? "" : "disabled"}>모두 팔기 (+${total.toLocaleString()})</button>
    <button id="buySap" ${S.bells >= 100 ? "" : "disabled"}>🌱 묘목 사기 (100)</button>
    <button id="closeShop">닫기 (Esc)</button>`;
  $("sellAll").onclick = () => { sfx("coin"); S.bells += total; sell.forEach(([k]) => S.inv[k] = 0); hud(); renderShop(); };
  $("buySap").onclick = () => { if (S.bells >= 100) { S.bells -= 100; add("sapling"); renderShop(); } };
  $("closeShop").onclick = closeShop; $("closeShopX").onclick = closeShop;
  $("shop").querySelectorAll("[data-pot]").forEach(b => b.onclick = () => { if (S.bells >= 60) { S.bells -= 60; S.potions++; hud(); renderShop(); } });
  $("shop").querySelectorAll("[data-sell]").forEach(b => b.onclick = () => { const it = S.bag.splice(+b.dataset.sell, 1)[0]; S.bells += it.price; hud(); renderShop(); });
  if ($("sellGear")) $("sellGear").onclick = () => { S.bag = S.bag.filter(it => it.rar >= 3 ? true : (S.bells += it.price, false)); hud(); renderShop(); };
  $("shop").querySelectorAll("[data-buy]").forEach(b => b.onclick = () => {
    const f = FURN[b.dataset.buy]; if (S.bells < f.p) return;
    sfx("coin"); S.bells -= f.p; S.fin[b.dataset.buy] = (S.fin[b.dataset.buy] || 0) + 1; hud(); renderShop();
  });
}
