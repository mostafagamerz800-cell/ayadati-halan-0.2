import { translate } from "../lib/clinic.i18n";
import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  HeartPulse,
  Search,
  Stethoscope,
} from "lucide-react";
import type { Tenant } from "../App";
import { getClinicConfig, type Language } from "../lib/clinic.config";
import { AccessibleDialog } from "./AccessibleDialog";
import { BookingStepper } from "./BookingStepper";

export function ClinicDirectory({
  tenants,
  onSelectTenant,
  onBackToHome,
  lang,
}: {
  tenants: Tenant[];
  onSelectTenant: (tenant: Tenant) => void;
  onBackToHome: () => void;
  lang: Language;
}) {
  const [specialty, setSpecialty] = useState("all");
  const [preview, setPreview] = useState<Tenant | null>(null);
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const specialties = Array.from(
    new Set(tenants.map((tenant) => tenant.specialty)),
  );
  const filtered = tenants.filter(
    (tenant) => specialty === "all" || tenant.specialty === specialty,
  );
  return (
    <div className="clinic-site" dir={translate(lang, "text_513096137f")}>
      <main className="clinic-section">
        <div className="clinic-container">
          <button className="text-link" onClick={onBackToHome}>
            <Arrow size={18} />
            {translate(lang, "text_8a9907da35")}
          </button>
          <div className="section-heading">
            <span className="eyebrow">
              {translate(lang, "text_62f8368096")}
            </span>
            <h1>{translate(lang, "text_c642bd60fc")}</h1>
            <p>{translate(lang, "text_cfcc707df4")}</p>
          </div>
          <label className="directory-filter" htmlFor="specialty-filter">
            <Search size={20} />
            <span>{translate(lang, "text_821ee7a8c7")}</span>
            <select
              id="specialty-filter"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
            >
              <option value="all">{translate(lang, "text_259326f271")}</option>
              {specialties.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <p className="directory-count" aria-live="polite">
            {filtered.length} {translate(lang, "text_5c2ca364cf")}
          </p>
          <div className="clinic-grid services-grid">
            {filtered.map((tenant) => (
              <article className="clinic-card" key={tenant.id}>
                <span className="preview-tag">
                  {translate(lang, "text_254438a50b")}
                </span>
                <span className="icon-tile" style={{ marginBlockStart: 20 }}>
                  <Stethoscope />
                </span>
                <h2 style={{ fontSize: "1.2rem" }}>
                  <bdi>{tenant.doctorName}</bdi>
                </h2>
                <p>
                  <bdi>{tenant.specialty}</bdi>
                </p>
                <p className="field-hint">
                  {translate(lang, "text_5892cee8d6")}
                </p>
                <div className="card-actions">
                  <button
                    className="clinic-button primary"
                    onClick={() => onSelectTenant(tenant)}
                  >
                    {translate(lang, "text_da2d15166e")}
                    <Arrow size={16} />
                  </button>
                  <button
                    className="text-link"
                    onClick={() => setPreview(tenant)}
                  >
                    {translate(lang, "text_26738a183a")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      {preview && (
        <AccessibleDialog
          title={translate(lang, "text_996b25bdd4")}
          onClose={() => setPreview(null)}
        >
          <p className="field-hint">
            <bdi>{preview.doctorName}</bdi> ·{" "}
            {translate(lang, "text_65a94475b0")}
          </p>
          <BookingStepper lang={lang} config={getClinicConfig(preview.id)} />
        </AccessibleDialog>
      )}
    </div>
  );
}
