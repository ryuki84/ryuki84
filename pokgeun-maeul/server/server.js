/* 포근 마을 멀티플레이 서버
 *  - index.html 을 직접 서빙하므로 `node server.js` 한 번이면 게임+서버가 같이 떠요.
 *  - 접속: http://localhost:3000/?online   (다른 호스트의 서버는 ?server=ws://주소:3000)
 *  - 동기화: 플레이어 위치 / 채팅 / 월드 편집(건설·채집). 몬스터·전투는 각자 클라이언트에서 돌아가요(프로토타입).
 *  - 월드 편집은 data/world-edits.json 에 저장돼 서버를 껐다 켜도 유지돼요.
 */
const http = require("http"), fs = require("fs"), path = require("path"), { WebSocketServer } = require("ws");
const PORT = +process.env.PORT || 3000, N = 1048576, MAXP = +process.env.MAX_PLAYERS || 64;
const ROOT = path.join(__dirname, ".."), DATA = process.env.DATA_DIR || path.join(__dirname, "data"), FILE = path.join(DATA, "world-edits.json");
const ALLOWED = new Set([0, 12, 13, 14, 15, 18, 21]);          // 0 = 채집/철거, 나머지는 건설 조각 코드
const COLORS = [0x3d6ed0, 0xd9534f, 0x4a9a4a, 0xf0a23c, 0x8a5ad0, 0x2fb0b0, 0xe8508a, 0x6a7a8a];
fs.mkdirSync(DATA, { recursive: true });
let edits = {}; try { edits = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch (e) {}
let dirty = false, rdirty = false;
const RFILE = path.join(DATA, "ranking.json"); let ranking = []; try { ranking = JSON.parse(fs.readFileSync(RFILE, "utf8")); } catch (e) {}
const players = new Map(); let nextId = 1;

const regrow = k => setTimeout(() => { if (edits[k] === 0) { delete edits[k]; dirty = true; broadcast({ t: "edit", k: +k, c: null }); } }, 420000 + Math.random() * 120000);
for (const k in edits) if (edits[k] === 0) regrow(k);          // 재시작 후에도 채집된 자원이 다시 자라도록

const server = http.createServer((req, res) => {
  const u = req.url.split("?")[0];
  if (u === "/" || u === "/index.html") {
    fs.readFile(path.join(ROOT, "index.html"), (e, b) => {
      if (e) { res.writeHead(500); return res.end("index.html 을 찾을 수 없어요"); }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" }); res.end(b);
    });
  } else if (u.startsWith("/assets/")) {
    const f = path.normalize(path.join(ROOT, decodeURIComponent(u))), A = path.join(ROOT, "assets") + path.sep;
    if (!f.startsWith(A)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { "Content-Type": { ".glb": "model/gltf-binary", ".png": "image/png", ".webp": "image/webp", ".json": "application/json", ".txt": "text/plain; charset=utf-8" }[path.extname(f)] || "application/octet-stream", "Cache-Control": "max-age=3600" }); res.end(b); });
  } else if (u === "/health") { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ players: players.size, edits: Object.keys(edits).length })); }
  else { res.writeHead(404); res.end("not found"); }
});
const wss = new WebSocketServer({ server, maxPayload: 4096 });

function send(p, m) { if (p.ws.readyState === 1) p.ws.send(JSON.stringify(m)); }
function broadcast(m, except) { const s = JSON.stringify(m); for (const p of players.values()) if (p !== except && p.ws.readyState === 1) p.ws.send(s); }
const cleanLook = l => { const o = {}; for (const k of ["h", "hc", "sk", "ey", "tp", "c", "hat", "cc", "pc", "bc", "ot", "bd", "br"]) o[k] = Math.max(0, Math.min(9, (l && +l[k]) | 0)); return o; };
const pub = p => ({ id: p.id, name: p.name, col: p.col, look: p.look, x: p.x, y: p.y, dx: p.dx, dy: p.dy, mv: p.mv });
const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f<>]/g, "").trim().slice(0, n);
const num = (v, lo, hi, d = 0) => Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d;

