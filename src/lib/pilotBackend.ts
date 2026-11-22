import {onAuthStateChanged} from 'firebase/auth';
import {collection,doc,getDoc,getDocs,onSnapshot,query,where,setDoc,updateDoc,runTransaction} from 'firebase/firestore';
import {auth,db} from './firebase';
import type {MvpBooking} from './devSync';
export const PILOT = import.meta.env.VITE_SECURE_PILOT === 'true';
export const CLINIC = 'pilot-clinic-1';
const base=`clinics/${CLINIC}`;
const bookings=()=>collection(db,`${base}/bookings`);
let cache:MvpBooking[]=[], role='patient', stop=()=>{}, error='', generation=0;
const listeners=new Set<()=>void>();
const emit=()=>listeners.forEach(f=>f());
export const pilotBookings=()=>[...cache];
export const pilotRole=()=>role;
export const pilotError=()=>error;
export const pilotSubscribe=(f:()=>void)=>{listeners.add(f);return ()=>{listeners.delete(f);}};
export const ownPilotBooking=()=>cache.filter(x=>x.createdBy===auth.currentUser?.uid).sort((a,b)=>b.createdAt-a.createdAt)[0]||null;
export const pilotLastId=()=>ownPilotBooking()?.id||null;
export async function loadPilotRole(uid:string){
 const snap=await getDoc(doc(db,`${base}/members/${uid}`));
 const value=snap.exists()?snap.data().role:'patient';
 return ['doctor','receptionist'].includes(value)?value:'patient';
}
export async function pilotAction<T>(fn:()=>Promise<T>):Promise<T>{
 error='';emit();try{return await fn();}catch(e){error='التغيير ما اتحفظش. حدّث الصفحة وراجع الحالة، وبعدين حاول تاني لو لسه محتاج. مفيش تأكيد نجاح قبل الحفظ.';emit();throw e;}
}
if(PILOT) onAuthStateChanged(auth,async user=>{
 const current=++generation;stop();cache=[];role='patient';error='';emit();
 if(!user)return;
 try {
  const uid=user.uid; const nextRole=await loadPilotRole(uid);
  if(current!==generation||auth.currentUser?.uid!==uid)return;
  role=nextRole;
  const source=role==='patient'?query(bookings(),where('createdBy','==',uid)):bookings();
  stop=onSnapshot(source,s=>{if(current!==generation||auth.currentUser?.uid!==uid)return;cache=s.docs.map(x=>x.data() as MvpBooking);emit();},()=>{if(current!==generation)return;cache=[];error='تعذر تحميل الحجوزات. البيانات مش متاحة من الجهاز ده حاليًا.';emit();});
  emit();
 } catch {if(current!==generation)return;error='تعذر التحقق من صلاحية الحساب. مش هنعرض بيانات عيادة.';emit();}
});
export async function addPilotBooking(data:{name:string;phone:string;type:string;date:string;note:string}):Promise<MvpBooking>{
 return pilotAction(async()=>{
  const user=auth.currentUser;if(!user||user.isAnonymous)throw Error('Sign in first');
  if(data.note.trim())throw Error('No clinical notes in fake pilot');
  const ref=doc(bookings()),now=Date.now();
  const b:MvpBooking={...data,note:'',id:ref.id,status:'requested',turn:null,createdBy:user.uid,createdAt:now,updatedAt:now};
  await setDoc(ref,b);return b;
 });
}
export async function updatePilotBooking(id:string,patch:Partial<Pick<MvpBooking,'status'|'turn'>>){
 return pilotAction(()=>updateDoc(doc(bookings(),id),{...patch,updatedAt:Date.now()}));
}
export async function confirmPilot(id:string){return pilotAction(()=>runTransaction(db,async tx=>{
 const b=doc(bookings(),id),c=doc(db,`${base}/meta/turnCounter`);
 const bs=await tx.get(b),cs=await tx.get(c);if(!bs.exists()||bs.data().status!=='requested')return;
 const next=cs.exists()?cs.data().next:1;
 tx.update(b,{status:'confirmed',turn:next,updatedAt:Date.now()});tx.set(c,{next:next+1,lastBookingId:id});
}));}
export async function callPilot(){return pilotAction(async()=>{
 const rows=(await getDocs(bookings())).docs.map(d=>d.data() as MvpBooking).filter(x=>['confirmed','arrived'].includes(x.status)).sort((a,b)=>(a.turn||0)-(b.turn||0));
 const candidate=rows[0];if(!candidate)return;
 await runTransaction(db,async tx=>{
  const s=doc(db,`${base}/meta/queueState`),b=doc(bookings(),candidate.id);
  const ss=await tx.get(s),bs=await tx.get(b);
  if(ss.exists()&&ss.data().currentInConsult)return;
  if(!bs.exists()||!['confirmed','arrived'].includes(bs.data().status))throw Error('Queue changed; retry');
  tx.update(b,{status:'in-consult',updatedAt:Date.now()});tx.set(s,{currentInConsult:candidate.id});
 });
});}
export async function finishPilot(id:string){return pilotAction(()=>runTransaction(db,async tx=>{
 const b=doc(bookings(),id),s=doc(db,`${base}/meta/queueState`);
 const bs=await tx.get(b),ss=await tx.get(s);
 if(!bs.exists()||bs.data().status!=='in-consult')return;
 if(!ss.exists()||ss.data().currentInConsult!==id)throw Error('Room state mismatch');
 tx.update(b,{status:'done',updatedAt:Date.now()});tx.set(s,{currentInConsult:null});
}));}
