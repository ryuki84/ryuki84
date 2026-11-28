/* ---------- 그리기: 3D 로우폴리 툰 (Three.js) ---------- */
const cv = $("c"), ov = $("o"), ctx = ov.getContext("2d");
let LVH = 640, sc = 1, Z = 1, DT = .016, frameNo = 0, shake = 0;
const HAS3D = typeof THREE !== "undefined";
if (!HAS3D) { const stub = new Proxy(function () {}, { get: (t, k) => k === Symbol.toPrimitive ? () => 0 : stub, apply: () => stub, construct: () => stub, set: () => true }); window.THREE = stub; }   // 라이브러리 로드 실패 시에도 게임 로직이 죽지 않게
let R3 = null, S3, cam, sun, amb, hemi, gradTex, PLs = [];
const PL0 = { x: 0, z: 0, r: 5, c: 0xffd9a0, i: 0, h: 1.6 };
const INK = 0x1c1420, lights = [], labels = [];
const camT = { x: 15, z: 10 }; let camInit = false;

/* ----- 그래픽 품질 ----- */
const QLEVELS = { high: { n: "높음", bloom: true, shadow: 4096, dpr: 2.5, motes: 90 }, mid: { n: "보통", bloom: true, shadow: 2048, dpr: 2, motes: 50 }, low: { n: "낮음", bloom: false, shadow: 1024, dpr: 1.25, motes: 0 } };
let gfxLv = "high"; try { gfxLv = localStorage.getItem("pokgeun-gfx") || ""; } catch (e) {}
if (!QLEVELS[gfxLv]) gfxLv = (window.matchMedia && matchMedia("(pointer:coarse)").matches) || innerWidth < 700 ? "mid" : "high";
const QUAL = { ...QLEVELS[gfxLv] }, TOUCHDEV = !!(window.matchMedia && matchMedia("(pointer:coarse)").matches);
const touchCap = () => { if (!TOUCHDEV) return; QUAL.dpr = Math.min(QUAL.dpr, gfxLv === "high" ? 2 : 1.5); if (gfxLv !== "high") QUAL.bloom = false; QUAL.shadow = Math.min(QUAL.shadow, gfxLv === "high" ? 2048 : 1024); };   // 휴대폰은 화면 픽셀이 많고 GPU가 약해서 낮춰요
touchCap();
{ const gi = document.getElementById("gfxinfo"); if (gi) { gi.innerHTML = `🎨 그래픽: <b>${VIEW2D ? "귀여운 2D" : { real: "듀랑고풍(실사)", cel: "원신풍(애니 셀)", toon: "파스텔 툰", pbr: "부드러운 3D" }[RSTYLE]}</b> · 화질 ${QLEVELS[gfxLv].n} · 버전 ${RENDER_VER}` + (SAFE_FROM === "safe" ? ` <button id="tryReal">🌄 실사 그래픽 다시 시도</button>` : "");
  const tb = document.getElementById("tryReal"); if (tb) tb.onclick = () => { try { localStorage.removeItem("pokgeun-safe"); } catch (e) {} location.replace(location.pathname); }; } }
