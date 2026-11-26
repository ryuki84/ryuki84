// 떠돌이 섬 — 탐험(오픈월드) · 핵앤슬래시 전투/파밍 · 생존 제작 · 마을살이를 섞은 3D 프로토타입
import * as THREE from 'three';

// ============================================================
// 유틸 & 노이즈
// ============================================================
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
let seed = 20261126;
const srand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

function hash(x, y) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967295;
}
const smooth = t => t * t * (3 - 2 * t);
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  const u = smooth(xf), v = smooth(yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y) {
  let s = 0, amp = 1, f = 1, n = 0;
  for (let i = 0; i < 4; i++) { s += vnoise(x * f, y * f) * amp; n += amp; amp *= 0.5; f *= 2; }
  return s / n;
}

// ============================================================
// 월드 지형
// ============================================================
const WORLD = 220;
const VILLAGE = { x: 0, z: 0, r: 18 };
const SHRINE = { x: -55, z: 38 };
const PEAK = { x: 48, z: -48 };

function heightAt(x, z) {
  const d = Math.hypot(x, z) / (WORLD * 0.5);
  let h = fbm(x * 0.022 + 10, z * 0.022 + 10) * 15 - 3.5;
  h -= Math.pow(Math.max(0, d - 0.6), 2) * 90;           // 섬 가장자리
  const m = Math.hypot(x - PEAK.x, z - PEAK.z);
  h += Math.max(0, 26 - m) * 0.95;                         // 북동쪽 산
  const flat = (cx, cz, r, target) => {
    const v = Math.hypot(x - cx, z - cz);
    if (v < r) { const t = smooth(Math.min(1, v / r)); h = target * (1 - t) + h * t; }
  };
  flat(VILLAGE.x, VILLAGE.z, 22, 2);
  flat(SHRINE.x, SHRINE.z, 13, 3);
  return h;
}

// ============================================================
// 렌더러 / 씬
// ============================================================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9fd4ff);
scene.fog = new THREE.Fog(0x9fd4ff, 70, 170);
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 500);

const hemi = new THREE.HemisphereLight(0xdff0ff, 0x4a6b3a, 1.1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 200 });
sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// 지형 메시
{
  const SEG = 200;
  const g = new THREE.PlaneGeometry(WORLD, WORLD, SEG, SEG);
  g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, cols = [];
  const c = new THREE.Color(), g1 = new THREE.Color(0x7cc653), g2 = new THREE.Color(0x4f9a3a),
    sand = new THREE.Color(0xead9a2), rock = new THREE.Color(0x8b8f7d), snow = new THREE.Color(0xf4f6fa),
    path = new THREE.Color(0xc9a66b);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), h = heightAt(x, z);
    pos.setY(i, h);
    if (h < 0.7) c.copy(sand);
    else if (h < 10) c.copy(g1).lerp(g2, fbm(x * 0.08, z * 0.08));
    else if (h < 16) c.copy(rock);
    else c.copy(snow);
    const vr = Math.hypot(x, z);
    if (vr < 6 || (vr < 20 && Math.abs(Math.abs(x) - Math.abs(z)) < 1.4 && h > 0.7)) c.lerp(path, 0.7);
    cols.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  g.computeVertexNormals();
  const terrain = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  terrain.receiveShadow = true;
  scene.add(terrain);
}
const water = new THREE.Mesh(new THREE.PlaneGeometry(800, 800),
  new THREE.MeshLambertMaterial({ color: 0x3aa6d8, transparent: true, opacity: 0.78 }));
water.rotation.x = -Math.PI / 2;
scene.add(water);

// ============================================================
// 재질 & 모델 빌더
// ============================================================
const MATS = {};
const mat = (color, extra = {}) => {
  const key = color + JSON.stringify(extra);
  return MATS[key] || (MATS[key] = new THREE.MeshLambertMaterial({ color, flatShading: true, ...extra }));
};
function mesh(geo, material, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}
function makeLabel(text, color = '#fff', size = 48) {
  const cv = document.createElement('canvas');
  const ctx = cv.getContext('2d');
  ctx.font = `800 ${size}px sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + 24;
  cv.width = w; cv.height = size + 20;
  ctx.font = `800 ${size}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,.65)';
  ctx.strokeText(text, w / 2, cv.height / 2);
  ctx.fillStyle = color; ctx.fillText(text, w / 2, cv.height / 2);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false }));
  s.scale.set(w / cv.height * 0.6, 0.6, 1);
  s.renderOrder = 10;
  return s;
}

const GEO = {
  trunk: new THREE.CylinderGeometry(0.22, 0.32, 1.6, 6),
  pine: new THREE.ConeGeometry(1.3, 2.6, 7),
  round: new THREE.IcosahedronGeometry(1.4, 0),
  rock: new THREE.DodecahedronGeometry(1, 0),
  bush: new THREE.IcosahedronGeometry(0.75, 0),
  berry: new THREE.SphereGeometry(0.13, 6, 4),
  box: new THREE.BoxGeometry(1, 1, 1),
};

function buildTree(kind) {
  const g = new THREE.Group();
  mesh(GEO.trunk, mat(0x7a5432), 0, 0.8, 0, g);
  if (kind === 'pine') {
    mesh(GEO.pine, mat(0x2f7d4a), 0, 2.4, 0, g);
    const t = mesh(GEO.pine, mat(0x3a9157), 0, 3.5, 0, g); t.scale.setScalar(0.72);
  } else {
    const c = mesh(GEO.round, mat(pick([0x5fb34a, 0x6cc04f, 0xe9a0b8])), 0, 2.6, 0, g);
    c.scale.set(1, 0.9, 1);
  }
  return g;
}
function buildRock(big) {
  const g = new THREE.Group();
  const m = mesh(GEO.rock, mat(big ? 0x7f8796 : 0x9aa1ab), 0, 0.4, 0, g);
  m.scale.set(rand(0.8, 1.3) * (big ? 1.4 : 1), rand(0.6, 0.9) * (big ? 1.4 : 1), rand(0.8, 1.3));
  m.rotation.y = rand(0, 6);
  if (srand() < 0.3) { const o = mesh(GEO.rock, mat(0xc7b07a), 0.4, 0.75, 0.2, g); o.scale.setScalar(0.3); }
  return g;
}
function buildBush() {
  const g = new THREE.Group();
  mesh(GEO.bush, mat(0x3f8f3e), 0, 0.55, 0, g).scale.set(1.2, 0.85, 1.2);
  const berries = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2;
    mesh(GEO.berry, mat(0xe8344a), Math.cos(a) * 0.72, 0.5 + Math.sin(i * 3) * 0.25, Math.sin(a) * 0.72, berries);
  }
  g.add(berries);
  g.userData.berries = berries;
  return g;
}

// 캐릭터
function buildPlayer() {
  const g = new THREE.Group();
  const body = new THREE.Group(); g.add(body);
  mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.9, 8), mat(0x2f6fb5), 0, 0.85, 0, body);         // 튜닉
  mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.12, 8), mat(0x6b4423), 0, 0.72, 0, body);         // 벨트
  mesh(new THREE.SphereGeometry(0.36, 10, 8), mat(0xf6d2a8), 0, 1.55, 0, body);                    // 머리
  const hair = mesh(new THREE.SphereGeometry(0.38, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x5b3a1e), 0, 1.6, -0.03, body);
  hair.scale.set(1, 0.8, 1);
  mesh(new THREE.ConeGeometry(0.3, 0.5, 6), mat(0x3d8b4f), 0, 1.98, -0.05, body).rotation.x = -0.4; // 모자
  mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(0x222222), 0.13, 1.58, 0.32, body);
  mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(0x222222), -0.13, 1.58, 0.32, body);
  const legL = mesh(new THREE.BoxGeometry(0.18, 0.45, 0.2), mat(0x4a3a2a), 0.16, 0.25, 0, body);
  const legR = mesh(new THREE.BoxGeometry(0.18, 0.45, 0.2), mat(0x4a3a2a), -0.16, 0.25, 0, body);
  // 망토
  const cape = mesh(new THREE.BoxGeometry(0.7, 0.9, 0.06), mat(0xb8323a), 0, 0.95, -0.42, body);
  // 무기 팔
  const arm = new THREE.Group(); arm.position.set(-0.5, 1.1, 0); body.add(arm);
  mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), mat(0xf6d2a8), 0, -0.2, 0, arm);
  const weaponHolder = new THREE.Group(); weaponHolder.position.set(0, -0.45, 0.1); arm.add(weaponHolder);
  // 방패 팔
  const shield = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 10), mat(0x8a5a2b), 0.52, 0.95, 0.05, body);
  shield.rotation.z = Math.PI / 2;
  // 글라이더
  const glider = new THREE.Group(); glider.position.y = 2.6; glider.visible = false; g.add(glider);
  const sail = mesh(new THREE.ConeGeometry(1.8, 0.5, 4, 1, true), mat(0xf2c14e, { side: THREE.DoubleSide }), 0, 0, 0, glider);
  sail.rotation.y = Math.PI / 4; sail.scale.set(1, 1, 0.6);
  g.userData = { body, legL, legR, arm, weaponHolder, cape, glider };
  return g;
}
function buildWeaponMesh(w) {
  const g = new THREE.Group();
  const col = RARITY[w.rarity].hex;
  const metal = mat(w.rarity >= 2 ? col : 0xcfd6de, w.rarity >= 1 ? { emissive: col, emissiveIntensity: 0.35 } : {});
  mesh(new THREE.BoxGeometry(0.08, 0.3, 0.08), mat(0x5b3a1e), 0, 0, 0, g);
  if (w.base === '검') { mesh(new THREE.BoxGeometry(0.3, 0.06, 0.08), mat(0xb08d3a), 0, -0.15, 0, g); mesh(new THREE.BoxGeometry(0.1, 1.0, 0.04), metal, 0, -0.68, 0, g); }
  if (w.base === '단검') { mesh(new THREE.BoxGeometry(0.22, 0.05, 0.08), mat(0xb08d3a), 0, -0.15, 0, g); mesh(new THREE.BoxGeometry(0.09, 0.5, 0.04), metal, 0, -0.42, 0, g); }
  if (w.base === '도끼') { mesh(new THREE.BoxGeometry(0.07, 0.9, 0.07), mat(0x7a5432), 0, -0.45, 0, g); mesh(new THREE.BoxGeometry(0.4, 0.3, 0.06), metal, 0.15, -0.8, 0, g); }
  if (w.base === '망치') { mesh(new THREE.BoxGeometry(0.08, 0.9, 0.08), mat(0x7a5432), 0, -0.45, 0, g); mesh(new THREE.BoxGeometry(0.5, 0.3, 0.3), metal, 0, -0.9, 0, g); }
  g.rotation.x = Math.PI; // 칼끝이 앞/위를 보도록
  g.rotation.z = 0;
  return g;
}

