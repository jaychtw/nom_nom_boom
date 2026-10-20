import { cp, mkdir, rm } from "node:fs/promises";
await rm("dist", { recursive: true, force: true });
await mkdir("dist");
for (const file of ["index.html", "style.css", "src", "assets"])
  await cp(file, `dist/${file}`, { recursive: true });
console.log("Static game built in dist/ — no runtime dependencies.");
