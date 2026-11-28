/* ---------- 업데이트 ---------- */
function update(dt) {
  vtime += dt;
  clock = (clock + dt / 3600 * (fast ? 180 : 1)) % 24;
  if (!started || modal) return;
  // 이동
  let ix = (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
  let iy = (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0);
  let amag = 1; if (JOY.on && !(ix || iy)) { ix = JOY.x; iy = JOY.y; amag = clamp(Math.hypot(ix, iy), .35, 1); }   // 아날로그: 모든 방향 + 살짝 밀면 천천히
  player.mv = !!(ix || iy); player.rawF = iy < 0 && Math.abs(ix) < Math.abs(iy) * .4;
  if (keys.has("Comma") || keys.has("Period")) { camYaw += (keys.has("Comma") ? 1 : -1) * 2.2 * dt; camManT = vtime; }
  if (TPV() && (ix || iy)) { const c = Math.cos(camYaw), sn = Math.sin(camYaw), wx = ix * c + iy * sn, wz = -ix * sn + iy * c; ix = Math.abs(wx) < 1e-6 ? 0 : wx; iy = Math.abs(wz) < 1e-6 ? 0 : wz; }
  if (scene === "dun" && player.dash > 0 && !(ix || iy)) { ix = player.dx; iy = player.dy; }
  if (ix || iy) {
    cancelFish();
    if (scene === "dun") { const l = Math.hypot(ix, iy); if (player.dash <= 0) { player.dx = ix / l; player.dy = iy / l; } }
    else if (Math.abs(ix) >= Math.abs(iy)) { player.dx = Math.sign(ix); player.dy = 0; } else { player.dx = 0; player.dy = Math.sign(iy); }
    const len = Math.hypot(ix, iy), sp = (scene === "dun" ? (player.dash > 0 ? 340 : 120 * pstats().ms) : 120) * dt / len * (player.dash > 0 ? 1 : amag);
    if (!blocked(player.x + ix * sp, player.y + 8, 9, 6)) player.x += ix * sp;
    if (!blocked(player.x, player.y + 8 + iy * sp, 9, 6)) player.y += iy * sp;
  }
  if (WORLD && WORLD.vreg && started) {   // 한 맵: 지역 경계를 걸어서 넘으면 바로 이어짐
    const ftx = Math.floor(player.x / T), fty = Math.floor((player.y + 8) / T);
    if (scene === "out" && (ftx < 0 || fty < 0 || ftx >= W || fty >= H)) seamToWorld();
    else if (scene === "dun" && dun && dun.kind === "world") { const v = WORLD.vreg, h = WORLD.hreg; if (ftx >= v.x && ftx < v.x + W && fty >= v.y && fty < v.y + H) seamToLocal("village"); else if (ftx >= h.x && ftx < h.x + RW && fty >= h.y + 2 && fty < h.y + RH) seamToLocal("home"); }
  }
  if (scene === "dun") { updateDun(dt); return; }
  if (scene === "home") { if (Math.floor((player.y + 8) / T) >= RH) leaveHome(); return; }
  // 바닥 아이템 줍기
  const ptx = Math.floor(player.x / T), pty = Math.floor((player.y + 8) / T);
  for (let i = ground.length - 1; i >= 0; i--) if (ground[i].x === ptx && ground[i].y === pty && add(ground[i].k)) { ground.splice(i, 1); sfx("pick"); }
  // 낚시
  if (fishing) {
    fishing.t -= dt;
    if (fishing.t <= 0) {
      if (fishing.state === "wait") { fishing.state = "bite"; fishing.t = .9; sfx("ui"); }
      else { say("놓쳤어요…"); fishing = null; }
    }
  }
  // 나무 성장
  for (const t of trees) {
    t.age += dt;
    if (t.age >= 60 && t.fruit < 3) { t.t += dt; if (t.t > 45) { t.fruit++; t.t = 0; } }
  }
  for (const f of flowers) if (f.back > 0) f.back -= dt;
  // 주민
  for (const c of critters) {   // 동물: 가끔 쉬고, 가끔 짧게 뛰어요
    c.t -= dt; if (c.t <= 0) { c.t = 1.5 + R() * 3; const a = R() < .45 ? null : R() * Math.PI * 2, sp = R() < .2 ? 70 : 24; c.vx = a === null ? 0 : Math.cos(a) * sp; c.vy = a === null ? 0 : Math.sin(a) * sp; }
    const nx = c.x + c.vx * dt, ny = c.y + c.vy * dt; if (!blocked(nx, c.y + 8, 7, 5)) c.x = nx; else c.vx *= -1; if (!blocked(c.x, ny + 8, 7, 5)) c.y = ny; else c.vy *= -1;
  }
  for (const v of villagers) {
    if (v.talk > 0) { v.talk -= dt; continue; }
    v.t -= dt;
    if (v.t <= 0) { v.t = 1 + R() * 2.5; const a = R() < .35 ? null : R() * Math.PI * 2; v.vx = a === null ? 0 : Math.cos(a) * 28; v.vy = a === null ? 0 : Math.sin(a) * 28; }
    const nx = v.x + v.vx * dt, ny = v.y + v.vy * dt;
    if (!blocked(nx, v.y + 8, 9, 6) && Math.hypot(nx - player.x, v.y - player.y) > 22) v.x = nx; else v.vx *= -1;
    if (!blocked(v.x, ny + 8, 9, 6) && Math.hypot(v.x - player.x, ny - player.y) > 22) v.y = ny; else v.vy *= -1;
  }
  // 곤충
  const day = clock >= 6 && clock < 18, night = clock >= 19 || clock < 5;
  if (bugs.length < 6 && R() < dt * .5 && (day || night)) {
    const x = R() * W | 0, y = R() * H | 0;
    if (terrain[y][x] === "g") bugs.push({ x: (x + .5) * T, y: (y + .5) * T, a: R() * 6.28, life: 40, id: day ? "butterfly" : "firefly" });
  }
  for (let i = bugs.length - 1; i >= 0; i--) {
    const b = bugs[i]; b.life -= dt; b.a += (R() - .5) * 3 * dt;
    const nx = b.x + Math.cos(b.a) * 38 * dt, ny = b.y + Math.sin(b.a) * 38 * dt;
    if (nx < 0 || ny < 0 || nx > VW || ny > VH || terrain[ny / T | 0]?.[nx / T | 0] === "w") b.a += Math.PI; else { b.x = nx; b.y = ny; }
    if (b.life <= 0 || (b.id === "butterfly" ? !day : !night)) bugs.splice(i, 1);
  }
  if ((saveT += dt) > 10) { saveT = 0; save(); }
}