// 몬스터
function buildSlime(color) {
  const g = new THREE.Group();
  const b = mesh(new THREE.SphereGeometry(0.6, 10, 8), mat(color, { transparent: true, opacity: 0.88 }), 0, 0.5, 0, g);
  b.scale.set(1, 0.8, 1);
  mesh(new THREE.SphereGeometry(0.08, 6, 4), mat(0x111111), 0.2, 0.62, 0.48, g);
  mesh(new THREE.SphereGeometry(0.08, 6, 4), mat(0x111111), -0.2, 0.62, 0.48, g);
  g.userData.squash = b;
  return g;
}
function buildRaptor() {
  const g = new THREE.Group();
  const c = mat(0x5f8f3a), belly = mat(0xc9d48a);
  mesh(new THREE.BoxGeometry(0.6, 0.6, 1.2), c, 0, 1.0, 0, g);
  mesh(new THREE.BoxGeometry(0.5, 0.4, 0.9), belly, 0, 0.85, 0.05, g);
  const neck = mesh(new THREE.BoxGeometry(0.3, 0.6, 0.3), c, 0, 1.45, 0.55, g); neck.rotation.x = 0.5;
  mesh(new THREE.BoxGeometry(0.4, 0.35, 0.7), c, 0, 1.75, 0.85, g);
  mesh(new THREE.BoxGeometry(0.3, 0.12, 0.5), mat(0xffffff), 0, 1.6, 0.95, g);
  mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0xffd000), 0.18, 1.85, 1.0, g);
  mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0xffd000), -0.18, 1.85, 1.0, g);
  const tail = mesh(new THREE.BoxGeometry(0.25, 0.25, 1.2), c, 0, 1.1, -1.1, g); tail.rotation.x = -0.2;
  const legL = mesh(new THREE.BoxGeometry(0.18, 0.8, 0.22), c, 0.22, 0.4, 0, g);
  const legR = mesh(new THREE.BoxGeometry(0.18, 0.8, 0.22), c, -0.22, 0.4, 0, g);
  for (let i = 0; i < 4; i++) mesh(new THREE.ConeGeometry(0.07, 0.25, 4), mat(0xd9733a), 0, 1.35, 0.3 - i * 0.3, g);
  g.userData.legs = [legL, legR]; g.userData.tail = tail;
  return g;
}
function buildGolem() {
  const g = new THREE.Group();
  const s = mat(0x6f7480), moss = mat(0x4f8a3a), glow = mat(0x66e0ff, { emissive: 0x66e0ff, emissiveIntensity: 1 });
  mesh(new THREE.DodecahedronGeometry(1.2, 0), s, 0, 2.2, 0, g).scale.set(1.3, 1, 1);
  mesh(new THREE.DodecahedronGeometry(0.6, 0), s, 0, 3.6, 0.2, g);
  mesh(new THREE.BoxGeometry(0.5, 0.2, 0.1), glow, 0, 3.65, 0.72, g);
  mesh(new THREE.BoxGeometry(1.6, 0.4, 1.2), moss, 0, 3.05, -0.1, g);
  const aL = mesh(new THREE.DodecahedronGeometry(0.55, 0), s, 1.7, 2.0, 0, g); aL.scale.set(0.8, 1.6, 0.8);
  const aR = mesh(new THREE.DodecahedronGeometry(0.55, 0), s, -1.7, 2.0, 0, g); aR.scale.set(0.8, 1.6, 0.8);
  const lL = mesh(new THREE.BoxGeometry(0.6, 1.1, 0.6), s, 0.6, 0.55, 0, g);
  const lR = mesh(new THREE.BoxGeometry(0.6, 1.1, 0.6), s, -0.6, 0.55, 0, g);
  g.userData.legs = [lL, lR]; g.userData.arms = [aL, aR];
  return g;
}

// 주민
function buildMoko() {
  const g = new THREE.Group();
  const fur = mat(0xb07a4a), light = mat(0xf0d9b5);
  mesh(new THREE.SphereGeometry(0.6, 10, 8), fur, 0, 0.75, 0, g).scale.set(1, 1.1, 1);
  mesh(new THREE.SphereGeometry(0.45, 10, 8), light, 0, 0.7, 0.25, g);
  mesh(new THREE.SphereGeometry(0.42, 10, 8), fur, 0, 1.55, 0, g);
  mesh(new THREE.SphereGeometry(0.2, 8, 6), light, 0, 1.45, 0.35, g);
  mesh(new THREE.SphereGeometry(0.07, 6, 4), mat(0x332222), 0, 1.5, 0.55, g);
  mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(0x111111), 0.14, 1.65, 0.36, g);
  mesh(new THREE.SphereGeometry(0.05, 6, 4), mat(0x111111), -0.14, 1.65, 0.36, g);
  mesh(new THREE.SphereGeometry(0.14, 6, 4), fur, 0.3, 1.9, 0, g);
  mesh(new THREE.SphereGeometry(0.14, 6, 4), fur, -0.3, 1.9, 0, g);
  mesh(new THREE.TorusGeometry(0.3, 0.06, 6, 12), mat(0x3a7bd5), 0, 1.25, 0, g).rotation.x = Math.PI / 2; // 스카프
  return g;
}
function buildPio() {
  const g = new THREE.Group();
  const f = mat(0x5fa8e8);
  mesh(new THREE.SphereGeometry(0.55, 10, 8), f, 0, 0.9, 0, g).scale.set(1, 1.2, 1);
  mesh(new THREE.SphereGeometry(0.35, 10, 8), mat(0xffffff), 0, 0.8, 0.28, g);
  mesh(new THREE.ConeGeometry(0.13, 0.35, 6), mat(0xf2a33a), 0, 1.35, 0.6, g).rotation.x = Math.PI / 2;
  mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0x111111), 0.18, 1.5, 0.45, g);
  mesh(new THREE.SphereGeometry(0.06, 6, 4), mat(0x111111), -0.18, 1.5, 0.45, g);
  const wL = mesh(new THREE.BoxGeometry(0.1, 0.5, 0.35), f, 0.58, 0.95, 0, g); wL.rotation.z = -0.3;
  const wR = mesh(new THREE.BoxGeometry(0.1, 0.5, 0.35), f, -0.58, 0.95, 0, g); wR.rotation.z = 0.3;
  mesh(new THREE.ConeGeometry(0.12, 0.3, 4), mat(0xf25a7a), 0, 1.95, 0, g);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 4), mat(0xf2a33a), 0.15, 0.15, 0, g);
  mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 4), mat(0xf2a33a), -0.15, 0.15, 0, g);
  g.userData.wings = [wL, wR];
  return g;
}

// 건축물
function buildHut(roofColor = 0xc0483a) {
  const g = new THREE.Group();
  mesh(new THREE.BoxGeometry(3.2, 2.2, 3.2), mat(0xf2e2c4), 0, 1.1, 0, g);
  const roof = mesh(new THREE.ConeGeometry(2.8, 1.8, 4), mat(roofColor), 0, 3.1, 0, g); roof.rotation.y = Math.PI / 4;
  mesh(new THREE.BoxGeometry(0.9, 1.4, 0.1), mat(0x7a5432), 0, 0.7, 1.62, g);
  mesh(new THREE.BoxGeometry(0.6, 0.6, 0.1), mat(0x9fd8ff, { emissive: 0x332200 }), 1.0, 1.4, 1.62, g);
  mesh(new THREE.BoxGeometry(0.35, 1, 0.35), mat(0x8a8f99), -0.9, 3.4, -0.6, g);
  return g;
}
function buildCampfire() {
  const g = new THREE.Group();
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    mesh(GEO.rock, mat(0x8a8f99), Math.cos(a) * 0.7, 0.1, Math.sin(a) * 0.7, g).scale.setScalar(0.22);
  }
  const l1 = mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 6), mat(0x6b4423), 0, 0.15, 0, g); l1.rotation.z = Math.PI / 2;
  const l2 = mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.1, 6), mat(0x6b4423), 0, 0.2, 0, g); l2.rotation.set(0, Math.PI / 2, Math.PI / 2);
  const flame = mesh(new THREE.ConeGeometry(0.35, 0.9, 6), new THREE.MeshBasicMaterial({ color: 0xffa531 }), 0, 0.65, 0, g);
  const flame2 = mesh(new THREE.ConeGeometry(0.2, 0.6, 6), new THREE.MeshBasicMaterial({ color: 0xfff1a0 }), 0, 0.55, 0, g);
  flame.castShadow = flame2.castShadow = false;
  g.userData.flames = [flame, flame2];
  return g;
}
function buildFence() {
  const g = new THREE.Group();
  const w = mat(0xb5874f);
  mesh(new THREE.BoxGeometry(0.18, 1.0, 0.18), w, -0.9, 0.5, 0, g);
  mesh(new THREE.BoxGeometry(0.18, 1.0, 0.18), w, 0.9, 0.5, 0, g);
  mesh(new THREE.BoxGeometry(2.0, 0.14, 0.08), w, 0, 0.7, 0, g);
  mesh(new THREE.BoxGeometry(2.0, 0.14, 0.08), w, 0, 0.35, 0, g);
  return g;
}
function buildFlower() {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.4, 8), mat(0xc0683a), 0, 0.2, 0, g);
  const cols = [0xff7aa8, 0xffd84a, 0xffffff, 0xa06bff, 0xff5a5a];
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * Math.PI * 2;
    mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 4), mat(0x3f8f3e), Math.cos(a) * 0.12, 0.55, Math.sin(a) * 0.12, g);
    mesh(new THREE.SphereGeometry(0.11, 6, 4), mat(pick(cols)), Math.cos(a) * 0.12, 0.78, Math.sin(a) * 0.12, g);
  }
  return g;
}
function buildLantern() {
  const g = new THREE.Group();
  mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.8, 6), mat(0x3a3a3a), 0, 0.9, 0, g);
  const lamp = mesh(new THREE.BoxGeometry(0.4, 0.45, 0.4), new THREE.MeshBasicMaterial({ color: 0xffe08a }), 0, 1.95, 0, g);
  lamp.castShadow = false;
  mesh(new THREE.ConeGeometry(0.35, 0.25, 4), mat(0x3a3a3a), 0, 2.3, 0, g).rotation.y = Math.PI / 4;
  g.userData.lamp = lamp;
  return g;
}
function buildChest(golden) {
  const g = new THREE.Group();
  const wood = mat(golden ? 0x3d6fb8 : 0x8a5a2b), trim = mat(0xf2c14e, { emissive: 0x553300 });
  mesh(new THREE.BoxGeometry(1.1, 0.6, 0.75), wood, 0, 0.3, 0, g);
  const lid = new THREE.Group(); lid.position.set(0, 0.6, -0.37); g.add(lid);
  mesh(new THREE.BoxGeometry(1.1, 0.3, 0.75), wood, 0, 0.15, 0.37, lid);
  mesh(new THREE.BoxGeometry(1.14, 0.08, 0.1), trim, 0, 0.15, 0.75, lid);
  mesh(new THREE.BoxGeometry(0.16, 0.2, 0.06), trim, 0, 0.45, 0.39, g);
  g.userData.lid = lid;
  return g;
}

const BUILD_DEFS = {
  campfire: { name: '모닥불', build: buildCampfire, r: 0.9 },
  fence: { name: '나무 울타리', build: buildFence, r: 0.5 },
  flower: { name: '꽃 화분', build: buildFlower, r: 0.4 },
  lantern: { name: '가로등', build: buildLantern, r: 0.3 },
  hut: { name: '작은 오두막', build: () => buildHut(0x3f7fbf), r: 2.3 },
};

// ============================================================
// 아이템 / 루트 시스템
// ============================================================
const RARITY = [
  { name: '일반', css: '#e6e6e6', hex: 0xe6e6e6, mult: 1.0, w: 62 },
  { name: '마법', css: '#5a8cff', hex: 0x5a8cff, mult: 1.35, w: 27 },
  { name: '희귀', css: '#ffd84a', hex: 0xffd84a, mult: 1.8, w: 9 },
  { name: '전설', css: '#ff8a1f', hex: 0xff8a1f, mult: 2.6, w: 2 },
];
const BASES = [
  { base: '검', dmg: 10, spd: 1.0, gather: 1 },
  { base: '도끼', dmg: 11, spd: 0.85, gather: 3 },
  { base: '망치', dmg: 16, spd: 0.68, gather: 2 },
  { base: '단검', dmg: 7, spd: 1.5, gather: 1 },
];
const MATERIALS = ['나무', '강철', '미스릴', '태고의'];
const AFFIXES = [
  { pre: '흡혈의', apply: w => { w.ls += randi(4, 9); } },
  { pre: '날렵한', apply: w => { w.spd = +(w.spd * 1.22).toFixed(2); } },
  { pre: '나무꾼의', apply: w => { w.gather += 2; } },
  { pre: '잔혹한', apply: w => { w.dmg = Math.round(w.dmg * 1.25); } },
  { pre: '수호자의', apply: w => { w.hp += randi(20, 40); } },
  { pre: '불꽃의', apply: w => { w.fire += randi(3, 8); } },
];
function rollRarity(luck = 0) {
  let total = 0;
  const ws = RARITY.map((r, i) => (total += r.w * (i > 0 ? 1 + luck : 1)));
  const x = Math.random() * total;
  return ws.findIndex(v => x < v);
}
function makeWeapon(level, rarity = rollRarity(), baseName) {
  const b = baseName ? BASES.find(x => x.base === baseName) : pick(BASES);
  const scale = RARITY[rarity].mult * (1 + (level - 1) * 0.1);
  const w = { id: Math.random().toString(36).slice(2, 9), base: b.base, rarity, dmg: Math.round(b.dmg * scale * rand(0.9, 1.1)),
    spd: b.spd, gather: b.gather, ls: 0, hp: 0, fire: 0, lvl: level };
  const affs = [...AFFIXES].sort(() => Math.random() - 0.5).slice(0, rarity);
  affs.forEach(a => a.apply(w));
  w.name = `${affs[0] ? affs[0].pre + ' ' : ''}${MATERIALS[rarity]} ${b.base}`;
  return w;
}
function weaponDesc(w) {
  const p = [`공격력 ${w.dmg}`, `속도 ${w.spd}`];
  if (w.fire) p.push(`화염 +${w.fire}`);
  if (w.ls) p.push(`흡혈 ${w.ls}%`);
  if (w.hp) p.push(`체력 +${w.hp}`);
  if (w.gather > 1) p.push(`채집 x${w.gather}`);
  return p.join(' · ');
}

