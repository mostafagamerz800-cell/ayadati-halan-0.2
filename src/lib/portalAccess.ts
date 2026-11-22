export type PortalRole = "patient" | "receptionist" | "doctor";
export const portalLabels: Record<PortalRole, string> = {
  patient: "بوابة المريض",
  receptionist: "بوابة الاستقبال",
  doctor: "بوابة الدكتور",
};
export const portalPaths: Record<PortalRole, string> = {
  patient: "#/patient",
  receptionist: "#/reception",
  doctor: "#/doctor",
};
export function portalFromHash(hash: string): PortalRole | null {
  return (
    (Object.keys(portalPaths) as PortalRole[]).find(
      (role) => portalPaths[role] === hash,
    ) ?? null
  );
}
/** A URL is a destination request, never a role grant. Role comes from clinic membership. */
export function portalAccess(
  role: string,
  requested: PortalRole | null,
): "allowed" | "denied" {
  return Object.hasOwn(portalLabels, role) && (!requested || requested === role)
    ? "allowed"
    : "denied";
}
