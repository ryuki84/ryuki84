import * as T3 from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
const THREE = { ...T3, EffectComposer, RenderPass, ShaderPass, UnrealBloomPass, GLTFLoader, SkeletonUtils };
// 아티팩트 뷰어는 보안 정책상 data: 주소 읽기를 막아요(blob:은 허용). glTF(JSON) 안에 data:로 넣어 둔 버퍼·이미지를
// 먼저 blob: 주소로 바꿔서 읽어요. 이 처리가 없으면 아티팩트에서 3D 모델이 전부 실패하고 코드 모델로만 보여요.
{ const load0 = GLTFLoader.prototype.load;
  const toBlob = u => { const i = u.indexOf(","), head = u.slice(5, i), b64 = /;base64/.test(head), body = u.slice(i + 1), bin = b64 ? atob(body) : decodeURIComponent(body), a = new Uint8Array(bin.length); for (let k = 0; k < bin.length; k++) a[k] = bin.charCodeAt(k); return URL.createObjectURL(new Blob([a], { type: head.split(";")[0] || "application/octet-stream" })); };
  GLTFLoader.prototype.load = function (url, onLoad, onProgress, onError) {
    if (!/\.json(\?|$)/.test(url)) return load0.call(this, url, onLoad, onProgress, onError);
    fetch(url).then(r => { if (!r.ok) throw new Error(r.status + " " + url); return r.json(); }).then(j => {
      for (const b of j.buffers || []) if (b.uri && b.uri.startsWith("data:")) b.uri = toBlob(b.uri);
      for (const im of j.images || []) if (im.uri && im.uri.startsWith("data:")) im.uri = toBlob(im.uri);
      this.parse(JSON.stringify(j), url.slice(0, url.lastIndexOf("/") + 1), onLoad, onError);
    }).catch(e => onError ? onError(e) : console.error(e));
  }; }
/* r128 → r187: 기존 색감 유지 — 색 관리 끄기 + 옛 방식 점광원 감쇠 */
THREE.ColorManagement.enabled = false;
/* 렌더링 스타일 비교용: ?style=cel (애니메 셀) / ?style=pbr (스타일라이즈드 PBR) / 기본 = 툰 */
// 렌더 버전: 바뀌면 예전에 "툰으로 대체"했던 기기도 실사를 한 번 다시 시도해요(예전에는 한 번 실패하면 영원히 툰이었어요)
const RENDER_VER = "2026-11-28";
let SAFE_FROM = "";   // 툰이 된 이유: "safe"(기기 검사 실패 기록) / "url"(주소 지정) / ""
const RSTYLE = (() => { try { const h = (location.hash.match(/style=(\w+)/) || [])[1]; let v = new URLSearchParams(location.search).get("style") || h; if (v) SAFE_FROM = "url";
  let pref = null; try { pref = localStorage.getItem("pokgeun-style"); } catch (e) {}   // 설정에서 고른 그래픽 스타일
  if (!v && (!pref || pref === "real" || pref === "pbr")) try { const raw = localStorage.getItem("pokgeun-safe"); if (raw) { let o = null; try { o = JSON.parse(raw); } catch (e) {} if (o && o.v === RENDER_VER) { v = o.style; SAFE_FROM = "safe"; } else localStorage.removeItem("pokgeun-safe"); } } catch (e) {}
  if (!v) v = pref;
  return ["toon", "cel", "pbr", "real"].includes(v) ? v : "real"; } catch (e) { return "toon"; } })();
const REAL = RSTYLE === "real", PBRL = RSTYLE === "pbr" || REAL;
const VIEW2D = (() => { try { const q = new URLSearchParams(location.search).get("view"); if (q) return q === "2d"; return localStorage.getItem("pokgeun-view") === "2d"; } catch (e) { return false; } })();
THREE.ColorManagement.enabled = REAL;   // 듀랑고풍: 정확한 색 관리 + ACES 톤매핑
const RX = REAL ? await Promise.all([import("three/addons/objects/Sky.js"), import("three/addons/postprocessing/OutputPass.js")]).catch(() => null) : null;
const PBRX = PBRL ? await Promise.all([import("three/addons/postprocessing/GTAOPass.js"), Promise.resolve(null)]).catch(() => null) : null;
function TOON(o) { if (!PBRL) return new THREE.MeshToonMaterial(o); const { gradientMap, ...r } = o; return new THREE.MeshStandardMaterial({ roughness: REAL ? .88 : .72, metalness: 0, ...r }); }
/* 듀랑고풍: Quaternius Ultimate Stylized Nature (CC0) 나무·덤불·바위·풀 */
const NEXT = "glb";            // 아티팩트 사본은 json(glTF) 로 바뀜
const NAT = REAL ? await (async () => {
  try {
    const L = new THREE.GLTFLoader(), TL = new THREE.TextureLoader(), base = "assets/nature/", tex = {}, parts = {}, mats = {};
    const TN = ["NormalTree_Bark", "NormalTree_Leaves", "PineTree_Bark", "PineTree_Leaves", "BirchTree_Bark", "BirchTree_Leaves", "PalmTree_Trunk", "PalmTree_Leaves", "Bush_Leaves", "Grass", "Flowers", "Rocks", "Rocks_Desert"];
    const MN = ["NormalTree_1", "NormalTree_2", "NormalTree_3", "PineTree_1", "PineTree_2", "PineTree_3", "BirchTree_1", "BirchTree_2", "PalmTree_1", "PalmTree_2", "DeadTree_1", "DeadTree_2", "Bush", "Bush_Flowers", "Bush_Large", "Bush_Large_Flowers", "Rock_1", "Rock_2", "Rock_3", "Rock_4", "Grass_Large", "Grass_Small", "Flower_1_Clump", "Flower_3_Clump", "Flower_4_Clump", "Plant_1", "Plant_2"];
    await Promise.all(TN.map(async n => { const t = await TL.loadAsync(base + "tex/" + n + ".webp"); t.colorSpace = REAL ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; tex[n] = t; }));
    const LODN = ["NormalTree_1", "NormalTree_2", "NormalTree_3", "PineTree_1", "PineTree_2", "PineTree_3", "BirchTree_1", "BirchTree_2", "DeadTree_1", "DeadTree_2"];   // 먼 나무용 간략 모델(tools/make-nature-lod.mjs)
    MN.push(...LODN.map(n => "lod/" + n));
    const gl = await Promise.all(MN.map(n => L.loadAsync(base + n + "." + NEXT)));
    MN.forEach((n, i) => { const P = []; gl[i].scene.updateMatrixWorld(true); gl[i].scene.traverse(o => { if (o.isMesh) { const g = o.geometry.clone().applyMatrix4(o.matrixWorld); g.userData.shared = 1; P.push({ g, m: o.material.name }); } }); parts[n] = P; });
    return { tex, parts, mats };
  } catch (e) { console.warn("자연 에셋을 불러오지 못했어요 — 기본 나무로 표시해요.", e); return null; }
})() : null;
THREE.ShaderChunk.lights_pars_begin = THREE.ShaderChunk.lights_pars_begin.replace(/float getDistanceAttenuation\([\s\S]*?return distanceFalloff;\s*\}/, "float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n\tif ( cutoffDistance > 0.0 && decayExponent > 0.0 ) return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );\n\treturn 1.0;\n}");

"use strict";