// ============================================================
// 게임 상태
// ============================================================
const state = {
  level: 1, xp: 0, gold: 0, hp: 100,
  res: { wood: 0, stone: 0, berry: 0, potion: 1 },
  items: [], equipped: null,
  quest: 0, questActive: false, questBase: 0,
  kills: { slime: 0, raptor: 0, golem: 0 },
  structures: [], glider: false, shrineDone: false, shrineChestOpened: false,
  openedChests: [], time: 0.28, spawn: { x: 0, z: 4 },
};
const xpNeed = () => Math.round(60 * Math.pow(state.level, 1.45));
const weapon = () => state.items.find(i => i.id === state.equipped) || state.items[0];
const maxHp = () => 100 + (state.level - 1) * 12 + (weapon()?.hp || 0);
const baseDmg = () => (weapon()?.dmg || 5) + (state.level - 1) * 2;

// ============================================================
// 사운드 (WebAudio로 간단한 효과음)
// ============================================================
let actx;
function sfx(freq = 440, dur = 0.08, type = 'square', vol = 0.06, slide = 0) {
  try {
    actx = actx || new AudioContext();
    const o = actx.createOscillator(), gn = actx.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), actx.currentTime + dur);
    gn.gain.setValueAtTime(vol, actx.currentTime);
    gn.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + dur);
    o.connect(gn).connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch { /* 오디오 불가 환경 */ }
}

// ============================================================
// UI 헬퍼
// ============================================================
const $ = id => document.getElementById(id);
function toast(msg, color) {
  const d = document.createElement('div');
  d.className = 'toast'; d.innerHTML = msg;
  if (color) d.style.color = color;
  $('toasts').appendChild(d);
  setTimeout(() => d.remove(), 3300);
  while ($('toasts').children.length > 5) $('toasts').firstChild.remove();
}
const floaters = [];
const _v = new THREE.Vector3();
function floatText(text, pos, color = '#fff', size = 18) {
  const d = document.createElement('div');
  d.className = 'floater'; d.textContent = text; d.style.color = color; d.style.fontSize = size + 'px';
  $('floaters').appendChild(d);
  floaters.push({ d, p: pos.clone().add(new THREE.Vector3(rand(-0.3, 0.3), 1.8, rand(-0.3, 0.3))), t: 0 });
}
function updateFloaters(dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.t += dt; f.p.y += dt * 1.5;
    _v.copy(f.p).project(camera);
    f.d.style.left = (_v.x * 0.5 + 0.5) * innerWidth + 'px';
    f.d.style.top = (-_v.y * 0.5 + 0.5) * innerHeight + 'px';
    f.d.style.opacity = 1 - f.t / 0.9;
    if (f.t > 0.9 || _v.z > 1) { f.d.remove(); floaters.splice(i, 1); }
  }
}

// ============================================================
// 월드 오브젝트 생성
// ============================================================
const resources = [];   // 나무/바위/덤불
const statics = [];     // 충돌용 {x,z,r,alive?}
function addStatic(x, z, r, ref) { const s = { x, z, r, ref }; statics.push(s); return s; }

function placeResources() {
  let tries = 0;
  const near = (x, z, cx, cz, r) => Math.hypot(x - cx, z - cz) < r;
  while (resources.length < 420 && tries++ < 6000) {
    const x = (srand() - 0.5) * WORLD * 0.9, z = (srand() - 0.5) * WORLD * 0.9;
    const h = heightAt(x, z);
    if (h < 0.9 || near(x, z, 0, 0, 21) || near(x, z, SHRINE.x, SHRINE.z, 14)) continue;
    const forest = fbm(x * 0.03 + 50, z * 0.03 + 50);
    const r = srand();
    let type;
    if (h > 12) type = r < 0.55 ? 'rock' : null;
    else if (forest > 0.52 && r < 0.75) type = 'tree';
    else if (r < 0.12) type = 'rock';
    else if (r < 0.17) type = 'bush';
    else if (r < 0.25) type = 'tree';
    if (!type) continue;
    if (resources.some(o => near(x, z, o.x, o.z, 2.2))) continue;
    let m, hp, rad;
    if (type === 'tree') { m = buildTree(h > 7 || srand() < 0.5 ? 'pine' : 'round'); hp = 4; rad = 0.5; m.scale.setScalar(rand(0.85, 1.3)); }
    if (type === 'rock') { const big = srand() < 0.3; m = buildRock(big); hp = big ? 6 : 4; rad = big ? 1.3 : 0.9; }
    if (type === 'bush') { m = buildBush(); hp = 1; rad = 0.6; }
    m.position.set(x, h - 0.05, z);
    m.rotation.y = srand() * 6;
    scene.add(m);
    const o = { type, mesh: m, x, z, hp, maxHp: hp, alive: true, regrow: 0, shake: 0, ripe: true };
    if (type !== 'bush') o.col = addStatic(x, z, rad, o);
    resources.push(o);
  }
}
placeResources();

// 마을
const villageProps = [];
function placeVillage() {
  const h1 = buildHut(0xd9534a); h1.position.set(-9, heightAt(-9, -7), -7); h1.rotation.y = 0.6; scene.add(h1); addStatic(-9, -7, 2.4);
  const h2 = buildHut(0x4fae6b); h2.position.set(9, heightAt(9, -8), -8); h2.rotation.y = -0.6; scene.add(h2); addStatic(9, -8, 2.4);
  // 우물
  const well = new THREE.Group();
  mesh(new THREE.CylinderGeometry(1, 1.1, 0.9, 10), mat(0x9aa1ab), 0, 0.45, 0, well);
  mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.1, 10), mat(0x3aa6d8), 0, 0.8, 0, well);
  mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), mat(0x7a5432), 0.9, 1.3, 0, well);
  mesh(new THREE.BoxGeometry(0.12, 1.6, 0.12), mat(0x7a5432), -0.9, 1.3, 0, well);
  const wr = mesh(new THREE.ConeGeometry(1.4, 0.7, 4), mat(0xc0483a), 0, 2.35, 0, well); wr.rotation.y = Math.PI / 4;
  well.position.set(0, 2, 0); scene.add(well); addStatic(0, 0, 1.2);
  // 마을 장식
  for (const [x, z] of [[-4, 4], [4, 4], [-13, 2], [13, 2], [-6, -11], [6, -11]]) {
    const f = buildFlower(); f.position.set(x, heightAt(x, z), z); scene.add(f);
  }
  for (const [x, z] of [[-5, 8], [5, 8], [-15, -3], [15, -3]]) {
    const l = buildLantern(); l.position.set(x, heightAt(x, z), z); scene.add(l); villageProps.push(l);
  }
  // 표지판
  const sign = new THREE.Group();
  mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), mat(0x7a5432), 0, 0.6, 0, sign);
  mesh(new THREE.BoxGeometry(1.2, 0.5, 0.08), mat(0xc9a66b), 0, 1.15, 0, sign);
  sign.position.set(3, 2, 10); scene.add(sign);
  const lb = makeLabel('🏡 바람결 마을', '#fff8e7', 40); lb.position.set(3, 4, 10); scene.add(lb);
}
placeVillage();

// 고대 유적 (퍼즐)
const crystals = [];
let shrineChest = null;
function placeShrine() {
  const y = heightAt(SHRINE.x, SHRINE.z);
  const plat = mesh(new THREE.CylinderGeometry(7, 7.6, 0.6, 12), mat(0xa8a291), SHRINE.x, y + 0.1, SHRINE.z); scene.add(plat);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, px = SHRINE.x + Math.cos(a) * 6.3, pz = SHRINE.z + Math.sin(a) * 6.3;
    const broken = i % 3 === 1;
    const p = mesh(new THREE.BoxGeometry(0.8, broken ? 1.6 : 3.6, 0.8), mat(0x9b9583), px, y + (broken ? 1.1 : 2.1), pz);
    p.rotation.y = -a; scene.add(p); addStatic(px, pz, 0.6);
  }
  const lb = makeLabel('🗿 잊혀진 유적', '#e8f6ff', 40); lb.position.set(SHRINE.x, y + 5.5, SHRINE.z); scene.add(lb);
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2 + 0.5, cx = SHRINE.x + Math.cos(a) * 5, cz = SHRINE.z + Math.sin(a) * 5;
    const g = new THREE.Group();
    mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.8, 6), mat(0x8a8573), 0, 0.4, 0, g);
    const cm = new THREE.MeshLambertMaterial({ color: 0x4a5a6a, emissive: 0x000000, flatShading: true });
    const c = mesh(new THREE.OctahedronGeometry(0.45, 0), cm, 0, 1.4, 0, g);
    g.position.set(cx, y + 0.35, cz); scene.add(g);
    addStatic(cx, cz, 0.6);
    crystals.push({ g, c, cm, x: cx, z: cz, lit: 0 });
  }
}
placeShrine();

// 보물상자
const chests = [];
function addChest(id, x, z, golden, hidden = false) {
  const m = buildChest(golden);
  m.position.set(x, heightAt(x, z), z);
  m.rotation.y = rand(0, 6);
  m.visible = !hidden;
  scene.add(m);
  const c = { id, mesh: m, x, z, golden, opened: false, open: 0, col: hidden ? null : addStatic(x, z, 0.7) };
  chests.push(c);
  return c;
}
addChest('peak', PEAK.x, PEAK.z + 1, true);
addChest('beach', -70, -55, false);
addChest('forest', 30, 55, false);
addChest('cliff', -20, -75, false);
shrineChest = addChest('shrine', SHRINE.x, SHRINE.z, true, true);

// ============================================================
// 플레이어
// ============================================================
const player = {
  mesh: buildPlayer(), pos: new THREE.Vector3(0, 2, 5), vy: 0, face: Math.PI, onGround: true,
  atkCd: 0, swing: 0, spin: 0, qCd: 0, roll: 0, rollCd: 0, rollDir: new THREE.Vector2(), inv: 0, dead: false, walk: 0, gliding: false,
};
scene.add(player.mesh);
function refreshWeaponMesh() {
  const h = player.mesh.userData.weaponHolder;
  while (h.children.length) h.remove(h.children[0]);
  const w = weapon();
  if (w) h.add(buildWeaponMesh(w));
}

// ============================================================
// 입력
// ============================================================
const keys = {};
const mouse = new THREE.Vector2();
let camYaw = Math.PI * 0.25, camDist = 18, camPitch = 0.95;
let rDrag = false, lastMX = 0, started = false, uiOpen = null;
let buildMode = null; // {type, ghost, rot}

