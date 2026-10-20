import {
  Game,
  WIDTH,
  HEIGHT,
  STEP,
  formatTime,
  normalizeRecords,
  readRecords,
  saveRecord,
  PREFS_KEY,
} from "./core.js";
import { messages } from "./i18n.js";
import { friend, dumpling, garden, drawTitle, flower } from "./art.js";
import { PicnicAudio } from "./audio.js";

const $ = (selector) => document.querySelector(selector);
const arena = $("#arena"),
  ctx = arena.getContext("2d");
const finaleCanvas = $("#finale-canvas"),
  finalCtx = finaleCanvas.getContext("2d");
const dialog = $("#modal");
const audio = new PicnicAudio();
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = null;
}
let preferences = {};
try {
  preferences = JSON.parse(storage?.getItem(PREFS_KEY)) || {};
} catch {
  /* Default preferences. */
}
if (
  !preferences ||
  typeof preferences !== "object" ||
  Array.isArray(preferences)
)
  preferences = {};
let language = ["en", "zh-TW"].includes(preferences.language)
  ? preferences.language
  : navigator.language.startsWith("zh")
    ? "zh-TW"
    : "en";
const systemMotion = matchMedia("(prefers-reduced-motion: reduce)");
let reduced =
  typeof preferences.reduced === "boolean"
    ? preferences.reduced
    : systemMotion.matches;
let muted = preferences.muted === true;
let records = readRecords(storage),
  storageAvailable = true;
let game = new Game(),
  screen = "title",
  modalType = null,
  pendingAction = null;
let lastFrame = null,
  accumulator = 0,
  visualTime = 0,
  finaleAge = 0,
  pulseQueue = [],
  particles = [];
let lastRecordDate = null,
  focusReturn = null;
const keys = new Set(),
  pointers = new Map();
const movementKeys = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};
const t = (key) => messages[language][key];
const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const bg = document.createElement("canvas");
bg.width = WIDTH;
bg.height = HEIGHT;
garden(bg.getContext("2d"));
$("#snack-dots").innerHTML = "<i></i>".repeat(5);
function persistPreferences() {
  preferences = { language, reduced, muted };
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify(preferences));
  } catch {
    /* Preferences are optional. */
  }
}
document.body.classList.toggle("touch-device", navigator.maxTouchPoints > 0);
function localize() {
  document.documentElement.lang = language;
  document.title =
    language === "en"
      ? "Nom Nom BOOM! · A very big appetite"
      : "Nom Nom BOOM! 吃吃碰！";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-action="language"]').forEach((el) => {
    el.textContent = t("language");
    el.setAttribute("aria-label", t("languageLabel"));
  });
  document.querySelectorAll('[data-action="mute"]').forEach((el) => {
    el.textContent = `${muted ? "♪̸" : "♫"}  ${t(muted ? "soundOff" : "soundOn")}`;
    el.setAttribute("aria-pressed", String(muted));
  });
  document.querySelectorAll('[data-action="motion"]').forEach((el) => {
    el.textContent = `≈  ${t(reduced ? "motionOff" : "motionOn")}`;
    el.setAttribute("aria-pressed", String(reduced));
  });
  document
    .querySelectorAll("[data-dir]")
    .forEach((el) => el.setAttribute("aria-label", t(el.dataset.dir)));
  $(".dpad").setAttribute("aria-label", t("touch"));
  arena.setAttribute("aria-label", t("arena"));
  document.body.classList.toggle("reduced-motion", reduced);
  updateHUD();
  drawTitle($("#title-art"), reduced);
}
function clearInput() {
  keys.clear();
  pointers.clear();
  document
    .querySelectorAll("[data-dir]")
    .forEach((el) => el.classList.remove("pressed"));
}
function inputVector() {
  const active = new Set([...keys].map((key) => movementKeys[key]));
  for (const direction of pointers.values()) active.add(direction);
  return {
    x: Number(active.has("right")) - Number(active.has("left")),
    y: Number(active.has("down")) - Number(active.has("up")),
  };
}
function updateHUD() {
  $("#timer").innerHTML =
    `${formatTime(game.elapsed)}<span>${escapeHTML(t("seconds"))}</span>`;
  $("#eaten-count").textContent = game.eaten;
  [...$("#snack-dots").children].forEach((el, i) =>
    el.classList.toggle("eaten", i < game.eaten),
  );
  $("#ready-message").hidden = game.started || screen !== "game";
}
function closeModal() {
  if (dialog.open) dialog.close();
  modalType = null;
}
function startRun() {
  closeModal();
  clearInput();
  game = new Game();
  screen = "game";
  accumulator = 0;
  lastFrame = null;
  pulseQueue = [];
  particles = [];
  finaleAge = 0;
  lastRecordDate = null;
  $("#announcer").textContent = "";
  $("#title-screen").hidden = true;
  $("#game-screen").hidden = false;
  $("#finale").hidden = true;
  $("#finale").classList.remove("show-caption");
  document.body.classList.add("playing");
  window.scrollTo(0, 0);
  audio.unlock();
  audio.startMusic();
  updateHUD();
  arena.focus({ preventScroll: true });
}
function returnTitle() {
  closeModal();
  clearInput();
  audio.stopMusic();
  screen = "title";
  $("#title-screen").hidden = false;
  $("#game-screen").hidden = true;
  $("#finale").hidden = true;
  document.body.classList.remove("playing");
  window.scrollTo(0, 0);
  $('[data-action="play"]').focus({ preventScroll: true });
}
function pause() {
  if (screen !== "game" || game.complete) return;
  game.setPaused(true);
  clearInput();
  accumulator = 0;
  lastFrame = null;
  audio.stopMusic();
  showModal("pause");
}
function resume() {
  closeModal();
  game.setPaused(false);
  clearInput();
  lastFrame = null;
  accumulator = 0;
  audio.unlock();
  audio.startMusic();
  arena.focus({ preventScroll: true });
}
function discard(action) {
  if (game.started && !game.complete) {
    pendingAction = action;
    showModal("confirm");
  } else if (action === "restart") startRun();
  else returnTitle();
}
const button = (action, label, className = "secondary") =>
  `<button class="${className}" data-action="${action}">${escapeHTML(t(label))}</button>`;
