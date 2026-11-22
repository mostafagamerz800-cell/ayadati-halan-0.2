import {PILOT,pilotBookings,pilotSubscribe,pilotLastId,ownPilotBooking,pilotRole,addPilotBooking,updatePilotBooking,confirmPilot,callPilot,finishPilot} from './pilotBackend';
// ============================================================
// DEV-COPY ONLY — Stage 1 local implementation (approved scope).
// Shared booking store for the booking -> reception -> queue -> turn chain.
// Persists to localStorage and syncs LIVE between tabs on THIS device
// via BroadcastChannel (+ storage event fallback).
// Stage 2 (separate explicit approval) replaces this module's internals
// with Firestore so the same chain works across real devices.
// All data here stays fake demo data. No real patient data allowed.
// ============================================================

export type MvpBookingStatus =
  | 'requested'   // patient sent the booking request
  | 'confirmed'   // reception confirmed -> has a turn number
  | 'arrived'     // reception marked the patient as arrived (waiting)
  | 'in-consult'  // called into the doctor's office
  | 'done'        // consultation finished
  | 'cancelled'   // request declined / booking cancelled
  | 'no-show';    // patient never arrived

export interface MvpBooking {
  id: string;
  name: string;
  phone: string;
  type: string;       // 'new' | 'followup'
  date: string;       // preferred date (yyyy-mm-dd) or ''
  note: string;
  status: MvpBookingStatus;
  turn: number | null;
  createdAt: number;
  updatedAt: number;
  createdBy?: string; // auth uid of the creator (Firestore mode; rules enforce it)
}

// Single-clinic demo scope (Stage 1): one shared store for the dev copy.
export const MVP_STORE_KEY = 'ayadati_mvp_bookings_v1';
const MVP_LAST_KEY = 'ayadati_mvp_last_booking_v1';
const MVP_CHANNEL = 'ayadati_mvp_sync_v1';

let bc: BroadcastChannel | null = null;
function channel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!bc) bc = new BroadcastChannel(MVP_CHANNEL);
  return bc;
}

export function loadBookings(): MvpBooking[] {
  if(PILOT) return pilotBookings();
  // Fresh copy: listener-driven re-renders rely on reference change even
  // when the underlying cache array was not rebuilt (patient mirror path).
  if (FS_MODE) return [...fsCache];
  try {
    const raw = localStorage.getItem(MVP_STORE_KEY);
    return raw ? (JSON.parse(raw) as MvpBooking[]) : [];
  } catch {
    return [];
  }
}

// Same-tab listeners: BroadcastChannel and the storage event only reach
// OTHER tabs, so local subscribers are notified directly after persist.
const localListeners = new Set<() => void>();

function persist(list: MvpBooking[]) {
  try {
    localStorage.setItem(MVP_STORE_KEY, JSON.stringify(list));
    channel()?.postMessage({ type: 'sync' });
  } catch {
    /* storage full / blocked — dev demo, ignore */
  }
  localListeners.forEach((fn) => fn());
}

// ============================================================
// FIRESTORE-EMULATOR BACKEND (approved dev-only scope).
// Activated with ?backend=firestore. Uses a SEPARATE Firebase app
// ('mvp-emu') with a dummy config that points ONLY at the local
// Firebase emulators (Auth 9099 / Firestore 8081). The live project
// config from lib/firebase.ts is never initialized on this path.
// Anonymous auth + repo firestore.rules are exercised for real;
// data lives in the local emulator only. Default (no param) stays
// the localStorage + BroadcastChannel mode above.
//
// Turn assignment is transactional + idempotent in BOTH modes:
// confirming an already-confirmed request keeps its turn; two
// concurrent confirms never share a turn.
// ============================================================
const FS_MODE = !PILOT &&
  typeof window !== 'undefined' &&
  ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname) &&
  new URLSearchParams(window.location.search).get('backend') === 'firestore';
const FS_COL = 'clinics/demo-clinic-1/bookings';
const FS_QCOL = 'clinics/demo-clinic-1/queuePublic';