addEventListener('keydown', e => {
  if (!started) return;
  const k = e.key.toLowerCase();
  if (e.code === 'Space') e.preventDefault();
  if (keys[k]) return; // 반복 입력 무시
  keys[k] = true;
  if (k === 'escape') { closeAll(); cancelBuild(); }
  if (uiOpen === 'dialog') return;
  if (k === 'c') togglePanel('craft');
  if (k === 'i') togglePanel('inv');
  if (uiOpen) return;
  if (k === 'e') interact();
  if (k === 'q') whirlwind();
  if (k === 'r') { if (buildMode) { buildMode.rot += Math.PI / 4; } else usePotion(); }
  if (k === 'shift') dodge();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());
renderer.domElement.addEventListener('mousedown', e => {
  if (!started) return;
  if (e.button === 2) { if (buildMode) { cancelBuild(); return; } rDrag = true; lastMX = e.clientX; }
  if (e.button === 0) {
    if (uiOpen) { closeAll(); return; }
    if (buildMode) placeBuild(); else attack();
  }
});
addEventListener('mouseup', e => { if (e.button === 2) rDrag = false; });
addEventListener('mousemove', e => {
  mouse.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (rDrag) { camYaw -= (e.clientX - lastMX) * 0.006; lastMX = e.clientX; }
});
addEventListener('wheel', e => { if (!uiOpen) camDist = clamp(camDist + e.deltaY * 0.01, 8, 32); }, { passive: true });

const raycaster = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
function mouseGround() {
  raycaster.setFromCamera(mouse, camera);
  groundPlane.constant = -player.pos.y;
  const p = new THREE.Vector3();
  return raycaster.ray.intersectPlane(groundPlane, p) ? p : null;
}

// ============================================================
// 전투
// ============================================================
const enemies = [];
const ETYPES = {
  slime: { name: '슬라임', hp: 32, speed: 2.4, dmg: 6, xp: 12, gold: [1, 4], r: 0.6, reach: 1.3, aggro: 12 },
  raptor: { name: '랩터', hp: 70, speed: 5.4, dmg: 11, xp: 30, gold: [3, 9], r: 0.7, reach: 1.7, aggro: 15 },
  golem: { name: '바위 골렘', hp: 520, speed: 2.0, dmg: 26, xp: 220, gold: [40, 80], r: 1.5, reach: 2.8, aggro: 18, boss: true },
};
const hpBarGeo = new THREE.PlaneGeometry(1, 0.12);
class Enemy {
  constructor(type, x, z, elite = false) {
    this.type = type; this.def = ETYPES[type]; this.elite = elite;
    const lvlScale = 1 + (state.level - 1) * 0.12;
    this.maxHp = Math.round(this.def.hp * lvlScale * (elite ? 2.5 : 1));
    this.hp = this.maxHp;
    this.mesh = type === 'slime' ? buildSlime(elite ? 0xb05aff : pick([0x62d26f, 0x5ac8e8, 0xf2c94e])) : type === 'raptor' ? buildRaptor() : buildGolem();
    if (elite) this.mesh.scale.setScalar(1.4);
    this.pos = new THREE.Vector3(x, heightAt(x, z), z);
    this.home = this.pos.clone();
    this.face = rand(0, 6); this.wander = 0; this.wanderDir = rand(0, 6);
    this.atkCd = rand(0.5, 1.5); this.windup = 0; this.stun = 0; this.kb = new THREE.Vector2(); this.dead = 0; this.t = rand(0, 10); this.burn = 0;
    const bg = new THREE.Mesh(hpBarGeo, new THREE.MeshBasicMaterial({ color: 0x220000, depthTest: false }));
    const fg = new THREE.Mesh(hpBarGeo, new THREE.MeshBasicMaterial({ color: elite || this.def.boss ? 0xff8a1f : 0xe2364b, depthTest: false }));
    fg.position.z = 0.001; bg.renderOrder = fg.renderOrder = 9;
    this.bar = new THREE.Group(); this.bar.add(bg, fg); this.bar.visible = false; this.fg = fg;
    this.bar.scale.setScalar(this.def.boss ? 2.5 : 1.2);
    scene.add(this.mesh, this.bar);
    if (this.def.boss || elite) {
      this.label = makeLabel((elite ? '⭐ 정예 ' : '') + this.def.name, elite ? '#d9a0ff' : '#ffb35a', 36);
      scene.add(this.label);
    }
  }
  hit(dmg, from, crit) {
    if (this.dead) return;
    this.hp -= dmg;
    this.stun = this.def.boss ? 0.05 : 0.22; this.windup = this.def.boss ? this.windup : 0;
    const d = new THREE.Vector2(this.pos.x - from.x, this.pos.z - from.z).normalize().multiplyScalar(this.def.boss ? 1 : 7);
    this.kb.copy(d);
    this.bar.visible = true;
    floatText(dmg, this.pos, crit ? '#ffd84a' : '#ffffff', crit ? 26 : 18);
    this.aggroed = true;
    if (this.hp <= 0) this.die();
  }
  die() {
    this.dead = 0.001;
    this.bar.visible = false;
    if (this.label) this.label.visible = false;
    state.kills[this.type]++;
    gainXp(Math.round(this.def.xp * (this.elite ? 3 : 1) * (1 + (state.level - 1) * 0.1)));
    const n = randi(...this.def.gold) * (this.elite ? 3 : 1);
    dropGold(this.pos, n);
    const chance = this.def.boss ? 1 : this.elite ? 0.9 : this.type === 'raptor' ? 0.35 : 0.2;
    if (Math.random() < chance) {
      const r = this.def.boss ? Math.max(2, rollRarity(2)) : rollRarity(this.elite ? 1.5 : 0);
      dropItem(this.pos, makeWeapon(state.level, r));
    }
    if (this.type === 'raptor' && Math.random() < 0.5) addRes('berry', 1, this.pos); // 고기 대신 열매(프로토타입)
    sfx(180, 0.25, 'sawtooth', 0.05, -120);
    if (this.def.boss) { toast('🏔️ 바위 골렘을 쓰러뜨렸다!', '#ffb35a'); golemTimer = 180; }
  }
  update(dt) {
    this.t += dt;
    const ud = this.mesh.userData;
    if (this.dead) {
      this.dead += dt;
      this.mesh.scale.setScalar(Math.max(0.01, (this.elite ? 1.4 : 1) * (1 - this.dead * 2)));
      this.mesh.rotation.z = this.dead * 4;
      if (this.dead > 0.5) { scene.remove(this.mesh, this.bar); if (this.label) scene.remove(this.label); return false; }
      return true;
    }
    if (this.burn > 0) {
      this.burn -= dt; this.burnTick = (this.burnTick || 0) - dt;
      if (this.burnTick <= 0) { this.burnTick = 0.5; this.hp -= this.burnDmg; floatText(this.burnDmg, this.pos, '#ff7a2a', 14); if (this.hp <= 0) { this.die(); return true; } }
    }
    const dx = player.pos.x - this.pos.x, dz = player.pos.z - this.pos.z, dist = Math.hypot(dx, dz);
    const inVillage = Math.hypot(this.pos.x, this.pos.z) < VILLAGE.r;
    const nearFire = fireNear(this.pos.x, this.pos.z, 5);
    let mvx = 0, mvz = 0, speed = this.def.speed;
    const aggro = !player.dead && !inVillage && !nearFire && (dist < this.def.aggro || (this.aggroed && dist < this.def.aggro * 1.8));
    if (this.stun > 0) {
      this.stun -= dt;
      mvx = this.kb.x; mvz = this.kb.y; speed = 1; this.kb.multiplyScalar(0.85);
    } else if (this.windup > 0) {
      this.windup -= dt;
      if (this.windup <= 0) {
        // 공격 판정
        if (dist < this.def.reach + 0.6 && !player.dead) damagePlayer(Math.round(this.def.dmg * (1 + (state.level - 1) * 0.1) * (this.elite ? 1.6 : 1)), this.pos);
        this.atkCd = this.def.boss ? 2.2 : 1.3;
        if (this.def.boss) { sfx(70, 0.3, 'sawtooth', 0.08); shake = 0.4; }
      }
    } else if (aggro) {
      this.atkCd -= dt;
      this.face = Math.atan2(dx, dz);
      if (dist > this.def.reach) { mvx = dx / dist; mvz = dz / dist; }
      else if (this.atkCd <= 0) this.windup = this.def.boss ? 0.8 : 0.45;
    } else {
      this.aggroed = false;
      this.wander -= dt;
      if (this.wander <= 0) { this.wander = rand(1.5, 4); this.wanderDir = rand(0, Math.PI * 2); this.idle = Math.random() < 0.4; }
      if (inVillage || nearFire) { const a = Math.atan2(this.pos.x, this.pos.z); this.wanderDir = a; this.idle = false; }
      const hd = Math.hypot(this.home.x - this.pos.x, this.home.z - this.pos.z);
      if (hd > 18 && !inVillage) this.wanderDir = Math.atan2(this.home.x - this.pos.x, this.home.z - this.pos.z);
      if (!this.idle) { mvx = Math.sin(this.wanderDir); mvz = Math.cos(this.wanderDir); speed *= 0.4; this.face = this.wanderDir; }
    }
    if (mvx || mvz) {
      const nx = this.pos.x + mvx * speed * dt, nz = this.pos.z + mvz * speed * dt;
      if (heightAt(nx, nz) > 0.3) { this.pos.x = nx; this.pos.z = nz; }
      resolveCollision(this.pos, this.def.r * (this.elite ? 1.3 : 1));
    }
    this.pos.y = heightAt(this.pos.x, this.pos.z);
    const moving = !!(mvx || mvz);
    // 애니메이션
    this.mesh.position.copy(this.pos);
    this.mesh.rotation.y = this.face;
    if (this.type === 'slime') {
      const hop = Math.abs(Math.sin(this.t * (moving ? 9 : 3)));
      this.mesh.position.y += hop * (moving ? 0.5 : 0.08);
      ud.squash.scale.set(1 + (1 - hop) * 0.15, 0.8 - (1 - hop) * 0.15 + (this.windup > 0 ? 0.3 : 0), 1 + (1 - hop) * 0.15);
    } else {
      const sw = moving ? Math.sin(this.t * (this.type === 'raptor' ? 14 : 6)) * 0.6 : 0;
      ud.legs[0].rotation.x = sw; ud.legs[1].rotation.x = -sw;
      if (ud.tail) ud.tail.rotation.y = Math.sin(this.t * 4) * 0.3;
      if (ud.arms) { const up = this.windup > 0 ? -2.4 : sw * 0.6; ud.arms[0].rotation.x = up; ud.arms[1].rotation.x = this.windup > 0 ? -2.4 : -sw * 0.6; }
      this.mesh.rotation.x = this.windup > 0 && this.type === 'raptor' ? -0.25 : 0;
    }
    const top = (this.def.boss ? 4.6 : this.type === 'raptor' ? 2.4 : 1.4) * (this.elite ? 1.4 : 1);
    this.bar.position.set(this.pos.x, this.pos.y + top, this.pos.z);
    this.bar.quaternion.copy(camera.quaternion);
    this.fg.scale.x = Math.max(0, this.hp / this.maxHp);
    this.fg.position.x = -(1 - this.fg.scale.x) / 2;
    if (this.label) this.label.position.set(this.pos.x, this.pos.y + top + 0.5, this.pos.z);
    return true;
  }
}

let golemTimer = 0;
function spawnLoop(dt) {
  const night = isNight();
  const max = night ? 30 : 18;
  if (enemies.filter(e => !e.def.boss).length < max && Math.random() < dt * (night ? 2 : 1)) {
    const a = rand(0, Math.PI * 2), d = rand(26, 55);
    const x = player.pos.x + Math.cos(a) * d, z = player.pos.z + Math.sin(a) * d;
    const h = heightAt(x, z);
    if (h > 0.8 && Math.hypot(x, z) > 30 && Math.abs(x) < WORLD / 2 - 8 && Math.abs(z) < WORLD / 2 - 8) {
      const forest = fbm(x * 0.03 + 50, z * 0.03 + 50);
      const far = Math.hypot(x, z) > 55;
      const type = (forest > 0.5 || far) && Math.random() < (night ? 0.65 : 0.45) ? 'raptor' : 'slime';
      enemies.push(new Enemy(type, x, z, Math.random() < (night ? 0.08 : 0.04)));
    }
  }
  if (!enemies.some(e => e.def.boss && !e.dead)) {
    golemTimer -= dt;
    if (golemTimer <= 0) { enemies.push(new Enemy('golem', PEAK.x - 6, PEAK.z + 6)); golemTimer = 9999; }
  }
}

function inCone(face, dx, dz, range, arc) {
  const d = Math.hypot(dx, dz);
  if (d > range) return false;
  if (d < 0.9) return true;
  const a = Math.atan2(dx, dz);
  const diff = Math.abs(((a - face) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI);
  return diff < arc / 2;
}
function rollDamage() {
  const crit = Math.random() < 0.12;
  const d = Math.round(baseDmg() * rand(0.85, 1.15) * (crit ? 1.8 : 1));
  return [d, crit];
}
function onHitEnemy(e, mult = 1) {
  let [d, crit] = rollDamage();
  d = Math.max(1, Math.round(d * mult));
  e.hit(d, player.pos, crit);
  const w = weapon();
  if (w?.fire) { e.burn = 2; e.burnDmg = w.fire; }
  if (w?.ls) healPlayer(Math.max(1, Math.round(d * w.ls / 100)), false);
}
function attack() {
  if (player.dead || player.atkCd > 0 || player.roll > 0) return;
  const w = weapon();
  player.atkCd = 0.55 / (w?.spd || 1);
  player.swing = 0.28;
  const mg = mouseGround();
  if (mg) player.face = Math.atan2(mg.x - player.pos.x, mg.z - player.pos.z);
  sfx(520, 0.06, 'triangle', 0.04, -300);
  const range = w?.base === '단검' ? 2.2 : w?.base === '망치' ? 3.0 : 2.7;
  let hitSomething = false;
  for (const e of enemies) {
    if (e.dead) continue;
    if (inCone(player.face, e.pos.x - player.pos.x, e.pos.z - player.pos.z, range + e.def.r * 0.6, 2.0)) { onHitEnemy(e); hitSomething = true; }
  }
  for (const r of resources) {
    if (!r.alive || r.type === 'bush') continue;
    const dx = r.x - player.pos.x, dz = r.z - player.pos.z;
    if (Math.abs(dx) > 4 || Math.abs(dz) > 4) continue;
    if (inCone(player.face, dx, dz, range + 0.6, 1.6)) { hitResource(r); hitSomething = true; break; }
  }
  for (const c of crystals) {
    if (inCone(player.face, c.x - player.pos.x, c.z - player.pos.z, range + 0.5, 1.6)) { lightCrystal(c); hitSomething = true; }
  }
  if (hitSomething) sfx(160, 0.07, 'square', 0.05);
}
function whirlwind() {
  if (player.dead || player.qCd > 0) return;
  player.qCd = 6; player.spin = 0.55;
  sfx(300, 0.4, 'sawtooth', 0.05, 400);
  for (const e of enemies) {
    if (!e.dead && e.pos.distanceTo(player.pos) < 4.2 + e.def.r) onHitEnemy(e, 1.6);
  }
  for (const c of crystals) if (Math.hypot(c.x - player.pos.x, c.z - player.pos.z) < 4.5) lightCrystal(c);
  ring(player.pos, 4.2, 0xbfe9ff);
}
function dodge() {
  if (player.dead || player.rollCd > 0 || !player.onGround) return;
  let dx = 0, dz = 0;
  const mv = moveInput();
  if (mv.lengthSq() > 0) { dx = mv.x; dz = mv.y; } else { dx = Math.sin(player.face); dz = Math.cos(player.face); }
  player.rollDir.set(dx, dz).normalize();
  player.face = Math.atan2(dx, dz);
  player.roll = 0.35; player.rollCd = 1.0; player.inv = 0.4;
  sfx(240, 0.12, 'triangle', 0.04, -100);
}
const effects = [];
function ring(pos, radius, color) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.5, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(pos.x, pos.y + 0.2, pos.z);
  scene.add(m);
  effects.push({ m, t: 0, dur: 0.4, update(t) { const s = 1 + t / this.dur * radius * 2; m.scale.setScalar(s); m.material.opacity = 0.8 * (1 - t / this.dur); } });
}
function damagePlayer(dmg, from) {
  if (player.inv > 0 || player.dead) return;
  state.hp -= dmg;
  player.inv = 0.5;
  floatText('-' + dmg, player.pos, '#ff5a5a', 20);
  sfx(110, 0.15, 'square', 0.06, -50);
  shake = Math.max(shake, 0.2);
  const k = new THREE.Vector2(player.pos.x - from.x, player.pos.z - from.z).normalize();
  player.pos.x += k.x * 0.6; player.pos.z += k.y * 0.6;
  if (state.hp <= 0) killPlayer();
}
function healPlayer(n, show = true) {
  const before = state.hp;
  state.hp = Math.min(maxHp(), state.hp + n);
  if (show && state.hp > before) floatText('+' + Math.round(state.hp - before), player.pos, '#7dff8a', 16);
}
function killPlayer() {
  player.dead = true; state.hp = 0;
  $('death').classList.remove('hidden');
  const lost = Math.floor(state.gold * 0.1);
  state.gold -= lost;
  setTimeout(() => {
    player.dead = false;
    state.hp = maxHp();
    player.pos.set(state.spawn.x, heightAt(state.spawn.x, state.spawn.z), state.spawn.z);
    $('death').classList.add('hidden');
    if (lost) toast(`골드 ${lost}개를 잃어버렸다…`, '#ff9a9a');
  }, 2800);
}
function gainXp(n) {
  state.xp += n;
  floatText(`+${n} XP`, player.pos, '#8be36b', 14);
  while (state.xp >= xpNeed()) {
    state.xp -= xpNeed(); state.level++;
    state.hp = maxHp();
    toast(`✨ 레벨 업! Lv ${state.level}`, '#8be36b');
    ring(player.pos, 3, 0xfff38a);
    sfx(660, 0.12, 'triangle', 0.06); setTimeout(() => sfx(880, 0.18, 'triangle', 0.06), 120);
  }
}
function usePotion() {
  if (state.res.potion > 0 && state.hp < maxHp()) {
    state.res.potion--; healPlayer(60 + state.level * 8); sfx(500, 0.2, 'sine', 0.06, 300);
  } else if (state.res.potion <= 0 && state.res.berry > 0 && state.hp < maxHp()) {
    state.res.berry--; healPlayer(15); toast('🍓 열매를 먹었다');
  }
}

// ============================================================
// 채집 & 루트
// ============================================================
const RES_ICON = { wood: '🪵', stone: '🪨', berry: '🍓', potion: '🧪' };
function addRes(k, n, pos) {
  state.res[k] += n;
  if (pos) floatText(`+${n} ${RES_ICON[k]}`, pos, '#fff3c4', 15);
}
function hitResource(r) {
  r.shake = 0.3;
  const g = weapon()?.gather || 1;
  r.hp -= 1;
  if (r.type === 'tree') { addRes('wood', g, new THREE.Vector3(r.x, r.mesh.position.y, r.z)); sfx(200, 0.08, 'square', 0.05); }
  else { addRes('stone', Math.max(1, Math.ceil(g / 2)), new THREE.Vector3(r.x, r.mesh.position.y, r.z)); sfx(700, 0.05, 'square', 0.04); }
  if (r.hp <= 0) {
    r.alive = false; r.mesh.visible = false; r.regrow = rand(50, 90);
    if (r.type === 'tree') { addRes('wood', 2 * g); if (Math.random() < 0.25) addRes('berry', 2, new THREE.Vector3(r.x, r.mesh.position.y + 1, r.z)); }
    else { addRes('stone', 2 * g); if (Math.random() < 0.08) dropGold(r.mesh.position, randi(5, 15)); }
  }
}
const loot = [];
const coinGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 10);
const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 6, 6, 1, true);
function dropGold(pos, n) {
  const m = new THREE.Group();
  const coin = mesh(coinGeo, mat(0xffd34a, { emissive: 0x664400 }), 0, 0.3, 0, m); coin.rotation.x = Math.PI / 2;
  m.position.set(pos.x + rand(-0.8, 0.8), heightAt(pos.x, pos.z), pos.z + rand(-0.8, 0.8));
  scene.add(m);
  loot.push({ kind: 'gold', n, m, t: 0, spin: coin });
}
function dropItem(pos, w) {
  const m = new THREE.Group();
  const wm = buildWeaponMesh(w); wm.rotation.set(0, 0, Math.PI / 2.5); wm.position.y = 0.6; m.add(wm);
  if (w.rarity >= 1) {
    const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: RARITY[w.rarity].hex, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
    beam.position.y = 3; m.add(beam);
  }
  const lb = makeLabel(w.name, RARITY[w.rarity].css, 32); lb.position.y = 1.5; m.add(lb);
  m.position.set(pos.x + rand(-1, 1), heightAt(pos.x, pos.z), pos.z + rand(-1, 1));
  scene.add(m);
  loot.push({ kind: 'item', w, m, t: 0, spin: wm });
  if (w.rarity >= 2) sfx(w.rarity === 3 ? 990 : 780, 0.35, 'sine', 0.06, 200);
}
function updateLoot(dt) {
  for (let i = loot.length - 1; i >= 0; i--) {
    const l = loot[i];
    l.t += dt;
    l.spin.rotation.y += dt * 2;
    const d = Math.hypot(l.m.position.x - player.pos.x, l.m.position.z - player.pos.z);
    if (l.kind === 'gold' && d < 4 && l.t > 0.3) {
      l.m.position.lerp(player.pos, Math.min(1, dt * 8));
    }
    if (d < 1.3 && l.t > 0.4 && !player.dead) {
      if (l.kind === 'gold') { state.gold += l.n; floatText(`+${l.n} 🪙`, player.pos, '#ffd84a', 14); sfx(1200, 0.05, 'square', 0.03); }
      else pickupItem(l.w);
      scene.remove(l.m); loot.splice(i, 1);
    } else if (l.t > 240) { scene.remove(l.m); loot.splice(i, 1); }
  }
}
function pickupItem(w) {
  state.items.push(w);
  toast(`<span style="color:${RARITY[w.rarity].css}">[${RARITY[w.rarity].name}] ${w.name}</span> 획득`);
  sfx(880, 0.1, 'triangle', 0.05);
  const cur = weapon();
  if (!cur || w.dmg > cur.dmg * 1.15) { equip(w.id); toast('➡️ 더 강한 무기를 자동 장착했다'); }
  if (state.items.length > 24) {
    // 가방이 가득 차면 장착하지 않은 가장 약한 무기를 판매
    const sorted = state.items.filter(i => i.id !== state.equipped).sort((a, b) => a.dmg - b.dmg);
    const sold = sorted[0];
    state.items = state.items.filter(i => i !== sold);
    state.gold += 5 + sold.rarity * 15;
    toast(`가방이 가득 차서 ${sold.name}을(를) 팔았다`);
  }
}
function equip(id) {
  const ratio = state.hp / maxHp();
  state.equipped = id;
  state.hp = Math.round(maxHp() * ratio);
  refreshWeaponMesh();
}

