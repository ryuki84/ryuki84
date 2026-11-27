const open = require('../lib/harness');
(async () => { const { b, p, errs } = await open({ qs: '?style=real&noao' }); await p.keyboard.press('Space'); await p.waitForFunction(() => __game.MAN.ready, null, { timeout: 90000 }); await p.waitForTimeout(2500);
  require('../lib/harness').report(await p.evaluate(() => ({ env: !!__game.S3.environment, url: location.href.split('#')[1] || '' })), errs.slice(0, 4)); await b.close(); })();