let fsCache: MvpBooking[] = [];
let fsPublicCache: { id: string; turn: number | null; status: MvpBooking['status'] }[] = [];
let fsOwnBooking: MvpBooking | null = null;
let fsListDenied = false;
let fsReady = false;
let fsInit: Promise<void> | null = null;
let fsDb: any = null;
let fsAuthUid: string | null = null;
let fsApi: any = null;

async function initFs(): Promise<void> {
  if (fsInit) return fsInit;
  fsInit = (async () => {
    try {
      const { initializeApp } = await import('firebase/app');
      const { getAuth, connectAuthEmulator, signInAnonymously } = await import('firebase/auth');
      const fs = await import('firebase/firestore');
      const app = initializeApp(
        { apiKey: 'demo-key', authDomain: 'demo-ayadati.local', projectId: 'demo-ayadati', appId: 'demo-app' },
        'mvp-emu',
      );
      const auth = getAuth(app);
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      fsDb = fs.getFirestore(app);
      fs.connectFirestoreEmulator(fsDb, '127.0.0.1', 8081);
      await signInAnonymously(auth);
      fsAuthUid = auth.currentUser?.uid ?? null;
      fsApi = fs;
      (window as any).__mvpAuthUid = fsAuthUid;
      fs.onSnapshot(fs.collection(fsDb, FS_COL), (snap) => {
        fsCache = snap.docs.map((d) => d.data() as MvpBooking);
        const first = !fsReady;
        fsReady = true;
        (window as any).__mvpFsReady = true;
        localListeners.forEach((fn) => fn());
        if (first && fsCache.length === 0 &&
            new URLSearchParams(window.location.search).get('seed') === '1') {
          // Demo seeding in FS mode goes through scripts/seed-demo.mjs
          // (admin path): the rules only allow patients to create
          // 'requested' bookings, so a pre-confirmed seed cannot come
          // from the client API by design.
          console.info('MVP: empty store — seed with: node scripts/seed-demo.mjs');
        }
      }, (err: any) => {
        // Not staff (or profile not provisioned yet): the rules deny the
        // full queue list. Fall back to the privacy-safe patient path:
        // public turn/status mirror + this session's own booking only.
        console.info('MVP: staff queue list denied — switching to patient-safe reads', String(err).slice(0, 120));
        fsListDenied = true;
        (window as any).__mvpListDenied = true;
        fs.onSnapshot(fs.collection(fsDb, FS_QCOL), (qsnap: any) => {
          fsPublicCache = qsnap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }));
          fsReady = true;
          (window as any).__mvpFsReady = true;
          localListeners.forEach((fn) => fn());
        });
        const lastId = getLastBookingId();
        if (lastId) attachOwnListener(lastId);
      });
    } catch (err) {
      (window as any).__mvpFsError = String(err);
      console.error('MVP emulator backend init failed', err);
    }
  })();
  return fsInit;
}

// On a denied/failed write, re-read the collection so the optimistic
// cache never drifts from the rules-enforced truth.
async function fsRefreshCache() {
  if (fsListDenied) return; // patient path: nothing staff-shaped to refresh
  const snap = await fsApi.getDocs(fsApi.collection(fsDb, FS_COL));
  fsCache = snap.docs.map((d: any) => d.data() as MvpBooking);
  localListeners.forEach((fn) => fn());
}

// Patient-path own-booking listener (rules allow GET only when
// createdBy == uid, i.e. bookings this session created itself).
function attachOwnListener(id: string) {
  if (!fsApi || !fsDb) return;
  fsApi.onSnapshot(fsApi.doc(fsDb, FS_COL, id), (dsnap: any) => {
    fsOwnBooking = dsnap.exists() ? (dsnap.data() as MvpBooking) : null;
    (window as any).__mvpOwnBooking = fsOwnBooking;
    localListeners.forEach((fn) => fn());
  }, (err: any) => { console.error('MVP own-booking listener failed', err); fsOwnBooking = null; (window as any).__mvpOwnBooking = null; (window as any).__mvpOwnError = String(err); localListeners.forEach((fn) => fn()); });
}

export function isFsListDenied(): boolean { return PILOT ? pilotRole()==='patient' : fsListDenied; }
export function getFsPublicQueue() { return fsPublicCache; }
export function getFsOwnBooking(): MvpBooking | null { return fsOwnBooking; }