// ============================================================
// 퍼즐 (유적의 수정)
// ============================================================
function lightCrystal(c) {
  if (state.shrineDone) return;
  if (c.lit <= 0) sfx(880 + crystals.indexOf(c) * 220, 0.3, 'sine', 0.06);
  c.lit = 7;
  if (crystals.every(k => k.lit > 0)) {
    state.shrineDone = true;
    toast('🗿 유적이 깨어났다! 제단에 상자가 나타났다', '#9fe8ff');
    revealShrineChest();
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => sfx(f, 0.25, 'sine', 0.06), i * 140));
  }
}
function revealShrineChest() {
  shrineChest.mesh.visible = true;
  if (!shrineChest.col) shrineChest.col = addStatic(shrineChest.x, shrineChest.z, 0.7);
  crystals.forEach(c => { c.lit = 999; });
}
function updateCrystals(dt) {
  for (const c of crystals) {
    if (c.lit > 0 && !state.shrineDone) c.lit -= dt;
    const on = c.lit > 0;
    const pulse = on && c.lit < 2.5 && !state.shrineDone ? (Math.sin(c.lit * 20) > 0 ? 1 : 0.2) : 1;
    c.cm.emissive.setHex(on ? 0x55e0ff : 0x000000);
    c.cm.emissiveIntensity = pulse;
    c.cm.color.setHex(on ? 0xaaf0ff : 0x4a5a6a);
    c.c.rotation.y += dt * (on ? 3 : 0.5);
    c.c.position.y = 1.4 + Math.sin(performance.now() / 500 + c.x) * 0.1;
  }
}

// ============================================================
// 상자 / 건축
// ============================================================
function openChest(c) {
  c.opened = true;
  state.openedChests.push(c.id);
  sfx(600, 0.15, 'triangle', 0.05); setTimeout(() => sfx(900, 0.25, 'triangle', 0.05), 150);
  if (c.id === 'shrine') {
    state.shrineChestOpened = true; state.glider = true;
    toast('🪂 <b>활공 날개</b>를 얻었다! 공중에서 Space를 누르고 있으면 활공한다', '#ffd84a');
    dropItem(c.mesh.position, makeWeapon(state.level + 2, 3));
  } else {
    dropGold(c.mesh.position, c.golden ? randi(80, 140) : randi(20, 45));
    dropItem(c.mesh.position, makeWeapon(state.level + (c.golden ? 2 : 0), c.golden ? 3 : Math.max(1, rollRarity(1))));
    if (!c.golden) addRes('potion', 1, c.mesh.position);
  }
}

