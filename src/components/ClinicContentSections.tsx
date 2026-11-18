import { translate } from "../lib/clinic.i18n";
import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Stethoscope,
} from "lucide-react";
import type { ClinicConfig, Language } from "../lib/clinic.config";

// Content-driven medical sections. Empty or unverified content is never filled with invented copy.
export function VerifiedTrustStrip({
  config,
  lang,
}: {
  config: ClinicConfig;
  lang: Language;
}) {
  if (!config.verified) return null;
  const items: { value: string; label: string }[] = [];
  if (config.yearsExperience != null)
    items.push({
      value: String(config.yearsExperience),
      label: translate(lang, "text_4747571987"),
    });
  if (config.branches.length)
    items.push({
      value: String(config.branches.length),
      label: translate(lang, "text_4cf8f8d931"),
    });
  if (!items.length) return null;
  return (
    <div className="verified-trust">
      <div className="clinic-container">
        {items.map((item) => (
          <div key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
export function ConditionPicker({
  config,
  lang,
  onNavigate,
}: {
  config: ClinicConfig;
  lang: Language;
  onNavigate: (route: string) => void;
}) {
  if (!config.verified || !config.conditions?.length) return null;
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  return (
    <section className="clinic-section">
      <div className="clinic-container">
        <div className="section-heading">
          <span className="eyebrow">{translate(lang, "text_231d2dd7ad")}</span>
          <h2>{translate(lang, "text_3125eac018")}</h2>
        </div>
        <div className="clinic-grid services-grid">
          {config.conditions.slice(0, 3).map((condition, index) => (
            <article className="clinic-card" key={condition.id}>
              <span className="condition-number">0{index + 1}</span>
              <h3>{condition.title[lang]}</h3>
              <p>{condition.prompt[lang]}</p>
              <button
                className="text-link"
                onClick={() => onNavigate(`conditions/${condition.id}`)}
              >
                {translate(lang, "text_7be00c7a00")}
                <Arrow size={17} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export function SpecialtyRows({
  config,
  lang,
  onBook,
}: {
  config: ClinicConfig;
  lang: Language;
  onBook: () => void;
}) {
  if (!config.verified || !config.specialtyRows?.length) return null;
  return (
    <section className="clinic-section">
      <div className="clinic-container specialty-rows">
        {config.specialtyRows.map((row) => (
          <article className="specialty-row" key={row.id}>
            {row.image && (
              <img src={row.image} alt={row.title[lang]} loading="lazy" />
            )}
            <div>
              <span className="icon-tile">
                <Stethoscope />
              </span>
              <h2>{row.title[lang]}</h2>
              <ul className="check-list">
                {row.conditions.map((condition, index) => (
                  <li key={index}>
                    <Check size={18} />
                    {condition[lang]}
                  </li>
                ))}
              </ul>
              <button className="clinic-button secondary" onClick={onBook}>
                {translate(lang, "text_135658794c")}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
export function ProcedureCards({
  config,
  lang,
  onBook,
}: {
  config: ClinicConfig;
  lang: Language;
  onBook: () => void;
}) {
  if (!config.verified || !config.procedures?.length) return null;
  return (
    <section className="clinic-section section-tint">
      <div className="clinic-container">
        <div className="section-heading">
          <h2>{translate(lang, "text_9b968864a9")}</h2>
        </div>
        <div className="clinic-grid services-grid">
          {config.procedures.map((procedure) => (
            <article key={procedure.id} className="clinic-card">
              <span className="icon-tile">
                <Stethoscope />
              </span>
              <h3>{procedure.title[lang]}</h3>
              <ul className="check-list">
                {procedure.points.map((point, index) => (
                  <li key={index}>
                    <Check size={16} />
                    {point[lang]}
                  </li>
                ))}
              </ul>
              <button className="text-link" onClick={onBook}>
                {translate(lang, "text_3e57e26420")}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
export function PromoBand({
  config,
  lang,
  onNavigate,
}: {
  config: ClinicConfig;
  lang: Language;
  onNavigate: (route: string) => void;
}) {
  if (!config.verified || !config.promo) return null;
  const promo = config.promo;
  return (
    <section className="clinic-section promo-band">
      <div className="clinic-container">
        <span className="icon-tile">
          <MapPin />
        </span>
        <h2>{promo.title[lang]}</h2>
        <p>{promo.description[lang]}</p>
        <button
          className="clinic-button hero-primary"
          onClick={() => onNavigate(promo.route)}
        >
          {promo.action[lang]}
        </button>
      </div>
    </section>
  );
}
