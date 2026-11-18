import ar from "../locales/ar.json";
import en from "../locales/en.json";
import type { Language } from "./clinic.config";
export function translate(lang: Language, key: keyof typeof ar): string {
  return (lang === "ar" ? ar : en)[key];
}
