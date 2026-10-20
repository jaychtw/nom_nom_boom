import { WIDTH, HEIGHT } from "./core.js";
export const palette = {
  ink: "#663f38",
  peach: "#f5b497",
  pink: "#e68a80",
  leaf: "#789374",
  cream: "#fff8eb",
  ground: "#dce5bc",
};
const { ink } = palette;
function ellipse(c, x, y, rx, ry, fill, stroke, width = 1) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke();
  }
}
function path(c, d, fill, stroke = ink, width = 0.04) {
  const p = new Path2D(d);
  if (fill) {
    c.fillStyle = fill;
    c.fill(p);
  }
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke(p);
  }
}

// All sprites are original vector drawings. The same little friend at every size.
export function friend(
  c,
  x,
  y,
  radius,
  {
    mouth = 0,
    time = 0,
    motion = true,
    pulse = 0,
    finale = false,
    faceWidth = 1,
    faceHeight = 1,
  } = {},
) {
  c.save();
  c.translate(x, y);
  const breathe = motion ? Math.sin(time * 2.1) * 0.012 : 0;
  c.scale(
    radius * (1 - breathe + pulse * 0.055),
    radius * (1 + breathe - pulse * 0.045),
  );
  c.lineCap = "round";
  c.lineJoin = "round";
  path(c, "M-.65 -.58 Q-1.06 -1.23 -.72 -1.12 Q-.4 -1.03 -.32 -.73", "#eea18b");
  path(c, "M.38 -.72 Q.7 -1.23 .87 -1.11 Q1 -1 .71 -.53", "#eea18b");
  path(
    c,
    "M-.48 -.72 Q-.03 -.99 .49 -.7 Q1 -.44 1 .12 Q1.07 .85 .51 .96 Q0 1.08 -.57 .94 Q-1 .84 -1 .19 Q-1 -.4 -.48 -.72Z",
    palette.peach,
  );
  path(c, "M-.15 -.82 Q-.35 -1.23 -.08 -1.35 Q.23 -1.14 .08 -.85", "#90a97c");
  path(c, "M-.03 -1.19 L-.02 -.84", null, "#5f805c", 0.027);
  path(c, "M-.75 .78 Q-1.06 1.03 -.69 1.05 L-.39 1.01", palette.peach);
  path(c, "M.44 1 Q.89 1.18 .84 .83", palette.peach);
  ellipse(c, 0, 0.68, 0.42, 0.21, "#fad2b0");
  c.save();
  c.scale(faceWidth, faceHeight);
  ellipse(c, -0.56, 0.19, 0.18, 0.085, "#e99a89");
  ellipse(c, 0.56, 0.19, 0.18, 0.085, "#e99a89");
  if (finale) {
    path(
      c,
      "M-.61 -.02 Q-.45 -.23 -.29 -.02 M.29 -.02 Q.45 -.23 .61 -.02",
      null,
      ink,
      0.045,
    );
  } else {
    path(
      c,
      "M-.66 -.09 Q-.49 .035 -.3 -.09 M.3 -.09 Q.49 .035 .66 -.09",
      null,
      ink,
      0.045,
    );
    path(c, "M-.64 -.15 L-.34 -.15 M.34 -.15 L.64 -.15", null, ink, 0.028);
  }
  if (mouth > 0.03 || finale) {
    const open = finale ? 0.15 : 0.065 + mouth * 0.2;
    ellipse(c, 0, 0.25 + open * 0.2, 0.12 + mouth * 0.09, open, ink);
    ellipse(
      c,
      0,
      0.25 + open * 0.75,
      0.075 + mouth * 0.06,
      open * 0.23,
      "#f0a5a1",
    );
  } else path(c, "M-.1 .22 Q0 .33 .1 .22", null, ink, 0.035);
  c.restore();
  // Tiny relaxed arms, always on the same body.
  path(
    c,
    "M-.83 .36 Q-.69 .48 -.63 .37 M.83 .36 Q.69 .48 .63 .37",
    null,
    "#bc796b",
    0.03,
  );
  c.restore();
}

export function dumpling(c, x, y, radius = 16, time = 0, motion = true) {
  c.save();
  c.translate(x, y + (motion ? Math.sin(time * 5) * 1.5 : 0));
  c.scale(radius, radius);
  c.lineCap = "round";
  c.lineJoin = "round";
  ellipse(c, 0, 1.03, 0.79, 0.18, "#71826028");
  path(
    c,
    "M-.5 .79 Q-.9 1.15 -.42 1.08 M.38 .85 Q.88 1.15 .67 .78",
    "#fff5d9",
    ink,
    0.08,
  );
  path(
    c,
    "M-.95 .23 Q-1 -.21 -.45 -.61 Q-.1 -.85 .03 -1.02 Q.15 -.7 .54 -.55 Q1 -.2 .95 .36 Q.96 .94 0 .96 Q-.94 .94 -.95 .23Z",
    "#fff7dc",
    ink,
    0.075,
  );
  path(
    c,
    "M-.31 -.51 Q-.05 -.56 .03 -1.02 Q.1 -.62 .32 -.5",
    null,
    "#d3b891",
    0.055,
  );
  ellipse(c, -0.34, 0.22, 0.055, 0.09, ink);
  ellipse(c, 0.34, 0.22, 0.055, 0.09, ink);
  ellipse(c, -0.57, 0.38, 0.13, 0.065, "#f1b7a0");
  ellipse(c, 0.57, 0.38, 0.13, 0.065, "#f1b7a0");
  path(c, "M-.09 .42 Q0 .5 .09 .42", null, ink, 0.045);
  c.restore();
}