const RECIPES = [
  { id: 'campfire', name: '🔥 모닥불', desc: '주변 체력 회복, 몬스터가 다가오지 못함', cost: { wood: 5, stone: 3 }, build: true },
  { id: 'fence', name: '🪵 나무 울타리', desc: '마을 꾸미기 / 길막기', cost: { wood: 2 }, build: true },
  { id: 'flower', name: '🌷 꽃 화분', desc: '마을을 화사하게', cost: { berry: 1, stone: 1 }, build: true },
  { id: 'lantern', name: '🏮 가로등', desc: '밤길을 밝혀준다', cost: { wood: 2, stone: 2 }, build: true },
  { id: 'hut', name: '🏠 작은 오두막', desc: '새로운 부활 지점이 된다', cost: { wood: 25, stone: 15 }, build: true },
  { id: 'potion', name: '🧪 회복 물약', desc: '체력을 크게 회복 (R)', cost: { berry: 3 } },
  { id: 'axe', name: '🪓 정교한 돌도끼', desc: '채집량이 많은 희귀 도끼', cost: { wood: 8, stone: 10 } },
];
const costText = c => Object.entries(c).map(([k, v]) => `${RES_ICON[k]}${v}`).join(' ');
const canAfford = c => Object.entries(c).every(([k, v]) => state.res[k] >= v);
const pay = c => Object.entries(c).forEach(([k, v]) => (state.res[k] -= v));
function renderCraft() {
  const list = $('craftList'); list.innerHTML = '';
  for (const r of RECIPES) {
    const d = document.createElement('div'); d.className = 'item';
    const ok = canAfford(r.cost);
    d.innerHTML = `<div class="info"><b>${r.name}</b><br>${r.desc}<br><span class="cost">${costText(r.cost)}</span></div>`;
    const b = document.createElement('button'); b.textContent = r.build ? '설치' : '제작'; b.disabled = !ok;
    b.onclick = () => craft(r);
    d.appendChild(b); list.appendChild(d);
  }
}
function craft(r) {
  if (!canAfford(r.cost)) return;
  if (r.build) { closeAll(); startBuild(r); return; }
  pay(r.cost);
  if (r.id === 'potion') addRes('potion', 1);
  if (r.id === 'axe') { const w = makeWeapon(state.level, 2, '도끼'); w.gather += 2; w.name = '정교한 돌도끼'; pickupItem(w); }
  toast(`${r.name} 제작 완료`);
  sfx(700, 0.1, 'triangle', 0.05);
  renderCraft();
}
function startBuild(r) {
  const def = BUILD_DEFS[r.id];
  const ghost = def.build();
  ghost.traverse(o => { if (o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.55; } o.castShadow = false; });
  scene.add(ghost);
  buildMode = { recipe: r, ghost, rot: 0, ok: false };
  $('buildHint').classList.remove('hidden');
}
function cancelBuild() {
  if (!buildMode) return;
  scene.remove(buildMode.ghost);
  buildMode = null;
  $('buildHint').classList.add('hidden');
}
function updateBuild() {
  if (!buildMode) return;
  const p = mouseGround();
  if (!p) return;
  const dx = p.x - player.pos.x, dz = p.z - player.pos.z, d = Math.hypot(dx, dz);
  if (d > 7) { p.x = player.pos.x + dx / d * 7; p.z = player.pos.z + dz / d * 7; }
  p.x = Math.round(p.x * 2) / 2; p.z = Math.round(p.z * 2) / 2;
  const r = BUILD_DEFS[buildMode.recipe.id].r;
  const h = heightAt(p.x, p.z);
  const blocked = h < 0.6 || statics.some(s => (s.ref?.alive ?? true) && Math.hypot(s.x - p.x, s.z - p.z) < s.r + r) ||
    Math.hypot(p.x - player.pos.x, p.z - player.pos.z) < r + 0.5;
  buildMode.ok = !blocked;
  buildMode.ghost.position.set(p.x, h, p.z);
  buildMode.ghost.rotation.y = buildMode.rot;
  buildMode.ghost.traverse(o => { if (o.material?.emissive) o.material.emissive.setHex(blocked ? 0x880000 : 0x003300); });
}
function placeBuild() {
  if (!buildMode?.ok) { toast('여기에는 지을 수 없어요', '#ff9a9a'); return; }
  const r = buildMode.recipe;
  if (!canAfford(r.cost)) { cancelBuild(); return; }
  pay(r.cost);
  const g = buildMode.ghost.position;
  addStructure({ type: r.id, x: g.x, z: g.z, rot: buildMode.rot }, true);
  sfx(330, 0.1, 'square', 0.05); setTimeout(() => sfx(440, 0.1, 'square', 0.05), 90);
  if (!canAfford(r.cost)) cancelBuild();
}
const structures = [];
const fireLights = [];
function addStructure(s, isNew) {
  const def = BUILD_DEFS[s.type];
  const m = def.build();
  m.position.set(s.x, heightAt(s.x, s.z), s.z);
  m.rotation.y = s.rot;
  scene.add(m);
  addStatic(s.x, s.z, def.r);
  const obj = { ...s, mesh: m };
  structures.push(obj);
  if (s.type === 'campfire' && fireLights.length < 6) {
    const L = new THREE.PointLight(0xff9a3a, 0, 14, 1.6); L.position.set(s.x, m.position.y + 1.2, s.z); scene.add(L); fireLights.push(L); obj.light = L;
  }
  if (isNew) {
    state.structures.push(s);
    toast(`${def.name}을(를) 지었다`);
    if (s.type === 'hut') { state.spawn = { x: s.x, z: s.z + 3 }; toast('🏠 이제 이곳에서 부활합니다'); }
  }
}
function fireNear(x, z, r) {
  return structures.some(s => s.type === 'campfire' && Math.hypot(s.x - x, s.z - z) < r);
}

// ============================================================
// 주민 & 퀘스트
// ============================================================
const npcs = [
  { id: 'moko', name: '모코', mesh: buildMoko(), home: new THREE.Vector3(-6, 0, -3), pos: new THREE.Vector3(-6, 0, -3),
    lines: ['오늘도 바람이 기분 좋네~ 뭉실뭉실.', '밤에는 숲이 위험해. 모닥불 곁에 있으면 몬스터가 못 다가와!', '나무는 도끼로 베면 더 많이 나온대.', '마을에 꽃을 심으면 다들 좋아할 거야!'] },
  { id: 'pio', name: '피오', mesh: buildPio(), home: new THREE.Vector3(6, 0, -4), pos: new THREE.Vector3(6, 0, -4),
    lines: ['삐릿! 서쪽 유적에는 오래된 수정이 잠들어 있대.', '북동쪽 산꼭대기엔 파란 보물상자가 있어. 근데 골렘이 지키고 있지…', '빛나는 기둥이 보이면 좋은 장비라는 뜻이야!', '높은 곳에서 날개를 펴면 멀리 날 수 있을 텐데~'] },
];
for (const n of npcs) {
  scene.add(n.mesh);
  n.label = makeLabel(n.name, '#fff8e7', 36); scene.add(n.label);
  n.mark = makeLabel('!', '#ffd84a', 64); n.mark.scale.multiplyScalar(1.3); scene.add(n.mark);
  n.target = n.home.clone(); n.wait = 0; n.t = rand(0, 5);
}
const QUESTS = [
  { giver: 'moko', title: '집 지을 나무', goal: '나무 10개 모아오기',
    intro: '안녕! 너 처음 보는 얼굴이네? 나는 모코야.\n집을 고치려는데 나무가 모자라… 나무 10개만 구해줄래?\n(나무를 공격하면 목재를 얻을 수 있어)',
    progress: () => `${Math.min(state.res.wood, 10)}/10`, done: () => state.res.wood >= 10,
    finish: () => { state.res.wood -= 10; state.gold += 60; addRes('potion', 2); return '우와, 고마워! 이건 보답이야.\n🪙 60, 🧪 물약 2개'; } },
  { giver: 'moko', title: '슬라임 소탕', goal: '슬라임 6마리 처치', base: () => state.kills.slime,
    intro: '요즘 마을 밖에 슬라임이 너무 많아졌어.\n6마리만 혼내줄 수 있어?',
    progress: q => `${Math.min(state.kills.slime - state.questBase, 6)}/6`, done: () => state.kills.slime - state.questBase >= 6,
    finish: () => { pickupItem(makeWeapon(state.level, 1, '검')); state.gold += 40; return '대단해! 우리 할아버지가 쓰던 검이야. 가져가!'; } },
  { giver: 'pio', title: '따뜻한 마을', goal: '모닥불 하나 짓기 (C 제작)',
    intro: '삐릿! 밤마다 너무 추워…\n나무 5개랑 돌 3개로 모닥불을 지어줄래? C를 누르면 제작할 수 있어!',
    progress: () => '', done: () => structures.some(s => s.type === 'campfire'),
    finish: () => { addRes('berry', 6); state.gold += 50; return '따뜻하다~ 고마워! 열매 좀 가져가. 🍓x6'; } },
  { giver: 'pio', title: '잊혀진 유적', goal: '서쪽 유적의 수정 3개를 동시에 밝히고 상자 열기',
    intro: '서쪽에 오래된 유적이 있어.\n세 개의 수정을 동시에 빛나게 하면 문이 열린대!\n수정은 금방 꺼지니까 빠르게 쳐야 해. (Q 회오리도 써봐!)',
    progress: () => (state.shrineDone ? '상자를 열자' : ''), done: () => state.shrineChestOpened,
    finish: () => { state.gold += 120; return '그게 전설의 날개구나!\n산꼭대기에서 뛰어내려 활공해봐! 🪙 120'; } },
  { giver: 'moko', title: '산의 수호자', goal: '북동쪽 산의 바위 골렘 처치', base: () => state.kills.golem,
    intro: '이제 너라면 할 수 있을 거야.\n북동쪽 산의 바위 골렘을 쓰러뜨려 줘. 정말 강하니까 레벨을 올리고 가!',
    progress: () => '', done: () => state.kills.golem - state.questBase >= 1,
    finish: () => { pickupItem(makeWeapon(state.level + 1, 3)); state.gold += 300; return '너는 이 섬의 영웅이야!\n이 전설의 무기를 받아줘. 🪙 300'; } },
];
function currentQuest() { return QUESTS[state.quest]; }
function talk(n) {
  const q = currentQuest();
  const btns = [];
  let text = pick(n.lines);
  if (q && q.giver === n.id) {
    if (!state.questActive) {
      text = q.intro;
      btns.push(['좋아!', () => { state.questActive = true; state.questBase = q.base ? q.base() : 0; toast(`📜 퀘스트 시작: ${q.title}`, '#ffd84a'); closeAll(); }]);
    } else if (q.done()) {
      text = q.finish();
      state.quest++; state.questActive = false;
      toast(`✅ 퀘스트 완료: ${q.title}`, '#8be36b');
      gainXp(60 * state.quest);
      sfx(660, 0.15, 'triangle', 0.06); setTimeout(() => sfx(990, 0.25, 'triangle', 0.06), 150);
    } else text = `${q.goal}… 부탁할게! ${q.progress(q)}`;
  } else if (!q) text = n.id === 'moko' ? '섬이 평화로워졌어. 언제든 놀러 와!' : '삐릿~ 너는 우리의 영웅이야!';
  if (n.id === 'moko') btns.push(['🧪 물약 구매 (25🪙)', () => {
    if (state.gold >= 25) { state.gold -= 25; addRes('potion', 1); sfx(900, 0.08, 'square', 0.04); $('dText').textContent = '매번 고마워~ 또 와!'; }
    else $('dText').textContent = '음… 골드가 조금 모자라네.';
  }]);
  if (n.id === 'pio') btns.push(['💰 낡은 무기 팔기', () => {
    const sell = state.items.filter(i => i.id !== state.equipped && i.rarity < 2);
    if (!sell.length) { $('dText').textContent = '팔 만한 무기가 없네? (희귀 이상은 안 팔아)'; return; }
    const g = sell.reduce((s, i) => s + 5 + i.rarity * 15 + i.lvl * 2, 0);
    state.items = state.items.filter(i => !sell.includes(i)); state.gold += g;
    $('dText').textContent = `무기 ${sell.length}개를 ${g}🪙에 사줄게! 삐릿!`; sfx(1200, 0.08, 'square', 0.04);
  }]);
  btns.push(['안녕!', closeAll]);
  openDialog(n.name, text, btns);
}
function openDialog(name, text, btns) {
  uiOpen = 'dialog';
  $('dialog').classList.remove('hidden');
  $('dName').textContent = name; $('dText').textContent = text;
  const box = $('dBtns'); box.innerHTML = '';
  for (const [label, fn] of btns) { const b = document.createElement('button'); b.textContent = label; b.onclick = fn; box.appendChild(b); }
}
function updateNpcs(dt) {
  for (const n of npcs) {
    n.t += dt;
    const talking = uiOpen === 'dialog' && $('dName').textContent === n.name;
    const dp = Math.hypot(player.pos.x - n.pos.x, player.pos.z - n.pos.z);
    let moving = false;
    if (talking || dp < 3) {
      n.face = Math.atan2(player.pos.x - n.pos.x, player.pos.z - n.pos.z);
    } else {
      n.wait -= dt;
      const dx = n.target.x - n.pos.x, dz = n.target.z - n.pos.z, d = Math.hypot(dx, dz);
      if (d > 0.3) { n.pos.x += dx / d * 1.4 * dt; n.pos.z += dz / d * 1.4 * dt; n.face = Math.atan2(dx, dz); moving = true; }
      else if (n.wait <= 0) { n.wait = rand(2, 6); n.target.set(n.home.x + rand(-4, 4), 0, n.home.z + rand(-4, 4)); }
    }
    n.pos.y = heightAt(n.pos.x, n.pos.z);
    n.mesh.position.copy(n.pos);
    n.mesh.position.y += moving ? Math.abs(Math.sin(n.t * 10)) * 0.12 : 0;
    n.mesh.rotation.y = lerpAngle(n.mesh.rotation.y, n.face || 0, dt * 8);
    if (n.mesh.userData.wings) { const f = Math.sin(n.t * (moving ? 18 : 3)) * 0.4; n.mesh.userData.wings[0].rotation.z = -0.3 - f; n.mesh.userData.wings[1].rotation.z = 0.3 + f; }
    n.label.position.set(n.pos.x, n.pos.y + 2.5, n.pos.z);
    const q = currentQuest();
    n.mark.visible = !!q && q.giver === n.id && (!state.questActive || q.done());
    n.mark.material.color.setHex(state.questActive ? 0x8be36b : 0xffffff);
    n.mark.position.set(n.pos.x, n.pos.y + 3.2 + Math.sin(n.t * 3) * 0.15, n.pos.z);
    // 플레이어와 겹치지 않게
    if (dp < 1.0 && dp > 0.001) { player.pos.x += (player.pos.x - n.pos.x) / dp * (1 - dp); player.pos.z += (player.pos.z - n.pos.z) / dp * (1 - dp); }
  }
}

