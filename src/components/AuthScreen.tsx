import {PILOT} from '../lib/pilotBackend';
import {portalLabels,type PortalRole} from '../lib/portalAccess';
import React, { useState } from 'react';
import {
  Stethoscope,
  Users,
  User,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Building2,
  KeyRound,
  ShieldCheck,
  HeartPulse,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {ThemeToggle} from './ThemeToggle';
import { ClinicIllustration } from './ClinicIllustration';
import './clinic-polish.css';


export const AuthScreen: React.FC<{ onPreviewClinic?: () => void; portal?: PortalRole; onChangePortal?: () => void }> = ({ onPreviewClinic, portal='patient', onChangePortal }) => {
  const signupEnabled = !PILOT || portal==='patient';
  const { login, signup, signInWithGoogle, demoLogin, error, clearError, isPlaceholderAuth } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Extra signup fields
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'doctor' | 'receptionist' | 'patient'>(PILOT?'patient':'doctor');
  const [department, setDepartment] = useState('General Medicine');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLocalError(null);
    clearError();
    setSuccessNotice(null);
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed';
      setLocalError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();
    setSuccessNotice(null);

    if (!email.trim() || !password.trim()) {
      setLocalError('اكتب البريد الإلكتروني وكلمة المرور.');
      return;
    }

    if (isSignUp && password.length < 6) {
      setLocalError('كلمة المرور لازم تكون 6 أحرف على الأقل.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isSignUp && signupEnabled) {
        const defaultName = fullName.trim() || email.split('@')[0];
        await signup(email.trim(), password, {
          name: defaultName,
          role,
          department: department.trim() || (role === 'receptionist' ? 'Front Desk & Billing' : 'General Medicine'),
        });
        setSuccessNotice('تم إنشاء الحساب. جاري فتح بوابتك...');
      } else {
        await login(email.trim(), password);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setLocalError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (newRole: 'doctor' | 'receptionist' | 'patient') => {
    setRole(newRole);
    if (newRole === 'doctor') {
      setDepartment('General Medicine');
    } else if (newRole === 'receptionist') {
      setDepartment('Front Desk & Billing');
    } else {
      setDepartment('Outpatient Clinic');
    }
  };

  const openDemo = (demoRole: 'doctor' | 'receptionist' | 'patient', name: string, demoDepartment: string) => {
    demoLogin(demoRole, name, demoDepartment);
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  };
  const changeMode = (signupMode: boolean) => {
    setIsSignUp(signupMode); setLocalError(null); setSuccessNotice(null); clearError();
  };
  return (
    <main className="polish-auth" dir="rtl" lang="ar">
      <header className="auth-topbar">
        <div className="auth-wordmark">
          <span className="auth-mark"><HeartPulse size={24} /></span>
          <span>عيادتي حالا<small lang="en" dir="ltr">AYADATI HALAN</small></span>
        </div>
        {onPreviewClinic && <button type="button" className="auth-text-button" onClick={onPreviewClinic}>استكشف العيادة <ArrowRight size={16} /></button>}
        {PILOT && onChangePortal && <ThemeToggle inline/>}
      </header>
      <div className="auth-layout">
        <section className="auth-intro" aria-labelledby="auth-welcome">
          <span className="auth-eyebrow"><span /> رعاية أقرب. يوم أهدى.</span>
          <h1 id="auth-welcome">مساحة بسيطة،<br /><span>لرعاية أفضل.</span></h1>
          <p>عيادتك ومواعيدك في مكان واحد.<br />من أول حجز، لحد متابعة دورك.</p>
          <ClinicIllustration kind="doctor" className="auth-intro-art" eager />
          <div className="auth-intro-caption"><span>01</span><p>تفاصيل أقل.<br /><strong>اهتمام أكتر.</strong></p></div>
        </section>
        <section className="auth-panel" aria-label="الدخول إلى عيادتي حالا">
          {PILOT && <div className="auth-portal-context"><strong>{portalLabels[portal]}</strong>{onChangePortal && <button type="button" onClick={onChangePortal}>تغيير البوابة</button>}</div>}
          <div className="auth-mode" role="group" aria-label="نوع الدخول">
            <button type="button" aria-pressed={!isSignUp} onClick={() => changeMode(false)}>تسجيل الدخول</button>
            {signupEnabled && <button type="button" aria-pressed={isSignUp} onClick={() => changeMode(true)}>حساب جديد</button>}
          </div>
          <div className="auth-heading">
            <span className="auth-eyebrow">أهلاً بيك في عيادتي حالا</span>
            <h2>{isSignUp ? 'نبدأ بخطوة بسيطة.' : PILOT ? portalLabels[portal] : 'كل حاجة في مكانها.'}</h2>
            <p>{isSignUp ? (PILOT ? 'أدخل بياناتك لإنشاء حساب مريض.' : 'أدخل بياناتك لإنشاء حسابك.') : 'ادخل لحسابك وكمل يومك.'}</p>
            {PILOT && !signupEnabled && <p className="auth-staff-notice">الدخول مرتبط بعضوية فريق العيادة. اختيار البوابة أو إنشاء حساب مريض مش بيمنح صلاحية {portal==='doctor'?'طبيب':'استقبال'}.</p>}
          </div>
          {(localError || error) && <div className="auth-alert" role="alert"><AlertCircle size={18} /><p>{localError || error}</p></div>}
          {successNotice && <div className="auth-notice" role="status"><CheckCircle2 size={18} /><p>{successNotice}</p></div>}
          <button type="button" className="auth-google" onClick={handleGoogleSignIn} disabled={isSubmitting || isGoogleLoading}>
            {isGoogleLoading ? <><span className="auth-spinner" /> جارٍ الاتصال بـ Google...</> : <><svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg><span>المتابعة باستخدام <bdi>Google</bdi></span></>}
          </button>
          <div className="auth-divider"><span>أو بالبريد الإلكتروني</span></div>
          <form onSubmit={handleSubmit} className="auth-form">
            {isSignUp && <>
              {!PILOT && <fieldset className="auth-role-field"><legend>هتستخدم العيادة كـ</legend><div className="auth-roles">
                {([['doctor', 'طبيب', Stethoscope], ['receptionist', 'استقبال', Users], ['patient', 'مريض', User]] as const).map(([key, label, Icon]) => <button type="button" key={key} onClick={() => handleRoleChange(key)} aria-pressed={role === key}><Icon size={18} />{label}</button>)}
              </div></fieldset>}
              <label htmlFor="auth-name">الاسم الكامل <span className="auth-optional">اختياري</span></label>
              <input id="auth-name" name="name" autoComplete="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="اسمك الكامل" />
              {!PILOT && <><label htmlFor="auth-department">القسم / التخصص</label>
              <input id="auth-department" name="department" value={department} onChange={e => setDepartment(e.target.value)} /></>}
            </>}
            <label htmlFor="auth-email">البريد الإلكتروني</label>
            <div className="auth-input-wrap"><Mail size={18} /><input id="auth-email" name="email" type="email" autoComplete="email" required dir="ltr" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <label htmlFor="auth-password">كلمة المرور {isSignUp && <span className="auth-optional">6 أحرف على الأقل</span>}</label>
            <div className="auth-input-wrap"><Lock size={18} /><input id="auth-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} required dir="ltr" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} /><button className="auth-eye" type="button" aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
            <button className="auth-submit" type="submit" disabled={isSubmitting || isGoogleLoading}>{isSubmitting ? <><span className="auth-spinner" />{isSignUp ? 'جارٍ إنشاء الحساب...' : 'جارٍ تسجيل الدخول...'}</> : <>{isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول'}<ArrowRight size={18} /></>}</button>
          </form>
          {!PILOT && <details className="auth-demo"><summary>جرّب الواجهة من غير حساب <span>تجريبي</span></summary>
            <p>بيانات وهمية لاختبار الواجهة فقط.</p>
            <div className="auth-demo-roles">
              <button type="button" onClick={() => openDemo('doctor', 'Demo doctor', 'Internal Medicine')}><Stethoscope size={17} />طبيب</button>
              <button type="button" onClick={() => openDemo('receptionist', 'Demo receptionist', 'Front Desk & Reception')}><Users size={17} />استقبال</button>
              <button type="button" onClick={() => openDemo('patient', 'Demo patient', 'Outpatient Consultation')}><User size={17} />مريض</button>
            </div>
          </details>}
          <p className="auth-safety"><Info size={15} />{isPlaceholderAuth ? 'المعاينة متاحة. إعداد تسجيل الدخول لم يكتمل.' : 'نسخة معاينة. الحجز الفعلي وجاهزية الخدمة غير مؤكدين.'}</p>
        </section>
      </div>
      <footer className="auth-footer"><span>عيادتي حالا</span><span>اهتمام بيك، في كل خطوة.</span></footer>
    </main>
  );
};
export default AuthScreen;