let composer = null, bloomPass = null, gradePass = null, postTried = false;
if (HAS3D) try {
  R3 = new THREE.WebGLRenderer({ canvas: cv, antialias: true }); R3.outputColorSpace = REAL ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace; if (REAL) { R3.toneMapping = THREE.ACESFilmicToneMapping; R3.toneMappingExposure = .72; }
  R3.shadowMap.enabled = true; R3.shadowMap.type = THREE.PCFShadowMap; R3.debug.checkShaderErrors = false;   // 셰이더 컴파일마다 기다리지 않게(새 모델이 처음 보일 때 끊김 줄이기)
  S3 = new THREE.Scene(); if (PBRX) { const pm = new THREE.PMREMGenerator(R3); const c = document.createElement("canvas"); c.width = 64; c.height = 32; const x = c.getContext("2d"), gr = x.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, "#9fd0ff"); gr.addColorStop(.48, "#e8f4ff"); gr.addColorStop(.52, "#a8c890"); gr.addColorStop(1, "#5a7a40"); x.fillStyle = gr; x.fillRect(0, 0, 64, 32); const et = new THREE.CanvasTexture(c); et.mapping = THREE.EquirectangularReflectionMapping; S3.environment = pm.fromEquirectangular(et).texture; S3.environmentIntensity = .35; } cam = new THREE.PerspectiveCamera(30, VW / VH, .5, 150);
  amb = new THREE.AmbientLight(0xffffff, .6); hemi = new THREE.HemisphereLight(0xcfe8ff, 0x6a5a3a, .35);
  sun = new THREE.DirectionalLight(0xfff2d6, .85); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, REAL ? { left: -26, right: 26, top: 26, bottom: -20, near: 1, far: 90 } : { left: -17, right: 17, top: 15, bottom: -15, near: 1, far: 80 }); sun.shadow.bias = -.0004; sun.shadow.normalBias = .025; sun.shadow.camera.updateProjectionMatrix();
  S3.add(amb, hemi, sun, sun.target);
  for (let i = 0; i < 6; i++) { const l = new THREE.PointLight(0xffc870, 0, 8, 2); S3.add(l); PLs.push(l); }
  const d = RSTYLE === "cel" ? new Uint8Array([96, 96, 96, 96, 160, 255, 255, 255]) : new Uint8Array([80, 140, 205, 255]); gradTex = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat); gradTex.minFilter = gradTex.magFilter = RSTYLE === "cel" ? THREE.LinearFilter : THREE.NearestFilter; gradTex.generateMipmaps = false; gradTex.needsUpdate = true;
} catch (e) { R3 = null; }
if (R3) applyQuality(gfxLv);
if (!R3) $("help").insertAdjacentHTML("afterbegin", `<p style="color:#c0392b;font-weight:700">⚠️ 3D 그래픽을 불러오지 못했어요. 인터넷 연결과 WebGL 지원 브라우저가 필요해요.</p>`);

const GRADE = {
  uniforms: { tDiffuse: { value: null }, vig: { value: .22 }, sat: { value: 1.1 }, con: { value: 1.05 }, fil: { value: REAL ? 0 : 1 } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: "uniform sampler2D tDiffuse; uniform float vig, sat, con, fil; varying vec2 vUv; void main(){ vec4 c = texture2D(tDiffuse, vUv); float m = max(c.r, max(c.g, c.b)); if (m > 1.0 && fil > .5) c.rgb /= m; float l = dot(c.rgb, vec3(.299,.587,.114)); c.rgb = mix(vec3(l), c.rgb, sat); if (fil > .5) { vec3 x = c.rgb * 1.12; vec3 a = clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0.0, 1.0); c.rgb = mix(c.rgb, a, .6); } c.rgb = (c.rgb - .5) * con + .5; c.rgb *= 1.0 - vig * smoothstep(.42, .98, distance(vUv, vec2(.5))); gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), 1.0); }",
};
function initPost(w, h) {
  postTried = true; if (!THREE.EffectComposer || !THREE.UnrealBloomPass || !THREE.RenderPass || !THREE.ShaderPass) return;
  try {
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, format: THREE.RGBAFormat, samples: 4 });
    composer = new THREE.EffectComposer(R3, rt); composer.addPass(new THREE.RenderPass(S3, cam));
    if (PBRX && gfxLv === "high" && !/noao/.test(location.search)) { const ao = new PBRX[0].GTAOPass(S3, cam, w, h); ao.blendIntensity = .9; composer.addPass(ao); }
    bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(w, h), .6, .55, REAL ? 6 : .95); composer.addPass(bloomPass);
    if (RX) composer.addPass(new RX[1].OutputPass());
    gradePass = new THREE.ShaderPass(GRADE); composer.addPass(gradePass);
  } catch (e) { composer = null; }
}
function applyQuality(k) {
  gfxLv = k; Object.assign(QUAL, QLEVELS[k]); touchCap(); try { localStorage.setItem("pokgeun-gfx", k); } catch (e) {}
  if (sun) { sun.castShadow = QUAL.shadow > 0; if (QUAL.shadow) { sun.shadow.mapSize.set(QUAL.shadow, QUAL.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } } }
  const el = document.getElementById("gfx"); if (el) el.textContent = "🎨 " + QUAL.n; if (typeof resize === "function" && ov) resize();
}
function resize() {
  const dpr = Math.min(QUAL.dpr, window.devicePixelRatio || 1), w = ov.clientWidth || VW, h = ov.clientHeight || w * VH / VW;
  ov.width = Math.round(w * dpr); ov.height = Math.round(h * dpr); sc = ov.width / VW; LVH = ov.height / sc; Z = w < 600 ? 2 : 1; if (cam) { cam.aspect = w / h; cam.updateProjectionMatrix(); }
  if (R3) { R3.setPixelRatio(dpr); R3.setSize(w, h, false); if (!composer && !postTried) initPost(Math.round(w * dpr), Math.round(h * dpr)); if (composer) { composer.setPixelRatio(dpr); composer.setSize(w, h); } }
}
addEventListener("resize", resize);

