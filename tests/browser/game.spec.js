import { test, expect } from "@playwright/test";
async function move(page, keys, ms) {
  for (const key of keys) await page.keyboard.down(key);
  await page.clock.runFor(ms);
  for (const key of keys) await page.keyboard.up(key);
}
async function eatEverything(page) {
  await move(page, ["ArrowDown", "ArrowLeft"], 1000);
  await expect(page.locator("#eaten-count")).toHaveText("1");
  await move(page, ["ArrowLeft"], 700);
  await expect(page.locator("#eaten-count")).toHaveText("2");
  await move(page, ["ArrowUp"], 1100);
  await expect(page.locator("#eaten-count")).toHaveText("3");
  await move(page, ["ArrowRight"], 2000);
  await expect(page.locator("#eaten-count")).toHaveText("5");
}

test("complete keyboard picnic, huge finale, results, persistence, and replay", async ({
  page,
}, info) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.clock.install();
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Nom Nom BOOM!" }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("01-title-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Let’s eat" }).click();
  await page.clock.runFor(2000);
  await expect(page.locator("#timer")).toHaveText("0.00s");
  await eatEverything(page);
  await expect(page.locator("#finale")).toBeVisible();
  const stopped = await page.locator("#timer").textContent();
  await page.clock.runFor(300);
  await page.screenshot({ path: info.outputPath("02-finale-desktop.png") });
  const coverage = await page.locator("#finale-canvas").evaluate((canvas) => {
    const ctx = canvas.getContext("2d");
    return [
      [0.03, 0.03],
      [0.97, 0.03],
      [0.03, 0.97],
      [0.97, 0.97],
    ].map(([x, y]) => [
      ...ctx.getImageData(
        Math.floor(canvas.width * x),
        Math.floor(canvas.height * y),
        1,
        1,
      ).data,
    ]);
  });
  for (const color of coverage)
    expect(color.slice(0, 3)).toEqual([245, 180, 151]);
  await page.clock.runFor(2400);
  await expect(
    page.getByRole("heading", { name: "Well, that escalated." }),
  ).toBeVisible();
  await expect(page.locator("#timer")).toHaveText(stopped);
  await expect(page.locator(".record-list li")).toHaveCount(1);
  await expect(page.locator(".result-eaten")).toHaveText(
    "5 / 5 happily munched",
  );
  await page.screenshot({ path: info.outputPath("03-results-desktop.png") });
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("nom-nom-boom.records.v1")),
  );
  expect(records).toHaveLength(1);
  expect(records[0].time).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Another little bite" }).click();
  await expect(page.locator("#eaten-count")).toHaveText("0");
  await expect(page.locator("#timer")).toHaveText("0.00s");
  await page.reload();
  await page.getByRole("button", { name: "Your picnic journal" }).click();
  await expect(page.locator(".record-list li")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("pause, background suspension, localized discard confirmation, and preferences", async ({
  page,
}, info) => {
  await page.clock.install();
  await page.goto("/");
  await page
    .getByRole("button", { name: "Switch to Traditional Chinese" })
    .click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  await page.getByRole("button", { name: "開動囉" }).click();
  await move(page, ["d"], 300);
  await page.keyboard.press("p");
  await expect(page.getByRole("heading", { name: "休息一下。" })).toBeVisible();
  const pausedTime = await page.locator("#timer").textContent();
  await page.clock.runFor(4000);
  await expect(page.locator("#timer")).toHaveText(pausedTime);
  await page.getByRole("button", { name: "重新開始" }).click();
  await expect(
    page.getByRole("heading", { name: "開始新的野餐嗎？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "先留在這裡" }).click();
  await expect(page.getByRole("heading", { name: "休息一下。" })).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "音效開啟" })
    .click();
  await expect(
    page.getByRole("button", { name: /音效關閉/ }).first(),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "柔和動畫" })
    .click();
  await page.screenshot({ path: info.outputPath("pause-zh-TW.png") });
  await page.getByRole("button", { name: "繼續吃吃" }).click();
  await page.clock.runFor(400);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.getByRole("heading", { name: "休息一下。" })).toBeVisible();
  const blurredTime = await page.locator("#timer").textContent();
  await page.clock.runFor(3000);
  await expect(page.locator("#timer")).toHaveText(blurredTime);
  await page.getByRole("button", { name: "回到野餐首頁" }).click();
  await expect(
    page.getByRole("heading", { name: "要回到野餐首頁嗎？" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "好，出發吧" }).click();
  await expect(page.getByRole("button", { name: "開動囉" })).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-TW");
  await expect(page.locator("body")).toHaveClass(/reduced-motion/);
  await expect(page.getByRole("button", { name: /音效關閉/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("mobile touch picnic in real time, portrait and landscape layouts", async ({
  browser,
}, info) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.screenshot({
    path: info.outputPath("01-title-mobile.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Let’s eat" }).tap();
  await expect(page.locator(".dpad")).toBeVisible();
  await page.screenshot({
    path: info.outputPath("02-game-mobile.png"),
    fullPage: true,
  });
  const cdp = await context.newCDPSession(page);
  async function touch(directions, duration) {
    const touches = [];
    for (const [i, direction] of directions.entries()) {
      const box = await page.locator(`[data-dir="${direction}"]`).boundingBox();
      touches.push({
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
        id: i + 1,
      });
    }
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: touches,
    });
    await page.waitForTimeout(duration);
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  }
  await touch(["down", "left"], 1000);
  await touch(["left"], 700);
  await touch(["up"], 1100);
  await touch(["right"], 2000);
  await expect(page.locator("#eaten-count")).toHaveText("5");
  await page.screenshot({
    path: info.outputPath("03-finale-mobile.png"),
    fullPage: true,
  });
  await expect(
    page.getByRole("heading", { name: "Well, that escalated." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Another little bite" }).tap();
  await page.setViewportSize({ width: 844, height: 390 });
  await page.screenshot({
    path: info.outputPath("04-game-landscape.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  for (const direction of ["up", "down", "left", "right"]) {
    const box = await page.locator(`[data-dir="${direction}"]`).boundingBox();
    expect(box.y + box.height).toBeLessThanOrEqual(390);
  }
  expect(errors).toEqual([]);
  await context.close();
});

test("blocked storage and reduced motion still allow a full localized picnic", async ({
  page,
}) => {
  await page.clock.install();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("body")).toHaveClass(/reduced-motion/);
  await page
    .getByRole("button", { name: "Switch to Traditional Chinese" })
    .click();
  await page.getByRole("button", { name: "開動囉" }).click();
  await eatEverything(page);
  await page.clock.runFor(3000);
  await expect(
    page.getByRole("heading", { name: "怎麼變這麼大！" }),
  ).toBeVisible();
  await expect(page.locator(".storage-warning")).toContainText(
    "目前無法儲存紀錄",
  );
  await expect(page.locator(".record-list li")).toHaveCount(1);
  await page.getByRole("button", { name: "再吃一小口" }).click();
  await eatEverything(page);
  await page.clock.runFor(3000);
  await expect(page.locator(".record-list li")).toHaveCount(2);
});

test("visibility change pauses automatically until explicitly resumed", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s eat" }).click();
  await move(page, ["ArrowRight"], 350);
  const before = await page.locator("#timer").textContent();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(5000);
  await page.evaluate(() => {
    delete document.hidden;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("heading", { name: "A little breather." }),
  ).toBeVisible();
  await expect(page.locator("#timer")).toHaveText(before);
  await page.getByRole("button", { name: "Keep munching" }).click();
  await page.clock.runFor(300);
  expect(await page.locator("#timer").textContent()).not.toBe(before);
});

test("production build works at a repository subpath and plays offline after loading", async ({
  page,
  context,
}) => {
  await page.clock.install();
  const failed = [];
  page.on("requestfailed", (req) => failed.push(req.url()));
  await page.goto("/dist/");
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);
  await page.getByRole("button", { name: "Let’s eat" }).click();
  await eatEverything(page);
  await page.clock.runFor(3000);
  await expect(
    page.getByRole("heading", { name: "Well, that escalated." }),
  ).toBeVisible();
  await expect(page.locator(".modal-friend")).toBeVisible();
  expect(
    await page
      .locator(".modal-friend")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
  ).toBe(true);
  expect(failed).toEqual([]);
});

test("synthesized munches and final chord produce soft non-clipping audio", async ({
  page,
}) => {
  await page.goto("/");
  const stats = await page.evaluate(async () => {
    const { PicnicAudio } = await import("./src/audio.js");
    const render = async (count) => {
      const sound = new PicnicAudio();
      sound.ctx = new OfflineAudioContext(1, 44100 * 3, 44100);
      sound.master = sound.ctx.createGain();
      sound.master.gain.value = 0.45;
      sound.master.connect(sound.ctx.destination);
      sound.eat(count);
      sound.boom(0.5);
      const buffer = await sound.ctx.startRendering();
      const samples = buffer.getChannelData(0);
      let peak = 0,
        power = 0;
      for (const sample of samples) {
        peak = Math.max(peak, Math.abs(sample));
        power += sample * sample;
      }
      return { peak, rms: Math.sqrt(power / samples.length) };
    };
    return { first: await render(1), fifth: await render(5) };
  });
  for (const sound of Object.values(stats)) {
    expect(sound.peak).toBeGreaterThan(0.01);
    expect(sound.peak).toBeLessThan(0.5);
    expect(sound.rms).toBeGreaterThan(0.001);
    expect(sound.rms).toBeLessThan(0.1);
  }
});

test("compact phone keeps all controls visible and prevents page scrolling", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 320, height: 568 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s eat" }).tap();
  for (const direction of ["up", "down", "left", "right"]) {
    const box = await page.locator(`[data-dir="${direction}"]`).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44);
    expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(568);
  }
  await expect(page.locator('footer [data-action="mute"]')).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, 100));
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await context.close();
});