wss.on("connection", ws => {
  if (players.size >= MAXP) { ws.close(1013, "서버가 가득 찼어요"); return; }
  const p = { id: nextId++, ws, name: "", col: 0, x: 0, y: 0, dx: 0, dy: 1, mv: 0, w: 0, joined: false, lastChat: 0, eT: 0, eN: 0, alive: true };
  p.col = COLORS[p.id % COLORS.length];
  ws.on("pong", () => { p.alive = true; });
  ws.on("message", raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; } if (!m || typeof m.t !== "string") return;
    if (m.t === "join" && !p.joined) {
      p.joined = true; p.look = cleanLook(m.look); p.name = clean(m.name, 12) || "모험가" + p.id; players.set(p.id, p);
      send(p, { t: "hello", id: p.id, name: p.name, col: p.col, edits, rank: ranking.slice(0, 10), count: players.size, players: [...players.values()].filter(q => q !== p && q.w).map(pub) });
      broadcast({ t: "chat", id: 0, name: "", text: `${p.name} 님이 접속했어요`, sys: 1 }, p); broadcast({ t: "count", n: players.size });
      return;
    }
    if (!p.joined) return;
    if (m.t === "look") { p.look = cleanLook(m.look); return; }
    if (m.t === "pos") { p.x = num(m.x, 0, N * 32, p.x); p.y = num(m.y, 0, N * 32, p.y); p.dx = num(m.dx, -1, 1, 0); p.dy = num(m.dy, -1, 1, 1); p.mv = m.mv ? 1 : 0; p.w = 1; }
    else if (m.t === "away") { if (p.w) { p.w = 0; broadcast({ t: "away", id: p.id }, p); } }
    else if (m.t === "chat") { const text = clean(m.text, 120), now = Date.now(); if (!text || now - p.lastChat < 400) return; p.lastChat = now; broadcast({ t: "chat", id: p.id, name: p.name, text }); }
    else if (m.t === "rank?") send(p, { t: "rank", list: ranking.slice(0, 10) });
    else if (m.t === "score") {                                  // 아레나 기록 (클라이언트 신고 방식이라 치트 방지는 없어요)
      const now = Date.now(); if (now - (p.lastScore || 0) < 5000) return; p.lastScore = now;
      const wave = Math.trunc(num(m.wave, 0, 999)), kills = Math.trunc(num(m.kills, 0, 99999)); if (wave < 1) return;
      ranking.push({ name: p.name, wave, kills, ts: now }); ranking.sort((a, b) => b.wave - a.wave || b.kills - a.kills); ranking = ranking.slice(0, 30); rdirty = true;
      broadcast({ t: "rank", list: ranking.slice(0, 10) });
    }
    else if (m.t === "edit") {
      const now = Date.now(); if (now - p.eT > 1000) { p.eT = now; p.eN = 0; } if (++p.eN > 30) return;        // 초당 30회 제한
      const k = Math.trunc(+m.k); if (!(k >= 0 && k < N * N)) return; const c = m.c === null ? null : Math.trunc(+m.c); if (c !== null && !ALLOWED.has(c)) return;
      if (c === null) delete edits[k]; else edits[k] = c; dirty = true; broadcast({ t: "edit", k, c }, p); if (m.rg && c === 0) regrow(k);
    }
  });
  ws.on("close", () => {
    if (!p.joined) return; players.delete(p.id);
    broadcast({ t: "away", id: p.id }); broadcast({ t: "chat", id: 0, name: "", text: `${p.name} 님이 나갔어요`, sys: 1 }); broadcast({ t: "count", n: players.size });
  });
  ws.on("error", () => {});
});

setInterval(() => {                                            // 10Hz 위치 브로드캐스트 (오픈월드에 있는 플레이어끼리만)
  const inWorld = [...players.values()].filter(p => p.w); if (inWorld.length < 2) return;
  for (const p of inWorld) send(p, { t: "state", ps: inWorld.filter(q => q !== p).map(pub) });
}, 100);
setInterval(() => { for (const p of players.values()) { if (!p.alive) { p.ws.terminate(); continue; } p.alive = false; p.ws.ping(); } }, 30000);
const flush = () => { if (dirty) { dirty = false; try { fs.writeFileSync(FILE, JSON.stringify(edits)); } catch (e) { console.error("저장 실패", e.message); } } if (rdirty) { rdirty = false; try { fs.writeFileSync(RFILE, JSON.stringify(ranking)); } catch (e) {} } };
setInterval(flush, 10000);
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => { flush(); process.exit(0); });
server.listen(PORT, () => console.log(`🌍 포근 마을 서버: http://localhost:${PORT}/?online  (편집 ${Object.keys(edits).length}개 불러옴)`));
