// Soft, locally synthesized audio. No downloads, samples, or network requests.
export class PicnicAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.music = null;
    this.notes = [
      261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23, 261.63, 329.63,
      392, 523.25, 440, 392, 329.63, 293.66,
    ];
    this.noteIndex = 0;
  }
  unlock() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.45;
        this.master.connect(this.ctx.destination);
      }
      this.ctx.resume().catch(() => {});
    } catch {
      /* Gameplay remains available without Web Audio. */
    }
  }
  setMuted(value) {
    this.muted = value;
    if (this.ctx)
      this.master.gain.setTargetAtTime(
        value ? 0 : 0.45,
        this.ctx.currentTime,
        0.03,
      );
  }
  tone(
    frequency,
    duration,
    volume = 0.12,
    delay = 0,
    end = frequency,
    type = "sine",
  ) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + delay,
      o = this.ctx.createOscillator(),
      g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(frequency, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + duration);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + duration + 0.03);
  }
  startMusic() {
    this.stopMusic();
    this.music = setInterval(() => {
      if (this.ctx?.state === "running" && !this.muted) {
        const n = this.notes[this.noteIndex++ % this.notes.length];
        this.tone(n, 0.7, 0.045);
        this.tone(n / 2, 1, 0.025);
      }
    }, 430);
  }
  stopMusic() {
    clearInterval(this.music);
    this.music = null;
  }
  eat(count, delay = 0) {
    this.tone(
      370 / (1 + count * 0.22),
      0.24 + count * 0.025,
      0.19,
      delay,
      105 / (1 + count * 0.12),
    );
    this.tone(680, 0.09, 0.045, delay + 0.015, 1050);
  }
  boom(delay = 0) {
    this.tone(110, 1.6, 0.22, delay, 38);
    this.tone(164.81, 1.2, 0.085, delay + 0.03, 82.4);
    [261.63, 329.63, 392, 523.25].forEach((f, i) =>
      this.tone(f, 0.9, 0.08, delay + 0.16 + i * 0.12),
    );
  }
}
