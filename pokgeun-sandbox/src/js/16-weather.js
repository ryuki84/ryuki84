/* ----- 날씨: 맑음 / 비 / 폭풍(번개·천둥) / 안개 / 눈 ----- */
const WX = { type: "clear", eff: "clear", t: 25, rain: 0, snow: 0, fog: 0, storm: 0, cloud: 0, flash: 0, bolt: 6, thunder: [] };
const WXFOG = new THREE.Fog(0xaab4bc, 40, 90), WXI = { clear: "", rain: "🌧️", storm: "⛈️", fog: "🌫️", snow: "❄️" };
let WXR = null, WXS = null, WXA = null, NBUF = null;
const noiseBuf = () => NBUF || (NBUF = (() => { const n = AC.sampleRate * 2, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; return b; })());
function wxEff() {
  if (GKIND !== "village" && GKIND !== "wild") return "clear";
  let t = WX.type, b = -1;
  if (scene === "dun" && dun && dun.kind === "world" && typeof WORLD !== "undefined" && WORLD) b = wb(Math.floor(player.x / T), Math.floor((player.y + 8) / T));
  if (b === BIO.SNOW && (t === "rain" || t === "storm")) t = "snow";
  else if (b === BIO.DESERT && t !== "clear") t = "clear";
  else if (b === BIO.DEMON) t = t === "snow" ? "clear" : t;
  return t;
}
function thunder() {
  if (muted || !started) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume();
    const t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf(); f.type = "lowpass";
    f.frequency.setValueAtTime(700, t); f.frequency.exponentialRampToValueAtTime(70, t + 2);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.4, t + .06); g.gain.exponentialRampToValueAtTime(.001, t + 2.1); s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); s.stop(t + 2.2);
  } catch (e) {}
}
function rainAudio() {
  if (!WXA && (WX.rain < .03 || muted || !started)) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume();
    if (!WXA) { const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf(); s.loop = true; f.type = "bandpass"; f.frequency.value = 2200; f.Q.value = .35; g.gain.value = 0; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(); WXA = g; }
    WXA.gain.setTargetAtTime(muted || !started ? 0 : WX.rain * (.04 + WX.storm * .04), AC.currentTime, .4);
  } catch (e) {}
}
function wxObjs() {
  if (WXR || !S3) return; const rn = 900, sn = 700, rg = new THREE.BufferGeometry(), sg = new THREE.BufferGeometry();
  rg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(rn * 6), 3)); sg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(sn * 3), 3));
  WXR = { o: new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: 0xd8e8ff, transparent: true, opacity: .7, depthWrite: false })), p: new Float32Array(rn * 3), n: rn };
  WXS = { o: new THREE.Points(sg, new THREE.PointsMaterial({ size: .46, color: 0xffffff, map: softTex(), transparent: true, depthWrite: false, opacity: .95, sizeAttenuation: true })), p: new Float32Array(sn * 3), n: sn };
  for (const W of [WXR, WXS]) { for (let i = 0; i < W.n; i++) { W.p[i * 3] = (Math.random() - .5) * 36; W.p[i * 3 + 1] = Math.random() * 15; W.p[i * 3 + 2] = (Math.random() - .5) * 28; } W.o.frustumCulled = false; W.o.visible = false; S3.add(W.o); }
}
function weatherTick() {
  const dt = clamp(DT, 0, .1); wxObjs();
  if ((WX.t -= dt) <= 0) { const r = Math.random(); WX.type = r < .46 ? "clear" : r < .68 ? "rain" : r < .8 ? "fog" : r < .88 ? "storm" : "snow"; WX.t = 80 + Math.random() * 130; }
  const e = WX.eff = wxEff(), up = (k, tg, s) => { WX[k] += clamp(tg - WX[k], -dt * s, dt * s); };
  up("rain", e === "rain" || e === "storm" ? 1 : 0, .5); up("storm", e === "storm" ? 1 : 0, .4); up("snow", e === "snow" ? 1 : 0, .5); up("fog", e === "fog" ? 1 : 0, .4);
  WX.cloud = clamp(Math.max(WX.rain * .62, WX.fog * .45, WX.snow * .5) + WX.storm * .3, 0, 1);
  if (WX.storm > .6) { if ((WX.bolt -= dt) <= 0) { WX.flash = 1; WX.bolt = 4 + Math.random() * 9; WX.thunder.push(.35 + Math.random() * 1.2); if (Math.random() < .4) WX.bolt = .25; } }
  WX.flash = clamp(WX.flash - dt * 3.2, 0, 1); for (const k of ["rain", "snow", "fog", "storm"]) WX[k] = clamp(WX[k], 0, 1); { const th = []; for (const d of WX.thunder) { if (d - dt <= 0) thunder(); else th.push(d - dt); } WX.thunder = th; } rainAudio();
  const cx = camT.x, cz = camT.z, R = WXR, Sn = WXS;
  R.o.visible = WX.rain > .02; if (R.o.visible) {
    const n = Math.round(R.n * clamp(.35 + WX.rain * .3 + WX.storm * .35, 0, 1)), p = R.p, a = R.o.geometry.attributes.position.array, sl = .06 + WX.storm * .08; R.o.material.opacity = .75 * WX.rain;
    for (let i = 0; i < n; i++) { let y = p[i * 3 + 1] - (20 + WX.storm * 8) * dt; if (y < 0) { y += 15; p[i * 3] = (Math.random() - .5) * 36; p[i * 3 + 2] = (Math.random() - .5) * 28; } p[i * 3 + 1] = y; const x = cx + p[i * 3], z = cz + p[i * 3 + 2] + 3; a[i * 6] = x; a[i * 6 + 1] = y; a[i * 6 + 2] = z; a[i * 6 + 3] = x + sl * 4; a[i * 6 + 4] = y + .8; a[i * 6 + 5] = z; }
    R.o.geometry.attributes.position.needsUpdate = true; R.o.geometry.setDrawRange(0, n * 2);
  }
  Sn.o.visible = WX.snow > .02; if (Sn.o.visible) {
    const n = Math.round(Sn.n * WX.snow), p = Sn.p, a = Sn.o.geometry.attributes.position.array; Sn.o.material.opacity = .95 * WX.snow;
    for (let i = 0; i < n; i++) { let y = p[i * 3 + 1] - (1 + (i % 5) * .25) * dt; if (y < 0) { y += 15; p[i * 3] = (Math.random() - .5) * 36; p[i * 3 + 2] = (Math.random() - .5) * 28; } p[i * 3 + 1] = y; a[i * 3] = cx + p[i * 3] + Math.sin(vtime * .8 + i) * .5; a[i * 3 + 1] = y; a[i * 3 + 2] = cz + p[i * 3 + 2] + 3 + Math.cos(vtime * .6 + i) * .4; }
    Sn.o.geometry.attributes.position.needsUpdate = true; Sn.o.geometry.setDrawRange(0, n);
  }
}
function wxApply(dk) {
  const k = { si: sun.intensity, ai: amb.intensity, hi: hemi.intensity, bg: S3.background, fog: S3.fog, sat: GR.sat, con: GR.con };
  if (GKIND !== "village" && GKIND !== "wild") return k;
  const c = WX.cloud, f = WX.fog; if (c < .01 && f < .01 && WX.flash <= 0) return k;
  const nd = clamp(dk / .55, 0, 1), gray = new THREE.Color(0x9aa6b4).lerp(new THREE.Color(0x141a2a), nd);
  S3.background = k.bg.clone().lerp(gray, clamp(c * .8 + f * .5, 0, 1));
  sun.intensity *= 1 - c * .8; hemi.intensity *= 1 - c * .3; amb.intensity = amb.intensity * (1 - c * .08) + c * .06; GR.sat *= 1 - c * .4 - f * .15; GR.con *= 1 - c * .04;
  if (WX.flash > 0) { amb.intensity += WX.flash * 1.1; sun.intensity += WX.flash * .6; S3.background.lerp(new THREE.Color(0xe8eeff), WX.flash * .5); }
  const fk = clamp(f + WX.rain * .35 + WX.snow * .4, 0, 1);
  if (fk > .02) { const n0 = k.fog ? k.fog.near : 60, f0 = k.fog ? k.fog.far : 140; WXFOG.color.copy(S3.background); WXFOG.near = n0 + (6 - n0) * fk; WXFOG.far = f0 + (30 - f0) * fk; S3.fog = WXFOG; }
  return k;
}
const LEGI = [];
const SUND = new THREE.Vector3(-.5, .7, .4).normalize(), SUNP = new THREE.Vector3();
/* 기기 안전 검사: 실사 조명이 이 기기에서 까맣게(NaN) 나오면 환경광을 끄고, 그래도 안 되면 툰으로 전환 */
function pbrProbe(env) {
  try {
    const sc = new THREE.Scene(), cm = new THREE.PerspectiveCamera(40, 1, .1, 10), rt = new THREE.WebGLRenderTarget(8, 8), m = toonPatch(TOON({ color: 0xffffff }));
    const me = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), m); sc.add(me, new THREE.AmbientLight(0xffffff, .5)); const dl = new THREE.DirectionalLight(0xffffff, 1); dl.position.set(1, 2, 3); sc.add(dl);
    sc.environment = env || null; cm.position.set(0, 0, 3); cm.lookAt(0, 0, 0); const tm = R3.toneMapping; R3.setRenderTarget(rt); R3.render(sc, cm); R3.setRenderTarget(null);
    const px = new Uint8Array(8 * 8 * 4); R3.readRenderTargetPixels(rt, 0, 0, 8, 8, px); let sum = 0; for (let i = 0; i < 64; i++) sum += px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2];
    rt.dispose(); me.geometry.dispose(); m.dispose(); return sum / 64 / 3 > 8;
  } catch (e) { return true; }
}
let probed = false;
function skyTick() {
  const out = GKIND === "village" || GKIND === "wild", h = clock, pa = (h - 6) / 12 * Math.PI, el = Math.sin(pa);
  SUNP.set(-Math.cos(pa), Math.max(el, -.3) * .95, .42).normalize();                         // 하늘에 그릴 실제 해 위치 (6시 동쪽 → 12시 높이 → 18시 서쪽)
  if (el > .06) SUND.copy(SUNP).setY(Math.max(SUNP.y, .18)).normalize(); else SUND.set(.35, .85, .4).normalize();   // 그림자 방향 (밤에는 달빛)
  const nd = clamp(darkness() / .55, 0, 1), wx = WX.cloud || 0, low = el < .1;   // 해가 낮거나 지면 물리 하늘 대신 노을·밤 하늘
  G.sky.visible = out && !low; G.nightSky.visible = out && low; G.stars.visible = out && nd > .25;
  if (G.stars.visible) { G.stars.position.copy(cam.position); G.stars.material.opacity = clamp((nd - .25) * 1.6, 0, 1) * (1 - wx); }
  R3.toneMappingExposure = .72 + nd * .55; if (!out) return;
  amb.intensity += nd * .22; sun.intensity += nd * .16; hemi.intensity += nd * .06;   // 달빛·밤 주변광 보강
  if (low) { const u = G.nightSky.material.uniforms, dusk = clamp(1 - nd * 1.4, 0, 1); G.nightSky.position.copy(cam.position);
    u.top.value.setHex(0x101a3e).lerp(new THREE.Color(0x3a5a9a), dusk * .8); u.hor.value.setHex(0x26345a).lerp(new THREE.Color(0xe8946a), dusk * .9); u.glow.value.setHex(0xff9a5a).multiplyScalar(dusk * .6); u.sd.value.copy(SUNP); }
  else { G.sky.position.copy(cam.position); G.sky.material.uniforms.sunPosition.value.copy(SUNP); }
  const hor = new THREE.Color(0xbcd2e2).lerp(new THREE.Color(0xf0b080), clamp(1 - Math.abs(el) * 4, 0, 1) * .6 * (1 - nd)).lerp(new THREE.Color(0x1e2a4a), nd).lerp(new THREE.Color(0x8a96a4).multiplyScalar(1 - nd * .7), wx * .7);
  S3.background = hor; if (S3.fog) S3.fog.color.copy(hor);
  const E = G.envSky; if (Math.abs(h - E.t) > .2 || Math.abs(nd - (E.nd ?? -1)) > .05 || !E.rt) { E.t = h; E.nd = nd;   // 환경광: 극단값 없는 하늘 그라데이션 (모바일 GPU 안전)
    const c = E.cv || (E.cv = document.createElement("canvas")); c.width = 64; c.height = 32; const x = c.getContext("2d"), gr = x.createLinearGradient(0, 0, 0, 32), hx = v => "#" + v.getHexString();
    const top = new THREE.Color(0x6aa8e0).lerp(new THREE.Color(0x182850), nd), hz = new THREE.Color(0xd8e4ec).lerp(new THREE.Color(0xf0a878), clamp(1 - Math.abs(el) * 4, 0, 1) * .5 * (1 - nd)).lerp(new THREE.Color(0x2a3a60), nd), gd = new THREE.Color(0x7a8a5a).lerp(new THREE.Color(0x182018), nd);
    gr.addColorStop(0, hx(top)); gr.addColorStop(.47, hx(hz)); gr.addColorStop(.53, hx(gd)); gr.addColorStop(1, hx(gd.clone().multiplyScalar(.7))); x.fillStyle = gr; x.fillRect(0, 0, 64, 32);
    const et = new THREE.CanvasTexture(c); et.mapping = THREE.EquirectangularReflectionMapping; et.colorSpace = THREE.SRGBColorSpace; const rt = E.pm.fromEquirectangular(et); et.dispose(); if (E.rt) E.rt.dispose(); E.rt = rt; S3.environment = E.noEnv ? null : rt.texture;
    if (!probed) { probed = true; if (!pbrProbe(rt.texture)) { if (pbrProbe(null)) { E.noEnv = true; S3.environment = null; console.warn("환경광이 이 기기에서 깨져서 끕니다."); } else { try { localStorage.setItem("pokgeun-safe", JSON.stringify({ style: "toon", v: RENDER_VER })); } catch (e) {} say("⚠️ 이 기기에서 실사 그래픽이 제대로 안 나와 툰 스타일로 바꿀게요.", 3000); setTimeout(() => { location.hash = "style=toon"; location.reload(); }, 1500); } } } }
  S3.environmentIntensity = (.38 - nd * .1) * (1 - wx * .3);
}
function legacyLights(on) {
  const L = [amb, hemi, sun, ...PLs];
  if (on) L.forEach((l, i) => { LEGI[i] = l.intensity; l.intensity *= Math.PI; }); else L.forEach((l, i) => { l.intensity = LEGI[i]; });
}
function wxRestore(k) { sun.intensity = k.si; amb.intensity = k.ai; hemi.intensity = k.hi; S3.background = k.bg; S3.fog = k.fog; GR.sat = k.sat; GR.con = k.con; }
function finish(D, dim) {
  const sh = shake > 0 ? (Math.random() - .5) * shake * .05 : 0, sv = shake > 0 ? (Math.random() - .5) * shake * .05 : 0;
  const tp = TPV(), f0 = tp ? 52 : 30, fov = cam.aspect >= 1.5 ? f0 : Math.min(f0 * 1.55, 2 * Math.atan(Math.tan(f0 * Math.PI / 360) * 1.5 / cam.aspect) * 180 / Math.PI); if (Math.abs(cam.fov - fov) > .01) { cam.fov = fov; cam.updateProjectionMatrix(); }
  if (tp) {
    const P = player; if (P.mv && P.rawF && vtime - camManT > 1.2) { let d = Math.atan2(-P.dx, -P.dy) - camYaw; d = Math.atan2(Math.sin(d), Math.cos(d)); if (Math.abs(d) < 2.2) camYaw += clamp(d, -DT * 1.6, DT * 1.6); }
    const px = P.x / T, pz = (P.y + 8) / T, R = 9.6 * camZoom, pt = .36 + (camZoom - 1) * .12, sy = Math.sin(camYaw), cy = Math.cos(camYaw);
    cam.position.set(px + sy * R * Math.cos(pt) + sh, 1.4 + R * Math.sin(pt) + sv, pz + cy * R * Math.cos(pt)); cam.lookAt(px - sy * 3, 1.15, pz - cy * 3);
  } else { D *= camZoom * 1.12; cam.position.set(camT.x + sh, D * (REAL ? .58 : .82) + sv, camT.z + D * (REAL ? .86 : .574)); cam.lookAt(camT.x + sh, 0, camT.z); }
  if (lookMode() && curPE) { const hp = curPE.g.position; if (innerWidth >= 700) { const ox = .95; cam.position.set(hp.x + ox, 1.5, hp.z + 6.2); cam.lookAt(hp.x + ox, .95, hp.z); } else { const fv = 2 * Math.atan(Math.tan(15 * Math.PI / 180) * 1.5 / Math.max(.4, cam.aspect)) * 180 / Math.PI; if (Math.abs(cam.fov - fv) > .01) { cam.fov = fv; cam.updateProjectionMatrix(); } cam.position.set(hp.x, 1.0, hp.z + 4.3); cam.lookAt(hp.x, -.5, hp.z); } if (vtime - lookManT > 2.5) lookYaw += DT * .5; curPE.g.rotation.y = lookYaw; }
  PPOS.value.set(GKIND === "village" || GKIND === "wild" ? player.x / T : 1e4, 0, (player.y + 8) / T); if (TPV()) CPOS.value.copy(cam.position); else CPOS.value.set(PPOS.value.x, 0, PPOS.value.z + 1.8);
  if (G && G.physSky) skyTick(); else if (G && G.sky) { const out = GKIND === "village" || GKIND === "wild", nd = clamp(darkness() / .55, 0, 1); G.sky.visible = out; if (out) { G.sky.position.copy(cam.position); const u = G.sky.material.uniforms; u.top.value.setHex(0x5d9fe0).lerp(new THREE.Color(0x070b20), nd); u.hor.value.copy(S3.background); } }
  if (G && G.physSky) sun.position.set(camT.x + SUND.x * 30, SUND.y * 30, camT.z + SUND.z * 30); else sun.position.set(camT.x - 9, 17, camT.z + 7); sun.target.position.set(camT.x, 0, camT.z); sun.target.updateMatrixWorld();
  const p0 = PLs[0]; p0.position.set(PL0.x, PL0.h, PL0.z); p0.color.setHex(PL0.c); p0.intensity = PL0.i; p0.distance = PL0.r;
  lights.sort((a, b) => ((a.x - camT.x) ** 2 + (a.z - camT.z) ** 2) - ((b.x - camT.x) ** 2 + (b.z - camT.z) ** 2));
  for (let i = 1; i < PLs.length; i++) { const L = lights[i - 1], l = PLs[i]; if (L) { l.position.set(L.x, L.h, L.z); l.color.setHex(L.c); l.intensity = L.i; l.distance = L.r; } else l.intensity = 0; }
  lights.length = 0; PL0.i = 0;
  drawParts(); updateMotes(); sweep();
  const dk = darkness(); weatherTick(); const keep = wxApply(dk); RIM.value = (.16 + dk * .24) * (RSTYLE === "cel" ? 2.2 : PBRL ? .5 : 1); RIMC.value.setHex(0xbfe0ff).lerp(new THREE.Color(0x7f93ff), clamp(dk * 1.6, 0, 1)); WIND.value = vtime; WATERMAT.uniforms.uT.value = vtime; if (REAL) { WATERMAT.uniforms.uSky.value.copy(S3.background).convertLinearToSRGB(); WATERMAT.uniforms.uSun.value.copy(SUND); } WATERMAT.uniforms.uDay.value = GKIND === "home" ? 1 : 1 - clamp(dk / .55, 0, 1) * .72;
  if (G.cloud) { const on = !REAL && (GKIND === "village" || GKIND === "wild") && dk < .3, cm = G.cloud; cm.visible = on; if (on) { cm.position.set(camT.x, .1, camT.z); const t = cm.material.map; t.offset.set(camT.x / 90 + vtime * .004, -camT.z / 90 + vtime * .002); cm.material.opacity = clamp(1 - dk * 3, 0, 1) * .9; } }
  if (sun && sun.castShadow) { const lite = LITE(); sun.shadow.autoUpdate = !lite; if (lite && (frameNo & 1) === 0) sun.shadow.needsUpdate = true; }   // 휴대폰: 그림자는 2프레임에 한 번 다시 그려요
  if (composer && gradePass) { bloomPass.enabled = QUAL.bloom; bloomPass.strength = REAL ? .3 + dk * .3 : .55 + dk * .5 + (RSTYLE === "cel" ? .15 : 0); const u = gradePass.uniforms; u.vig.value = GR.vig; u.sat.value = GR.sat * (RSTYLE === "cel" ? 1.12 : REAL ? 1.12 : 1); u.con.value = GR.con * (REAL ? 1.06 : 1); legacyLights(true); try { composer.render(DT); legacyLights(false); wxRestore(keep); return; } catch (e) { legacyLights(false); composer = null; } }
  legacyLights(true); R3.render(S3, cam); legacyLights(false); wxRestore(keep);
}
function light(x, z, r, c = 0xffc870, h = 1.4, i = 1.5) { lights.push({ x, z, r, c, h, i }); }
function overlay(extra, is2d) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, ov.width, ov.height); if (is2d) draw2D(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const v = new THREE.Vector3(), k = sc * Z;
  for (const L of labels) {
    let sx, sy; if (is2d) { [sx, sy] = v2proj(L.x, L.z, L.h); if (sx < -60 || sy < -60 || sx > ov.width + 60 || sy > ov.height + 60) continue; }
    else { v.set(L.x, L.h, L.z).project(cam); if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) continue; sx = (v.x * .5 + .5) * ov.width; sy = (-v.y * .5 + .5) * ov.height; }
    if (L.box) { ctx.font = `bold ${12 * k}px sans-serif`; const w = ctx.measureText(L.t).width + 12 * k; ctx.fillStyle = "rgba(28,20,32,.78)"; ctx.fillRect(sx - w / 2, sy - 9 * k, w, 18 * k); ctx.fillStyle = L.col; ctx.fillText(L.t, sx, sy + k); }
    else { ctx.globalAlpha = L.a; ctx.font = `bold ${L.size * k}px sans-serif`; ctx.lineWidth = 3 * k; ctx.strokeStyle = "#1c1420"; ctx.strokeText(L.t, sx, sy); ctx.fillStyle = L.col; ctx.fillText(L.t, sx, sy); ctx.globalAlpha = 1; }
  }
  labels.length = 0; ctx.setTransform(sc, 0, 0, sc, 0, 0); if (extra) extra();
}
function cursorAt(tx, tz, y = .03) { const c = G.cursor; c.visible = true; c.position.set(tx + .5, y, tz + .5); c.material.opacity = .55 + .35 * Math.sin(vtime * 6); }
