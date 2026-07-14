/**
 * Gerçek ses dosyası olmadan Web Audio API ile kısa prosedürel bipler.
 * AudioContext tarayıcı politikası gereği ilk kullanıcı etkileşiminde resume edilir.
 */

let audioContext = null;

function getAudioContext() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!audioContext) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return null;
    }
    audioContext = new Ctx();
  }

  return audioContext;
}

/** İlk dokunuş/tıklamada context'i aç (autoplay kısıtı) */
export function resumeAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Kısa bir osilatör bip'i çalar.
 * @param {number} frequency Hz
 * @param {number} durationSec sn
 * @param {OscillatorType} [type='square']
 * @param {number} [gain=0.08]
 * @param {number|null} [frequencyEnd] varsa linear ramp (sweep)
 * @param {number} [delaySec=0] başlangıç gecikmesi
 */
export function playBeep(frequency, durationSec, type = 'square', gain = 0.08, frequencyEnd = null, delaySec = 0) {
  const ctx = getAudioContext();
  if (!ctx) {
    return;
  }

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime + delaySec;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  if (frequencyEnd != null) {
    oscillator.frequency.linearRampToValueAtTime(frequencyEnd, now + durationSec);
  }

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(gain, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + durationSec + 0.02);
}

/** Düşman ölümü — alçak, kısa "thud" */
export function playDeathSound() {
  playBeep(120, 0.12, 'sawtooth', 0.1, 60);
}

/** Altın toplama — yüksek, parlak iki notalı bip */
export function playCoinSound() {
  playBeep(880, 0.07, 'square', 0.07);
  playBeep(1320, 0.06, 'square', 0.05, null, 0.05);
}

/** Hasar / vuruş — orta frekans tık (ileride kullanılabilir) */
export function playHitSound() {
  playBeep(220, 0.05, 'triangle', 0.09, 140);
}
