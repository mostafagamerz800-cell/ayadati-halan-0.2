import {ThemeToggle} from './ThemeToggle';
import {ClinicExperience} from './ClinicExperience';
import './pilot.css';
import {useEffect,useState} from 'react';
import {useAuth} from '../context/AuthContext';
import {AuthScreen} from './AuthScreen';
import {BookingStepper} from './BookingStepper';
import {PilotNotice} from './PilotNotice';
import {ClinicIllustration} from './ClinicIllustration';
import {pilotSubscribe,pilotBookings,pilotRole,confirmPilot,callPilot,finishPilot,updatePilotBooking} from '../lib/pilotBackend';
import './clinic-polish.css';
const labels:Record<string,string>={requested:'طلب جديد',confirmed:'مؤكد',arrived:'وصل', 'in-consult':'في الكشف',done:'انتهى',cancelled:'ملغي','no-show':'لم يحضر'};
export function PilotApp(){
 const {currentUser,firebaseUser,loading,logout,error}=useAuth();
 const [,refresh]=useState(0);const [busy,setBusy]=useState(false);const [view,setView]=useState<'clinic'|'bookings'>('clinic');const [lang,setLang]=useState<'ar'|'en'>('ar');
 useEffect(()=>pilotSubscribe(()=>refresh(n=>n+1)),[]);
 const run=async(action:()=>Promise<unknown>)=>{if(busy)return;setBusy(true);try{await action();}catch{/* PilotNotice shows the error. */}finally{setBusy(false);}};
 if(loading)return <main dir="rtl" className="p-8">جاري التحقق من الحساب والصلاحيات...</main>;
 if(!currentUser)return <><ThemeToggle/><PilotNotice/><AuthScreen/>{firebaseUser&&<div dir="rtl" className="p-6"><p role="alert">{error||'تعذر التحقق من الحساب.'}</p><button className="clinic-button secondary" onClick={()=>logout()}>تسجيل الخروج</button></div>}</>;
 const role=pilotRole();
 const staff=role==='doctor'||role==='receptionist';
 const rows=pilotBookings().sort((a,b)=>b.createdAt-a.createdAt);
 const navigation=<nav dir="rtl" className="pilot-nav"><button className="clinic-button secondary" onClick={()=>setView('clinic')}>واجهة العيادة</button><button className="clinic-button primary" onClick={()=>setView('bookings')}>لوحة الحجوزات</button></nav>;
 if(view==='clinic')return <><ThemeToggle/><PilotNotice/>{navigation}<ClinicExperience tenantLabel="عيادة التجربة الواحدة" tenantId="pilot-clinic-1" lang={lang} onToggleLanguage={()=>setLang(lang==='ar'?'en':'ar')} onDirectory={()=>setView('bookings')} onLogout={()=>logout()} onSelectPortal={()=>setView('bookings')} onOpenSaasModal={()=>setView('bookings')}/></>;
 return <div dir="rtl" lang="ar" className="pilot-app min-h-screen">
  <ThemeToggle/><PilotNotice/>{navigation}
  <header className="flex flex-wrap justify-between items-center gap-4 max-w-6xl mx-auto px-6 py-6 border-b border-[#dce3d7]"><div><h1 className="text-2xl font-bold">عيادتي حالا</h1><p className="text-sm mt-1">عيادة التجربة الواحدة · {staff?(role==='doctor'?'الطبيب':'الاستقبال'):'حساب المريض'}</p></div><button className="clinic-button secondary" onClick={()=>logout()}>تسجيل الخروج</button></header>
  <main className="max-w-6xl mx-auto p-6 grid gap-6 lg:grid-cols-[1fr_1.5fr]">
   <section className="pilot-intro rounded-3xl p-7 self-start"><span className="auth-eyebrow">مساحة بسيطة، لرعاية أفضل</span><h2 className="text-3xl leading-relaxed font-bold mt-5">{staff?'نظم يوم العيادة.':'طلبك ومتابعة حالته، في مكان واحد.'}</h2><ClinicIllustration kind={role==='doctor'?'doctor':'calendar'} className="w-full max-w-sm mx-auto my-5 hidden lg:block" eager/><p className="text-sm leading-7">اختبار تقني ببيانات وهمية فقط. مش خدمة طبية ومفيش تأكيد لموعد حقيقي. صلاحيات الطبيب والاستقبال بتتحدد من الإدارة، مش من التسجيل.</p></section>
   <section className="grid gap-6 min-w-0">
    {!staff&&<section className="pilot-surface border rounded-3xl p-6"><h2 className="text-xl font-bold mb-5">طلب حجز تجريبي</h2><BookingStepper lang="ar"/></section>}
    <section className="pilot-surface border rounded-3xl p-6"><div className="flex flex-wrap gap-4 justify-between items-center mb-5"><h2 className="text-xl font-bold">{staff?'طلبات العيادة':'طلباتي'}</h2>{role==='doctor'&&<button disabled={busy} className="clinic-button primary" onClick={()=>run(callPilot)}>نداء التالي</button>}</div>
     {rows.length===0&&<p className="py-6 text-[#536b60]">مفيش طلبات ظاهرة للحساب ده. لو فيه مشكلة اتصال هتظهر رسالة فوق.</p>}
     <div className="grid gap-4">{rows.map(b=><article key={b.id} className="border border-[#dce3d7] rounded-2xl p-4"><div className="flex justify-between gap-3"><strong>{b.name}</strong><span className="mvp-badge">{labels[b.status]}</span></div><p className="text-sm mt-3" dir="ltr">{b.phone} · {b.date||'بدون يوم محدد'}</p><p className="text-sm mt-2">{b.turn?'رقم الدور: '+b.turn:'رقم الدور بعد تأكيد الاستقبال'}</p><div className="flex flex-wrap gap-2 mt-4">
      {role==='receptionist'&&b.status==='requested'&&<button disabled={busy} className="clinic-button primary" onClick={()=>run(()=>confirmPilot(b.id))}>تأكيد الطلب</button>}
      {role==='receptionist'&&b.status==='confirmed'&&<button disabled={busy} className="clinic-button primary" onClick={()=>run(()=>updatePilotBooking(b.id,{status:'arrived'}))}>تسجيل الوصول</button>}
      {role==='receptionist'&&['requested','confirmed','arrived'].includes(b.status)&&<button disabled={busy} className="clinic-button secondary" onClick={()=>run(()=>updatePilotBooking(b.id,{status:'cancelled'}))}>إلغاء</button>}
      {role==='receptionist'&&['confirmed','arrived'].includes(b.status)&&<button disabled={busy} className="clinic-button secondary" onClick={()=>run(()=>updatePilotBooking(b.id,{status:'no-show'}))}>لم يحضر</button>}
      {role==='doctor'&&b.status==='in-consult'&&<button disabled={busy} className="clinic-button primary" onClick={()=>run(()=>finishPilot(b.id))}>إنهاء الكشف التجريبي</button>}
     </div></article>)}</div>
    </section>
   </section>
  </main>
 </div>;
}
