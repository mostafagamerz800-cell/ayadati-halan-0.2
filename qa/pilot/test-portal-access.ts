import assert from "node:assert/strict";
import {
  portalAccess,
  portalFromHash,
  portalPaths,
  type PortalRole,
} from "../../src/lib/portalAccess.ts";
const roles: PortalRole[] = ["patient", "receptionist", "doctor"];
let checks = 0;
for (const assigned of roles) {
  assert.equal(portalAccess(assigned, null), "allowed");
  checks++;
  for (const requested of roles) {
    assert.equal(
      portalAccess(assigned, requested),
      assigned === requested ? "allowed" : "denied",
    );
    checks++;
  }
  assert.equal(portalFromHash(portalPaths[assigned]), assigned);
  checks++;
}
for (const invalid of ["", "admin", "anonymous", "constructor", "__proto__"]) {
  for (const requested of [null, ...roles]) {
    assert.equal(portalAccess(invalid, requested), "denied");
    checks++;
  }
}
for (const path of [
  "#/admin",
  "#/doctor?role=doctor",
  "doctor",
  "?portal=doctor",
  "",
]) {
  assert.equal(portalFromHash(path), null);
  checks++;
}
console.log(
  "PASS",
  checks,
  "portal destination / membership matrix assertions",
);
