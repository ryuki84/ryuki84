/* ---------- 상태 / 저장 ---------- */
/* 저장: 버전 + 마이그레이션 + 자동 백업(최근 3개) + 실패 알림 + 내보내기·가져오기 */
const SAVE_KEY = "pokgeun-sandbox", SAVE_VER = 3, BAK_KEYS = [1, 2, 3].map(i => SAVE_KEY + ".bak" + i), BAK_EVERY = 10 * 60 * 1000;
const SAVE = { from: "new", error: null, failT: -1e9, lastBak: 0, corrupt: false };
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const parseSave = raw => { if (!raw) return null; try { const o = JSON.parse(raw); return o && typeof o === "object" && !Array.isArray(o) ? o : null; } catch (e) { return null; } };
let S = parseSave(lsGet(SAVE_KEY));
if (S) SAVE.from = "main";
else {
  if (lsGet(SAVE_KEY)) { SAVE.corrupt = true; try { localStorage.setItem(SAVE_KEY + ".corrupt", lsGet(SAVE_KEY)); } catch (e) {} }   // 깨진 원본은 따로 보관
  for (const k of BAK_KEYS) { const b = parseSave(lsGet(k)); if (b) { S = b; SAVE.from = k; break; } }
}
if (!S) S = { bells: 200, inv: { sapling: 1 }, trees: seedTrees, fin: { chair: 1, plant: 1 }, room: [] };
function migrateSave(o) {   // 저장 형식 변경 이력 (버전이 없던 저장은 v1로 봐요)
  const v = o.sv | 0 || 1;
  if (v < 3) { if (typeof o.disc === "string" && o.disc.length > 2000) delete o.disc; }   // v3: 무한 월드 전환 — 예전 320칸 발견 지도 문자열은 쓰지 않아요
  o.sv = SAVE_VER; return o;
}
migrateSave(S);
let resetting = false;
function capDisc() { const d = WORLD && WORLD.disc; if (d && d.size > 40000) { let n = d.size - 30000; for (const k of d) { if (n-- <= 0) break; d.delete(k); } } }   // 발견 지도는 최근 3만 칸까지
function backupNow(force) {
  const now = Date.now(); if (!force && now - SAVE.lastBak < BAK_EVERY) return; const cur = lsGet(SAVE_KEY); if (!cur || !parseSave(cur)) return;
  try { for (let i = BAK_KEYS.length - 1; i > 0; i--) { const prev = lsGet(BAK_KEYS[i - 1]); if (prev) localStorage.setItem(BAK_KEYS[i], prev); } localStorage.setItem(BAK_KEYS[0], cur); SAVE.lastBak = now; } catch (e) {}
}
function save() {
  if (resetting) return false;
  let json; try { if (WORLD) { capDisc(); S.disc2 = [...WORLD.disc].join(","); } S.sv = SAVE_VER; S.savedAt = Date.now(); json = JSON.stringify(S); } catch (e) { SAVE.error = e; return false; }
  backupNow(false);
  for (let tryN = 0; tryN < 2; tryN++) {
    try { localStorage.setItem(SAVE_KEY, json); SAVE.error = null; return true; }
    catch (e) { SAVE.error = e; if (tryN === 0) for (const k of [BAK_KEYS[2], BAK_KEYS[1], SAVE_KEY + ".corrupt"]) { try { localStorage.removeItem(k); } catch (_) {} } }   // 공간이 모자라면 오래된 백업부터 비우고 한 번 더
  }
  const now = Date.now(); if (now - SAVE.failT > 60000) { SAVE.failT = now; if (typeof say === "function") say("⚠️ 저장에 실패했어요 (브라우저 저장 공간 부족 또는 차단). ⚙️ 설정 → 저장 관리에서 내보내기로 백업해 두세요.", 6000); }
  return false;
}
function exportSave() { save(); return lsGet(SAVE_KEY) || JSON.stringify(S); }
function importSave(text) {
  const o = parseSave(text); if (!o || !(o.bells >= 0) || !o.inv) return "저장 파일 형식이 아니에요.";
  backupNow(true); migrateSave(o);
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(o)); } catch (e) { return "저장 공간이 부족해서 가져오지 못했어요."; }
  resetting = true; setTimeout(() => location.reload(), 300); return "";
}
function listBackups() { return BAK_KEYS.map(k => { const o = parseSave(lsGet(k)); return o ? { key: k, at: o.savedAt || 0, lv: o.lv || 1, bells: o.bells || 0 } : null; }).filter(Boolean); }
function restoreBackup(key) { const raw = lsGet(key); if (!parseSave(raw)) return "백업이 비어 있어요."; return importSave(raw); }
S.fin = S.fin || {}; S.room = Array.isArray(S.room) ? S.room : []; S.inv = S.inv || {}; S.trees = Array.isArray(S.trees) ? S.trees : seedTrees; S.bells = Number.isFinite(S.bells) ? S.bells : 200;   // 필드가 빠진 저장(가져오기·백업)도 시작되게
S.lv = S.lv || 1; S.xp = S.xp || 0; S.potions = S.potions ?? 2; S.bag = S.bag || []; S.best = S.best || 0;
S.eq = S.eq || { weapon: { id: 1, slot: "weapon", e: "🗡️", n: "나무 칼", rar: 0, ilvl: 1, st: { dmg: 3 }, price: 10 }, armor: null, ring: null };
if (!S.st) { S.st = { str: 0, dex: 0, vit: 0 }; S.sk = { whirl: 1, fire: 0, tough: 0, tamer: 0 }; S.pts = (S.lv - 1) * 5; S.sp = S.lv - 1; }
S.look = S.look || { h: 0, hc: 0, sk: 1, ey: 0, tp: 0 };
S.mat = S.mat || { wood: 0, stone: 0, fiber: 0, berry: 0, meat: 0, hide: 0, bone: 0 }; S.pets = S.pets || []; S.petA = S.petA ?? -1;
S.mat.ore = S.mat.ore || 0; S.arena = S.arena || { best: 0, kills: 0, runs: 0, style: "sword", own: ["sword"], up: { atk: 0, hp: 0, xp: 0 }, rank: [], start: 1 }; S.idleT = S.idleT || Date.now(); S.daily = S.daily || null; S.story = S.story || { stage: 0, p: {}, notified: false, demon: 0, known: false }; S.fame = S.fame || 0; S.wedits = S.wedits || {}; S.wreg = S.wreg || {}; S.wp = S.wp || {}; S.wopen = S.wopen || {}; S.wcl = S.wcl || {}; S.quests = S.quests || []; S.qoffer = S.qoffer || null; S.crops = S.crops || {};
const trees = S.trees;
let scene = "out", furnSel = null, dun = null, WORLD = null, buildSel = null;
(() => { const z = (x, y) => (x >= 25 && x <= 28 && y >= 1 && y <= 5) || (x >= 20 && x <= 24 && y >= 0 && y <= 5) || (x <= 3 && y >= 6 && y <= 12);
  for (let i = flowers.length - 1; i >= 0; i--) if (z(flowers[i].x, flowers[i].y)) flowers.splice(i, 1);
  for (let i = rocks.length - 1; i >= 0; i--) if (z(rocks[i].x, rocks[i].y)) rocks.splice(i, 1);
  for (let i = trees.length - 1; i >= 0; i--) if (z(trees[i].x, trees[i].y)) trees.splice(i, 1); })();