async function fsRun(mutate: () => Promise<void>) {
  await initFs();
  try {
    await mutate();
  } catch (err) {
    console.error('MVP emulator write failed (rules?)', err);
    (window as any).__mvpLastWriteError = String(err);
    await fsRefreshCache().catch(() => {});
    throw err;
  }
}

// Transactional + idempotent confirm. Turn numbers come from a counter
// doc incremented inside the same transaction, so two concurrent confirms
// can never share a turn; a repeated confirm keeps the existing turn.
const FS_COUNTER = 'clinics/demo-clinic-1/meta/turnCounter';
export async function confirmBookingFs(id: string): Promise<void> {
 if(PILOT) return confirmPilot(id);
  await fsRun(async () => {
    await fsApi.runTransaction(fsDb, async (tx: any) => {
      const ref = fsApi.doc(fsDb, FS_COL, id);
      const counterRef = fsApi.doc(fsDb, FS_COUNTER);
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const cur = snap.data() as MvpBooking;
      if (cur.status !== 'requested') return; // idempotent: already decided
      const csnap = await tx.get(counterRef);
      const next = csnap.exists() ? ((csnap.data().next as number) ?? 1) : 1;
      const now = Date.now();
      tx.update(ref, { status: 'confirmed', turn: next, updatedAt: now });
      tx.set(fsApi.doc(fsDb, FS_QCOL, id), { status: 'confirmed', turn: next, updatedAt: now }, { merge: true });
      tx.set(counterRef, { next: next + 1 }, { merge: true });
    });
  });
}

// Call-next with revalidation: pick the lowest waiting turn, then move it
// in a single-doc transaction; if a concurrent caller moved it first,
// re-read and take the next one (bounded attempts).
// Call-next with revalidation AND the single-doctor invariant: at most
// one patient may be in examination. A queue-state doc is read+written in
// the same transaction as the booking, so two concurrent call-next clicks
// can never seat a second patient; reception finishes the current one first.
const FS_QSTATE = 'clinics/demo-clinic-1/meta/queueState';
export async function callNextFs(): Promise<void> {
 if(PILOT) return callPilot();
  await fsRun(async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const snap = await fsApi.getDocs(fsApi.collection(fsDb, FS_COL));
      // Existing active entries, including older seeds without queueState,
      // must also block admission. Concurrent new entries are serialized below.
      if (snap.docs.some((d: any) => d.data().status === 'in-consult')) return;
      const candidate = snap.docs
        .map((d: any) => ({ ...(d.data() as MvpBooking), id: d.id }))
        .filter((b: MvpBooking) => b.status === 'arrived' || b.status === 'confirmed')
        .sort((a: MvpBooking, b: MvpBooking) => (a.turn ?? 99) - (b.turn ?? 99))[0];
      if (!candidate) return;
      let moved = false;
      try {
        await fsApi.runTransaction(fsDb, async (tx: any) => {
          const stateRef = fsApi.doc(fsDb, FS_QSTATE);
          const state = (await tx.get(stateRef)).data() as any;
          if (state?.currentInConsult) throw new Error('mvp-callnext-busy');
          const ref = fsApi.doc(fsDb, FS_COL, candidate.id);
          const cur = (await tx.get(ref)).data() as MvpBooking | undefined;
          if (cur && (cur.status === 'arrived' || cur.status === 'confirmed')) {
            const now = Date.now();
            tx.update(ref, { status: 'in-consult', updatedAt: now });
            tx.set(fsApi.doc(fsDb, FS_QCOL, candidate.id), { status: 'in-consult', updatedAt: now }, { merge: true });
            tx.set(stateRef, { currentInConsult: candidate.id }, { merge: true });
          } else {
            // Abort without committing: a concurrent caller already moved this
            // patient. The loop re-reads and takes the next one.
            throw new Error('mvp-callnext-noop');
          }
        });
        moved = true; // set only when the transaction actually committed
      } catch (err) {
        if (String(err).includes('mvp-callnext-busy')) return; // room occupied: no-op
        if (!String(err).includes('mvp-callnext-noop')) throw err;
      }
      if (moved) return;
    }
  });
}