// ============================================================
// 상호작용
// ============================================================
function nearestInteract() {
  let best = null, bd = 2.4;
  for (const n of npcs) { const d = n.pos.distanceTo(player.pos); if (d < bd + 0.6) { bd = d; best = { kind: 'npc', n, label: `E: ${n.name}와 대화` }; } }
  for (const c of chests) {
    if (c.opened || !c.mesh.visible) continue;
    const d = Math.hypot(c.x - player.pos.x, c.z - player.pos.z); if (d < bd) { bd = d; best = { kind: 'chest', c, label: 'E: 상자 열기' }; }
  }
  for (const r of resources) {
    if (r.type !== 'bush' || !r.alive || !r.ripe) continue;
    const d = Math.hypot(r.x - player.pos.x, r.z - player.pos.z); if (d < bd) { bd = d; best = { kind: 'bush', r, label: 'E: 열매 따기' }; }
  }
  return best;
}
function interact() {
  const t = nearestInteract();
  if (!t) return;
  if (t.kind === 'npc') talk(t.n);
  if (t.kind === 'chest') openChest(t.c);
  if (t.kind === 'bush') {
    t.r.ripe = false; t.r.regrow = rand(40, 70); t.r.mesh.userData.berries.visible = false;
    addRes('berry', randi(2, 4), new THREE.Vector3(t.r.x, t.r.mesh.position.y, t.r.z)); sfx(900, 0.06, 'sine', 0.05);
  }
}

// ============================================================
// 패널
// ============================================================
function togglePanel(id) {
  if (uiOpen === id) { closeAll(); return; }
  closeAll(); cancelBuild();
  uiOpen = id; $(id).classList.remove('hidden');
  if (id === 'craft') renderCraft();
  if (id === 'inv') renderInv();
}
function closeAll() {
  uiOpen = null;
  ['craft', 'inv', 'dialog'].forEach(i => $(i).classList.add('hidden'));
}
function renderInv() {
  const list = $('invList'); list.innerHTML = '';
  const items = [...state.items].sort((a, b) => (b.id === state.equipped) - (a.id === state.equipped) || b.rarity - a.rarity || b.dmg - a.dmg);
  for (const w of items) {
    const d = document.createElement('div'); d.className = 'item' + (w.id === state.equipped ? ' equipped' : '');
    d.innerHTML = `<div class="info"><b style="color:${RARITY[w.rarity].css}">${w.name}</b> <small>[${RARITY[w.rarity].name}]</small><br>${weaponDesc(w)}</div>`;
    const b = document.createElement('button');
    b.textContent = w.id === state.equipped ? '장착 중' : '장착';
    b.disabled = w.id === state.equipped;
    b.onclick = () => { equip(w.id); renderInv(); };
    d.appendChild(b); list.appendChild(d);
  }
  const extra = document.createElement('div');
  extra.className = 'item';
  extra.innerHTML = `<div class="info">🪂 활공 날개: ${state.glider ? '보유' : '없음'} · 처치: 슬라임 ${state.kills.slime} / 랩터 ${state.kills.raptor} / 골렘 ${state.kills.golem}</div>`;
  const reset = document.createElement('button'); reset.textContent = '세이브 초기화';
  reset.onclick = () => { if (confirm('정말 처음부터 다시 시작할까요?')) { try { localStorage.removeItem(SAVE_KEY); } catch {} location.reload(); } };
  extra.appendChild(reset);
  list.appendChild(extra);
}

// ============================================================
// 충돌 / 이동
// ============================================================
function resolveCollision(p, r) {
  for (const s of statics) {
    if (s.r <= 0 || (s.ref && s.ref.alive === false)) continue;
    const dx = p.x - s.x, dz = p.z - s.z;
    if (Math.abs(dx) > s.r + r || Math.abs(dz) > s.r + r) continue;
    const d = Math.hypot(dx, dz), min = s.r + r;
    if (d < min && d > 0.0001) { p.x = s.x + dx / d * min; p.z = s.z + dz / d * min; }
  }
}
function lerpAngle(a, b, t) {
  let d = ((b - a) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2) - Math.PI;
  return a + d * Math.min(1, t);
}
function moveInput() {
  const v = new THREE.Vector2();
  if (uiOpen) return v;
  const f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
  const r = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
  if (!f && !r) return v;
  const s = Math.sin(camYaw), c = Math.cos(camYaw);
  v.set(-s * f + c * r, -c * f - s * r).normalize();
  return v;
}

function updatePlayer(dt) {
  const ud = player.mesh.userData;
  player.atkCd -= dt; player.qCd -= dt; player.rollCd -= dt; player.inv -= dt;
  if (player.dead) { player.mesh.rotation.z = Math.min(Math.PI / 2, player.mesh.rotation.z + dt * 4); return; }
  player.mesh.rotation.z = 0;
  const mv = moveInput();
  let speed = 6.2;
  const ground = heightAt(player.pos.x, player.pos.z);
  if (ground < -0.2) speed *= 0.55; // 얕은 물
  let vx = 0, vz = 0;
  if (player.roll > 0) {
    player.roll -= dt;
    vx = player.rollDir.x * 14; vz = player.rollDir.y * 14;
  } else if (mv.lengthSq() > 0) {
    if (player.gliding) speed *= 1.5;
    vx = mv.x * speed; vz = mv.y * speed;
    if (player.swing <= 0) player.face = Math.atan2(mv.x, mv.y);
  }
  const nx = player.pos.x + vx * dt, nz = player.pos.z + vz * dt;
  const lim = WORLD / 2 - 4;
  if (heightAt(nx, nz) > -1.0 || player.pos.y > 1) {
    player.pos.x = clamp(nx, -lim, lim); player.pos.z = clamp(nz, -lim, lim);
  }
  resolveCollision(player.pos, 0.45);
  // 점프 & 활공
  const gy = heightAt(player.pos.x, player.pos.z);
  if (keys[' '] && player.onGround && !uiOpen) { player.vy = 8.5; player.onGround = false; sfx(400, 0.08, 'sine', 0.03, 200); }
  player.gliding = state.glider && !player.onGround && keys[' '] && player.vy < 0;
  player.vy -= (player.gliding ? 6 : 24) * dt;
  if (player.gliding) player.vy = Math.max(player.vy, -1.6);
  player.pos.y += player.vy * dt;
  if (player.pos.y <= gy) {
    if (!player.onGround && player.vy < -18) { damagePlayer(Math.round((-player.vy - 18) * 4), player.pos); }
    player.pos.y = gy; player.vy = 0; player.onGround = true;
  } else if (player.pos.y > gy + 0.05) player.onGround = false;
  if (player.pos.y < Math.max(gy, -0.6)) player.pos.y = Math.max(gy, -0.6);
  ud.glider.visible = player.gliding;
  // 모닥불 회복
  if (fireNear(player.pos.x, player.pos.z, 4.5)) healPlayer(6 * dt, false);
  else if (Math.hypot(player.pos.x, player.pos.z) < VILLAGE.r) healPlayer(2 * dt, false);
  // 애니메이션
  player.mesh.position.copy(player.pos);
  player.mesh.rotation.y = lerpAngle(player.mesh.rotation.y, player.face, dt * 16);
  const moving = (vx || vz) && player.onGround;
  player.walk += dt * (moving ? 11 : 0);
  const sw = moving ? Math.sin(player.walk) * 0.7 : 0;
  ud.legL.rotation.x = sw; ud.legR.rotation.x = -sw;
  ud.body.position.y = moving ? Math.abs(Math.sin(player.walk)) * 0.08 : 0;
  ud.cape.rotation.x = moving || player.gliding ? 0.35 + Math.sin(player.walk * 0.5) * 0.1 : 0.05;
  if (player.roll > 0) ud.body.rotation.x = (0.35 - player.roll) / 0.35 * Math.PI * 2;
  else ud.body.rotation.x = 0;
  if (player.spin > 0) { player.spin -= dt; ud.body.rotation.y = (0.55 - player.spin) / 0.55 * Math.PI * 4; ud.arm.rotation.x = -Math.PI / 2; }
  else {
    ud.body.rotation.y = 0;
    if (player.swing > 0) {
      player.swing -= dt;
      const t = 1 - player.swing / 0.28;
      ud.arm.rotation.x = -2.6 + t * 3.4; ud.arm.rotation.z = -0.3;
    } else { ud.arm.rotation.x = lerp(ud.arm.rotation.x, moving ? -sw * 0.5 : -0.2, dt * 10); ud.arm.rotation.z = 0; }
  }
  player.mesh.visible = !(player.inv > 0 && player.roll <= 0 && Math.floor(player.inv * 20) % 2 === 0);
}

