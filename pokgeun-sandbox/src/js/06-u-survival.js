/* ===== GDD P3-1 (2026-11-28): 허기 · 스태미나 · 먹기 · 요리 =====
   난이도 보통(GDD 8.3): 즉사 없음, 단계적으로 알려 주고 대응할 시간을 줘요.
   - 허기(S.surv.food 0~100): 넓은 세상·던전에서 30초에 1, 마을·집에서는 90초에 1 줄어요(100 → 0 약 50분)
     30 아래면 스태미나 회복이 절반, 0이면 체력이 천천히 줄지만 최대 체력의 25% 아래로는 안 내려가요
   - 스태미나(player.sta 0~100): 채집·공격 2.5, 구르기 15. 쉬면 초당 14 회복. 5 아래면 채집·공격이 느려져요
   - 먹기: 가장 든든한 음식부터 자동으로(🍙 버튼 · T 키). 요리는 모닥불 옆에서(제작 창 '요리') */
MAT.cmeat = ["🍗", "구운 고기"]; MAT.soup = ["🥣", "열매 수프"]; MAT.gfish = ["🍢", "생선 구이"];
const FOODS = [   // 든든한 순서
  { k: "soup", src: "mat", f: 32, sta: 40, n: "열매 수프" }, { k: "cmeat", src: "mat", f: 36, sta: 30, n: "구운 고기" }, { k: "gfish", src: "mat", f: 30, sta: 30, n: "생선 구이" },
  { k: "peach", src: "inv", f: 16, n: "복숭아" }, { k: "apple", src: "inv", f: 14, n: "사과" }, { k: "orange", src: "inv", f: 14, n: "오렌지" },
  { k: "berry", src: "mat", f: 6, n: "열매" }, { k: "meat", src: "mat", f: 7, n: "날고기", raw: true },
];
const FISHES = ["crucian", "tropical", "puffer"];
S.surv = Object.assign({ food: 100 }, S.surv && typeof S.surv === "object" ? S.surv : {});
player.sta = 100;
const SV = { actT: 9, warnT: -99, starveT: 0, low: false };
const foodHave = f => f.src === "mat" ? (S.mat[f.k] || 0) : (S.inv[f.k] || 0);
function eatBest() {
  if (!started || modal) return;
  if (S.surv.food >= 97) return say("🙂 배가 불러요.", 1400);
  const f = FOODS.find(f => foodHave(f) > 0); if (!f) return say("🍙 먹을 게 없어요. 덤불의 열매, 과일나무, 사냥한 고기를 모아 모닥불에서 요리해 보세요.", 3200);
  if (f.src === "mat") S.mat[f.k]--; else S.inv[f.k]--;
  S.surv.food = Math.min(100, S.surv.food + f.f); if (f.sta) player.sta = Math.min(100, player.sta + f.sta);
  sfx("potion"); pAnim("Use_Item", .6); fx(player.x, player.y - 26, `🍙 +${f.f}`, "#ffd34d"); SV.low = S.surv.food < 30;
  say(`😋 ${f.n}을(를) 먹었어요${f.raw ? " (익히면 훨씬 든든해요)" : ""}. 배부름 ${Math.round(S.surv.food)}`, 1800); hud();
}
// 요리법(모닥불 옆): 제작 창의 '🍳 요리' 칸에 나와요
CRAFT2.push(
  { id: "c_meat", g: "food", fire: 1, e: "🍗", n: "구운 고기", cost: { meat: 1 }, give: { cmeat: 1 }, d: "배부름 +36 · 스태미나 +30" },
  { id: "c_meat5", g: "food", fire: 1, e: "🍗", n: "구운 고기 ×5", cost: { meat: 5 }, give: { cmeat: 5 }, d: "한 번에 많이" },
  { id: "c_soup", g: "food", fire: 1, e: "🥣", n: "열매 수프", cost: { berry: 3 }, give: { soup: 1 }, d: "배부름 +32 · 스태미나 +40" },
  { id: "c_fish", g: "food", fire: 1, e: "🍢", n: "생선 구이", cost: {}, fish: 1, give: { gfish: 1 }, d: "잡은 물고기 한 마리 → 배부름 +30" },
);
function nearFire(r = 3) {
  if (!(scene === "dun" && dun && dun.kind === "world")) return false;
  const px = Math.floor(player.x / T), py = Math.floor((player.y + 8) / T);
  for (let y = py - r; y <= py + r; y++) for (let x = px - r; x <= px + r; x++) if (wc(x, y) === CELL.FIRE) return true;
  return false;
}
/* 매 프레임 */
function survTick(dt) {
  if (!started || modal || resetting) return;
  const P = player, out = scene === "dun", lowF = S.surv.food < 30, zero = S.surv.food <= 0;
  S.surv.food = Math.max(0, S.surv.food - dt / (out ? 30 : 90));
  if ((SV.actT += dt) > .6) P.sta = Math.min(100, P.sta + dt * 14 * (zero ? .3 : lowF ? .5 : 1));
  if (lowF && !SV.low) { SV.low = true; say("🍙 배가 고파요. 먹으면(🍙 · T) 스태미나가 다시 잘 차올라요.", 3000); }
  if (!lowF) SV.low = false;
  if (zero && out) { if ((SV.starveT += dt) > 4) { SV.starveT = 0; const m = pstats().maxhp; if (P.hp > m * .25) { P.hp = Math.max(m * .25, P.hp - 2); fx(P.x, P.y - 20, "🍙 배고파요", "#ffb04d"); } }
    if (vtime - SV.warnT > 30) { SV.warnT = vtime; say("😵 너무 배고파요! 체력이 조금씩 줄어요. 열매·고기를 먹어요.", 3200); } }
}
const staUse = n => { player.sta = Math.max(0, player.sta - n); SV.actT = 0; };
{ const a0 = attack; attack = function (held) { const P = player, cd0 = P.atkCd; const r = a0.call(this, held); if (scene === "dun" && cd0 <= 0 && P.atkCd > 0) { staUse(2.5); if (P.sta < 5) { P.atkCd *= 2.2; if (vtime - SV.warnT > 6) { SV.warnT = vtime; say("😮‍💨 힘들어요… 잠깐 쉬면 다시 빨라져요.", 1800); } } } return r; }; }
{ const d0 = dash; dash = function () { const P = player; if (scene === "dun" && P.eCd <= 0 && !modal && P.sta < 15) return say("😮‍💨 숨이 차서 구를 수 없어요.", 1400); const e0 = P.eCd, r = d0.call(this); if (P.eCd > e0) staUse(15); return r; }; }
{ const s0 = sleepAt; sleepAt = function (...a) { player.sta = 100; S.surv.food = Math.max(5, S.surv.food - 8); return s0.apply(this, a); }; }   // 자고 나면 개운하지만 조금 출출
addEventListener("keydown", e => { if (e.code === "KeyT" && !e.repeat && started && document.activeElement?.id !== "chatin") eatBest(); });
{ let lt = performance.now(); (function loop(now) { survTick(clamp((now - lt) / 1000, 0, .1)); lt = now; requestAnimationFrame(loop); })(lt); }
