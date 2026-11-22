import ar from "../locales/ar.json";
import en from "../locales/en.json";
import type { Language } from "./clinic.config";
const pilotCopy:Record<string,{ar:string;en:string}>={
 text_73e9f953c2:{ar:'تجربة Firebase · بيانات وهمية فقط، مش حجز طبي',en:'Firebase pilot · synthetic data only, no medical booking'},
 text_61f5ef531d:{ar:'الطلب التجريبي بيتحفظ بعد تأكيد الحفظ فقط. مش موعد طبي.',en:'The test request is stored only after save confirmation. Not a medical appointment.'},
 hero_interactive_note:{ar:'طلب وهمي محفوظ في قاعدة التجربة فقط. مش موعد طبي ومفيش إرسال رسائل.',en:'Synthetic request stored in the pilot database only. No medical appointment or messages.'},
};
export function translate(lang: Language, key: keyof typeof ar): string {
  if(import.meta.env.VITE_SECURE_PILOT==='true'&&pilotCopy[key])return pilotCopy[key][lang];
  return (lang === "ar" ? ar : en)[key];
}