export function flower(c, x, y, size, color = "#fff6df") {
  c.save();
  c.translate(x, y);
  c.scale(size, size);
  for (let i = 0; i < 5; i++) {
    c.rotate((Math.PI * 2) / 5);
    ellipse(c, 0, -0.6, 0.33, 0.45, color);
  }
  ellipse(c, 0, 0, 0.29, 0.29, "#d59c55");
  c.restore();
}
function bush(c, x, y, s) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  path(
    c,
    "M-50 17 Q-65 -10 -38 -15 Q-36 -55 -5 -34 Q17 -62 31 -26 Q66 -34 59 4 Q69 24 43 25 L-36 25Z",
    "#a8bb89",
    "#8da575",
    2,
  );
  path(c, "M-23 9L-30 -4M0 0L7 -13M28 10L34 -2", null, "#809b6d", 2);
  c.restore();
}
export function garden(c, width = WIDTH, height = HEIGHT) {
  c.save();
  c.scale(width / WIDTH, height / HEIGHT);
  c.fillStyle = "#dfe6c4";
  c.fillRect(0, 0, WIDTH, HEIGHT);
  c.strokeStyle = "#d3dcb7";
  c.lineWidth = 54;
  c.beginPath();
  c.moveTo(-40, 340);
  c.bezierCurveTo(230, 500, 450, 40, 1000, 240);
  c.stroke();
  c.strokeStyle = "#e9edcf";
  c.lineWidth = 28;
  c.stroke();
  // Sunny garden fence, kept outside the playable space.
  c.strokeStyle = "#b6c79c";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, 28);
  c.lineTo(960, 28);
  c.moveTo(0, 40);
  c.lineTo(960, 40);
  c.stroke();
  for (let x = 18; x < 960; x += 36) {
    c.fillStyle = "#c6d3ac";
    c.beginPath();
    c.roundRect(x, 8, 7, 45, 4);
    c.fill();
  }
  for (let i = 0; i < 80; i++) {
    const x = (i * 137 + 49) % WIDTH,
      y = (i * 83 + 63) % HEIGHT;
    c.strokeStyle = "#b9cb9b";
    c.lineWidth = 1.6;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(x - 3, y + 2);
    c.lineTo(x - 5, y - 3);
    c.moveTo(x, y + 2);
    c.lineTo(x + 2, y - 5);
    c.stroke();
  }
  bush(c, 14, 42, 1.2);
  bush(c, 930, 508, 1.3);
  bush(c, 885, 24, 0.9);
  bush(c, 70, 530, 0.9);
  for (const [x, y, s, color] of [
    [52, 100, 9],
    [910, 130, 8, "#e9b4a2"],
    [210, 493, 8],
    [766, 50, 7],
    [24, 445, 7, "#e9b4a2"],
    [924, 367, 7],
    [640, 510, 8, "#e9b4a2"],
    [285, 46, 8],
  ])
    flower(c, x, y, s, color);
  // A little folded picnic blanket; scenery never blocks a snack.
  c.save();
  c.translate(860, 438);
  c.rotate(-0.14);
  c.fillStyle = "#eed3b3";
  c.fillRect(-30, -22, 60, 44);
  c.fillStyle = "#e4b99f";
  for (let x = -30; x < 30; x += 20) c.fillRect(x, -22, 10, 44);
  c.globalAlpha = 0.6;
  for (let y = -22; y < 22; y += 20) c.fillRect(-30, y, 60, 10);
  c.restore();
  // Sleepy mushrooms.
  for (const [x, y] of [
    [95, 63],
    [793, 503],
  ]) {
    c.fillStyle = "#f7e4b6";
    c.fillRect(x - 3, y, 6, 12);
    c.beginPath();
    c.ellipse(x, y, 12, 9, 0, Math.PI, 0);
    c.fillStyle = "#d99781";
    c.fill();
    ellipse(c, x - 5, y - 4, 2, 2, "#fff0d4");
    ellipse(c, x + 4, y - 6, 2, 2, "#fff0d4");
  }
  c.restore();
}
export function drawTitle(canvas, reduced) {
  const c = canvas.getContext("2d");
  c.clearRect(0, 0, 700, 650);
  c.save();
  c.translate(40, 67);
  c.rotate(-0.045);
  c.shadowColor = "#6a593518";
  c.shadowBlur = 0;
  c.shadowOffsetX = 8;
  c.shadowOffsetY = 12;
  c.beginPath();
  c.roundRect(0, 0, 625, 510, 95);
  c.fillStyle = "#dfe6c4";
  c.fill();
  c.shadowColor = "transparent";
  c.clip();
  garden(c, 625, 510);
  // A sunlit corner and the afternoon's five unsuspecting guests.
  ellipse(c, 536, 63, 34, 34, "#f3d897");
  for (const [x, y, r] of [
    [100, 125, 25],
    [506, 163, 23],
    [528, 373, 25],
    [132, 405, 23],
    [348, 78, 22],
  ])
    dumpling(c, x, y, r, 0, !reduced);
  ellipse(c, 316, 395, 127, 22, "#8d9c7230");
  friend(c, 316, 274, 125, { time: 0, motion: false });
  flower(c, 450, 462, 15);
  flower(c, 73, 277, 12, "#e8ab99");
  c.restore();
  c.save();
  c.translate(601, 546);
  c.rotate(0.18);
  flower(c, 0, 0, 30, "#e8ac98");
  c.restore();
  c.strokeStyle = "#8ba376";
  c.lineWidth = 3;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(25, 536);
  c.quadraticCurveTo(50, 558, 71, 540);
  c.moveTo(24, 523);
  c.lineTo(12, 514);
  c.moveTo(11, 540);
  c.lineTo(1, 544);
  c.stroke();
}
