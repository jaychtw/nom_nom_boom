export const WIDTH = 960;
export const HEIGHT = 540;
export const BASE_RADIUS = 30;
export const ENEMY_RADIUS = 16;
export const SPEED = 180;
export const STEP = 1 / 120;
export const RECORDS_KEY = "nom-nom-boom.records.v1";
export const PREFS_KEY = "nom-nom-boom.preferences.v1";
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const reflect = (v, lo, hi) => {
  const span = hi - lo;
  const phase = (((v - lo) % (2 * span)) + 2 * span) % (2 * span);
  return lo + (phase <= span ? phase : 2 * span - phase);
};

// Positions depend only on active simulation time, never the player or frame rate.
export function enemyPosition(id, time) {
  switch (id) {
    case 0:
      return { x: reflect(110 + time * 45, 60, 900), y: 105 };
    case 1:
      return { x: reflect(850 - time * 34, 60, 900), y: 195 };
    case 2:
      return {
        x: reflect(140 + time * 38, 60, 900),
        y: reflect(410 - time * 29, 60, 480),
      };
    case 3:
      return {
        x: 720 + Math.cos(Math.PI / 2 + time * 0.38) * 145,
        y: 355 + Math.sin(Math.PI / 2 + time * 0.38) * 100,
      };
    case 4: {
      const corners = [
        { x: 360, y: 425 },
        { x: 585, y: 425 },
        { x: 585, y: 105 },
        { x: 360, y: 105 },
      ];
      let t = time % ((2 * (225 + 320)) / 48 + 4 * 0.45);
      for (let i = 0; i < 4; i++) {
        const a = corners[i],
          b = corners[(i + 1) % 4];
        if (t < 0.45) return { ...a };
        t -= 0.45;
        const duration = Math.hypot(b.x - a.x, b.y - a.y) / 48;
        if (t < duration)
          return {
            x: a.x + ((b.x - a.x) * t) / duration,
            y: a.y + ((b.y - a.y) * t) / duration,
          };
        t -= duration;
      }
      return { ...corners[0] };
    }
    default:
      throw new RangeError("Exactly five wanderers live here.");
  }
}

export class Game {
  constructor() {
    this.reset();
  }
  reset() {
    this.player = { x: WIDTH / 2, y: HEIGHT / 2 };
    this.enemies = Array.from({ length: 5 }, (_, id) => ({
      id,
      eaten: false,
      ...enemyPosition(id, 0),
    }));
    this.eaten = 0;
    this.ticks = 0;
    this.started = false;
    this.paused = false;
    this.complete = false;
    this.finaleCount = 0;
  }
  get elapsed() {
    return this.ticks * STEP;
  }
  get multiplier() {
    return 2 ** this.eaten;
  }
  get radius() {
    return BASE_RADIUS * this.multiplier;
  }
  setPaused(value) {
    this.paused = value;
  }
  step(input = { x: 0, y: 0 }) {
    if (this.paused || this.complete) return [];
    const length = Math.hypot(input.x, input.y);
    if (!this.started && length === 0) return [];
    this.started = true;
    this.ticks++;
    if (length) {
      this.player.x = clamp(
        this.player.x + (input.x / length) * SPEED * STEP,
        0,
        WIDTH,
      );
      this.player.y = clamp(
        this.player.y + (input.y / length) * SPEED * STEP,
        0,
        HEIGHT,
      );
    }
    for (const enemy of this.enemies)
      Object.assign(enemy, enemyPosition(enemy.id, this.elapsed));
    return this.resolveCollisions();
  }
  resolveCollisions() {
    if (this.complete) return [];
    const meals = [];
    let found;
    do {
      found = false;
      for (const enemy of this.enemies) {
        if (
          !enemy.eaten &&
          Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y) <=
            this.radius + ENEMY_RADIUS
        ) {
          enemy.eaten = true;
          this.eaten++;
          meals.push({
            id: enemy.id,
            x: enemy.x,
            y: enemy.y,
            count: this.eaten,
            multiplier: this.multiplier,
          });
          found = true;
        }
      }
    } while (found && this.eaten < 5);
    if (this.eaten === 5) {
      this.complete = true;
      this.finaleCount++;
    }
    return meals;
  }
}

export const formatTime = (seconds) => Math.max(0, seconds).toFixed(2);
export function normalizeRecords(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (r) =>
        r &&
        typeof r.time === "number" &&
        Number.isFinite(r.time) &&
        r.time > 0 &&
        typeof r.date === "string" &&
        Number.isFinite(Date.parse(r.date)),
    )
    .map((r) => ({ time: r.time, date: r.date }))
    .sort((a, b) => a.time - b.time || Date.parse(a.date) - Date.parse(b.date))
    .slice(0, 10);
}
export function readRecords(storage) {
  try {
    return normalizeRecords(JSON.parse(storage.getItem(RECORDS_KEY)));
  } catch {
    return [];
  }
}
export function saveRecord(storage, time, date = new Date().toISOString()) {
  const records = normalizeRecords([...readRecords(storage), { time, date }]);
  let persisted = true;
  try {
    storage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    persisted = false;
  }
  return { records, persisted };
}
