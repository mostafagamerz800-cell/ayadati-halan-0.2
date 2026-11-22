import { useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
  Ticket,
  Users,
  UserRound,
} from "lucide-react";
import type { MvpBooking } from "../lib/devSync";
import { portalLabels, type PortalRole } from "../lib/portalAccess";
import { ThemeToggle } from "./ThemeToggle";
import { BookingStepper } from "./BookingStepper";
import { ClinicIllustration } from "./ClinicIllustration";
import "./secure-portals.css";

export const bookingLabels: Record<MvpBooking["status"], string> = {
  requested: "طلب جديد",
  confirmed: "مؤكد",
  arrived: "وصل",
  "in-consult": "في الكشف",
  done: "انتهى",
  cancelled: "ملغي",
  "no-show": "لم يحضر",
};
const roleIcons = {
  patient: UserRound,
  receptionist: Users,
  doctor: Stethoscope,
};
const descriptions: Record<PortalRole, string> = {
  patient: "حجزك، رقم دورك، ومتابعة طلبك.",
  receptionist: "طلبات الحجز، التأكيد، وتنظيم الوصول.",
  doctor: "طابور الكشف والحالة الموجودة في الغرفة.",
};
type Common = {
  name: string;
  rows: MvpBooking[];
  busy: boolean;
  onLogout: () => void;
  onClinic: () => void;
};
type ReceptionProps = Common & {
  onConfirm: (id: string) => void;
  onStatus: (id: string, status: "arrived" | "cancelled" | "no-show") => void;
};
type DoctorProps = Common & {
  onCall: () => void;
  onFinish: (id: string) => void;
};

export function PortalGateway({
  onChoose,
}: {
  onChoose: (role: PortalRole) => void;
}) {
  return (
    <main className="portal-gateway" dir="rtl" lang="ar">
      <header className="gateway-header">
        <div className="portal-brand">
          <HeartPulse />
          <div>
            عيادتي حالا<small>مساحة بسيطة، لرعاية أفضل.</small>
          </div>
        </div>
        <ThemeToggle inline />
      </header>
      <div className="gateway-heading">
        <span className="portal-eyebrow">كل واحد في مكانه</span>
        <h1>أهلاً بيك في عيادتك.</h1>
        <p>اختار بوابتك، وسجّل الدخول لحسابك.</p>
      </div>
      <div className="gateway-cards">
        {(["patient", "receptionist", "doctor"] as PortalRole[]).map((role) => {
          const Icon = roleIcons[role];
          return (
            <section className="gateway-card" key={role}>
              <span className="portal-icon">
                <Icon size={24} />
              </span>
              <ClinicIllustration
                kind={
                  role === "patient"
                    ? "calendar"
                    : role === "doctor"
                      ? "doctor"
                      : "ticket"
                }
                eager
              />
              <h2>{portalLabels[role]}</h2>
              <p>{descriptions[role]}</p>
              <button
                className="portal-button primary"
                onClick={() => onChoose(role)}
              >
                دخول {portalLabels[role]}
                <ArrowLeft size={17} />
              </button>
              {role !== "patient" && (
                <small>
                  <LockKeyhole size={12} /> للحسابات المصرح لها فقط
                </small>
              )}
            </section>
          );
        })}
      </div>
      <p className="gateway-foot">
        <ShieldCheck size={17} /> اختيار البوابة لا يغيّر صلاحية حسابك. دي تجربة
        ببيانات وهمية فقط، مش خدمة طبية.
      </p>
    </main>
  );
}

export function PortalAccessDenied({
  requested,
  assigned,
  onAssigned,
  onLogout,
}: {
  requested: PortalRole;
  assigned: PortalRole;
  onAssigned: () => void;
  onLogout: () => void;
}) {
  return (
    <main className="portal-access" dir="rtl">
      <ShieldCheck size={38} />
      <span className="portal-eyebrow">صلاحيات الحساب</span>
      <h1>البوابة دي مش متاحة لحسابك.</h1>
      <p>
        حاولت تفتح {portalLabels[requested]}. الصلاحية الحالية لحسابك هي{" "}
        {portalLabels[assigned]}.
      </p>
      <p>تغيير الرابط أو اختيار بوابة تانية مش بيمنح صلاحيات موظفين.</p>
      <button className="portal-button primary" onClick={onAssigned}>
        افتح {portalLabels[assigned]}
      </button>
      <button className="portal-button" onClick={onLogout}>
        تسجيل الخروج
      </button>
    </main>
  );
}