/* ----- 재료 / 헬퍼 ----- */
const MCACHE = new Map(), GC = {};
let UNIQ = false;
const RIM = { value: .2 }, RIMC = { value: new THREE.Color(0xbfe0ff) };
function toonPatch(m, key = "rim") {
  const prev = m.onBeforeCompile, pk = m.customProgramCacheKey;
  m.onBeforeCompile = sh => {
    if (prev) prev.call(m, sh); sh.uniforms.uRim = RIM; sh.uniforms.uRimC = RIMC;
    if (PBRL) sh.fragmentShader = sh.fragmentShader.replace("#include <dithering_fragment>", "#include <dithering_fragment>\n if (any(isnan(gl_FragColor.rgb)) || any(isinf(gl_FragColor.rgb))) gl_FragColor.rgb = diffuseColor.rgb * .35;");
    if (PBRL) sh.fragmentShader = sh.fragmentShader.replace("#include <lights_physical_fragment>", "#include <lights_physical_fragment>\n material.specularF90 = .12; material.specularColor *= .5;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float uRim; uniform vec3 uRimC;").replace("#include <opaque_fragment>", (RSTYLE === "cel" ? "{ float bse = max(dot(diffuseColor.rgb, vec3(.3333)), 1e-3); float lit = dot(outgoingLight - totalEmissiveRadiance, vec3(.3333)) / bse; float shd = clamp(1.1 - lit, 0.0, 1.0); float lm = dot(outgoingLight, vec3(.299, .587, .114)); outgoingLight = mix(vec3(lm), outgoingLight, 1.0 + shd * .4) * mix(vec3(1.0), vec3(.8, .85, 1.12), shd); }\n" : "") + "#include <opaque_fragment>").replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\n { float rf = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.6); totalEmissiveRadiance += uRimC * rf * uRim; }");
  };
  m.customProgramCacheKey = () => key + (m.userData.pk || "");
  return m;
}
const Mu = c => { const m = toonPatch(TOON({ color: c, gradientMap: gradTex })); if (GRD) addDetail(m, DKIND(c)); m.userData.own = 1; return m; };
const M = c => { let m = MCACHE.get(c); if (!m) { m = toonPatch(TOON({ color: c, gradientMap: gradTex })); if (GRD) addDetail(m, DKIND(c)); MCACHE.set(c, m); } return m; };
const uq = f => { UNIQ = true; try { return f(); } finally { UNIQ = false; } };
const geo = (k, f) => GC[k] || (GC[k] = f());
function addM(par, geom, col, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(geom, UNIQ ? Mu(col) : M(col));
  m.position.set(x, y, z); if (o.s) m.scale.set(o.s[0], o.s[1], o.s[2]); if (o.r) m.rotation.set(o.r[0], o.r[1], o.r[2]);
  m.castShadow = o.cs !== false; m.receiveShadow = !!o.rs; par.add(m); return m;
}
const B = (p, w, h, d, c, x, y, z, o) => addM(p, geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), c, x, y, z, o);
const Sp = (p, r, c, x, y, z, o) => addM(p, geo(`s${r}`, () => new THREE.SphereGeometry(r, 12, 9)), c, x, y, z, o);
const C = (p, rt, rb, h, c, x, y, z, n = 8, o) => addM(p, geo(`c${rt},${rb},${h},${n}`, () => new THREE.CylinderGeometry(rt, rb, h, n)), c, x, y, z, o);
const K = (p, r, h, c, x, y, z, n = 7, o) => addM(p, geo(`k${r},${h},${n}`, () => new THREE.ConeGeometry(r, h, n)), c, x, y, z, o);
const I = (p, r, c, x, y, z, o) => addM(p, geo(`i${r}`, () => new THREE.IcosahedronGeometry(r, 0)), c, x, y, z, o);
const TR = (p, r, t, c, x, y, z, o) => addM(p, geo(`t${r},${t}`, () => new THREE.TorusGeometry(r, t, 6, 14)), c, x, y, z, o);
const HALF = Math.PI / 2;
const OUTM = new THREE.MeshBasicMaterial({ color: RSTYLE === "cel" ? 0x3e2a44 : INK, side: THREE.BackSide });
const HDR = (hex, k = 2.4, o = {}) => { const m = new THREE.MeshBasicMaterial({ color: hex, ...o }); m.color.multiplyScalar(k); return m; };
const WIND = { value: 0 };
function windMat(opts, amp) {
  const m = TOON({ gradientMap: gradTex, ...opts }); m.userData.pk = "w" + amp;
  m.onBeforeCompile = sh => {
    sh.uniforms.uWind = WIND;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uWind;").replace("#include <begin_vertex>", `#include <begin_vertex>\n#ifdef USE_INSTANCING\n float ph = instanceMatrix[3].x * .7 + instanceMatrix[3].z * .5;\n transformed.x += sin(uWind * 1.7 + ph) * ${amp.toFixed(3)} * max(position.y, 0.0);\n transformed.z += cos(uWind * 1.3 + ph) * ${(amp * .6).toFixed(3)} * max(position.y, 0.0);\n#endif`);
  };
  return toonPatch(m);
}
/* 듀랑고풍 지형: Poly Haven(CC0) 실사 텍스처 6종 + 노멀맵을 아틀라스로 묶어 바이옴별로 섞기 */
const GRD = REAL ? await (async () => {
  try {
    const L = ["grass", "forest", "sand", "snow", "rock", "dirt"], IL = new THREE.ImageLoader(), base = "assets/ground/";
    const load = n => IL.loadAsync(base + n + ".webp");
    const DK = ["plaster", "roof", "wood", "brick", "timber", "fabric"], [D, N, PL, RK, RKN, DT, DN] = await Promise.all([Promise.all(L.map(load)), Promise.all(L.map(n => load(n + "_n"))), load("plaster"), load("rock"), load("rock_n"), Promise.all(DK.map(load)), Promise.all(DK.map(n => load(n + "_n")))]);
    const atlas = (imgs, srgb) => { const T = imgs[0].width, P = T / 16, CS = T + P * 2, c = document.createElement("canvas"); c.width = CS * 3; c.height = CS * 2; const x = c.getContext("2d");
      imgs.forEach((im, i) => { const cx = (i % 3) * CS, cy = Math.floor(i / 3) * CS; x.save(); x.beginPath(); x.rect(cx, cy, CS, CS); x.clip(); for (const ox of [-T, 0, T]) for (const oy of [-T, 0, T]) x.drawImage(im, cx + P + ox, cy + P + oy, T, T); x.restore(); });
      const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; t.userData.ts = T; return t; };
    const lum = im => { const c = document.createElement("canvas"); c.width = c.height = 16; const x = c.getContext("2d"); x.drawImage(im, 0, 0, 16, 16); const d = x.getImageData(0, 0, 16, 16).data; let s = 0; for (let i = 0; i < d.length; i += 4) { const f = v => Math.pow(v / 255, 2.2); s += f(d[i]) * .3 + f(d[i + 1]) * .59 + f(d[i + 2]) * .11; } return s / 256; };
    const tex = (im, srgb) => { const t = new THREE.Texture(im); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 8; return t; };
    const DTX = {}; DK.forEach((k, i) => { DTX[k] = { d: tex(DT[i], false), n: tex(DN[i], false) }; });
    return { A: atlas(D, true), NA: atlas(N, false), LM: D.map(lum), PL: tex(PL, false), RK: tex(RK, true), RKN: tex(RKN, false), DTX };
  } catch (e) { console.warn("지형 텍스처를 불러오지 못했어요.", e); return null; }
})() : null;
const BIOL = [2, 2, 0, 1, 2, 3, 5, 4, 0, 5, 4];   // 바이옴 → 지형 레이어 (0풀 1숲 2모래 3눈 4바위 5흙)
const GLAY = { g: 0, s: 2, p: 5, w: 2 };
function groundMat() {
  const m = TOON({ vertexColors: true, color: 0xffffff, roughness: .95 });
  m.onBeforeCompile = sh => {
    sh.uniforms.tGA = { value: GRD.A }; sh.uniforms.tGN = { value: GRD.NA }; sh.uniforms.uLM = { value: GRD.LM }; sh.uniforms.uTS = { value: new THREE.Vector2(GRD.A.userData.ts, GRD.NA.userData.ts) };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute vec3 sw0, sw1; varying vec3 vS0, vS1, vGW;").replace("#include <fog_vertex>", "#include <fog_vertex>\n vGW = (modelMatrix * vec4(transformed, 1.0)).xyz; vS0 = sw0; vS1 = sw1;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D tGA, tGN; uniform float uLM[6]; uniform vec2 uTS; varying vec3 vS0, vS1, vGW; vec3 gNrm = vec3(0.0, 0.0, 1.0); vec2 auvOf(int i, vec2 f, float T) { float P = T / 16.0, CS = T + P * 2.0; vec2 cell = vec2(float(i - (i / 3) * 3), float(i / 3)); return (cell * CS + P + f * T) / vec2(CS * 3.0, CS * 2.0); }")
      .replace("#include <map_fragment>", `{ vec2 wuv = vGW.xz * .3; float w[6]; w[0] = vS0.x; w[1] = vS0.y; w[2] = vS0.z; w[3] = vS1.x; w[4] = vS1.y; w[5] = vS1.z;
  vec2 AD = vec2(uTS.x * 1.125 * 3.0, uTS.x * 1.125 * 2.0), AN = vec2(uTS.y * 1.125 * 3.0, uTS.y * 1.125 * 2.0), gx = dFdx(wuv), gy = dFdy(wuv); vec3 tx = vec3(0.0), nn = vec3(0.0); float ws = 0.0, lm = 0.0;
  vec2 wuv2 = vGW.xz * .071 + vec2(.37, .61); vec2 gx2 = dFdx(wuv2), gy2 = dFdy(wuv2);
  for (int i = 0; i < 6; i++) { if (w[i] < .01) continue;
    vec3 a1 = textureGrad(tGA, auvOf(i, fract(wuv), uTS.x), gx * uTS.x / AD, gy * uTS.x / AD).rgb, a2 = textureGrad(tGA, auvOf(i, fract(wuv2), uTS.x), gx2 * uTS.x / AD, gy2 * uTS.x / AD).rgb;
    tx += mix(a1, a2, .35) * w[i]; nn += (textureGrad(tGN, auvOf(i, fract(wuv), uTS.y), gx * uTS.y / AN, gy * uTS.y / AN).rgb * 2.0 - 1.0) * w[i]; ws += w[i]; lm += uLM[i] * w[i]; }
  tx /= max(ws, 1e-3); lm /= max(ws, 1e-3); gNrm = normalize(vec3(nn.xy * 1.3, max(nn.z, .2)));
  float L = dot(tx, vec3(.3, .59, .11)), k = pow(L / max(lm, .03), 1.15); vec3 chroma = tx / max(L, .02); diffuseColor.rgb = vColor.rgb * k * mix(vec3(1.0), chroma, .22); }`)
      .replace("#include <dithering_fragment>", "#include <dithering_fragment>\n if (any(isnan(gl_FragColor.rgb)) || any(isinf(gl_FragColor.rgb))) gl_FragColor.rgb = diffuseColor.rgb * .35;")
      .replace("#include <color_fragment>", "").replace("#include <lights_physical_fragment>", "#include <lights_physical_fragment>\n material.specularF90 = .06; material.specularColor *= .4;")
      .replace("#include <normal_fragment_maps>", "{ vec3 nW = normalize(vec3(gNrm.x, gNrm.z, -gNrm.y)); normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz); }");
  };
  m.customProgramCacheKey = () => "ground"; return m;
}
const DCOL = { roof: [0xc8553d, 0xb04a34, 0x7a2e22, 0xc8383a, 0xd8383a, 0xa8202a], wood: [0x7d5433, 0xa87645, 0x9a7048, 0x8a5a34, 0x5a3a22, 0x6a5238, 0x7a5a3a, 0x8a7050, 0x9a6a3e, 0x6a4a2a], brick: [0xe4dfd6, 0xd2cdc2, 0xd8d3c8, 0xc8c3b8, 0x8a8e9e, 0xb8bcc8, 0x6c7080, 0x5c4a5a, 0x3d3248] };
const DKIND = c => { for (const k in DCOL) if (DCOL[k].includes(c)) return k; return "plaster"; };
const DSCALE = { plaster: .45, roof: .9, wood: .75, brick: .55, timber: .6, fabric: 2.2 };
function addDetail(m, kind = "plaster", obj = false) {   // 3방향 투영(트라이플래너) 질감 + 노멀: 지붕 기와 · 나무 판자 · 돌벽 · 회벽 · 천
  const prev = m.onBeforeCompile, T = GRD.DTX[kind] || GRD.DTX.plaster, sc = DSCALE[kind] || .5, str = kind === "plaster" ? .55 : kind === "fabric" ? .5 : .85; m.userData.pk = (m.userData.pk || "") + "dtl" + kind + (obj ? "o" : "");
  m.onBeforeCompile = sh => {
    if (prev) prev.call(m, sh); sh.uniforms.tDD = { value: T.d }; sh.uniforms.tDN = { value: T.n };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vDW, vDN;").replace("#include <fog_vertex>", obj ? "#include <fog_vertex>\n vDW = position; vDN = normalize(normal);" : "#include <fog_vertex>\n{ vec4 p4 = vec4(transformed, 1.0); vec3 n3 = objectNormal;\n#ifdef USE_INSTANCING\n p4 = instanceMatrix * p4; n3 = mat3(instanceMatrix) * n3;\n#endif\n vDW = (modelMatrix * p4).xyz; vDN = normalize(mat3(modelMatrix) * n3); }");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>\nuniform sampler2D tDD, tDN; varying vec3 vDW, vDN; vec3 dBW;`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n{ dBW = pow(abs(vDN), vec3(4.0)); dBW /= (dBW.x + dBW.y + dBW.z + 1e-4); vec3 p = vDW * ${sc.toFixed(3)}; float dl = texture2D(tDD, p.zy).r * dBW.x + texture2D(tDD, p.xz).r * dBW.y + texture2D(tDD, p.xy).r * dBW.z; diffuseColor.rgb *= 1.0 + (dl - .5) * ${(str * 1.6).toFixed(3)}; }`)
      .replace("#include <normal_fragment_maps>", obj ? "#include <normal_fragment_maps>" : `#include <normal_fragment_maps>\n{ vec3 p = vDW * ${sc.toFixed(3)}; vec3 tX = texture2D(tDN, p.zy).xyz * 2.0 - 1.0, tY = texture2D(tDN, p.xz).xyz * 2.0 - 1.0, tZ = texture2D(tDN, p.xy).xyz * 2.0 - 1.0; vec3 nW = normalize(vDN + (vec3(0.0, tX.y, tX.x) * dBW.x + vec3(tY.x, 0.0, tY.y) * dBW.y + vec3(tZ.x, tZ.y, 0.0) * dBW.z) * ${(str * .9).toFixed(3)}); normal = normalize((viewMatrix * vec4(nW, 0.0)).xyz); }`);
  };
  return m;
}
function addWind(m, amp, key) {
  const prev = m.onBeforeCompile; m.userData.pk = (m.userData.pk || "") + key;
  m.onBeforeCompile = sh => { if (prev) prev.call(m, sh); sh.uniforms.uWind = WIND; sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uWind;").replace("#include <begin_vertex>", `#include <begin_vertex>\n{ float ph = 0.0;\n#ifdef USE_INSTANCING\n ph = instanceMatrix[3].x * .7 + instanceMatrix[3].z * .5;\n#endif\n float hy = max(position.y - .4, 0.0); transformed.x += sin(uWind * 1.6 + ph) * ${amp.toFixed(4)} * hy; transformed.z += cos(uWind * 1.2 + ph) * ${(amp * .6).toFixed(4)} * hy; }`); };
  return m;
}
const PPOS = { value: new THREE.Vector3(1e4, 0, 1e4) }, CPOS = { value: new THREE.Vector3(1e4, 0, 1e4) };
function addFade(m) {
  const prev = m.onBeforeCompile; m.userData.pk = (m.userData.pk || "") + "fade";
  m.onBeforeCompile = sh => {
    if (prev) prev.call(m, sh); sh.uniforms.uPP = PPOS; sh.uniforms.uCP = CPOS;
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP;").replace("#include <fog_vertex>", "#include <fog_vertex>\n{ vec4 wpp = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\n wpp = instanceMatrix * wpp;\n#endif\n vWP = (modelMatrix * wpp).xyz; }");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vWP; uniform vec3 uPP, uCP;").replace("#include <clipping_planes_fragment>", "#include <clipping_planes_fragment>\n{ vec2 a0 = uPP.xz, ab = uCP.xz - a0; float tt = clamp(dot(vWP.xz - a0, ab) / max(dot(ab, ab), 1e-4), 0.0, .92); vec2 d = vWP.xz - (a0 + ab * tt); float r = length(d) + (tt < .05 ? 0.0 : 0.0); if (vWP.y > .9 && r < 3.0) { float a = smoothstep(1.7, 3.0, r); if (fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453) > a) discard; } }");
  };
  return m;
}
const NTINT = { PineTree_Leaves: 0x5f9a78, BirchTree_Leaves: 0x5a9ac8, NormalTree_Leaves: 0x9cba90, Bush_Leaves: 0x9cba90, Grass: 0xd8e0c0 };
function natMat(name) {
  if (NAT.mats[name]) return NAT.mats[name];
  const leaf = /Leaves|Grass|Flowers|Bush/.test(name), tn = name === "Rock" ? "Rocks" : name === "RockD" ? "Rocks_Desert" : name;
  let m = TOON({ map: NAT.tex[tn] || null, alphaTest: leaf ? .45 : 0, side: leaf ? THREE.DoubleSide : THREE.FrontSide });
  if (NTINT[name]) m.color.setHex(NTINT[name]); if (/Rock/.test(name)) m.color.setRGB(1.7, 1.68, 1.55);
  if (leaf) addWind(m, /Grass|Flowers/.test(name) ? .09 : .012, name); if (/Tree|Palm/.test(name)) addFade(m); toonPatch(m); return (NAT.mats[name] = m);
}
function natModel(n, sc = 1, desert) { const g = new THREE.Group(); for (const p of NAT.parts[n]) { const me = new THREE.Mesh(p.g, natMat(desert && p.m === "Rock" ? "RockD" : p.m)); me.castShadow = !/Grass|Flower/.test(n); me.receiveShadow = true; g.add(me); } g.scale.setScalar(sc); return g; }
const NATV = { oak: ["NormalTree_1", "NormalTree_2", "NormalTree_3"], pine: ["PineTree_1", "PineTree_2", "PineTree_3"], spine: ["PineTree_1", "PineTree_3"], dead: ["DeadTree_1", "DeadTree_2"], willow: ["BirchTree_1", "BirchTree_2"], rock: ["Rock_1", "Rock_2", "Rock_3", "Rock_4"], bush: ["Bush", "Bush_Large", "Bush", "Bush_Large"], tuft: ["Grass_Large", "Grass_Small", "Grass_Large", "Grass_Small", "Grass_Large", "Grass_Small", "Grass_Large"] };
const NATS = { oak: .52, pine: .55, spine: .5, dead: .5, willow: .5, rock: .75, bush: .8, tuft: 1.1 };
const WATERMAT = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, vertexColors: true, uniforms: { uT: { value: 0 }, uDay: { value: 1 }, uSky: { value: new THREE.Color(0xbcd2e2) }, uSun: { value: new THREE.Vector3(-.4, .8, .4) } },
  vertexShader: "varying vec3 vW; varying float vF; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vF = color.r; gl_Position = projectionMatrix * viewMatrix * w; }",
  fragmentShader: "uniform float uT, uDay; uniform vec3 uSky, uSun; varying vec3 vW; varying float vF; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); } void main(){ vec2 p = vW.xz; float a = n(p * 1.6 + vec2(uT * .35, uT * .2)), b = n(p * 3.1 - vec2(uT * .3, uT * .25)); float w = a * .6 + b * .4; vec3 col = mix(vec3(.2, .5, .84), vec3(.42, .76, .96), w); col += vec3(.5, .62, .7) * pow(w, 5.0) * .8; col += vec3(1.0) * smoothstep(.8, .88, w) * .45; float edge = vF * (.55 + .45 * sin(uT * 2.2 + p.x * 2.0 + p.y * 1.7)); col = mix(col, vec3(.92, .98, 1.0), edge * smoothstep(.25, .6, n(p * 4.0 + uT * .4) + vF * .35) * .75); " + (REAL ? "{ vec3 N = normalize(vec3((a - .5) * .55 + (b - .5) * .35, 1.0, (b - .5) * .55 - (a - .5) * .25)); vec3 V = normalize(cameraPosition - vW); float fr = .06 + .94 * pow(1.0 - max(dot(N, V), 0.0), 4.0); col = mix(col, uSky, clamp(fr, 0.0, .75)); float sp = pow(max(dot(reflect(-normalize(uSun), N), V), 0.0), 120.0); col += vec3(1.0, .95, .85) * sp * 1.6 * uDay; }" : "") + " col *= uDay; gl_FragColor = vec4(" + (REAL ? "pow(col, vec3(2.2))" : "col") + ", mix(.84, .95, vF)); }",
});
const mkCanvasTex = (n, fn, rep = true) => { const c = document.createElement("canvas"); c.width = c.height = n; fn(c.getContext("2d"), n); const t = new THREE.CanvasTexture(c); if (REAL) t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
let _soft = null, _detail = null, _cloud = null;
const softTex = () => _soft || (_soft = mkCanvasTex(64, (x, n) => { const g = x.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(.4, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, n, n); }, false));
const groundTex = () => mkCanvasTex(512, (x, n) => {
  x.fillStyle = "#e6e6e0"; x.fillRect(0, 0, n, n); const r = mulberry32(77);
  for (let i = 0; i < 260; i++) { const cx = r() * n, cy = r() * n, rad = 8 + r() * 46, gr = x.createRadialGradient(cx, cy, 0, cx, cy, rad), d = r() < .5; gr.addColorStop(0, d ? "rgba(70,80,40,.18)" : "rgba(255,255,235,.22)"); gr.addColorStop(1, "rgba(0,0,0,0)"); for (const [ox, oy] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) { x.save(); x.translate(ox, oy); x.fillStyle = gr; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); x.restore(); } }
  for (let i = 0; i < 5200; i++) { const a = r() * n, b = r() * n, l = 3 + r() * 9, ang = -HALF + (r() - .5) * .9; x.strokeStyle = r() < .55 ? `rgba(255,255,230,${.18 + r() * .25})` : `rgba(40,55,20,${.12 + r() * .18})`; x.lineWidth = .8 + r() * 1.4; x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(ang) * l, b + Math.sin(ang) * l); x.stroke(); }
  for (let i = 0; i < 160; i++) { x.fillStyle = `rgba(110,100,90,${.15 + r() * .2})`; x.beginPath(); x.ellipse(r() * n, r() * n, 1 + r() * 3, 1 + r() * 2, r() * 3, 0, 7); x.fill(); }
});
const detailTex = () => _detail || (_detail = REAL ? groundTex() : mkCanvasTex(128, (x, n) => {
  x.fillStyle = "#f2f2f2"; x.fillRect(0, 0, n, n); const r = mulberry32(31);
  for (let i = 0; i < 900; i++) { const a = r() * n, b = r() * n, l = 2 + r() * 5; x.strokeStyle = r() < .5 ? "rgba(255,255,255,.55)" : "rgba(60,70,40,.16)"; x.lineWidth = 1; x.beginPath(); x.moveTo(a, b); x.lineTo(a + (r() - .5) * 3, b - l); x.stroke(); }
  for (let i = 0; i < 40; i++) { x.fillStyle = "rgba(90,100,60,.07)"; x.beginPath(); x.arc(r() * n, r() * n, 4 + r() * 10, 0, 7); x.fill(); }
}));
const cloudTex = () => _cloud || (_cloud = mkCanvasTex(256, (x, n) => { const r = mulberry32(8); for (let i = 0; i < 18; i++) { const cx = r() * n, cy = r() * n, rad = 26 + r() * 40; for (const [ox, oy] of [[0, 0], [n, 0], [-n, 0], [0, n], [0, -n]]) { const g = x.createRadialGradient(cx + ox, cy + oy, 0, cx + ox, cy + oy, rad); g.addColorStop(0, "rgba(12,24,60,.34)"); g.addColorStop(1, "rgba(12,24,60,0)"); x.fillStyle = g; x.fillRect(0, 0, n, n); } } }));
function outline(g, t = 1.1) {
  if (PBRL) return g; if (RSTYLE === "cel") t += .015;
  const L = []; g.traverse(o => { if (o.isMesh && !o.userData.ol) L.push(o); });
  for (const m of L) { const o = new THREE.Mesh(m.geometry, OUTM); o.scale.setScalar(t); o.userData.ol = 1; m.add(o); }
  return g;
}
function flash(e, on) {
  if (e.fl === on) return; e.fl = on;
  e.g.traverse(m => { if (m.isMesh && !m.userData.ol && m.material.emissive) m.material.emissive.setHex(on ? 0xffffff : 0); });
}
function face(g, dx, dz, k = 14) {
  if (!dx && !dz) return; const tg = Math.atan2(dx, dz); let d = tg - g.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); g.rotation.y += d * Math.min(1, DT * k);
}
const hexRGB = h => new THREE.Color(h);
