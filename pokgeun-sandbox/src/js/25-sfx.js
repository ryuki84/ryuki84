/* ---------- 효과음 (WebAudio, 파일 없이 합성) ---------- */
let AC = null, muted = false;
try { muted = localStorage.getItem("pokgeun-mute") === "1"; } catch (e) {}
function tone(wave, f0, f1, dur, vol = .1, delay = 0) {
  if (muted || !started) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume();
    const t = AC.currentTime + delay, o = AC.createOscillator(), gn = AC.createGain();
    o.type = wave; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(gn); gn.connect(AC.destination); o.start(t); o.stop(t + dur + .02);
  } catch (e) {}
}
const SFX = {
  swing: () => tone("triangle", 420, 160, .07, .06), hit: () => tone("square", 220, 90, .08, .08), crit: () => { tone("square", 330, 110, .1, .1); tone("sawtooth", 880, 220, .08, .05); },
  hurt: () => tone("sawtooth", 180, 60, .16, .1), kill: () => tone("square", 300, 60, .2, .08), chop: () => tone("square", 150, 80, .06, .08),
  coin: () => { tone("square", 988, 988, .05, .05); tone("square", 1319, 1319, .1, .05, .05); }, pick: () => tone("triangle", 520, 880, .08, .08), place: () => tone("triangle", 300, 200, .06, .08),
  gear: () => [523, 659, 784].forEach((f, i) => tone("square", f, f, .08, .05, i * .06)), lvl: () => [523, 659, 784, 1047].forEach((f, i) => tone("square", f, f, .14, .07, i * .1)),
  tame: () => [659, 784, 988, 1319].forEach((f, i) => tone("triangle", f, f, .12, .09, i * .09)), talk: () => tone("square", 420 + Math.random() * 200, 500, .05, .04), ui: () => tone("square", 660, 660, .04, .04),
  splash: () => tone("sine", 500, 120, .15, .08), fire: () => tone("sawtooth", 600, 120, .2, .06), whirl: () => tone("sawtooth", 200, 520, .2, .06), dash: () => tone("triangle", 700, 300, .08, .06),
  potion: () => tone("sine", 400, 900, .18, .08), die: () => [392, 330, 262, 196].forEach((f, i) => tone("square", f, f * .9, .16, .07, i * .12)), portal: () => tone("sine", 300, 900, .25, .07),
};
function sfx(k) { if (SFX[k]) SFX[k](); }
function setMute(m) { muted = m; try { localStorage.setItem("pokgeun-mute", m ? "1" : "0"); } catch (e) {} $("snd").textContent = m ? "🔇" : "🔊"; }