// ============================================================
// 시간 / 낮·밤
// ============================================================
const DAY_LEN = 300; // 초
const skyDay = new THREE.Color(0x9fd4ff), skySet = new THREE.Color(0xf6a26b), skyNight = new THREE.Color(0x1a2850), tmpC = new THREE.Color();
const WHITE = new THREE.Color(0xffffff), DUSK = new THREE.Color(0xffa060), SKYLIGHT = new THREE.Color(0xdff0ff);
const isNight = () => state.time > 0.76 || state.time < 0.22;
function updateTime(dt) {
  state.time = (state.time + dt / DAY_LEN) % 1;
  const t = state.time;
  const sunAng = (t - 0.25) * Math.PI * 2; // 0.25 일출, 0.5 정오, 0.75 일몰
  const elev = Math.sin(sunAng);
  const day = clamp(elev * 3 + 0.2, 0, 1);
  const dusk = clamp(1 - Math.abs(elev) * 4, 0, 1);
  tmpC.copy(skyNight).lerp(skyDay, day).lerp(skySet, dusk * 0.6);
  scene.background.copy(tmpC); scene.fog.color.copy(tmpC);
  sun.intensity = 0.7 + day * 1.5;  // 밤에는 달빛
  sun.color.setHex(0x7f9cff).lerp(WHITE, day).lerp(DUSK, dusk * 0.7);
  hemi.intensity = 0.75 + day * 0.4;
  hemi.color.setHex(0x8fa8ff).lerp(SKYLIGHT, day);
  const sx = Math.cos(sunAng) * 60, sy = Math.max(Math.abs(elev), 0.25) * 70;
  sun.position.set(player.pos.x + sx, player.pos.y + sy, player.pos.z + 25);
  sun.target.position.copy(player.pos);
  for (const L of fireLights) L.intensity = (1 - day) * 40 + 8 + Math.sin(performance.now() / 90) * 3;
  const lampOn = day < 0.5;
  for (const v of villageProps) v.userData.lamp.material.color.setHex(lampOn ? 0xffe08a : 0x777766);
  for (const s of structures) if (s.type === 'lantern') s.mesh.userData.lamp.material.color.setHex(lampOn ? 0xffe08a : 0x777766);
  const hh = Math.floor(t * 24), labels = ['🌙 깊은 밤', '🌅 새벽', '☀️ 아침', '☀️ 낮', '🌇 저녁', '🌙 밤'];
  const idx = hh < 4 ? 0 : hh < 6 ? 1 : hh < 11 ? 2 : hh < 17 ? 3 : hh < 19 ? 4 : 5;
  $('clock').textContent = `${labels[idx]} ${String(hh).padStart(2, '0')}:${String(Math.floor((t * 24 % 1) * 60)).padStart(2, '0')}`;
}

// ============================================================
// 미니맵
// ============================================================
const mm = $('minimap'), mctx = mm.getContext('2d');
const mmBase = document.createElement('canvas'); mmBase.width = mmBase.height = 220;
{
  const c = mmBase.getContext('2d'), img = c.createImageData(220, 220);
  for (let y = 0; y < 220; y++) for (let x = 0; x < 220; x++) {
    const wx = (x / 220 - 0.5) * WORLD, wz = (y / 220 - 0.5) * WORLD, h = heightAt(wx, wz);
    const col = h < 0 ? [58, 166, 216] : h < 0.7 ? [234, 217, 162] : h < 10 ? [100 - h * 3, 180 - h * 4, 80] : h < 16 ? [139, 143, 125] : [244, 246, 250];
    const i = (y * 220 + x) * 4; img.data.set([...col, 255], i);
  }
  c.putImageData(img, 0, 0);
}
function drawMinimap() {
  const S = mm.width, scale = S / 90; // 90유닛 범위 표시
  mctx.save();
  mctx.clearRect(0, 0, S, S);
  mctx.beginPath(); mctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2); mctx.clip();
  const px = (player.pos.x / WORLD + 0.5) * 220, pz = (player.pos.z / WORLD + 0.5) * 220, view = 90 / WORLD * 220;
  mctx.drawImage(mmBase, px - view / 2, pz - view / 2, view, view, 0, 0, S, S);
  const dot = (x, z, color, r = 3) => {
    const sx = S / 2 + (x - player.pos.x) * scale, sy = S / 2 + (z - player.pos.z) * scale;
    mctx.fillStyle = color; mctx.beginPath(); mctx.arc(sx, sy, r, 0, Math.PI * 2); mctx.fill();
  };
  for (const e of enemies) if (!e.dead) dot(e.pos.x, e.pos.z, e.def.boss ? '#ff8a1f' : e.elite ? '#d9a0ff' : '#ff4a4a', e.def.boss ? 5 : 2.5);
  for (const n of npcs) dot(n.pos.x, n.pos.z, '#ffe08a', 3.5);
  for (const c of chests) if (!c.opened && c.mesh.visible) dot(c.x, c.z, '#ffd34a', 3);
  for (const l of loot) if (l.kind === 'item' && l.w.rarity >= 1) dot(l.m.position.x, l.m.position.z, RARITY[l.w.rarity].css, 2.5);
  // 유적 방향 표시
  dot(SHRINE.x, SHRINE.z, '#9fe8ff', 4);
  mctx.restore();
  // 플레이어 화살표
  mctx.save(); mctx.translate(S / 2, S / 2); mctx.rotate(-player.face + Math.PI);
  mctx.fillStyle = '#fff'; mctx.strokeStyle = '#000'; mctx.lineWidth = 1.5;
  mctx.beginPath(); mctx.moveTo(0, -7); mctx.lineTo(5, 5); mctx.lineTo(-5, 5); mctx.closePath(); mctx.fill(); mctx.stroke();
  mctx.restore();
}

// ============================================================
// HUD
// ============================================================
function updateHud() {
  const mh = maxHp();
  $('lvl').textContent = `Lv ${state.level}`;
  $('gold').textContent = `🪙 ${state.gold}`;
  $('hpFill').style.width = (state.hp / mh * 100) + '%';
  $('hpText').textContent = `${Math.ceil(state.hp)}/${mh}`;
  $('xpFill').style.width = (state.xp / xpNeed() * 100) + '%';
  const w = weapon();
  $('weapon').innerHTML = w ? `<span style="color:${RARITY[w.rarity].css}">⚔️ ${w.name}</span> · ${weaponDesc(w)}` : '';
  $('rWood').textContent = state.res.wood; $('rStone').textContent = state.res.stone;
  $('rBerry').textContent = state.res.berry; $('rPotion').textContent = state.res.potion;
  $('cdQ').style.height = clamp(player.qCd / 6, 0, 1) * 100 + '%';
  $('cdRoll').style.height = clamp(player.rollCd / 1, 0, 1) * 100 + '%';
  const q = currentQuest();
  $('quest').innerHTML = q ? (state.questActive
    ? `<b>📜 ${q.title}</b>${q.goal} ${q.progress(q)}${q.done() ? `<br>✅ ${q.giver === 'moko' ? '모코' : '피오'}에게 돌아가자` : ''}`
    : `<b>📜 새 부탁</b>${q.giver === 'moko' ? '모코' : '피오'}가 무언가 할 말이 있는 것 같다`) : '<b>🏆 모든 부탁 완료!</b>자유롭게 섬을 탐험하자';
  const it = !uiOpen && !buildMode ? nearestInteract() : null;
  $('prompt').classList.toggle('hidden', !it);
  if (it) $('prompt').textContent = it.label;
}

// ============================================================
// 저장 / 불러오기
// ============================================================
const SAVE_KEY = 'wanderers-isle-save-v1';
function save() {
  try {
    const s = { ...state, pos: { x: player.pos.x, z: player.pos.z } };
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  } catch { /* 저장 불가 환경 */ }
}
function loadSave() {
  try { const raw = localStorage.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function applySave(s) {
  Object.assign(state, s, { res: { ...state.res, ...s.res }, kills: { ...state.kills, ...s.kills } });
  for (const st of state.structures) addStructure(st, false);
  for (const c of chests) if (state.openedChests.includes(c.id)) { c.opened = true; c.open = 1; }
  if (state.shrineDone) revealShrineChest();
  if (s.pos) player.pos.set(s.pos.x, heightAt(s.pos.x, s.pos.z), s.pos.z);
  state.hp = Math.min(state.hp, maxHp());
}

// ============================================================
// 카메라 & 메인 루프
// ============================================================
let shake = 0;
const camTarget = new THREE.Vector3();
function updateCamera(dt) {
  camTarget.lerp(new THREE.Vector3(player.pos.x, player.pos.y + 1, player.pos.z), Math.min(1, dt * 8));
  const cp = Math.cos(camPitch), sp = Math.sin(camPitch);
  camera.position.set(camTarget.x + Math.sin(camYaw) * camDist * cp, camTarget.y + camDist * sp, camTarget.z + Math.cos(camYaw) * camDist * cp);
  if (shake > 0) { shake -= dt; camera.position.x += rand(-1, 1) * shake * 0.6; camera.position.y += rand(-1, 1) * shake * 0.6; }
  camera.lookAt(camTarget);
}

function updateWorld(dt) {
  water.position.y = Math.sin(performance.now() / 1500) * 0.08;
  for (const r of resources) {
    if (r.shake > 0) { r.shake -= dt; r.mesh.rotation.z = Math.sin(r.shake * 60) * 0.06; if (r.shake <= 0) r.mesh.rotation.z = 0; }
    if (!r.alive || (r.type === 'bush' && !r.ripe)) {
      r.regrow -= dt;
      if (r.regrow <= 0) {
        if (r.type === 'bush') { r.ripe = true; r.mesh.userData.berries.visible = true; }
        else if (Math.hypot(r.x - player.pos.x, r.z - player.pos.z) > 3) { r.alive = true; r.hp = r.maxHp; r.mesh.visible = true; }
      }
    }
  }
  for (const s of structures) if (s.mesh.userData.flames) {
    const f = s.mesh.userData.flames, t = performance.now() / 100;
    f[0].scale.set(1, 1 + Math.sin(t) * 0.15, 1); f[1].scale.set(1, 1 + Math.cos(t * 1.3) * 0.2, 1); f[0].rotation.y = t * 0.2;
  }
  for (const c of chests) if (c.opened && c.open < 1) { c.open = Math.min(1, c.open + dt * 3); }
  for (const c of chests) c.mesh.userData.lid.rotation.x = -c.open * 1.9;
  for (let i = effects.length - 1; i >= 0; i--) {
    const e = effects[i]; e.t += dt; e.update(e.t);
    if (e.t >= e.dur) { scene.remove(e.m); effects.splice(i, 1); }
  }
}

const clock = new THREE.Clock();
let saveTimer = 0;
function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (started) {
    updateTime(dt);
    updatePlayer(dt);
    for (let i = enemies.length - 1; i >= 0; i--) if (!enemies[i].update(dt)) enemies.splice(i, 1);
    // 너무 먼 적 정리
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      if (!e.def.boss && e.pos.distanceTo(player.pos) > 90) { scene.remove(e.mesh, e.bar); if (e.label) scene.remove(e.label); enemies.splice(i, 1); }
    }
    spawnLoop(dt);
    updateNpcs(dt);
    updateLoot(dt);
    updateCrystals(dt);
    updateWorld(dt);
    updateBuild();
    updateHud();
    drawMinimap();
    saveTimer += dt;
    if (saveTimer > 10) { saveTimer = 0; save(); }
  } else {
    camYaw += dt * 0.05; // 타이틀 화면 회전
    updateTime(0);
  }
  updateCamera(dt);
  updateFloaters(dt);
  renderer.render(scene, camera);
}

// ============================================================
// 시작
// ============================================================
const existing = loadSave();
if (existing) $('btnContinue').classList.remove('hidden');
function startGame(cont) {
  if (cont && existing) applySave(existing);
  else {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    const starter = makeWeapon(1, 0, '검'); starter.name = '낡은 나무 검';
    state.items.push(starter); state.equipped = starter.id;
  }
  if (!state.items.length) { const s = makeWeapon(1, 0, '검'); state.items.push(s); state.equipped = s.id; }
  refreshWeaponMesh();
  player.pos.y = heightAt(player.pos.x, player.pos.z);
  camYaw = Math.PI * 0.25;
  $('title').classList.add('hidden');
  $('hud').classList.remove('hidden');
  started = true;
  golemTimer = 0;
  if (!cont) setTimeout(() => toast('💬 마을 주민 모코에게 말을 걸어보자 (E)', '#ffd84a'), 800);
  sfx(523, 0.1, 'triangle', 0.05); setTimeout(() => sfx(784, 0.15, 'triangle', 0.05), 100);
}
$('btnNew').onclick = () => startGame(false);
$('btnContinue').onclick = () => startGame(true);
addEventListener('beforeunload', () => { if (started) save(); });

camTarget.set(0, 3, 0);
loop();

// 디버그/테스트용 핸들
window.__game = { state, player, enemies, startGame };
