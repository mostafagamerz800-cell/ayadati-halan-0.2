import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { chromium } from "playwright";
process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), "../.."));
const root = resolve("."),
  base = "/ayadati-halan-0.2/",
  origin = "http://127.0.0.1:4174",
  output = process.env.PILOT_QA_OUTPUT || "/downloads/clinic-portals";
const history = JSON.parse(
  readFileSync("scripts/pages-assets-history.json", "utf8"),
);
const previous = execFileSync("git", [
  "show",
  "a8aacb78e1df8b357c3d51e4453bc76bdd108161:index.html",
]);
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};
const server = createServer((req, res) => {
  const pathname = new URL(req.url, origin).pathname;
  if (!pathname.startsWith(base)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const relative =
    decodeURIComponent(pathname.slice(base.length)) || "index.html";
  const file = join(root, relative);
  if (
    !file.startsWith(root + "/") ||
    (!existsSync(file) && relative !== "previous.html")
  ) {
    res.writeHead(404);
    res.end();
    return;
  }
  let bytes = relative === "previous.html" ? previous : readFileSync(file);
  const headers = {
    "Content-Type": types[extname(file)] || "application/octet-stream",
    "Cache-Control": "no-store",
  };
  if (
    /\.(html|js|css)$/.test(file) &&
    /gzip/.test(req.headers["accept-encoding"] || "")
  ) {
    bytes = gzipSync(bytes);
    headers["Content-Encoding"] = "gzip";
  }
  res.writeHead(200, headers);
  res.end(bytes);
});
await new Promise((r) => server.listen(4174, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});
let checks = 0;
const external = [],
  errors = [];
function check(value, label) {
  assert.ok(value, label);
  console.log("PASS", ++checks, label);
}
async function page() {
  const c = await browser.newContext({
    viewport: { width: 390, height: 844 },
    locale: "ar-EG",
  });
  await c.route("**/*", (route) => {
    const u = route.request().url();
    if (!u.startsWith("data:") && new URL(u).hostname !== "127.0.0.1") {
      external.push(u);
      return route.abort();
    }
    return route.continue();
  });
  const p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  return p;
}
async function settle(p) {
  await p.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().endTime !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  );
  await p.evaluate(() => document.fonts.ready);
}
async function gateway(p) {
  await p
    .getByRole("button", { name: "دخول بوابة المريض", exact: true })
    .waitFor();
  await settle(p);
}
try {
  for (const filename of new Set([
    ...history.current,
    ...history.baseline.flat(),
  ]))
    check(
      (await fetch(origin + base + "assets/" + filename)).status === 200,
      "candidate/retained asset available " + filename,
    );
  const js = history.current
    .filter((x) => x.endsWith(".js"))
    .map((x) => readFileSync("assets/" + x, "utf8"))
    .join("\n");
  for (const marker of [
    "demo-api-key",
    "demo-ayadati-secure",
    "مريض اختبار أول",
    "Synthetic Offline",
  ])
    check(
      !js.includes(marker),
      "production build excludes local fixture marker " + marker,
    );
  const p = await page();
  await p.goto(origin + base);
  await gateway(p);
  check(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "built mobile gateway has no overflow",
  );
  await p.screenshot({
    path: join(output, "built-gateway-mobile.png"),
    fullPage: true,
  });
  await p
    .getByRole("button", { name: "دخول بوابة الدكتور", exact: true })
    .click();
  await p.locator("#auth-email").waitFor();
  await settle(p);
  const authHeader = await p.locator(".auth-topbar").boundingBox(),
    theme = await p.locator(".auth-topbar .theme-toggle").boundingBox();
  check(
    !!theme &&
      theme.y >= authHeader.y &&
      theme.y + theme.height <= authHeader.y + authHeader.height,
    "built login theme control stays clear of notice and form",
  );
  check(
    (await p
      .getByRole("button", { name: "حساب جديد", exact: true })
      .count()) === 0,
    "built doctor entry remains login-only",
  );
  await p.screenshot({
    path: join(output, "built-doctor-login-mobile.png"),
    fullPage: true,
  });
  for (const kind of ["entry", "css"]) {
    const q = await page();
    let blocked = true;
    await q.route(
      kind === "entry" ? "**/assets/index-*.js" : "**/assets/index-*.css",
      (route) => (blocked ? route.abort() : route.continue()),
    );
    await q.goto(origin + base, { waitUntil: "commit" });
    await q.locator("#boot-retry").waitFor({ state: "visible" });
    check(
      (await q.locator("#boot-title").innerText()) === "تعذّر فتح الصفحة",
      "built " + kind + " failure shows recovery UI",
    );
    blocked = false;
    await q.locator("#boot-retry").click();
    await gateway(q);
    check(true, "built " + kind + " retry recovers");
  }
  const old = await page();
  await old.goto(origin + base + "previous.html");
  await old.getByRole("button", { name: "حساب جديد", exact: true }).waitFor();
  check(true, "previous published HTML still loads retained secure assets");
  const timings = {};
  for (const revision of ["candidate", "previous"]) {
    const slow = await page(),
      cdp = await slow.context().newCDPSession(slow);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 400,
      downloadThroughput: 50000,
      uploadThroughput: 25000,
    });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const start = Date.now();
    await slow.goto(
      origin + base + (revision === "previous" ? "previous.html" : ""),
      { waitUntil: "commit" },
    );
    await slow.locator("#clinic-boot").waitFor({ state: "visible" });
    const startup = Date.now() - start;
    if (revision === "candidate")
      await slow.screenshot({ path: join(output, "built-slow-startup.png") });
    await slow
      .getByRole("button", {
        name: revision === "candidate" ? "دخول بوابة المريض" : "حساب جديد",
        exact: true,
      })
      .waitFor();
    if (revision === "previous")
      await slow.waitForFunction(
        () =>
          getComputedStyle(document.querySelector(".auth-panel")).opacity ===
          "1",
      );
    const interfaceVisible = Date.now() - start;
    await settle(slow);
    timings[revision] = {
      startup,
      interfaceVisible,
      fontsReady: Date.now() - start,
    };
    if (revision === "candidate")
      await slow.screenshot({
        path: join(output, "built-slow-gateway.png"),
        fullPage: true,
      });
    check(true, "slow " + revision + " opens after visible startup");
  }
  console.log("SIMULATED SLOW MS", JSON.stringify(timings));
  check(external.length === 0, "built checks make zero external requests");
  check(errors.length === 0, "built checks have no browser runtime errors");
  console.log("ALL BUILT CHECKS", checks, "PASSED");
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