const ground = [];       // 바닥에 떨어진 아이템 {x,y,k}
const bugs = [];
let fishing = null;      // {tx,ty,state,t}
let modal = false, started = false, fast = false;
let clock = new Date().getHours() + new Date().getMinutes() / 60;
let vtime = 0, saveT = 0;

const player = { x: 8.5 * T, y: 8.5 * T, dx: 0, dy: 1, tool: 0, hp: 100, atkCd: 0, qCd: 0, eCd: 0, fCd: 0, dash: 0, inv: 0, flash: 0, rCd: 0, mounted: false };
const SPAWNS = [[11, 9], [13, 8], [5, 11], [12, 14]];
// 마을을 돌아다니는 동물(말은 안 걸어요): Quaternius Ultimate Animated Animals(CC0)
const critters = [{ k: "v/shiba", n: "시바", x: (SPAWNS[1][0] + 2.5) * T, y: (SPAWNS[1][1] + 1.5) * T, vx: 0, vy: 0, t: 0 }, { k: "v/fox", n: "여우", x: (SPAWNS[3][0] - 2.5) * T, y: (SPAWNS[3][1] + 1.5) * T, vx: 0, vy: 0, t: 1 }];
const villagers = VILLAGERS.map((v, i) => ({ ...v, vilLocal: true, x: (SPAWNS[i][0] + .5) * T, y: (SPAWNS[i][1] + .5) * T, vx: 0, vy: 0, t: 0, talk: 0, line: 0 }));
