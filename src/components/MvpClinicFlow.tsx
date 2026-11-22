import { ClinicIllustration } from './ClinicIllustration';
// ============================================================
// DEV-COPY ONLY — Stage 1 MVP panels (approved scope).
// Reception inbox + queue panel, and patient live-status card,
// wired to the shared dev store in lib/devSync.ts.
// 60/30/10 palette: neutral surfaces (60), deep blue #214f45 family (30),
// teal #ae8735 reserved for CTA actions only (10) — see mvp.css.
// ============================================================
import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Phone,
  CheckCircle2,
  XCircle,
  Megaphone,
  BellRing,
  Users,
  Hash,
  CheckCheck,
  UserX,
  ClipboardList,
  User,
  Stethoscope,
} from 'lucide-react';
import { loadBookings, subscribeBookings, updateBooking, getLastBookingId, confirmBookingFs, callNextFs, finishBookingFs, confirmBookingLocal, callNextLocal, isFsMode, type MvpBooking, isFsListDenied, getFsPublicQueue, getFsOwnBooking } from '../lib/devSync';

export function useMvpBookings(): MvpBooking[] {
  const [list, setList] = useState<MvpBooking[]>(() => loadBookings());
  useEffect(() => subscribeBookings(() => setList(loadBookings())), []);
  return list;
}

const statusLabel: Record<string, string> = {
  requested: 'طلب جديد',
  confirmed: 'مؤكد',
  arrived: 'وصل — منتظر',
  'in-consult': 'في الكشف',
  done: 'خلص',
  cancelled: 'اتلغى',
  'no-show': 'ميجاش',
};

const statusClass: Record<string, string> = {
  requested: 'mvp-badge mvp-badge-new',
  confirmed: 'mvp-badge mvp-badge-confirmed',
  arrived: 'mvp-badge mvp-badge-waiting',
  'in-consult': 'mvp-badge mvp-badge-inconsult',
  done: 'mvp-badge mvp-badge-done',
  cancelled: 'mvp-badge mvp-badge-muted',
  'no-show': 'mvp-badge mvp-badge-muted',
};

