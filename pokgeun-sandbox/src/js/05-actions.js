/* ---------- 행동 ---------- */
function target() {
  const px = player.x + player.dx * 26, py = player.y + 8 + player.dy * 26;
  return { px, py, tx: Math.floor(px / T), ty: Math.floor(py / T) };
}
function dropFruit(tree) {
  const spots = [];
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const x = tree.x + i, y = tree.y + j;
    if ((i || j) && !solidTile(x, y) && !ground.some(g => g.x === x && g.y === y)) spots.push([x, y]);
  }
  spots.sort(() => R() - .5);
  const n = Math.min(tree.fruit, spots.length);
  for (let i = 0; i < n; i++) ground.push({ x: spots[i][0], y: spots[i][1], k: tree.kind });
  tree.fruit -= n; tree.t = 0; tree.sh = .5; sfx("chop");
  burst((tree.x + .5) * T, (tree.y + .5) * T - 8, 12, ["#4a9a4a", "#6dbb4f", "#2f6b3a"], 60, .7, 120, 2.2);
}
function cancelFish() { fishing = null; }
function act() {
  if (!started) return;
  if (modal) return;
  if (scene === "home") return actHome();
  if (scene === "dun") return attack();
  if (fishing) {
    if (fishing.state === "bite") { catchFish(); } else { say("너무 일렀어요… 찌가 움직일 때까지 기다려요."); }
    fishing = null; return;
  }
  const { px, py, tx, ty } = target();
  const v = villagers.find(v => Math.hypot(v.x - px, v.y - py) < 30);
  if (v) return talk(v);
  if (inRect(SHOP, tx, ty)) return openShop();
  if (FEAT.arena && inRect(ARENA, tx, ty)) return togglePanel("arena");
  if (inRect(CAVE, tx, ty)) return enterDungeon(1);
  if (inRect(HOUSE, tx, ty)) return enterHome();
  const tool = player.tool; pAnim(tool === 2 ? "Throw" : tool === 3 ? "1H_Melee_Attack_Chop" : tool === 1 ? "1H_Melee_Attack_Slice_Horizontal" : tool === 4 ? "PickUp" : "Interact", .6);
  if (tool === 0) {
    const tr = treeAt(tx, ty), fl = flowerAt(tx, ty);
    if (tr && tr.age >= 60) { if (tr.fruit > 0) { dropFruit(tr); say("우수수! 열매가 떨어졌어요 🍎"); } else say("열매가 없어요. 조금 기다려 봐요."); }
    else if (tr) say("아직 어린 나무예요 🌱");
    else if (fl) { if (add("flower")) { sfx("pick"); fl.back = 90; say(`${fl.e} 꽃을 땄어요!`); } }
    else if (rockAt(tx, ty)) say("단단한 바위예요.");
  } else if (tool === 1) {
    const b = bugs.findIndex(b => Math.hypot(b.x - px, b.y - py) < 40);
    if (b >= 0) { if (add(bugs[b].id)) { sfx("pick"); burst(bugs[b].x, bugs[b].y - 10, 6, ["#fff", "#f28cb0"], 50, .3); say(`${ITEMS[bugs[b].id].e} ${obj(ITEMS[bugs[b].id].n)} 잡았어요!`); bugs.splice(b, 1); } }
    else say("휙! …아무것도 없었어요.");
  } else if (tool === 2) {
    if (terrain[ty]?.[tx] === "w") { fishing = { tx, ty, state: "wait", t: 1.5 + R() * 3 }; sfx("splash"); burst((tx + .5) * T, (ty + .6) * T, 6, ["#a8dcf5", "#fff"], 40, .3); say("찌를 던졌어요…", 1200); }
    else say("물가에서 연못을 바라보고 사용해요.");
  } else if (tool === 3) {
    const t = terrain[ty]?.[tx];
    if ((t !== "g" && t !== "s") || solidTile(tx, ty) || flowerAt(tx, ty)) return say("여기는 팔 수 없어요.");
    const r = R(); sfx("chop"); burst((tx + .5) * T, (ty + .6) * T, 8, t === "s" ? ["#dcc788", "#ead9a0"] : ["#8a6a44", "#5a3f28"], 60, .4);
    if (t === "s" && r < .45) { if (add("shell")) say("🐚 조개를 찾았어요!"); }
    else if (t === "g" && r < .2) { if (add("fossil")) say("🦴 화석을 파냈어요!!"); }
    else say("흙만 나왔어요.");
  } else if (tool === 4) {
    if (!(S.inv.sapling > 0)) return say("묘목이 없어요. 상점에서 살 수 있어요.");
    if (terrain[ty]?.[tx] !== "g" || solidTile(tx, ty) || flowerAt(tx, ty) || inRect({x:HOUSE.x,y:HOUSE.y+2,w:HOUSE.w,h:1}, tx, ty)) return say("여기에는 심을 수 없어요.");
    if (trees.some(t => Math.abs(t.x - tx) <= 1 && Math.abs(t.y - ty) <= 1)) return say("나무끼리 너무 가까워요.");
    sfx("place"); S.inv.sapling--; trees.push({ x: tx, y: ty, age: 0, fruit: 0, kind: FRUITS[R() * 3 | 0], t: 0 });
    hud(); say("🌱 묘목을 심었어요! 1분쯤 지나면 자라요."); save();
  }
}
let WDUN = null;
function seamToWorld() {
  const r = scene === "home" ? WORLD.hreg : WORLD.vreg, P = player, wx = P.x + r.x * T, wy = P.y + r.y * T, dx = P.dx, dy = P.dy; cancelFish(); furnSel = null; save();
  if (WDUN && WDUN.kind === "world") { scene = "dun"; dun = WDUN; hud(); } else enterWorld({ x: wx, y: wy }, "🌍 넓은 세상으로 나왔어요 — 북쪽 길을 따라가면 포근 왕국 왕도예요.");
  P.x = wx; P.y = wy; P.dx = dx; P.dy = dy; S.wpos = { x: wx, y: wy }; hud();
}
function seamToLocal(kind) {
  const r = kind === "home" ? WORLD.hreg : WORLD.vreg, P = player, dx = P.dx, dy = P.dy; WDUN = dun; S.wpos = { x: P.x, y: P.y };
  scene = kind === "home" ? "home" : "out"; dun = null; P.x -= r.x * T; P.y -= r.y * T; P.dx = dx; P.dy = dy; P.mounted = false; furnSel = null; cancelFish(); hud(); renderBar();
  if (kind === "home") say("🏠 집 안이에요. 가구를 놓아 보세요 (지붕이 사라져 안이 보여요)", 2200); else say("🏡 포근 마을", 1200);
}
function enterHome() {
  save(); scene = "home"; furnSel = null; cancelFish();
  player.x = 6 * T; player.y = (RH - 1) * T + 16; player.dx = 0; player.dy = -1;
  hud(); say("집에 들어왔어요. 가구를 놓아 보세요 🏠", 3000);
}
function leaveHome() {
  if (WORLD && WORLD.vreg) return seamToWorld();
  scene = "out"; save();
  player.x = 4.5 * T; player.y = 5.5 * T; player.dx = 0; player.dy = 1;
  hud(); say("저장했어요 💾");
}
function canPlace(id, x, y) {
  const f = FURN[id];
  if (x < 0 || x >= RW) return false;
  const here = S.room.filter(r => r.x === x && r.y === y);
  if (f.wall) return (y === 0 || y === 1) && !here.some(r => FURN[r.id].wall);
  if (y < 2 || y >= RH) return false;
  if (f.rug) return !here.some(r => FURN[r.id].rug);
  if ((y === RH - 1 && (x === 5 || x === 6))) return false;           // 출입구는 비워 두기
  return !here.some(r => !FURN[r.id].rug);
}
function pickUp(tx, ty) {
  const here = S.room.filter(r => r.x === tx && r.y === ty);
  const r = here.find(r => !FURN[r.id].rug) || here[0];
  if (!r) return false;
  sfx("pick"); S.room.splice(S.room.indexOf(r), 1); S.fin[r.id] = (S.fin[r.id] || 0) + 1;
  hud(); say(`${FURN[r.id].e} ${FURN[r.id].n}${/[가-힣]/.test(FURN[r.id].n) && (FURN[r.id].n.charCodeAt(FURN[r.id].n.length - 1) - 0xAC00) % 28 ? "을" : "를"} 집었어요.`, 1500);
  return true;
}
function actHome() {
  const { tx, ty } = target();
  if (furnSel && canPlace(furnSel, tx, ty)) {
    sfx("place"); S.room.push({ id: furnSel, x: tx, y: ty }); S.fin[furnSel]--;
    if (S.fin[furnSel] <= 0) furnSel = null;
    hud(); save(); return;
  }
  if (pickUp(tx, ty)) return save();
  say(furnSel ? "여기에는 놓을 수 없어요." : "오른쪽 위 목록에서 가구를 선택하세요.", 1500);
}