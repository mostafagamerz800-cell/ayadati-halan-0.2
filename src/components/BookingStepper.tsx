import { translate } from "../lib/clinic.i18n";
import React, { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Info,
  MapPin,
} from "lucide-react";
import {
  clinicConfig,
  type Language,
  type ClinicConfig,
} from "../lib/clinic.config";

export const normalizeEgyptianMobile = (value: string) => {
  const western = value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[\s()\-]/g, "");
  return western.replace(/^(?:\+20|0020)/, "0");
};
export function BookingStepper({
  lang,
  config = clinicConfig,
}: {
  lang: Language;
  config?: ClinicConfig;
}) {
  const uniqueId = React.useId();
  const ids = {
    name: `${uniqueId}-name`,
    phone: `${uniqueId}-phone`,
    date: `${uniqueId}-date`,
    note: `${uniqueId}-note`,
    hint: `${uniqueId}-hint`,
  };
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    branch: "",
    type: "new",
    name: "",
    phone: "",
    date: "",
    note: "",
  });
  const heading = useRef<HTMLHeadingElement>(null);
  const update = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setError("");
  };
  const branches = config.verified ? config.branches : [];
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const advance = () => {
    if (step === 0 && branches.length > 0 && !form.branch) {
      setError(translate(lang, "text_848b206c12"));
      return;
    }
    if (step === 1) {
      if (form.name.trim().split(/\s+/).length < 2) {
        setError(translate(lang, "text_8f7f6b0355"));
        return;
      }
      if (!/^01[0125]\d{8}$/.test(normalizeEgyptianMobile(form.phone))) {
        setError(translate(lang, "text_9317614313"));
        return;
      }
      if (form.date && form.date < minDate) {
        setError(translate(lang, "text_f1acab8c7c"));
        return;
      }
    }
    setError("");
    setStep((previous) => previous + 1);
    requestAnimationFrame(() => heading.current?.focus());
  };
  if (done)
    return (
      <div className="booking-complete" role="status">
        <CheckCircle2 size={42} />
        <h3>{translate(lang, "text_8745013f6b")}</h3>
        <p>{translate(lang, "text_371098e27b")}</p>
        <button
          className="clinic-button secondary"
          onClick={() => {
            setDone(false);
            setStep(0);
            setForm({
              branch: "",
              type: "new",
              name: "",
              phone: "",
              date: "",
              note: "",
            });
          }}
        >
          {translate(lang, "text_3470574853")}
        </button>
      </div>
    );
  return (
    <div className="booking-stepper">
      <div className="notice">
        <Info size={18} />
        <p>{translate(lang, "text_7e106b8f6a")}</p>
      </div>
      <ol
        className="booking-progress"
        aria-label={translate(lang, "text_a293b4d6ae")}
      >
        {[
          translate(lang, "text_b5f12d4787"),
          translate(lang, "text_9a6824632f"),
          translate(lang, "text_a01b4e474e"),
        ].map((label, index) => (
          <li
            key={label}
            aria-current={step === index ? "step" : undefined}
            className={index <= step ? "active" : ""}
          >
            <span>{index < step ? <Check size={15} /> : index + 1}</span>
            <b>{label}</b>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (step < 2) advance();
          else {
            setDone(true);
            setForm({
              branch: "",
              type: "new",
              name: "",
              phone: "",
              date: "",
              note: "",
            });
          }
        }}
        noValidate
      >
        <h3 ref={heading} tabIndex={-1} className="step-heading">
          {
            [
              translate(lang, "text_2cbe8dd394"),
              translate(lang, "text_b7fed64426"),
              translate(lang, "text_7eb805fdc5"),
            ][step]
          }
        </h3>
        {step === 0 && (
          <div className="form-stack">
            <fieldset>
              <legend>{translate(lang, "text_fa1be395af")}</legend>
              {branches.length ? (
                branches.map((branch) => (
                  <label
                    className={`branch-option ${form.branch === branch.id ? "selected" : ""}`}
                    key={branch.id}
                  >
                    <input
                      type="radio"
                      name="branch"
                      value={branch.id}
                      checked={form.branch === branch.id}
                      onChange={(e) => update("branch", e.target.value)}
                    />
                    <div>
                      <strong>{branch.name[lang]}</strong>
                      {branch.address && <p>{branch.address[lang]}</p>}
                      {branch.hours?.map((hour, i) => (
                        <p key={i}>{hour[lang]}</p>
                      ))}
                      {branch.fee != null && (
                        <p>
                          {branch.fee} {translate(lang, "text_407a467cf3")}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              ) : (
                <div className="empty-branch">
                  <MapPin size={21} />
                  <div>
                    <strong>{translate(lang, "text_9106650bd9")}</strong>
                    <p>{translate(lang, "text_50d2ae6eb4")}</p>
                  </div>
                </div>
              )}
            </fieldset>
            <fieldset>
              <legend>{translate(lang, "text_54361868a9")}</legend>
              <div className="visit-types">
                {[
                  ["new", translate(lang, "text_9ff6339554")],
                  ["followup", translate(lang, "text_edc5598c8b")],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className={`choice ${form.type === value ? "selected" : ""}`}
                  >
                    <input
                      type="radio"
                      name="type"
                      checked={form.type === value}
                      onChange={() => update("type", value)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}
        {step === 1 && (
          <div className="form-stack">
            <label htmlFor={ids.name}>
              {translate(lang, "text_75881bfeb8")} <span>*</span>
            </label>
            <input
              id={ids.name}
              autoComplete="off"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              maxLength={100}
              required
              aria-invalid={error ? true : undefined}
            />
            <label htmlFor={ids.phone}>
              {translate(lang, "text_4259c08f6b")} <span>*</span>
            </label>
            <input
              id={ids.phone}
              type="tel"
              inputMode="tel"
              autoComplete="off"
              dir="ltr"
              placeholder="01000000000"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              maxLength={22}
              required
              aria-describedby={ids.hint}
            />
            <p id={ids.hint} className="field-hint">
              {translate(lang, "text_d40ad20ce1")}
            </p>
            <label htmlFor={ids.date}>
              {translate(lang, "text_d9d7be34a2")}
            </label>
            <input
              id={ids.date}
              type="date"
              min={minDate}
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
            <p className="field-hint">{translate(lang, "text_5583ec9342")}</p>
          </div>
        )}
        {step === 2 && (
          <div className="form-stack">
            <dl className="review-details">
              <div>
                <dt>{translate(lang, "text_54361868a9")}</dt>
                <dd>
                  {form.type === "new"
                    ? translate(lang, "text_9ff6339554")
                    : translate(lang, "text_edc5598c8b")}
                </dd>
              </div>
              <div>
                <dt>{translate(lang, "text_fa1be395af")}</dt>
                <dd>
                  {branches.find((branch) => branch.id === form.branch)?.name[
                    lang
                  ] || translate(lang, "text_aae94980f2")}
                </dd>
              </div>
              <div>
                <dt>{translate(lang, "text_78e727ee84")}</dt>
                <dd>{form.name}</dd>
              </div>
              <div>
                <dt>{translate(lang, "text_37af86df04")}</dt>
                <dd dir="ltr">{normalizeEgyptianMobile(form.phone)}</dd>
              </div>
              {form.date && (
                <div>
                  <dt>{translate(lang, "text_a1a71adb4d")}</dt>
                  <dd dir="ltr">{form.date}</dd>
                </div>
              )}
            </dl>
            <details>
              <summary>{translate(lang, "text_cb860abc49")}</summary>
              <label className="sr-only" htmlFor={ids.note}>
                {translate(lang, "text_9a211efc33")}
              </label>
              <textarea
                id={ids.note}
                rows={3}
                maxLength={300}
                placeholder={translate(lang, "text_18e28faca8")}
                value={form.note}
                onChange={(e) => update("note", e.target.value)}
              />
            </details>
            <p className="field-hint">{translate(lang, "text_c374473b87")}</p>
          </div>
        )}
        <p className="form-error" role="alert">
          {error}
        </p>
        <div className="booking-controls">
          {step > 0 && (
            <button
              type="button"
              className="clinic-button secondary"
              onClick={() => {
                setStep((previous) => previous - 1);
                setError("");
              }}
            >
              {translate(lang, "text_92b9ba7727")}
            </button>
          )}
          <button type="submit" className="clinic-button primary">
            {step === 2
              ? translate(lang, "text_7bf22a99f4")
              : translate(lang, "text_4ea85cc4e9")}
            {lang === "ar" ? <ArrowLeft size={18} /> : <ArrowRight size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}
