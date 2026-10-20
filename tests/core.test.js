import { test } from "node:test";
import assert from "node:assert/strict";
import {
  Game,
  WIDTH,
  HEIGHT,
  SPEED,
  STEP,
  BASE_RADIUS,
  enemyPosition,
  normalizeRecords,
  readRecords,
  saveRecord,
  RECORDS_KEY,
} from "../src/core.js";
import { messages } from "../src/i18n.js";
const near = (a, b, epsilon = 1e-8) =>
  assert.ok(Math.abs(a - b) < epsilon, `${a} should equal ${b}`);
const storage = () => {
  const data = new Map();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
  };
};
const away = (game) =>
  game.enemies.forEach((e) => Object.assign(e, { x: 10000, y: 10000 }));

test("all six linear sizes are exact powers of two, with no skipped growth events", () => {
  const g = new Game();
  away(g);
  assert.equal(g.radius, BASE_RADIUS);
  for (let i = 0; i < 5; i++) {
    const e = g.enemies[i];
    Object.assign(e, g.player);
    const meals = g.resolveCollisions();
    assert.equal(meals.length, 1);
    assert.equal(meals[0].multiplier, 2 ** (i + 1));
    assert.equal(g.radius * 2, BASE_RADIUS * 2 * 2 ** (i + 1));
  }
  assert.equal(g.finaleCount, 1);
  assert.equal(g.complete, true);
  assert.deepEqual(g.resolveCollisions(), []);
  assert.equal(g.finaleCount, 1);
});
test("collision loop revisits earlier enemies and resolves a whole chain immediately", () => {
  const g = new Game();
  g.player = { x: 100, y: 100 };
  // Reverse order requires a second traversal: each new radius unlocks the next meal.
  const distances = [400, 200, 110, 60, 40];
  g.enemies.forEach((e, i) =>
    Object.assign(e, { x: 100 + distances[i], y: 100 }),
  );
  const meals = g.resolveCollisions();
  assert.deepEqual(
    meals.map((m) => m.id),
    [4, 3, 2, 1, 0],
  );
  assert.deepEqual(
    meals.map((m) => m.multiplier),
    [2, 4, 8, 16, 32],
  );
  assert.equal(g.ticks, 0);
  assert.equal(g.eaten, 5);
  assert.equal(g.finaleCount, 1);
});
test("each enemy can be eaten first and simultaneous overlaps never duplicate meals", () => {
  for (let id = 0; id < 5; id++) {
    const g = new Game();
    away(g);
    Object.assign(g.enemies[id], g.player);
    assert.equal(g.resolveCollisions()[0].id, id);
    g.enemies
      .filter((e) => !e.eaten)
      .forEach((e) => Object.assign(e, g.player));
    assert.equal(g.resolveCollisions().length, 4);
    assert.equal(g.finaleCount, 1);
    assert.equal(
      new Set(g.enemies.filter((e) => e.eaten).map((e) => e.id)).size,
      5,
    );
  }
});
test("deterministic paths stay in bounds over many loops and ignore the player", () => {
  const paths = Array.from({ length: 5 }, () => []);
  for (let tick = 0; tick < 30000; tick += 17)
    for (let id = 0; id < 5; id++) {
      const p = enemyPosition(id, tick * STEP);
      const again = enemyPosition(id, tick * STEP);
      assert.deepEqual(p, again);
      assert.ok(p.x >= 16 && p.x <= WIDTH - 16);
      assert.ok(p.y >= 16 && p.y <= HEIGHT - 16);
      paths[id].push(p);
    }
  assert.ok(enemyPosition(0, 1).x > enemyPosition(0, 0).x);
  assert.ok(enemyPosition(1, 1).x < enemyPosition(1, 0).x);
  assert.notEqual(enemyPosition(2, 1).x, enemyPosition(2, 0).x);
  assert.notEqual(enemyPosition(2, 1).y, enemyPosition(2, 0).y);
  assert.deepEqual(enemyPosition(4, 0.2), enemyPosition(4, 0));
  assert.deepEqual(enemyPosition(4, 0.449), enemyPosition(4, 0));
  near(enemyPosition(3, 0).x, enemyPosition(3, (2 * Math.PI) / 0.38).x);
  near(enemyPosition(3, 0).y, enemyPosition(3, (2 * Math.PI) / 0.38).y);
  const rectanglePeriod = (2 * (225 + 320)) / 48 + 4 * 0.45;
  assert.deepEqual(enemyPosition(4, rectanglePeriod), enemyPosition(4, 0));
  assert.equal(new Set(paths.map((p) => JSON.stringify(p))).size, 5);
});
test("movement is normalized, remains constant at every playable size, and constrains only the center", () => {
  for (const eaten of [0, 1, 2, 3, 4]) {
    const a = new Game();
    a.eaten = eaten;
    a.resolveCollisions = () => [];
    const b = new Game();
    b.eaten = eaten;
    b.resolveCollisions = () => [];
    a.step({ x: 1, y: 0 });
    b.step({ x: 1, y: 1 });
    near(a.player.x - WIDTH / 2, SPEED * STEP);
    near(
      Math.hypot(b.player.x - WIDTH / 2, b.player.y - HEIGHT / 2),
      SPEED * STEP,
    );
  }
  const g = new Game();
  g.resolveCollisions = () => [];
  for (let i = 0; i < 1000; i++) g.step({ x: -1, y: -1 });
  assert.deepEqual(g.player, { x: 0, y: 0 });
});
test("timer waits for movement, counts idle active time, suspends on pause, and stops on fifth meal", () => {
  const g = new Game();
  for (let i = 0; i < 120; i++) g.step();
  assert.equal(g.elapsed, 0);
  assert.equal(g.started, false);
  assert.equal(g.eaten, 0);
  g.step({ x: 1, y: 0 });
  for (let i = 0; i < 119; i++) g.step();
  near(g.elapsed, 1);
  g.setPaused(true);
  const frozen = structuredClone({ player: g.player, enemies: g.enemies });
  for (let i = 0; i < 120; i++) g.step({ x: 1, y: 0 });
  near(g.elapsed, 1);
  assert.deepEqual({ player: g.player, enemies: g.enemies }, frozen);
  g.setPaused(false);
  g.step();
  near(g.elapsed, 1 + STEP);
  g.enemies.forEach((e) => Object.assign(e, g.player));
  g.resolveCollisions();
  const finalTime = g.elapsed;
  for (let i = 0; i < 120; i++) g.step({ x: 1, y: 0 });
  assert.equal(g.elapsed, finalTime);
  assert.equal(g.finaleCount, 1);
});
test("fixed-step simulation is identical across different render frame groupings", () => {
  const simulate = (frames) => {
    const game = new Game();
    let accumulator = 0;
    for (const frame of frames) {
      accumulator += frame;
      while (accumulator + 1e-12 >= STEP) {
        game.step({ x: -1, y: 1 });
        accumulator -= STEP;
      }
    }
    return game;
  };
  const a = simulate(Array(120).fill(1 / 60)),
    b = simulate(Array(40).fill(1 / 20));
  assert.deepEqual(a, b);
});
test("records persist, sort fastest first with deterministic ties, and retain only ten", () => {
  const db = storage();
  for (let i = 15; i > 0; i--)
    assert.equal(
      saveRecord(db, i, `2026-10-${String(i).padStart(2, "0")}T00:00:00.000Z`)
        .persisted,
      true,
    );
  const records = readRecords(db);
  assert.equal(records.length, 10);
  assert.deepEqual(
    records.map((r) => r.time),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  const saved = JSON.parse(db.getItem(RECORDS_KEY));
  assert.deepEqual(saved, records);
  const ties = normalizeRecords([
    { time: 1, date: "2026-02-01" },
    { time: 1, date: "2026-01-01" },
  ]);
  assert.equal(ties[0].date, "2026-01-01");
});
test("corrupt, unavailable, and full storage never prevent a completed game", () => {
  const db = storage();
  db.setItem(RECORDS_KEY, "{broken");
  assert.deepEqual(readRecords(db), []);
  db.setItem(
    RECORDS_KEY,
    JSON.stringify([
      null,
      { time: -1, date: "2026-01-01" },
      { time: "1", date: "2026-01-01" },
      { time: 1, date: "bad" },
    ]),
  );
  assert.deepEqual(readRecords(db), []);
  const denied = {
    getItem() {
      throw Error("denied");
    },
    setItem() {
      throw Error("full");
    },
  };
  const result = saveRecord(denied, 2, "2026-01-01");
  assert.equal(result.persisted, false);
  assert.equal(result.records.length, 1);
  assert.deepEqual(readRecords(null), []);
});
test("both languages cover the same entire interface", () => {
  assert.deepEqual(
    Object.keys(messages.en).sort(),
    Object.keys(messages["zh-TW"]).sort(),
  );
  for (const dictionary of Object.values(messages))
    for (const value of Object.values(dictionary))
      assert.ok(typeof value === "string" && value.length > 0);
});
