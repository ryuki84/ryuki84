/* ---------- 상수 / 데이터 ---------- */
const T = 32, W = 30, H = 20, VW = W * T, VH = H * T;
const HOUSE = { x: -60, y: -60, w: 3, h: 2 };   // 집은 마을 서쪽의 실제 건물(걸어 들어가는 집)로 옮김
const SHOP  = { x: 13, y: 3, w: 3, h: 2 };
const CAP = 30;

const ITEMS = {
  apple:    { e: "🍎", n: "사과", p: 50 },
  orange:   { e: "🍊", n: "오렌지", p: 50 },
  peach:    { e: "🍑", n: "복숭아", p: 80 },
  flower:   { e: "🌷", n: "꽃", p: 30 },
  crucian:  { e: "🐟", n: "붕어", p: 100 },
  tropical: { e: "🐠", n: "열대어", p: 250 },
  puffer:   { e: "🐡", n: "복어", p: 400 },
  shark:    { e: "🦈", n: "상어", p: 1500 },
  boot:     { e: "🥾", n: "낡은 장화", p: 10 },
  butterfly:{ e: "🦋", n: "나비", p: 80 },
  firefly:  { e: "✨", n: "반딧불이", p: 150 },
  fossil:   { e: "🦴", n: "화석", p: 500 },
  shell:    { e: "🐚", n: "조개", p: 60 },
  sapling:  { e: "🌱", n: "묘목", p: 0 },
};
const DW = 48, DH = 32, BAGCAP = 20;
const CAVE = { x: 26, y: 2, w: 2, h: 2 };
const RARITY = [{ n: "일반", c: "#eeeeee", m: 1 }, { n: "마법", c: "#6fa8ff", m: 1.5 }, { n: "희귀", c: "#ffd34d", m: 2.3 }, { n: "전설", c: "#ff8a2b", m: 3.5 }, { n: "세트", c: "#5be37d", m: 3.2 }];
const RD = ["#555", "#2b6fd6", "#b8860b", "#d2691e", "#2e8b57"];      // 밝은 종이 배경용
const SLOTS = {
  weapon: { n: "무기", es: ["🗡️", "🪓", "🔨"], base: ["검", "도끼", "망치"] },
  armor:  { n: "방어구", es: ["🛡️", "🥋"], base: ["방패", "갑옷"] },
  ring:   { n: "반지", es: ["💍"], base: ["반지"] },
};
const MPRE = ["예리한", "튼튼한", "날랜", "빛나는"], RPRE = ["용사의", "그림자", "폭풍의", "태양의"];
const LEG = { weapon: ["포근 마을의 수호검", "달빛 도끼", "풍요의 망치"], armor: ["다람쥐 장군의 갑옷", "숲의 수호 방패"], ring: ["별빛 반지", "행운의 인장"] };
const AFFIX = [
  { k: "dmg", f: l => 2 + l * 1.2 }, { k: "hp", f: l => 10 + l * 5 }, { k: "armor", f: l => 2 + l * 1.4 },
  { k: "crit", f: l => 2 + l * .4 }, { k: "as", f: l => 3 + l * .5 }, { k: "ms", f: l => 3 + l * .3 }, { k: "ls", f: l => 1 + l * .15 },
];
const MONS = [
  { e: "🐀", n: "슬라임", hp: 22, dmg: 5, spd: 75, xp: 6 }, { e: "🦇", n: "말벌", hp: 16, dmg: 6, spd: 115, xp: 7 },
  { e: "🕷️", n: "버섯돌이", hp: 30, dmg: 8, spd: 85, xp: 9 }, { e: "💀", n: "유령", hp: 48, dmg: 10, spd: 62, xp: 12 },
  { e: "🧟", n: "오크", hp: 80, dmg: 13, spd: 48, xp: 16 }, { e: "👹", n: "도깨비", hp: 130, dmg: 18, spd: 66, xp: 26 },
];
/* 정예 몬스터: 일반 몬스터가 낮은 확률로 강한 변종이 돼요. 각자 특수 패턴이 있어요 */
const ELITE = {
  spiky: { base: "🐀", n: "가시 슬라임", model: "spikyslime", ai: "charge", tip: "❗ 뒤에 돌진" },
  hornet: { base: "🦇", n: "장수말벌", model: "hornet", ai: "shoot", tip: "독침 발사" },
  mushking: { base: "🕷️", n: "버섯 대장", model: "mushking", ai: "spore", tip: "포자 장판" },
  skullghost: { base: "💀", n: "해골 유령", model: "skullghost", ai: "blink", tip: "순간이동" },
  skullorc: { base: "🧟", n: "해골 오크", model: "skullorc", ai: "slam", tip: "광역 내려찍기" },
};
const ELITE_BY = Object.fromEntries(Object.entries(ELITE).map(([k, v]) => [v.base, k]));
const ELITE_P = .08;   // 정예 등장 확률(깊이 3 이상)
function eliteify(m, force) {
  const k = ELITE_BY[m.e]; if (!k || m.boss || m.wild || m.demon || !(force || ((m.dpt || 1) >= 3 && Math.random() < ELITE_P))) return m;
  const E = ELITE[k]; m.elite = k; m.n = "★ " + E.n; m.hp = m.mhp = Math.round(m.mhp * 3); m.dmg = Math.round(m.dmg * 1.4); m.xp = Math.round(m.xp * 4); m.sk = 1.5 + Math.random(); return m;
}
const ri = n => Math.random() * n | 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
let uidN = Date.now(); const uid = () => ++uidN;
const WILDG = { x: 0, y: 8, w: 2, h: 2 };
const MAT = { wood: ["🪵", "나무"], stone: ["🪨", "돌"], fiber: ["🌿", "섬유"], berry: ["🫐", "열매"], meat: ["🥩", "고기"], hide: ["🐾", "가죽"], bone: ["🦴", "뼈"], ore: ["🔩", "철광석"] };
const DINOS = [
  { e: "🦎", n: "도마뱀", hp: 20, dmg: 4, spd: 90, xp: 5, tame: 3, ride: false },
  { e: "🐗", n: "멧돼지", hp: 45, dmg: 8, spd: 80, xp: 9, tame: 4, ride: true },
  { e: "🦕", n: "파라사우롤로푸스", hp: 120, dmg: 10, spd: 45, xp: 20, tame: 6, ride: true, big: true },
  { e: "🦏", n: "트리케라톱스", hp: 90, dmg: 15, spd: 70, xp: 22, tame: 6, ride: true, aggro: true },
  { e: "🦖", n: "랩터", hp: 110, dmg: 18, spd: 105, xp: 30, tame: 8, ride: true, aggro: true },
];
const SETS = {
  hunter: { n: "사냥꾼", names: { weapon: "사냥꾼의 창", armor: "사냥꾼의 가죽옷", ring: "사냥꾼의 인장" }, bonus: { dmg: 14, crit: 8, ms: 10 } },
  tamer:  { n: "조련사", names: { weapon: "조련사의 채찍", armor: "조련사의 망토", ring: "조련사의 목걸이" }, bonus: { hp: 80, armor: 20, ls: 3 } },
};
const RW = 12, RH = 8;           // 실내 크기(칸), 위 2줄은 벽
const FURN = {
  chair:  { e: "🪑", n: "의자", p: 150 },
  sofa:   { e: "🛋️", n: "소파", p: 350 },
  bed:    { e: "🛏️", n: "침대", p: 400 },
  tv:     { e: "📺", n: "TV", p: 500 },
  shelf:  { e: "📚", n: "책장", p: 300 },
  plant:  { e: "🪴", n: "화분", p: 100 },
  lamp:   { e: "💡", n: "램프", p: 90 },
  teddy:  { e: "🧸", n: "곰인형", p: 80 },
  piano:  { e: "🎹", n: "피아노", p: 800 },
  frame:  { e: "🖼️", n: "액자", p: 120, wall: true },
  clock:  { e: "🕰️", n: "벽시계", p: 200, wall: true },
  window: { e: "🪟", n: "창문", p: 160, wall: true },
  rugR:   { e: "🟥", n: "빨간 러그", p: 120, rug: "#d9534f" },
  rugB:   { e: "🟦", n: "파란 러그", p: 120, rug: "#4a8fd6" },
};
const FRUITS = ["apple", "orange", "peach"];
const TOOLS = [
  { e: "🖐️", n: "손" }, { e: "🥅", n: "채" }, { e: "🎣", n: "낚시" },
  { e: "⛏️", n: "삽" }, { e: "🌱", n: "묘목" },
];
const VILLAGERS = [
  { name: "콩이", e: "🐶", lines: ["오늘도 산책하기 좋은 날이네요!", "저기 연못에서 큰 물고기를 봤어요.", "멍! 아, 말버릇이에요."] },
  { name: "나비", e: "🐱", vrm: "sample_B", lines: ["야옹~ 햇살이 따뜻해요.", "나무를 흔들면 열매가 떨어진대요.", "낮잠 자러 가야겠어요…"] },
  { name: "토리", e: "🐰", vrm: "sample_C", lines: ["깡총! 꽃이 정말 예쁘죠?", "묘목을 심으면 나무가 자라요.", "상점에 가면 벨을 벌 수 있어요."] },
  { name: "음메", e: "🐮", lines: ["음메~ 오늘도 풀이 맛있어요.", "화석은 비싸게 팔린대요.", "밤에는 반딧불이가 나와요."] },
];