export const ReceptionMvpPanel: React.FC = () => {
  const bookings = useMvpBookings();
  const requests = bookings.filter((b) => b.status === 'requested');
  const queue = bookings
    .filter((b) => ['confirmed', 'arrived', 'in-consult'].includes(b.status))
    .sort((a, b) => (a.turn ?? 99) - (b.turn ?? 99));
  const inConsult = queue.find((b) => b.status === 'in-consult');
  const waitingCount = queue.filter((b) => b.status === 'arrived' || b.status === 'confirmed').length;

  // Confirm/call-next are transactional + idempotent (see devSync):
  // concurrent or repeated clicks can never duplicate a turn.
  const confirm = (b: MvpBooking) =>
    void (isFsMode() ? confirmBookingFs(b.id) : confirmBookingLocal(b)).catch(() => {});
  const decline = (b: MvpBooking) => updateBooking(b.id, { status: 'cancelled' });
  const markArrived = (b: MvpBooking) => updateBooking(b.id, { status: 'arrived' });
  const callNext = () => void (isFsMode() ? callNextFs() : callNextLocal()).catch(() => {});
  // Finish frees the examination room atomically (single-doctor invariant).
  const finish = (b: MvpBooking) =>
    isFsMode() ? void finishBookingFs(b.id).catch(() => {}) : updateBooking(b.id, { status: 'done' });
  const noShow = (b: MvpBooking) => updateBooking(b.id, { status: 'no-show' });

  return (
    <section dir="rtl" className="mvp-card p-5 space-y-4" aria-label="مسار الحجز والطابور التجريبي">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--mvp-navy)' }}>
          <ClipboardList size={20} style={{ color: 'var(--mvp-primary)' }} />
          مسار الحجز التجريبي — من الطلب للطابور
        </h2>
        <span className="text-[11px] font-semibold" style={{ color: 'var(--mvp-muted)' }}>
          بيانات وهمية — نسخة تطوير، بتحدث لحظيًا بين تبويبات الجهاز
        </span>
      </div>

      {/* Stacked panels so the queue table gets the full content width
          (TabibSoft pattern: one large attendance table as the main area). */}
      <div className="reception-operational-grid space-y-4">
        {/* Inbox: new booking requests */}
        <div className="reception-inbox rounded-xl border p-3" style={{ borderColor: 'var(--mvp-line)', background: 'var(--mvp-bg)' }}>
          <h3 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--mvp-primary)' }}>
            <CalendarCheck size={17} /> طلبات الحجز الجديدة
            <span className="mvp-badge mvp-badge-new">{requests.length}</span>
          </h3>
          {requests.length === 0 && (
            <p className="text-xs py-4 text-center" style={{ color: 'var(--mvp-muted)' }}>مفيش طلبات جديدة — جرّب تبعت حجز من صفحة العيادة.</p>
          )}
          <ul className="space-y-2">
            {requests.map((b) => (
              <li key={b.id} className="bg-white rounded-xl p-3 border" style={{ borderColor: 'var(--mvp-line)' }}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: 'var(--mvp-navy)' }}>{b.name}</p>
                    <p className="text-[11px] flex items-center gap-1" style={{ color: 'var(--mvp-muted)' }}>
                      <Phone size={12} /> <span dir="ltr">{b.phone}</span> • {b.type === 'new' ? 'كشف جديد' : 'استشارة/متابعة'} • <span dir="ltr" className="whitespace-nowrap">{b.date || 'أقرب ميعاد'}</span>
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => confirm(b)} className="mvp-cta-tonal text-xs px-3 py-2 flex items-center gap-1">
                      <CheckCircle2 size={14} /> تأكيد
                    </button>
                    <button onClick={() => decline(b)} className="mvp-ghost-danger text-xs px-3 py-2 flex items-center gap-1">
                      <XCircle size={14} /> رفض
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Live queue — organized as one operational system:
            current patient hero (QClinic "in the room now" pattern),
            then the waiting list as a scannable structured table (TabibSoft pattern). */}
        <div className="reception-queue rounded-xl border p-3" style={{ borderColor: 'var(--mvp-line)', background: 'var(--mvp-bg)' }}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--mvp-primary)' }}>
              <Users size={17} /> طابور اليوم
              <span className="mvp-badge mvp-badge-waiting">{waitingCount} منتظر</span>
            </h3>
            <button
              onClick={callNext}
              disabled={!!inConsult}
              title={inConsult ? 'خلّص الكشف الحالي الأول، وبعدين نادِ اللي بعده' : undefined}
              className={`mvp-cta text-xs px-3 py-2 flex items-center gap-1 ${inConsult ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <BellRing size={14} /> نداء التالي
            </button>
          </div>

          {/* Current patient hero, the dominant operational focus.
              QClinic pattern: the in-room patient gets its own prominent band. */}
          {inConsult && (
            <div className="mvp-hero mb-2" role="status">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="mvp-hero-icon"><Stethoscope size={18} /></span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold truncate" style={{ color: 'var(--mvp-navy)' }}>
                    في الكشف دلوقتي: دور #{inConsult.turn} — {inConsult.name}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--mvp-muted)' }}>
                    لما الكشف يخلص اضغط «خلص»، وبعدها نادِ اللي بعده.
                  </p>
                </div>
              </div>
              <button onClick={() => finish(inConsult)} className="mvp-cta text-xs px-4 py-2 flex items-center gap-1 shrink-0">
                <CheckCheck size={14} /> خلص
              </button>
            </div>
          )}
          {queue.length === 0 && (
            <p className="text-xs py-4 text-center" style={{ color: 'var(--mvp-muted)' }}>الطابور فاضي — أكّد طلب حجز عشان يدخل الطابور بدور.</p>
          )}
          {queue.length > 0 && (
            <div>
              {/* Table header — desktop only (TabibSoft: predictable columns for fast scanning) */}
              <div className="mvp-queue-head hidden md:grid" aria-hidden="true">
                <span>الدور</span><span>المريض</span><span>الزيارة</span><span>الحالة</span><span></span>
              </div>
              <ul>
                {queue.map((b) => (
                  <li key={b.id} className="mvp-queue-row">
                    <span className="mvp-turn"><Hash size={13} />{b.turn}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate" style={{ color: 'var(--mvp-navy)' }}>{b.name}</p>
                      <p className="text-[11px] md:hidden" style={{ color: 'var(--mvp-muted)' }}>
                        {b.type === 'new' ? 'كشف جديد' : 'استشارة/متابعة'}
                      </p>
                    </div>
                    <span className="hidden md:block text-xs" style={{ color: 'var(--mvp-muted)' }}>
                      {b.type === 'new' ? 'كشف جديد' : 'استشارة/متابعة'}
                    </span>
                    <span className={statusClass[b.status]}>{statusLabel[b.status]}</span>
                    <div className="flex gap-1.5 md:justify-end items-center">
                      {b.status === 'confirmed' && (
                        <button onClick={() => markArrived(b)} className="mvp-outline text-[11px] px-2.5 py-1.5">وصل</button>
                      )}
                      {b.status === 'arrived' && (
                        <span className="text-[11px]" style={{ color: 'var(--mvp-muted)' }}>بانتظار النداء</span>
                      )}
                      {b.status !== 'in-consult' && (
                        <button onClick={() => noShow(b)} className="mvp-ghost-danger text-[11px] px-2.5 py-1.5 flex items-center gap-1">
                          <UserX size={13} /> ميجاش
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export const PatientMvpStatus: React.FC<{ doctorName?: string; clinicName?: string; onBook?: () => void }> = ({ doctorName, clinicName, onBook }) => {
  const bookings = useMvpBookings();
  const lastId = getLastBookingId();
  let mine: any;
  let inConsultTurn: number | null = null;
  let ahead = 0;
  if (isFsMode() && isFsListDenied()) {
    // Privacy-safe patient path (Firestore mode, non-staff session): the
    // rules serve only this session's own booking; everyone else's queue
    // position comes from the turn/status-only public mirror.
    mine = getFsOwnBooking();
    const pub = getFsPublicQueue();
    inConsultTurn = pub.filter((q) => q.status === 'in-consult')
      .sort((a, b) => (a.turn ?? 99) - (b.turn ?? 99))[0]?.turn ?? null;
    ahead = mine && (mine.status === 'confirmed' || mine.status === 'arrived') && mine.turn != null
      ? pub.filter((q) => ['confirmed', 'arrived'].includes(q.status) && q.turn != null && q.turn < (mine.turn ?? 99)).length
      : 0;
  } else {
    // Prefer the device-owned booking; otherwise the active queue entry
    // (lowest turn), else the most recently created request.
    mine = bookings.find((b) => b.id === lastId)
      || bookings.filter((b) => ['arrived', 'in-consult', 'confirmed'].includes(b.status))
          .sort((a, b) => (a.turn ?? 99) - (b.turn ?? 99))[0]
      || [...bookings].sort((a, b) => b.createdAt - a.createdAt)[0];
    inConsultTurn = bookings.find((b) => b.status === 'in-consult')?.turn ?? null;
    ahead = mine && (mine.status === 'confirmed' || mine.status === 'arrived')
      ? bookings.filter((b) => ['confirmed', 'arrived'].includes(b.status) && (b.turn ?? 99) < (mine.turn ?? 99)).length
      : 0;
  }

  if (!mine) return <section className="patient-empty-status" dir="rtl" aria-labelledby="patient-empty-title">
    <ClinicIllustration kind="search" className="empty-art" />
    <h2 id="patient-empty-title">لسه مفيش طلب حجز تجريبي</h2>
    <p>بعد ما تجرّب طلب موعد، تقدر تتابع حالته من هنا.</p>
    {onBook && <button type="button" onClick={onBook} className="clinic-button primary">استكشف طلب موعد</button>}
  </section>;

  return (
    <div className="patient-live-content" dir="rtl">
      <div className="patient-live-brand"><Stethoscope size={32} /><h1>{clinicName || 'عيادتي حالا'}</h1><p>أهلًا، {mine.name}</p></div>
      <section dir="rtl" className="patient-live-card" aria-label="حالة حجزي التجريبية">
        <h2 className="patient-live-label">حجزي — متابعة لحظية</h2>
        {mine.turn != null && <><p className="patient-live-label">رقم دورك</p><p className="patient-live-turn" aria-label={`رقم دورك ${mine.turn}`}>{String(mine.turn).padStart(2, '0')}</p></>}
        {(mine.status === 'confirmed' || mine.status === 'arrived') && <p className="patient-live-label">عدد المرضى قبلك في الطابور</p>}
        {(mine.status === 'confirmed' || mine.status === 'arrived') && <>
          <p className="patient-live-number">{ahead > 0 ? `قدامك ${ahead}` : 'انت التالي'}</p>
          {ahead > 0 && <p className="patient-live-eta">الوقت المتوقع: حوالي {ahead * 10} دقيقة <small>(مثال تجريبي، مش ميعاد مؤكد)</small></p>}
        </>}
        {mine.status === 'requested' && <p className="patient-live-message">طلبك وصل الاستقبال — هيتأكد وياخد رقم دور.</p>}
        {mine.status === 'in-consult' && <p className="patient-live-message">اتنادى عليك — اتفضل لعيادة الدكتور.</p>}
        {['done','cancelled','no-show'].includes(mine.status) && <p className="patient-live-message">{statusLabel[mine.status]}</p>}
        <p className="patient-live-doctor"><span><Stethoscope size={21}/></span>{doctorName || 'الدكتور'}</p>
        <p className="patient-live-meta">دور #{mine.turn ?? '—'} <span className={statusClass[mine.status]}>{statusLabel[mine.status]}</span></p>
        <p className="patient-live-reassurance">الدور بيتحدّث تلقائيًا — مفيش داعي تعمل تحديث للصفحة.{inConsultTurn != null ? ` في الكشف دلوقتي دور #${inConsultTurn}.` : ''}</p>
      </section>
      <p className="patient-live-demo">بيانات وهمية — نسخة تطوير محلية</p>
    </div>
  );
};
