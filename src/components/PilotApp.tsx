import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { ClinicExperience } from "./ClinicExperience";
import { AuthScreen } from "./AuthScreen";
import { PilotNotice } from "./PilotNotice";
import {
  DoctorPortal,
  PatientPortal,
  ReceptionPortal,
  PortalAccessDenied,
  PortalGateway,
} from "./SecurePortals";
import { useAuth } from "../context/AuthContext";
import {
  portalAccess,
  portalFromHash,
  portalPaths,
  type PortalRole,
} from "../lib/portalAccess";
import {
  pilotSubscribe,
  pilotBookings,
  pilotRole,
  pilotReady,
  pilotPendingWrites,
  confirmPilot,
  callPilot,
  finishPilot,
  updatePilotBooking,
} from "../lib/pilotBackend";
import "./clinic-polish.css";
import "./pilot.css";

export function PilotApp() {
  const { currentUser, firebaseUser, loading, logout, error } = useAuth();
  const [, refresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [route, setRoute] = useState(() => window.location.hash);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const operation = useRef({ epoch: 0, busy: false });
  useEffect(() => pilotSubscribe(() => refresh((n) => n + 1)), []);
  useEffect(() => {
    const changed = () => {
      setRoute(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  useEffect(() => {
    operation.current = { epoch: operation.current.epoch + 1, busy: false };
    setBusy(false);
  }, [currentUser?.uid]);
  const go = (hash: string) => {
    setRoute(hash);
    window.location.hash = hash;
    window.scrollTo(0, 0);
  };
  const choose = (role: PortalRole) => go(portalPaths[role]);
  const leave = () => {
    void logout()
      .then(() => go("#/portals"))
      .catch(() => {
        /* AuthContext supplies the error. */
      });
  };
  const run = async (action: () => Promise<unknown>) => {
    if (operation.current.busy) return;
    const epoch = operation.current.epoch;
    operation.current.busy = true;
    setBusy(true);
    try {
      await action();
    } catch {
      /* PilotNotice shows the saved-state error. */
    } finally {
      if (operation.current.epoch === epoch) {
        operation.current.busy = false;
        setBusy(false);
      }
    }
  };
  const requested = portalFromHash(route);
  const chrome = (
    <>
      <PilotNotice />
      {error && (
        <aside dir="rtl" className="p-3" role="alert">
          {error}
        </aside>
      )}
    </>
  );
  if (loading)
    return (
      <>
        <ThemeToggle />
        {chrome}
        <main className="portal-session-status" dir="rtl">
          <p role="status">جاري التحقق من الحساب والصلاحيات...</p>
        </main>
      </>
    );
  if (route.startsWith("#/clinic/"))
    return (
      <>
        <ThemeToggle />
        {chrome}
        <nav className="pilot-nav" dir="rtl">
          <button
            className="portal-button primary"
            onClick={() =>
              currentUser
                ? choose(currentUser.role as PortalRole)
                : go("#/portals")
            }
          >
            {currentUser ? "بوابتي" : "اختيار البوابة"}
          </button>
        </nav>
        <ClinicExperience
          tenantLabel="عيادة التجربة الواحدة"
          tenantId="pilot-clinic-1"
          lang={lang}
          onToggleLanguage={() => setLang(lang === "ar" ? "en" : "ar")}
          onDirectory={() => go("#/portals")}
          onLogout={currentUser ? leave : () => go("#/portals")}
          onSelectPortal={(value) =>
            choose(
              value === "doctor"
                ? "doctor"
                : value === "receptionist" || value === "reception"
                  ? "receptionist"
                  : "patient",
            )
          }
          onOpenSaasModal={() => go("#/portals")}
        />
      </>
    );
  if (!currentUser)
    return (
      <>
        {chrome}
        {requested ? (
          <>
            <AuthScreen
              key={requested}
              portal={requested}
              onChangePortal={() => go("#/portals")}
            />
          </>
        ) : (
          <PortalGateway onChoose={choose} />
        )}
        {firebaseUser && (
          <div dir="rtl" className="portal-session-status">
            <p role="alert">
              تعذر التحقق من صلاحيات الحساب. مفيش بيانات عيادة ظاهرة.
            </p>
            <button className="portal-button" onClick={leave}>
              تسجيل الخروج
            </button>
          </div>
        )}
      </>
    );
  if (!pilotReady() || pilotRole() !== currentUser.role)
    return (
      <>
        <ThemeToggle />
        {chrome}
        <main className="portal-session-status" dir="rtl">
          <p role="status">جاري تحميل بوابتك من صلاحيات العيادة...</p>
          <button className="portal-button" onClick={leave}>
            تسجيل الخروج
          </button>
        </main>
      </>
    );
  const role = pilotRole() as PortalRole;
  if (portalAccess(role, requested) === "denied")
    return (
      <>
        <ThemeToggle />
        {chrome}
        <PortalAccessDenied
          requested={requested!}
          assigned={role}
          onAssigned={() => choose(role)}
          onLogout={leave}
        />
      </>
    );
  const rows = pilotBookings().sort((a, b) => b.createdAt - a.createdAt);
  const common = {
    name: currentUser.name,
    rows,
    busy: busy || pilotPendingWrites(),
    onLogout: leave,
    onClinic: () => go("#/clinic/home"),
  };
  return (
    <div className="pilot-app">
      {chrome}
      {(busy || pilotPendingWrites()) && (
        <div className="portal-pending" dir="rtl" role="status">
          جاري حفظ التغيير. استنى تأكيد الحفظ، ومتقفلش الصفحة.
        </div>
      )}
      {role === "patient" ? (
        <PatientPortal key={currentUser.uid} {...common} />
      ) : role === "receptionist" ? (
        <ReceptionPortal
          key={currentUser.uid}
          {...common}
          onConfirm={(id) => void run(() => confirmPilot(id))}
          onStatus={(id, status) =>
            void run(() => updatePilotBooking(id, { status }))
          }
        />
      ) : (
        <DoctorPortal
          key={currentUser.uid}
          {...common}
          onCall={() => void run(callPilot)}
          onFinish={(id) => void run(() => finishPilot(id))}
        />
      )}
    </div>
  );
}