function journalHTML() {
  if (!records.length) return `<p class="empty">${escapeHTML(t("empty"))}</p>`;
  const dateFormat = new Intl.DateTimeFormat(language, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `<ol class="record-list">${records.map((r, i) => `<li class="${r.date === lastRecordDate ? "current" : ""}"><span class="record-number">${String(i + 1).padStart(2, "0")}</span><span>${escapeHTML(t("you"))}</span><time datetime="${escapeHTML(r.date)}">${escapeHTML(dateFormat.format(new Date(r.date)))}</time><strong>${formatTime(r.time)} ${escapeHTML(t("seconds"))}</strong></li>`).join("")}</ol>`;
}
function showModal(type) {
  const alreadyOpen = dialog.open;
  if (!alreadyOpen) focusReturn = document.activeElement;
  modalType = type;
  let html = "";
  if (type === "pause") {
    html = `<div class="centered"><img class="modal-friend" src="./assets/friend.svg" alt=""><h2 class="modal-title" id="modal-heading">${t("paused")}</h2><p class="modal-copy">${t("pausedText")}</p></div><div class="modal-actions">${button("resume", "resume", "primary")}${button("restart", "restart")}${button("title", "title", "text-button")}</div><div class="modal-settings">${button("language", "language", "pill")}${button("mute", muted ? "soundOff" : "soundOn", "setting-button")}${button("motion", reduced ? "motionOff" : "motionOn", "setting-button")}</div>`;
  } else if (type === "confirm") {
    html = `<h2 class="modal-title" id="modal-heading">${t(pendingAction === "restart" ? "confirmRestart" : "confirmTitle")}</h2><p class="modal-copy">${t("confirmText")}</p><div class="modal-actions">${button("cancel-discard", "cancel", "primary")}${button("confirm-discard", "confirm")}</div>`;
  } else if (type === "records") {
    html = `<div class="modal-top"><p class="eyebrow">NOM NOM BOOM!</p><button class="close-button" data-action="close" aria-label="${t("close")}">×</button></div><h2 class="modal-title" id="modal-heading">${t("journal")}</h2><p class="modal-copy">${t("journalText")}</p>${journalHTML()}${button("close", "close", "secondary")}`;
  } else if (type === "results") {
    html = `<div class="centered"><img class="modal-friend" src="./assets/friend.svg" alt=""><h2 class="modal-title" id="modal-heading">${t("results")}</h2><p class="modal-copy">${t("resultText")}</p><div class="result-label">${t("resultTime")}</div><div class="result-time">${formatTime(game.elapsed)}<span>${t("seconds")}</span></div><p class="result-eaten">${t("allEaten")}</p></div><div class="journal-heading">${t("journal")}</div>${journalHTML()}${!storageAvailable ? `<p class="storage-warning">${t("storage")}</p>` : ""}<div class="modal-actions">${button("play", "again", "primary")}${button("title", "title", "text-button")}</div><div class="modal-settings">${button("language", "language", "pill")}</div>`;
  }
  $("#modal-content").innerHTML = html;
  localize();
  if (!alreadyOpen) dialog.showModal();
  const first =
    type === "results"
      ? dialog.querySelector('[data-action="play"]')
      : dialog.querySelector("button");
  first?.focus({ preventScroll: true });
}
function finish(meals) {
  screen = "finale";
  finaleAge = 0;
  clearInput();
  audio.stopMusic();
  lastRecordDate = new Date().toISOString();
  const result = saveRecord(storage, game.elapsed, lastRecordDate);
  storageAvailable = result.persisted;
  records = result.persisted
    ? result.records
    : normalizeRecords([
        ...records,
        { time: game.elapsed, date: lastRecordDate },
      ]);
  $("#finale").hidden = false;
  audio.boom(meals.length * 0.1);
  $("#announcer").textContent = t("completeAnnouncement");
  updateHUD();
}
function onMeals(meals) {
  for (const [i, meal] of meals.entries()) {
    pulseQueue.push({ start: visualTime + i * 0.1, count: meal.count });
    audio.eat(meal.count, i * 0.1);
    if (!reduced)
      for (let j = 0; j < 9; j++)
        particles.push({
          x: meal.x,
          y: meal.y,
          start: visualTime,
          angle: (j / 9) * Math.PI * 2,
          color: j % 2 ? "#fff6d6" : "#e3a387",
        });
  }
  if (meals.length)
    $("#announcer").textContent = `${t("meal")} ${game.eaten} / 5`;
  if (game.complete) finish(meals);
}
function drawGame() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.drawImage(bg, 0, 0);
  for (const e of game.enemies)
    if (!e.eaten)
      dumpling(ctx, e.x, e.y, 16, visualTime + e.id, !reduced && !game.paused);
  ctx.fillStyle = "#6c7e5824";
  ctx.beginPath();
  ctx.ellipse(
    game.player.x,
    game.player.y + game.radius * 0.84,
    game.radius * 0.85,
    game.radius * 0.15,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  const active = pulseQueue.find(
    (p) => visualTime >= p.start && visualTime - p.start < 0.18,
  );
  const pulse =
    active && !reduced
      ? Math.sin(((visualTime - active.start) / 0.18) * Math.PI)
      : 0;
  const mouth = active ? 1 : 0;
  friend(ctx, game.player.x, game.player.y, game.radius, {
    mouth,
    time: visualTime,
    motion: !reduced && !game.paused,
    pulse,
  });
  if (!reduced)
    for (const p of particles) {
      const age = visualTime - p.start;
      if (age < 0.55) {
        ctx.globalAlpha = Math.max(0, 1 - age / 0.55);
        flower(
          ctx,
          p.x + Math.cos(p.angle) * age * 105,
          p.y + Math.sin(p.angle) * age * 105 - 20 * age,
          4 * (1 - age),
          p.color,
        );
      }
    }
  ctx.globalAlpha = 1;
  particles = particles.filter((p) => visualTime - p.start < 0.55);
  pulseQueue = pulseQueue.filter((p) => visualTime - p.start < 0.2);
}
function drawFinale() {
  const w = innerWidth,
    h = innerHeight,
    dpr = Math.min(devicePixelRatio || 1, 2);
  if (
    finaleCanvas.width !== Math.round(w * dpr) ||
    finaleCanvas.height !== Math.round(h * dpr)
  ) {
    finaleCanvas.width = Math.round(w * dpr);
    finaleCanvas.height = Math.round(h * dpr);
  }
  finalCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  finalCtx.clearRect(0, 0, w, h);
  finalCtx.fillStyle = "#dfe6c4";
  finalCtx.fillRect(0, 0, w, h);
  const rect = arena.getBoundingClientRect();
  const startX = rect.left + (game.player.x / WIDTH) * rect.width;
  const startY = rect.top + (game.player.y / HEIGHT) * rect.height;
  const progress = Math.min(1, finaleAge / (reduced ? 0.18 : 0.85));
  const ease = 1 - (1 - progress) ** 3;
  // Keep ×32 as the minimum; then center the face and overwhelm the actual viewport.
  const initialRadius = (game.radius / WIDTH) * rect.width;
  const targetRadius = Math.max(initialRadius, w * 1.05, h * 1.5);
  const radius = initialRadius + (targetRadius - initialRadius) * ease;
  const wobble = reduced
    ? 0
    : Math.sin(finaleAge * 13) * Math.exp(-finaleAge * 3) * 8;
  const pulse = reduced
    ? 0
    : pulseQueue.reduce((sum, p) => {
        const age = visualTime - p.start;
        return (
          sum + (age >= 0 && age < 0.18 ? Math.sin((age / 0.18) * Math.PI) : 0)
        );
      }, 0);
  friend(
    finalCtx,
    startX + (w / 2 - startX) * ease + wobble,
    startY + (h * 0.43 - startY) * ease,
    radius,
    {
      finale: true,
      mouth: 0.7,
      motion: false,
      pulse,
      faceWidth: Math.min(1, w / (radius * 1.25)),
      faceHeight: Math.min(1, w / (radius * 1.25)),
    },
  );
  $("#finale").classList.toggle("show-caption", finaleAge > 1.15);
}
function frame(now) {
  const delta = lastFrame === null ? 0 : (now - lastFrame) / 1000;
  lastFrame = now;
  if (!document.hidden) {
    if (!game.paused) visualTime += delta;
    if (screen === "game") {
      if (!game.paused) {
        accumulator += delta;
        while (accumulator >= STEP && screen === "game") {
          const meals = game.step(inputVector());
          accumulator -= STEP;
          if (meals.length) onMeals(meals);
        }
      }
      drawGame();
      updateHUD();
    } else if (screen === "finale") {
      finaleAge += delta;
      drawFinale();
      if (finaleAge >= 2.65) {
        screen = "results";
        showModal("results");
        // Keep the gigantic friendly face behind the results.
      }
    } else if (screen === "results") drawFinale();
  }
  requestAnimationFrame(frame);
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  switch (action) {
    case "play":
      startRun();
      break;
    case "pause":
      pause();
      break;
    case "resume":
      resume();
      break;
    case "restart":
      discard("restart");
      break;
    case "title":
      if (screen === "game") discard("title");
      else returnTitle();
      break;
    case "confirm-discard":
      if (pendingAction === "restart") startRun();
      else returnTitle();
      pendingAction = null;
      break;
    case "cancel-discard":
      pendingAction = null;
      showModal("pause");
      break;
    case "records":
      showModal("records");
      break;
    case "close":
      closeModal();
      focusReturn?.focus({ preventScroll: true });
      break;
    case "language":
      language = language === "en" ? "zh-TW" : "en";
      persistPreferences();
      if (modalType) showModal(modalType);
      else localize();
      break;
    case "mute":
      muted = !muted;
      audio.unlock();
      audio.setMuted(muted);
      persistPreferences();
      localize();
      break;
    case "motion":
      reduced = !reduced;
      persistPreferences();
      localize();
      break;
  }
});
$(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  if (screen === "game") {
    pause();
    discard("title");
  } else if (screen !== "finale") returnTitle();
});
document.addEventListener("keydown", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (screen === "game" && (key === "Escape" || key === "p")) {
    event.preventDefault();
    if (event.repeat) return;
    if (modalType === "confirm") {
      pendingAction = null;
      showModal("pause");
    } else if (game.paused) resume();
    else pause();
    return;
  }
  if (screen === "game" && !game.paused && movementKeys[key]) {
    event.preventDefault();
    keys.add(key);
    return;
  }
  if (
    (key === "Enter" || key === " ") &&
    !event.repeat &&
    !event.target.closest("button,a")
  ) {
    if ((screen === "title" && !dialog.open) || screen === "results") {
      event.preventDefault();
      startRun();
    }
  }
});
document.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});
dialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  if (modalType === "confirm") {
    pendingAction = null;
    showModal("pause");
  } else if (modalType === "pause") resume();
  else if (modalType === "records") {
    closeModal();
    focusReturn?.focus({ preventScroll: true });
  }
});
for (const button of document.querySelectorAll("[data-dir]")) {
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (screen !== "game" || game.paused) return;
    audio.unlock();
    button.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, button.dataset.dir);
    button.classList.add("pressed");
  });
  const release = (event) => {
    pointers.delete(event.pointerId);
    button.classList.toggle(
      "pressed",
      [...pointers.values()].includes(button.dataset.dir),
    );
  };
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
  // The pad is also usable with keyboard focus and assistive switch activation.
  button.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      pointers.set("keyboard", button.dataset.dir);
      button.classList.add("pressed");
    }
  });
  button.addEventListener("keyup", (event) => {
    if (event.key === " " || event.key === "Enter") {
      pointers.delete("keyboard");
      button.classList.remove("pressed");
    }
  });
}
function autoPause() {
  clearInput();
  lastFrame = null;
  if (screen === "game" && !game.paused) pause();
}
document.addEventListener("visibilitychange", () => {
  lastFrame = null;
  if (document.hidden) autoPause();
});
window.addEventListener("blur", autoPause);
window.addEventListener("pagehide", autoPause);
systemMotion.addEventListener("change", (event) => {
  if (typeof preferences.reduced !== "boolean") {
    reduced = event.matches;
    localize();
  }
});
audio.setMuted(muted);
localize();
drawGame();
requestAnimationFrame(frame);