// Finish the in-consult patient and free the examination room atomically.
export async function finishBookingFs(id: string): Promise<void> {
 if(PILOT) return finishPilot(id);
  await fsRun(async () => {
    await fsApi.runTransaction(fsDb, async (tx: any) => {
      const stateRef = fsApi.doc(fsDb, FS_QSTATE);
      const ref = fsApi.doc(fsDb, FS_COL, id);
      const state = (await tx.get(stateRef)).data() as any;
      const cur = (await tx.get(ref)).data() as MvpBooking | undefined;
      if (!cur || cur.status !== 'in-consult') return;
      const now = Date.now();
      tx.update(ref, { status: 'done', updatedAt: now });
      tx.set(fsApi.doc(fsDb, FS_QCOL, id), { status: 'done', updatedAt: now }, { merge: true });
      if (state?.currentInConsult === id) tx.set(stateRef, { currentInConsult: null }, { merge: true });
    });
  });
}

// ---- Cross-tab mutex for the localStorage mode (best-effort atomicity) ----
const LOCK_KEY = 'ayadati_mvp_lock_v1';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function acquireStoreLock(): Promise<string> {
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  for (let tries = 0; tries < 100; tries++) {
    try {
      const raw = localStorage.getItem(LOCK_KEY);
      const lock = raw ? JSON.parse(raw) : null;
      if (!lock || Date.now() - lock.ts > 5000) {
        localStorage.setItem(LOCK_KEY, JSON.stringify({ token, ts: Date.now() }));
        const check = JSON.parse(localStorage.getItem(LOCK_KEY) || '{}');
        if (check.token === token) return token;
      }
    } catch { /* storage blocked — proceed unlocked in dev */ return token; }
    await sleep(40);
  }
  return token; // dev demo: give up waiting, proceed
}
function releaseStoreLock(token: string) {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (raw && JSON.parse(raw).token === token) localStorage.removeItem(LOCK_KEY);
  } catch { /* ignore */ }
}

// Idempotent confirm (localStorage mode), serialized across tabs.
export async function confirmBookingLocal(b: MvpBooking): Promise<void> {
  if (b.status !== 'requested') return;
  const token = await acquireStoreLock();
  try {
    const cur = loadBookings().find((x) => x.id === b.id);
    if (!cur || cur.status !== 'requested') return; // someone else confirmed it
    updateBooking(b.id, { status: 'confirmed', turn: nextTurn(loadBookings()) });
  } finally {
    releaseStoreLock(token);
  }
}

// Serialized call-next (localStorage mode) — same single-doctor invariant.
export async function callNextLocal(): Promise<void> {
  const token = await acquireStoreLock();
  try {
    const list = loadBookings();
    if (list.some((b) => b.status === 'in-consult')) return; // room occupied: no-op
    const next = list
      .filter((b) => b.status === 'arrived' || b.status === 'confirmed')
      .sort((a, b) => (a.turn ?? 99) - (b.turn ?? 99))[0];
    if (next) updateBooking(next.id, { status: 'in-consult' });
  } finally {
    releaseStoreLock(token);
  }
}

export const isFsMode = () => PILOT || FS_MODE;

if (FS_MODE) {
  void initFs();
  // Dev/test hooks (emulator mode only, never in the default build path UI).
  (window as any).__mvpDevSync = { updateBooking, addBooking, confirmBookingFs, callNextFs, finishBookingFs, loadBookings, getFsCache: () => fsCache };
}

