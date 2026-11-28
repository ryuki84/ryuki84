/* ---------- 상수 / 데이터 ---------- */
/* 포근 마을 샌드박스: 기존 게임에서 가져온 전투 중심 콘텐츠는 꺼 둬요(코드는 남겨 두고 나중에 지역 도전 콘텐츠로 재활용 검토).
   arena: 서바이벌 아레나 · demon: 마왕성 · story: 왕국 메인 퀘스트(왕명) · elite: 정예 몬스터 */
const FEAT = { arena: false, demon: false, story: false, elite: false };
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
  if (!FEAT.elite && !force) return m;
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
const VILLAGERS = [   // 직업 주민(치비 캐릭터 셋, src/js/12-chibi.js). e는 2D 화면·아이콘용
  { name: "보리", job: "농부", e: "🌾", cb: { head: 0, body: 1, legs: 1, hat: 0, cape: 0 }, lines: ["밭은 섬유 2개면 만들 수 있어요. 열매를 씨앗처럼 심어 보세요!", "작물은 해가 몇 번 지나면 쑥쑥 자라요.", "비 오는 날엔 밭이 촉촉해서 기분이 좋아요."] },
  { name: "도토리", job: "목수", e: "🪚", cb: { head: 1, body: 1, legs: 1, hat: 0, cape: 0, prop: "axe_1handed" }, lines: ["나무는 여러 번 두드려야 쓰러져요. 그루터기는 금방 다시 자라요.", "나무 벽 하나에 목재 2개면 충분해요.", "튼튼한 집은 바닥부터 차근차근!"] },
  { name: "무쇠", job: "대장장이", e: "🔨", cb: { head: 1, body: 0, legs: 0, hat: 1, cape: 0, prop: "sword_1handed" }, lines: ["반짝이는 철광석은 바위 지대에 숨어 있어요.", "좋은 도구가 있으면 일이 훨씬 빨라지죠.", "망치질 소리가 들리면 저예요!"] },
  { name: "방울", job: "상인", e: "💰", cb: { head: 3, body: 2, legs: 3, hat: 0, cape: 3, cc: 3 }, lines: ["물고기와 화석은 다람쥐 상점에서 좋은 값을 받아요.", "멀리 있는 마을엔 신기한 물건이 많대요.", "벨은 모아 두면 언젠가 쓸 데가 있어요."] },
  { name: "꿀비", job: "요리사", e: "🍳", cb: { head: 2, body: 3, legs: 3, hat: 0, cape: 3, cc: 8 }, lines: ["열매는 그냥 먹어도 맛있지만, 요리하면 더 든든해요.", "모닥불 옆에 있으면 몸이 따뜻해져요.", "오늘 저녁은 버섯 수프 어때요?"] },
  { name: "솔", job: "탐험가", e: "🧭", cb: { head: 4, body: 4, legs: 4, hat: 0, cape: 4, prop: "crossbow_1handed" }, lines: ["이동석을 찾아 두면 다음엔 순식간에 갈 수 있어요.", "숲 너머 눈 덮인 산엔 귀한 광물이 있대요.", "지도(N)에 가 본 곳이 기록돼요."] },
];
