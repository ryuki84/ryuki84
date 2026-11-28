// 3인칭 카메라 기준 이동: 카메라를 돌리면 방향키가 화면 기준으로 바뀌는지
const open = require('../lib/harness');
(async () => {
  const { b, p, errs } = await open(); await p.keyboard.press('Space');
  await p.waitForFunction(() => __game.KAY.ready && __game.curPE, null, { timeout: 90000 });
  await p.evaluate(() => __game.enterWorld()); await p.waitForFunction(() => __game.dun && __game.dun.kind === 'world', null, { timeout: 30000 });   // 왕도 광장(장애물 없는 곳)에서 측정
  const mv = async (yaw, key) => {
    await p.evaluate(y => { const g = __game, P = g.player; g.setYaw(y); const s = g.WORLD.spawn; P.x = (s.x + 3.5) * 32; P.y = (s.y + 1.5) * 32 - 8; P.mounted = false; }, yaw);
    const a = await p.evaluate(() => [__game.player.x, __game.player.y]);
    await p.keyboard.down(key);
    await p.waitForFunction(a => Math.hypot(__game.player.x - a[0], __game.player.y - a[1]) > 8, a, { timeout: 30000 }).catch(() => {});
    await p.keyboard.up(key);
    const c = await p.evaluate(() => [__game.player.x, __game.player.y]); return [Math.round(c[0] - a[0]), Math.round(c[1] - a[1])];
  };
  const r = { yaw0_up: await mv(0, 'ArrowUp'), yaw90_up: await mv(Math.PI / 2, 'ArrowUp'), yaw90_right: await mv(Math.PI / 2, 'ArrowRight'), yaw0_right: await mv(0, 'ArrowRight') };
  open.report(r, errs); await b.close();
})();
