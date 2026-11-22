import { chromium } from "playwright";
import {
  initializeTestEnvironment,
  assertFails,
} from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";
import { readFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
const output = process.env.PILOT_QA_OUTPUT || "qa-artifacts";
mkdirSync(output, { recursive: true });
const base = "http://127.0.0.1:4173/";
const rules = readFileSync("firestore.pilot.rules", "utf8");
const env = await initializeTestEnvironment({
  projectId: "demo-ayadati-secure",
  firestore: { host: "127.0.0.1", port: 8081, rules },
});
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox"],
});
const failures = [],
  external = [];
let checks = 0;
function check(value, name) {
  if (!value) throw Error(name);
  checks++;
  console.log("PASS", checks, name);
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
async function shot(p, name) {
  await settle(p);
  await p.screenshot({ path: join(output, name + ".png"), fullPage: true });
}
async function page(viewport = { width: 1440, height: 1050 }) {
  const c = await browser.newContext({
    viewport,
    locale: "ar-EG",
    timezoneId: "Africa/Cairo",
  });
  await c.route("**/*", (route) => {
    const u = route.request().url();
    if (
      !u.startsWith("data:") &&
      !["127.0.0.1", "localhost"].includes(new URL(u).hostname)
    ) {
      external.push(u.split("?")[0]);
      return route.abort();
    }
    return route.continue();
  });
  const p = await c.newPage();
  p.on("pageerror", (e) => failures.push(e.message));
  await p.goto(base + "#/portals");
  await p
    .getByRole("button", { name: "دخول بوابة المريض", exact: true })
    .waitFor();
  return p;
}
async function signup(p, label) {
  await p
    .getByRole("button", { name: "دخول بوابة المريض", exact: true })
    .click();
  await p.getByRole("button", { name: "حساب جديد", exact: true }).click();
  await noOverflow(p, label + " signup");
  check(
    (await p.locator(".auth-role-field").count()) === 0,
    "no self-selected clinical role " + label,
  );
  const displayName =
    {
      reception: "استقبال تجريبي",
      doctor: "طبيب تجريبي",
      "patient-one": "مريض تجريبي",
      "patient-two": "مريض تجريبي آخر",
    }[label] || "حساب اختبار آخر";
  await p.locator("#auth-name").fill(displayName);
  await p.locator("#auth-email").fill(label + "@example.invalid");
  // Disposable emulator identity only, not a real account or persistent user credential.
  await p.locator("#auth-password").fill(randomBytes(20).toString("hex"));
  await p.getByRole("button", { name: "إنشاء حساب", exact: true }).click();
  await p.locator('[data-portal="patient"]').waitFor();
  await p
    .locator(".portal-page-heading h1")
    .filter({ hasText: displayName })
    .waitFor();
  check(true, "new account displays saved name without reload " + label);
  return await p.evaluate(async () => {
    const { auth } = await import("/src/lib/firebase.ts");
    return auth.currentUser.uid;
  });
}
async function assignLocalFixture(p, uid, role) {
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), "clinics/pilot-clinic-1/members/" + uid), {
      role,
    }),
  );
  await p.goto(base + (role === "doctor" ? "#/doctor" : "#/reception"));
  await p.reload();
  await p.locator(`[data-portal="${role}"]`).waitFor();
}
async function book(p, name, phone) {
  await p
    .locator(".patient-tabs")
    .getByRole("button", { name: "طلب جديد", exact: true })
    .click();
  const form = p.locator(".booking-stepper");
  await form.locator("button[type=submit]").click();
  await form.locator("input:not([type])").first().fill(name);
  await form.locator("input[type=tel]").fill(phone);
  await form.locator("button[type=submit]").click();
  return form;
}
async function follow(p) {
  await p
    .locator(".patient-tabs")
    .getByRole("button", { name: "متابعتي", exact: true })
    .click();
}
async function noOverflow(p, label) {
  check(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    label + " has no horizontal overflow",
  );
  const button = await p.locator("header .theme-toggle").boundingBox();
  const header = await p.locator("header").boundingBox();
  check(
    !!button &&
      button.y >= header.y &&
      button.y + button.height <= header.y + header.height + 1,
    label + " theme control stays inside header, clear of workspace actions",
  );
}
async function directActionDenied(p, action, id) {
  return p.evaluate(
    async ({ action, id }) => {
      const b = await import("/src/lib/pilotBackend.ts");
      try {
        if (action === "arrive")
          await b.updatePilotBooking(id, { status: "arrived" });
        else if (action === "confirm") await b.confirmPilot(id);
        else if (action === "call") await b.callPilot();
        return false;
      } catch {
        return true;
      }
    },
    { action, id },
  );
}
try {
  await env.clearFirestore();
  const p = await page();
  check(
    (await p.locator(".gateway-card").count()) === 3,
    "three explicit entry destinations",
  );
  check((await p.locator(".auth-demo").count()) === 0, "no demo role bypass");
  await shot(p, "portal-gateway-desktop");
  await p
    .getByRole("button", { name: "دخول بوابة الدكتور", exact: true })
    .click();
  check(
    (await p
      .getByRole("button", { name: "حساب جديد", exact: true })
      .count()) === 0,
    "doctor entry cannot register a clinical role",
  );
  await shot(p, "portal-doctor-login");
  await p.getByRole("button", { name: "تغيير البوابة", exact: true }).click();
  const puid = await signup(p, "patient-one");
  await p.goto(base + "?portal=doctor&seed=1#/doctor");
  await p
    .getByRole("heading", { name: "البوابة دي مش متاحة لحسابك.", exact: true })
    .waitFor();
  check(
    (await p.locator('[data-portal="doctor"]').count()) === 0,
    "patient cannot route into doctor workspace by URL",
  );
  check(
    (await p
      .getByRole("button", { name: "نداء التالي", exact: true })
      .count()) === 0,
    "forged doctor destination exposes no staff action",
  );
  await shot(p, "portal-patient-denied-doctor");
  await p
    .getByRole("button", { name: "افتح بوابة المريض", exact: true })
    .click();
  let form = await book(p, "مريض اختبار أول", "01000000001");
  await form.locator("button[type=submit]").click();
  await p.getByText("اتحفظ طلب التجربة", { exact: true }).waitFor();
  await follow(p);
  check(
    (await p.locator("article[data-booking-id]").count()) === 1,
    "patient booking saved and displayed",
  );
  const bookingId = await p
    .locator("article[data-booking-id]")
    .getAttribute("data-booking-id");
  check(
    await directActionDenied(p, "arrive", bookingId),
    "patient direct status update rejected by backend rules",
  );
  check(
    await directActionDenied(p, "confirm", bookingId),
    "patient direct reception action rejected by backend rules",
  );
  await assertFails(
    setDoc(
      doc(
        env.authenticatedContext(puid).firestore(),
        "clinics/pilot-clinic-1/members/" + puid,
      ),
      { role: "doctor" },
    ),
  );
  check(true, "patient cannot grant own staff membership");
  await p.reload();
  await p.locator('[data-portal="patient"]').waitFor();
  await shot(p, "portal-patient-desktop");
  await p.setViewportSize({ width: 390, height: 844 });
  await noOverflow(p, "patient mobile");
  await shot(p, "portal-patient-mobile");
  await p.setViewportSize({ width: 1440, height: 1050 });
  await p
    .locator(".patient-tabs")
    .getByRole("button", { name: /بعد الكشف/ })
    .click();
  check(
    await p
      .getByText(
        "الوصفات، التقارير والملاحظات الطبية مش مفعلة في تجربة الحجز. مش هنعرض معلومات طبية تجريبية كأنها تخص زيارتك.",
        { exact: true },
      )
      .isVisible(),
    "unavailable clinical content is stated honestly",
  );
  await follow(p);
  const r = await page();
  const ruid = await signup(r, "reception");
  await assignLocalFixture(r, ruid, "receptionist");
  await r.getByRole("button", { name: "تأكيد الطلب", exact: true }).waitFor();
  check(
    (await r
      .getByRole("button", { name: "نداء التالي", exact: true })
      .count()) === 0,
    "reception has no doctor controls",
  );
  await r.getByRole("button", { name: "تأكيد الطلب", exact: true }).click();
  await r.getByRole("button", { name: "تسجيل الوصول", exact: true }).waitFor();
  await p.locator('.patient-ticket [data-status="confirmed"]').waitFor();
  check(
    (await p.locator(".ticket-number strong").innerText()) === "1",
    "patient receives reception-assigned turn from same record",
  );
  await r.getByRole("button", { name: "تسجيل الوصول", exact: true }).click();
  await r.locator('article [data-status="arrived"]').waitFor();
  check(
    await directActionDenied(r, "call"),
    "reception direct doctor action rejected by backend rules",
  );
  await r.reload();
  await r.locator('[data-portal="receptionist"]').waitFor();
  await shot(r, "portal-reception-desktop");
  await r.setViewportSize({ width: 390, height: 844 });
  await noOverflow(r, "reception mobile");
  await shot(r, "portal-reception-mobile");
  await r.setViewportSize({ width: 1440, height: 1050 });
  await r
    .getByRole("textbox", { name: "ابحث بالاسم أو رقم الاختبار أو الدور" })
    .fill("not-present");
  check(
    (await r.locator("article[data-booking-id]").count()) === 0,
    "reception search filters current authorized records",
  );
  await r
    .getByRole("textbox", { name: "ابحث بالاسم أو رقم الاختبار أو الدور" })
    .fill("");
  const d = await page();
  const duid = await signup(d, "doctor");
  await assignLocalFixture(d, duid, "doctor");
  await d.getByRole("button", { name: "نداء التالي", exact: true }).waitFor();
  check(
    (await d
      .getByRole("button", { name: "تأكيد الطلب", exact: true })
      .count()) === 0,
    "doctor has no reception controls",
  );
  await shot(d, "portal-doctor-queue-desktop");
  await d.getByRole("button", { name: "نداء التالي", exact: true }).click();
  await d
    .getByRole("button", { name: "إنهاء الكشف التجريبي", exact: true })
    .waitFor();
  await p.locator('.patient-ticket [data-status="in-consult"]').waitFor();
  check(
    (await d.locator(".current-consultation h3").innerText()) ===
      "مريض اختبار أول",
    "doctor room receives same synthetic patient",
  );
  check(
    (await d
      .getByRole("button", { name: "نداء التالي", exact: true })
      .count()) === 0,
    "active room cannot call second patient",
  );
  await shot(d, "portal-doctor-desktop");
  await d.setViewportSize({ width: 390, height: 844 });
  await noOverflow(d, "doctor mobile");
  await shot(d, "portal-doctor-mobile");
  await d.setViewportSize({ width: 1440, height: 1050 });
  for (const [target, label] of [
    [p, "patient"],
    [r, "reception"],
    [d, "doctor"],
  ]) {
    await target
      .getByRole("button", { name: "التبديل إلى الوضع الداكن", exact: true })
      .click();
    check(
      await target.evaluate(
        () => document.documentElement.dataset.theme === "dark",
      ),
      label + " dark mode applied",
    );
    await shot(target, "portal-" + label + "-dark");
    await target
      .getByRole("button", { name: "التبديل إلى الوضع الفاتح", exact: true })
      .click();
  }
  await d
    .getByRole("button", { name: "إنهاء الكشف التجريبي", exact: true })
    .click();
  await p.locator('.patient-ticket [data-status="done"]').waitFor();
  check(true, "doctor completion reaches patient in realtime");
  await r
    .locator(".portal-filter")
    .getByRole("button", { name: "منتهية", exact: true })
    .click();
  check(
    (await r.locator("article[data-booking-id]").count()) === 1,
    "reception closed filter uses shared final state",
  );
  await d.goto(base + "#/reception");
  await d
    .getByRole("heading", { name: "البوابة دي مش متاحة لحسابك.", exact: true })
    .waitFor();
  check(
    (await d.locator('[data-portal="receptionist"]').count()) === 0,
    "doctor cannot select reception workspace",
  );
  await d
    .getByRole("button", { name: "افتح بوابة الدكتور", exact: true })
    .click();
  const p2 = await page({ width: 390, height: 844 });
  await shot(p2, "portal-gateway-mobile");
  await signup(p2, "patient-two");
  check(
    (await p2.locator("article[data-booking-id]").count()) === 0,
    "second patient sees no other patient record",
  );
  await noOverflow(p2, "empty patient mobile");
  form = await book(p2, "طلب اختبار انقطاع", "01000000002");
  await shot(p2, "portal-booking-mobile");
  await p2.context().setOffline(true);
  await form.locator("button[type=submit]").click();
  await p2
    .getByText("جاري حفظ الطلب. استنى تأكيد الحفظ، ومتقفلش الصفحة.", {
      exact: true,
    })
    .waitFor();
  check(
    (await p2.getByText("اتحفظ طلب التجربة", { exact: true }).count()) === 0,
    "offline write never gives false saved confirmation",
  );
  check(
    await form.locator("button[type=submit]").isDisabled(),
    "pending write locks duplicate submission",
  );
  await p2.context().setOffline(false);
  await p2.getByText("اتحفظ طلب التجربة", { exact: true }).waitFor();
  await follow(p2);
  check(
    (await p2.locator("article[data-booking-id]").count()) === 1,
    "reconnection saves exactly one patient booking",
  );
  form = await book(p2, "طلب اختبار رفض", "01000000003");
  await initializeTestEnvironment({
    projectId: "demo-ayadati-secure",
    firestore: {
      host: "127.0.0.1",
      port: 8081,
      rules: rules.replace(/allow create: if/g, "allow create: if false &&"),
    },
  });
  await form.locator("button[type=submit]").click();
  await p2
    .getByText(
      "لم يتم حفظ الطلب. لازم تسجّل الدخول وتتأكد من الاتصال. استخدم بيانات وهمية فقط.",
      { exact: true },
    )
    .waitFor();
  check(
    (await p2.getByText("اتحفظ طلب التجربة", { exact: true }).count()) === 0,
    "denied write shows failure without false success",
  );
  await shot(p2, "portal-write-denied-mobile");
  await initializeTestEnvironment({
    projectId: "demo-ayadati-secure",
    firestore: { host: "127.0.0.1", port: 8081, rules },
  });
  await env.withSecurityRulesDisabled((c) =>
    setDoc(doc(c.firestore(), "clinics/pilot-clinic-1/members/" + duid), {
      role: "patient",
    }),
  );
  await d.reload();
  await d
    .getByRole("heading", { name: "البوابة دي مش متاحة لحسابك.", exact: true })
    .waitFor();
  check(
    (await d.locator('[data-portal="doctor"]').count()) === 0,
    "server membership removal blocks doctor workspace after recheck",
  );
  await d
    .getByRole("button", { name: "افتح بوابة المريض", exact: true })
    .click();
  check(
    (await d.locator("article[data-booking-id]").count()) === 0,
    "demoted staff account cannot retain clinic record cache",
  );
  await d.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
  await d
    .getByRole("button", { name: "دخول بوابة المريض", exact: true })
    .waitFor();
  await signup(d, "patient-switch");
  check(
    (await d.locator("article[data-booking-id]").count()) === 0,
    "same browser account switch clears records",
  );
  check(
    (await d
      .getByRole("button", { name: "نداء التالي", exact: true })
      .count()) === 0,
    "same browser account switch removes clinical controls",
  );
  await p.getByRole("button", { name: "تسجيل الخروج", exact: true }).click();
  await p
    .getByRole("button", { name: "دخول بوابة المريض", exact: true })
    .waitFor();
  check(
    (await p.locator("article[data-booking-id]").count()) === 0,
    "signout removes cached bookings",
  );
  await p.goto(base + "?portal=doctor&seed=1#/doctor");
  await p.locator("#auth-email").waitFor();
  check(
    (await p
      .getByRole("button", { name: "نداء التالي", exact: true })
      .count()) === 0,
    "signed-out doctor URL cannot bypass authentication",
  );
  check(
    !external.some((u) =>
      /firestore.googleapis|identitytoolkit.googleapis|securetoken.googleapis/.test(
        u,
      ),
    ),
    "no real cloud backend requests",
  );
  check(failures.length === 0, "no browser runtime errors");
  console.log("ALL APP CHECKS", checks, "PASSED");
} catch (e) {
  console.error(e);
  for (const p of browser.contexts().flatMap((c) => c.pages()))
    console.log(
      "PAGE",
      await p
        .locator("body")
        .innerText()
        .catch(() => ""),
    );
  throw e;
} finally {
  await browser.close();
  await env.cleanup();
}