export function addBooking(data: {
  name: string;
  phone: string;
  type: string;
  date: string;
  note: string;
}): MvpBooking | Promise<MvpBooking> {
  if(PILOT) return addPilotBooking(data);
  const booking: MvpBooking = {
    id: `mvp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name: data.name,
    phone: data.phone,
    type: data.type,
    date: data.date,
    note: data.note,
    status: 'requested',
    turn: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  if (FS_MODE) {
    fsCache = [...fsCache, booking];
    localListeners.forEach((fn) => fn());
    void (async () => {
      await initFs();
      const withCreator = { ...booking, createdBy: fsAuthUid ?? 'unknown' };
      await fsApi.setDoc(fsApi.doc(fsDb, FS_COL, booking.id), withCreator);
      await fsApi.setDoc(fsApi.doc(fsDb, FS_QCOL, booking.id), { turn: null, status: 'requested', updatedAt: Date.now() });
      if (fsListDenied) attachOwnListener(booking.id);
    })().catch(async (err) => {
      console.error('MVP emulator add failed', err);
      await fsRefreshCache().catch(() => {});
    });
    try { localStorage.setItem(MVP_LAST_KEY, booking.id); } catch {}
    return booking;
  }
  const list = loadBookings();
  list.push(booking);
  persist(list);
  try {
    localStorage.setItem(MVP_LAST_KEY, booking.id);
  } catch {}
  return booking;
}

export function getLastBookingId(): string | null {
 if(PILOT) return pilotLastId();
  try {
    return localStorage.getItem(MVP_LAST_KEY);
  } catch {
    return null;
  }
}

export function updateBooking(
  id: string,
  patch: Partial<Pick<MvpBooking, 'status' | 'turn'>>,
) {
  if(PILOT) { void updatePilotBooking(id,patch).catch(()=>{}); return; }
  if (FS_MODE) {
    // optimistic cache; reverted automatically if the rules deny the write
    fsCache = fsCache.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b));
    localListeners.forEach((fn) => fn());
    void fsRun(async () => {
      const now = Date.now();
      await fsApi.updateDoc(fsApi.doc(fsDb, FS_COL, id), { ...patch, updatedAt: now });
      const pubPatch: any = { updatedAt: now };
      if (patch.status !== undefined) pubPatch.status = patch.status;
      if (patch.turn !== undefined) pubPatch.turn = patch.turn;
      await fsApi.setDoc(fsApi.doc(fsDb, FS_QCOL, id), pubPatch, { merge: true });
    }).catch(() => {});
    return;
  }
  const list = loadBookings().map((b) =>
    b.id === id ? { ...b, ...patch, updatedAt: Date.now() } : b,
  );
  persist(list);
}

// Next free turn among active queue entries (confirmed/arrived/in-consult).
export function nextTurn(list: MvpBooking[]): number {
  const turns = list
    .filter((b) => ['confirmed', 'arrived', 'in-consult'].includes(b.status))
    .map((b) => b.turn ?? 0);
  return turns.length ? Math.max(...turns) + 1 : 1;
}

// Subscribe to live changes (BroadcastChannel + storage event fallback).
export function subscribeBookings(onChange: () => void): () => void {
 if(PILOT) return pilotSubscribe(onChange);
  if (FS_MODE) void initFs();
  const c = channel();
  const handler = () => onChange();
  localListeners.add(handler);
  c?.addEventListener('message', handler);
  window.addEventListener('storage', handler);
  return () => {
    localListeners.delete(handler);
    c?.removeEventListener('message', handler);
    window.removeEventListener('storage', handler);
  };
}

// Dev-screenshot / demo seeding: two fake bookings through the chain.
export function seedMvpDemo() {
 if(PILOT) return;
  if (FS_MODE) return; // emulator mode seeds after the first snapshot (see initFs)
  if (loadBookings().length > 0) return;
  const now = Date.now();
  const list: MvpBooking[] = [
    {
      id: 'mvp-seed-1',
      name: 'Demo Patient One',
      phone: '01000000001',
      type: 'new',
      date: new Date().toISOString().slice(0, 10),
      note: 'Seeded demo request',
      status: 'requested',
      turn: null,
      createdAt: now - 1000 * 60 * 9,
      updatedAt: now - 1000 * 60 * 9,
    },
    {
      id: 'mvp-seed-2',
      name: 'Demo Patient Two',
      phone: '01000000002',
      type: 'followup',
      date: new Date().toISOString().slice(0, 10),
      note: 'Seeded demo confirmed',
      status: 'arrived',
      turn: 1,
      createdAt: now - 1000 * 60 * 30,
      updatedAt: now - 1000 * 60 * 5,
    },
  ];
  persist(list);
  try {
    localStorage.setItem(MVP_LAST_KEY, 'mvp-seed-2');
  } catch {}
}