function Frame({
  role,
  name,
  onLogout,
  onClinic,
  children,
  tab,
  onTab,
}: {
  role: PortalRole;
  name: string;
  onLogout: () => void;
  onClinic: () => void;
  children: ReactNode;
  tab?: string;
  onTab?: (tab: string) => void;
}) {
  const Icon = roleIcons[role];
  return (
    <div
      className={`secure-portal secure-${role}`}
      dir="rtl"
      lang="ar"
      data-portal={role}
    >
      <header className="portal-header">
        <div className="portal-brand">
          <HeartPulse />
          <div>
            عيادتي حالا<small>عيادة التجربة الواحدة</small>
          </div>
        </div>
        <div className="portal-header-actions">
          <button aria-label="واجهة العيادة" onClick={onClinic}>
            <CalendarDays size={16} />
            <span>واجهة العيادة</span>
          </button>
          <button aria-label="تسجيل الخروج" onClick={onLogout}>
            <LogOut size={16} />
            <span>تسجيل الخروج</span>
          </button>
          <ThemeToggle inline />
        </div>
      </header>
      {role === "patient" ? (
        <nav className="patient-tabs" aria-label="أقسام بوابة المريض">
          <button
            aria-current={tab === "follow" ? "page" : undefined}
            onClick={() => onTab?.("follow")}
          >
            <Ticket size={17} />
            متابعتي
          </button>
          <button
            aria-current={tab === "book" ? "page" : undefined}
            onClick={() => onTab?.("book")}
          >
            <Plus size={17} />
            طلب جديد
          </button>
          <button
            aria-current={tab === "after" ? "page" : undefined}
            onClick={() => onTab?.("after")}
          >
            <FileText size={17} />
            بعد الكشف <LockKeyhole size={13} />
          </button>
        </nav>
      ) : null}
      <div className="portal-layout">
        {role !== "patient" && (
          <aside className="portal-sidebar">
            <div className="sidebar-identity">
              <span className="portal-icon">
                <Icon size={25} />
              </span>
              <h1>{portalLabels[role]}</h1>
              <p>
                <bdi>{name}</bdi>
              </p>
              <small>
                <ShieldCheck size={13} />
                {role === "doctor" ? "صلاحية طبيب" : "صلاحية استقبال"}
              </small>
            </div>
            <nav aria-label="أقسام البوابة">
              <button aria-current="page">
                <LayoutDashboard size={18} />
                {role === "doctor"
                  ? "المواعيد وغرفة الكشف"
                  : "إدارة الطابور والأدوار"}
              </button>
              <div className="sidebar-locked">
                <LockKeyhole size={16} />
                <span>
                  {role === "doctor"
                    ? "الملفات الطبية والتقارير"
                    : "المدفوعات والفواتير"}
                  <small>غير مفعلة في تجربة الحجز</small>
                </span>
              </div>
            </nav>
            <div className="sidebar-note">
              <ShieldCheck size={20} />
              <p>
                الحجز والطابور من مصدر واحد.
                <br />
                بيانات وهمية فقط.
              </p>
            </div>
          </aside>
        )}
        <main className="portal-workspace">{children}</main>
      </div>
      <footer className="portal-footer">
        عيادتي حالا · تجربة ربط آمن لعيادة واحدة. لا توجد خدمة طبية أو مدفوعات
        في هذه النسخة.
      </footer>
    </div>
  );
}
function Badge({ booking }: { booking: MvpBooking }) {
  return (
    <span className="portal-status" data-status={booking.status}>
      {bookingLabels[booking.status]}
    </span>
  );
}
function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="portal-empty">
      <ClinicIllustration kind="search" />
      <h3>مفيش طلبات هنا لسه.</h3>
      <p>{children}</p>
    </div>
  );
}
function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
}) {
  return (
    <div className="portal-metric">
      <span className="portal-icon">{icon}</span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
function BookingDetails({ booking: b }: { booking: MvpBooking }) {
  return (
    <dl className="portal-booking-details">
      <div>
        <dt>نوع الطلب</dt>
        <dd>{b.type === "followup" ? "متابعة" : "كشف جديد"}</dd>
      </div>
      <div>
        <dt>اليوم المطلوب</dt>
        <dd>{b.date || "بدون يوم محدد"}</dd>
      </div>
      <div>
        <dt>رقم الاختبار</dt>
        <dd>
          <bdi>{b.phone}</bdi>
        </dd>
      </div>
    </dl>
  );
}
const stages = [
  "requested",
  "confirmed",
  "arrived",
  "in-consult",
  "done",
] as const;
const stageLabels = [
  "إرسال الطلب",
  "تأكيد الاستقبال",
  "تسجيل الوصول",
  "في الكشف",
  "انتهاء الزيارة",
];
function PatientTicket({ booking: b }: { booking: MvpBooking }) {
  const current = stages.indexOf(b.status as (typeof stages)[number]);
  return (
    <section className="patient-ticket">
      <div className="ticket-main">
        <div>
          <span className="portal-eyebrow">آخر طلب ليك</span>
          <h2>{b.name}</h2>
          <Badge booking={b} />
        </div>
        <div className="ticket-number">
          <span>رقم دورك</span>
          <strong>{b.turn ?? "—"}</strong>
          <small>{b.turn ? "الدور المسجل لطلبك" : "بعد تأكيد الاستقبال"}</small>
        </div>
      </div>
      <BookingDetails booking={b} />
      {current >= 0 ? (
        <ol className="ticket-progress" aria-label="مراحل الطلب">
          {stages.map((stage, i) => (
            <li
              key={stage}
              className={i <= current ? "reached" : ""}
              aria-current={i === current ? "step" : undefined}
            >
              <span>{i < current ? <CheckCircle2 size={17} /> : i + 1}</span>
              <small>{stageLabels[i]}</small>
            </li>
          ))}
        </ol>
      ) : (
        <p className="portal-muted">
          {b.status === "cancelled"
            ? "تم إلغاء الطلب."
            : "تم تسجيل عدم الحضور."}{" "}
          ده مش موعد طبي حقيقي.
        </p>
      )}
      <div className="ticket-disclaimer">
        <ShieldCheck size={16} />
        الحالة ورقم الدور بيتحدثوا من نفس بيانات الاستقبال والدكتور.
      </div>
    </section>
  );
}
export function PatientPortal(props: Common) {
  const [tab, setTab] = useState("follow");
  return (
    <Frame {...props} role="patient" tab={tab} onTab={setTab}>
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">{portalLabels.patient}</span>
          <h1>
            أهلاً، <bdi>{props.name}</bdi>.
          </h1>
          <p>طلبك ومتابعة دورك، بهدوء ومن مكان واحد.</p>
        </div>
        <ClinicIllustration kind="ticket" eager />
      </div>
      {tab === "after" ? (
        <section className="portal-panel portal-unavailable">
          <LockKeyhole size={30} />
          <h2>بعد الكشف</h2>
          <p>
            الوصفات، التقارير والملاحظات الطبية مش مفعلة في تجربة الحجز. مش
            هنعرض معلومات طبية تجريبية كأنها تخص زيارتك.
          </p>
          <button className="portal-button" onClick={() => setTab("follow")}>
            الرجوع لمتابعتي
          </button>
        </section>
      ) : tab === "book" ? (
        <div className="patient-booking-layout">
          <section className="portal-panel">
            <span className="portal-eyebrow">بيانات وهمية فقط</span>
            <h2>طلب حجز تجريبي</h2>
            <BookingStepper lang="ar" />
          </section>
          <aside className="portal-help">
            <ClinicIllustration kind="calendar" />
            <h3>خطوة بخطوة.</h3>
            <p>
              إرسال الطلب مش تأكيد للموعد. بعد الحفظ، تقدر تتابع حالته من
              متابعتي.
            </p>
            <button className="portal-button" onClick={() => setTab("follow")}>
              افتح متابعتي
              <ArrowLeft size={16} />
            </button>
          </aside>
        </div>
      ) : (
        <>
          <div className="patient-overview-grid">
            <div>
              {props.rows[0] ? (
                <PatientTicket booking={props.rows[0]} />
              ) : (
                <section className="portal-panel">
                  <Empty>
                    ابدأ بطلب تجريبي جديد. بيانات حسابك بس هي اللي هتظهر هنا.
                  </Empty>
                  <button
                    className="portal-button primary"
                    onClick={() => setTab("book")}
                  >
                    طلب جديد
                    <Plus size={16} />
                  </button>
                </section>
              )}
            </div>
            <aside className="portal-help">
              <CalendarDays size={25} />
              <h3>حجزك على راحتك.</h3>
              <p>
                مفيش موعد طبي حقيقي أو وقت انتظار مؤكد في النسخة دي. استخدم
                أسماء وأرقام اختبار فقط.
              </p>
              <button
                className="portal-button primary"
                onClick={() => setTab("book")}
              >
                طلب جديد
                <Plus size={16} />
              </button>
              <p className="portal-help-small">
                <ShieldCheck size={15} /> طلباتك ظاهرة لحسابك وفريق العيادة
                المصرح له فقط.
              </p>
            </aside>
          </div>
          <section className="portal-panel patient-history">
            <div className="portal-section-heading">
              <h2>طلباتي</h2>
              <span>{props.rows.length} طلب</span>
            </div>
            {props.rows.length === 0 ? (
              <p className="portal-muted">لسه مفيش طلبات محفوظة.</p>
            ) : (
              <div className="portal-booking-list">
                {props.rows.map((b) => (
                  <article key={b.id} data-booking-id={b.id}>
                    <div className="portal-row-heading">
                      <div>
                        <h3>{b.name}</h3>
                        <small>
                          {b.date || "بدون يوم محدد"} ·{" "}
                          {b.turn ? "دور " + b.turn : "بانتظار رقم الدور"}
                        </small>
                      </div>
                      <Badge booking={b} />
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </Frame>
  );
}
export function ReceptionPortal(props: ReceptionProps) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const waiting = props.rows.filter((b) =>
    ["confirmed", "arrived"].includes(b.status),
  );
  const filtered = props.rows.filter(
    (b) =>
      (filter === "all" ||
        (filter === "requests" && b.status === "requested") ||
        (filter === "queue" &&
          ["confirmed", "arrived", "in-consult"].includes(b.status)) ||
        (filter === "closed" &&
          ["done", "cancelled", "no-show"].includes(b.status))) &&
      (!search ||
        `${b.name} ${b.phone} ${b.turn ?? ""}`
          .toLowerCase()
          .includes(search.toLowerCase())),
  );
  return (
    <Frame {...props} role="receptionist">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">مكتب الاستقبال</span>
          <h2>يوم العيادة، مرتب.</h2>
          <p>أكد الطلبات، سجّل الوصول، وتابع الطابور من مكان واحد.</p>
        </div>
        <ClinicIllustration kind="ticket" eager />
      </div>
      <div className="portal-metrics">
        <Metric
          label="طلبات جديدة"
          value={props.rows.filter((b) => b.status === "requested").length}
          icon={<CalendarDays size={21} />}
        />
        <Metric
          label="في الانتظار"
          value={waiting.length}
          icon={<Clock3 size={21} />}
        />
        <Metric
          label="في الكشف"
          value={props.rows.filter((b) => b.status === "in-consult").length}
          icon={<Activity size={21} />}
        />
      </div>
      <section className="portal-panel">
        <div className="portal-section-heading">
          <div>
            <h2>إدارة الطابور والأدوار</h2>
            <p>كل التغييرات مرتبطة بطلب المريض نفسه.</p>
          </div>
          <span className="portal-count">{props.rows.length} طلب</span>
        </div>
        <div className="reception-toolbar">
          <div className="portal-filter" aria-label="تصفية الحجوزات">
            {[
              ["all", "الكل"],
              ["requests", "طلبات جديدة"],
              ["queue", "الطابور"],
              ["closed", "منتهية"],
            ].map(([key, label]) => (
              <button
                key={key}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="portal-search">
            <Search size={17} />
            <input
              aria-label="ابحث بالاسم أو رقم الاختبار أو الدور"
              placeholder="ابحث بالاسم أو الدور"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        {filtered.length === 0 ? (
          <Empty>جرّب فلتر تاني أو انتظر طلب جديد.</Empty>
        ) : (
          <div className="portal-booking-list">
            {filtered.map((b) => (
              <article key={b.id} data-booking-id={b.id}>
                <div className="portal-row-heading">
                  <div className="queue-person">
                    <span className="queue-turn">{b.turn ?? "—"}</span>
                    <div>
                      <h3>{b.name}</h3>
                      <small>
                        <bdi>{b.phone}</bdi> · {b.date || "بدون يوم محدد"}
                      </small>
                    </div>
                  </div>
                  <Badge booking={b} />
                </div>
                <div className="portal-row-actions">
                  {b.status === "requested" && (
                    <button
                      className="portal-button primary"
                      disabled={props.busy}
                      onClick={() => props.onConfirm(b.id)}
                    >
                      تأكيد الطلب
                    </button>
                  )}
                  {b.status === "confirmed" && (
                    <button
                      className="portal-button primary"
                      disabled={props.busy}
                      onClick={() => props.onStatus(b.id, "arrived")}
                    >
                      تسجيل الوصول
                    </button>
                  )}
                  {["requested", "confirmed", "arrived"].includes(b.status) && (
                    <button
                      className="portal-button"
                      disabled={props.busy}
                      onClick={() => props.onStatus(b.id, "cancelled")}
                    >
                      إلغاء
                    </button>
                  )}
                  {["confirmed", "arrived"].includes(b.status) && (
                    <button
                      className="portal-button quiet"
                      disabled={props.busy}
                      onClick={() => props.onStatus(b.id, "no-show")}
                    >
                      لم يحضر
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </Frame>
  );
}
export function DoctorPortal(props: DoctorProps) {
  const queue = props.rows
    .filter((b) => ["confirmed", "arrived"].includes(b.status))
    .sort((a, b) => (a.turn ?? Infinity) - (b.turn ?? Infinity));
  const active = props.rows.find((b) => b.status === "in-consult");
  return (
    <Frame {...props} role="doctor">
      <div className="portal-page-heading">
        <div>
          <span className="portal-eyebrow">مساحة الدكتور</span>
          <h2>تركيزك على الكشف.</h2>
          <p>الطابور والغرفة قدامك، من غير تبديل بين شاشات منفصلة.</p>
        </div>
        <ClinicIllustration kind="doctor" eager />
      </div>
      <div className="portal-metrics">
        <Metric
          label="طلبات التجربة"
          value={props.rows.length}
          icon={<CalendarDays size={21} />}
        />
        <Metric
          label="في الانتظار"
          value={queue.length}
          icon={<Users size={21} />}
        />
        <Metric
          label="انتهى الكشف"
          value={props.rows.filter((b) => b.status === "done").length}
          icon={<CheckCircle2 size={21} />}
        />
      </div>
      <div className="doctor-work-grid">
        <section className="portal-panel consultation-room">
          <div className="portal-section-heading">
            <div>
              <span className="portal-eyebrow">غرفة الكشف</span>
              <h2>{active ? "الحالة الحالية" : "الغرفة متاحة"}</h2>
            </div>
            <span className="portal-icon">
              <Stethoscope size={24} />
            </span>
          </div>
          {active ? (
            <div className="current-consultation">
              <div className="consultation-turn">
                <small>رقم الدور</small>
                <strong>{active.turn}</strong>
              </div>
              <h3>{active.name}</h3>
              <Badge booking={active} />
              <BookingDetails booking={active} />
              <button
                className="portal-button primary"
                disabled={props.busy}
                onClick={() => props.onFinish(active.id)}
              >
                إنهاء الكشف التجريبي
                <CheckCircle2 size={17} />
              </button>
            </div>
          ) : (
            <div className="consultation-ready">
              <ClinicIllustration kind="doctor" />
              <h3>
                {queue.length
                  ? "جاهز للحالة الجاية؟"
                  : "مفيش حالة في الانتظار."}
              </h3>
              <p>
                {queue[0]
                  ? `الدور التالي: ${queue[0].turn} · ${queue[0].name}`
                  : "بعد تأكيد الاستقبال، الطلب هيظهر في الطابور."}
              </p>
              <button
                className="portal-button primary"
                disabled={props.busy || queue.length === 0}
                onClick={props.onCall}
              >
                نداء التالي
                <ArrowLeft size={17} />
              </button>
            </div>
          )}
          <div className="clinical-unavailable">
            <LockKeyhole size={17} />
            <p>
              الملاحظات الطبية، الوصفات والتسجيل الصوتي غير مفعلة. التجربة دي
              للحجز وحركة الطابور فقط.
            </p>
          </div>
        </section>
        <section className="portal-panel doctor-queue">
          <div className="portal-section-heading">
            <h2>طابور الانتظار</h2>
            <span className="portal-count">{queue.length}</span>
          </div>
          {queue.length === 0 ? (
            <Empty>لا توجد طلبات مؤكدة في الانتظار.</Empty>
          ) : (
            <div className="portal-booking-list">
              {queue.map((b) => (
                <article key={b.id} data-booking-id={b.id}>
                  <div className="portal-row-heading">
                    <div className="queue-person">
                      <span className="queue-turn">{b.turn}</span>
                      <div>
                        <h3>{b.name}</h3>
                        <small>
                          {b.type === "followup" ? "متابعة" : "كشف جديد"}
                        </small>
                      </div>
                    </div>
                    <Badge booking={b} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </Frame>
  );
}
