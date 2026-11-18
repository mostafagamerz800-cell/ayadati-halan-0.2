import { translate } from "../lib/clinic.i18n";
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Globe2,
  Heart,
  HeartPulse,
  Info,
  MapPin,
  Menu,
  MessageCircle,
  Phone,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
  Users,
} from "lucide-react";
import { getClinicConfig, type Language } from "../lib/clinic.config";
import { AccessibleDialog } from "./AccessibleDialog";
import { BookingStepper } from "./BookingStepper";
import "./clinic.css";
import {
  ConditionPicker,
  SpecialtyRows,
  ProcedureCards,
  PromoBand,
  VerifiedTrustStrip,
} from "./ClinicContentSections";

type Props = {
  onSelectPortal: (portal: string) => void;
  onOpenSaasModal: (tab?: "doctor" | "receptionist" | "patient") => void;
  onDirectory: () => void;
  lang: Language;
  onToggleLanguage: () => void;
  tenantLabel: string;
  tenantId: string;
  onLogout: () => void;
};
export function ClinicExperience({
  onSelectPortal,
  onOpenSaasModal,
  onDirectory,
  lang,
  onToggleLanguage,
  tenantLabel,
  tenantId,
  onLogout,
}: Props) {
  const config = getClinicConfig(tenantId);
  const copy = (value?: { ar: string; en: string }) => value?.[lang] || "";
  const parseRoute = () =>
    window.location.hash.startsWith("#/clinic/")
      ? window.location.hash.slice(9) || "home"
      : "home";
  const [route, setRoute] = useState(parseRoute);
  const [modal, setModal] = useState<"booking" | "menu" | null>(null);
  const [journey, setJourney] = useState(0);
  const [paused, setPaused] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [showA11y, setShowA11y] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pageTitle = useRef<HTMLHeadingElement>(null);
  const name = config.verified
    ? copy(config.doctorName)
    : translate(lang, "text_0464c787a9");
  const branches = config.verified ? config.branches : [];
  const services = config.verified ? config.services : [];
  const articles = config.verified ? config.articles : [];
  const reviews = config.verified
    ? config.reviews.filter((review) => review.consent)
    : [];
  const phone = branches.find((branch) =>
    /^\+?\d[\d\s-]{6,}$/.test(branch.phone || ""),
  )?.phone;
  const hasContact = !!(phone || (config.verified && config.whatsappNumber));
  useEffect(() => {
    const handleHash = () => {
      setRoute(parseRoute());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = translate(lang, "text_513096137f");
  }, [lang]);
  useEffect(() => {
    document.title = `${name} | ${translate(lang, "text_f52970e370")}`;
  }, [name, lang]);
  useEffect(() => {
    if (route !== "home")
      requestAnimationFrame(() => pageTitle.current?.focus());
  }, [route]);
  const go = (next: string, section?: string) => {
    setModal(null);
    setRoute(next);
    window.location.hash = `/clinic/${next}`;
    if (section)
      setTimeout(
        () =>
          document
            .getElementById(section)
            ?.scrollIntoView({
              behavior: paused ? "instant" : "smooth",
              block: "start",
            }),
        50,
      );
    else window.scrollTo({ top: 0 });
  };
  const book = () => {
    if (route === "book") document.getElementById("booking")?.scrollIntoView();
    else setModal("booking");
  };
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;
  const nav = [
    ["home", translate(lang, "text_17c4ca4554")],
    ["services", translate(lang, "text_4e1c5caea7")],
    ["about", translate(lang, "text_b1a183532b")],
    ...(articles.length
      ? [["articles", translate(lang, "text_6e21592d71")]]
      : []),
    ["branches", translate(lang, "text_08983958be")],
    ["portal", translate(lang, "text_c3e123d8ff")],
    ["contact", translate(lang, "text_f7201fc171")],
  ];
  const journeyCopy = [
    {
      title: translate(lang, "text_85c475cb22"),
      body: translate(lang, "text_989814086e"),
      note: translate(lang, "text_58e1f6a4ae"),
      icon: CalendarDays,
    },
    {
      title: translate(lang, "text_5bd1eb3b99"),
      body: translate(lang, "text_c3489bc90e"),
      note: translate(lang, "text_4fed628d2b"),
      icon: Stethoscope,
    },
    {
      title: translate(lang, "text_ba978f6c69"),
      body: translate(lang, "text_6884dd19dc"),
      note: translate(lang, "text_21f571c057"),
      icon: HeartPulse,
    },
  ];
  const JourneyIcon = journeyCopy[journey].icon;
  const sectionHeader = (eyebrow: string, title: string, subtitle?: string) => (
    <div className="section-heading">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
  const ContactButtons = () => (
    <>
      {phone && (
        <a
          className="clinic-button secondary"
          href={`tel:${phone.replace(/\s/g, "")}`}
        >
          <Phone size={18} />
          {translate(lang, "text_c3c4b55f82")}
        </a>
      )}
      {config.verified && config.whatsappNumber && (
        <a
          className="clinic-button whatsapp"
          target="_blank"
          rel="noreferrer"
          href={`https://wa.me/${config.whatsappNumber.replace(/\D/g, "")}`}
        >
          <MessageCircle size={18} />
          {translate(lang, "text_fcb966ac8f")}
        </a>
      )}
    </>
  );
  const Branches = () =>
    branches.length ? (
      <div className="clinic-grid branch-grid">
        {branches.map((branch) => (
          <article className="clinic-card branch-card" key={branch.id}>
            {branch.image && (
              <img src={branch.image} alt={branch.name[lang]} loading="lazy" />
            )}
            <span className="icon-tile">
              <MapPin />
            </span>
            <h3>{branch.name[lang]}</h3>
            {branch.address && <p>{branch.address[lang]}</p>}
            {branch.hours && (
              <ul>
                {branch.hours.map((hours, i) => (
                  <li key={i}>
                    <Clock3 size={16} />
                    {hours[lang]}
                  </li>
                ))}
              </ul>
            )}
            {branch.fee != null && (
              <p className="branch-fee">
                {translate(lang, "text_aa5e8eefa8")}: {branch.fee}{" "}
                {translate(lang, "text_407a467cf3")}
              </p>
            )}
            <div className="card-actions">
              {branch.mapsUrl?.startsWith("https://") && (
                <a
                  href={branch.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="clinic-button secondary"
                >
                  {translate(lang, "text_3a525fd2d4")}
                </a>
              )}
              {branch.phone && (
                <a
                  href={`tel:${branch.phone}`}
                  className="clinic-button secondary"
                >
                  {translate(lang, "text_c65b4f6f9c")}
                </a>
              )}
              <button className="clinic-button primary" onClick={book}>
                {translate(lang, "text_27dd340fe5")}
              </button>
            </div>
          </article>
        ))}
      </div>
    ) : (
      <div className="empty-state">
        <div className="icon-tile">
          <MapPin size={27} />
        </div>
        <div>
          <h3>{translate(lang, "text_5a24bcc5da")}</h3>
          <p>{translate(lang, "text_61ed83ebf5")}</p>
          <button className="text-link" onClick={book}>
            {translate(lang, "text_e77135eeff")}
            <Arrow size={17} />
          </button>
        </div>
      </div>
    );
  const BookingSection = () => (
    <section id="booking" className="clinic-section booking-section">
      <div className="clinic-container booking-layout">
        <div className="booking-intro">
          <span className="eyebrow">{translate(lang, "text_06e0e07d5e")}</span>
          <h2>
            {translate(lang, "text_e27d98077a")}
            <br />
            <em>{translate(lang, "text_7b808d7eeb")}</em>
          </h2>
          <p>{translate(lang, "text_225aff8734")}</p>
          <ul className="check-list">
            <li>
              <Check size={18} />
              {translate(lang, "text_e55849459b")}
            </li>
            <li>
              <Check size={18} />
              {translate(lang, "text_c668bcf633")}
            </li>
            <li>
              <Check size={18} />
              {translate(lang, "text_1fc1ac26bb")}
            </li>
          </ul>
          <span className="preview-tag">
            {translate(lang, "text_b39714d010")}
          </span>
        </div>
        <div className="booking-card">
          <BookingStepper lang={lang} config={config} />
        </div>
      </div>
    </section>
  );
  const ServiceCards = () =>
    services.length ? (
      <div className="clinic-grid services-grid">
        {services.map((service) => (
          <article className="clinic-card" key={service.id}>
            <span className="icon-tile">
              <Stethoscope />
            </span>
            <h3>{service.title[lang]}</h3>
            <p>{service.description[lang]}</p>
            <button
              className="text-link"
              onClick={() => go(`services/${service.id}`)}
            >
              {translate(lang, "text_19687e3f42")}
              <Arrow size={17} />
            </button>
          </article>
        ))}
      </div>
    ) : (
      <div className="clinic-grid services-grid">
        {[
          [
            CalendarDays,
            translate(lang, "text_3e57e26420"),
            translate(lang, "text_7ad30714af"),
            book,
          ],
          [
            MapPin,
            translate(lang, "text_828d41397c"),
            translate(lang, "text_589c81aad1"),
            () => go("branches"),
          ],
          [
            HeartPulse,
            translate(lang, "text_13b8a29427"),
            translate(lang, "text_19a9737421"),
            () => onSelectPortal("patient"),
          ],
        ].map(([Icon, title, body, action], index) => {
          const CardIcon = Icon as typeof CalendarDays;
          return (
            <article className="clinic-card" key={index}>
              <span className="icon-tile">
                <CardIcon size={24} />
              </span>
              <h3>{title as string}</h3>
              <p>{body as string}</p>
              <button className="text-link" onClick={action as () => void}>
                {translate(lang, "text_f6d80e9161")}
                <Arrow size={17} />
              </button>
            </article>
          );
        })}
      </div>
    );
  const FAQ = () => (
    <section className="clinic-section faq-section">
      <div className="clinic-container faq-layout">
        {sectionHeader(
          translate(lang, "text_a3f6728363"),
          translate(lang, "text_9fbdf321d0"),
          translate(lang, "text_2dd36c76f4"),
        )}
        <div className="faq-list">
          {[
            [
              translate(lang, "text_8fb5b33c08"),
              translate(lang, "text_1ace6c68fe"),
            ],
            [
              translate(lang, "text_8996403143"),
              translate(lang, "text_01de57b8e6"),
            ],
            [
              translate(lang, "text_e79e2111c4"),
              translate(lang, "text_10a47becd0"),
            ],
            [
              translate(lang, "text_2aba21f31f"),
              translate(lang, "text_155c8520ef"),
            ],
          ].map(([question, answer], index) => (
            <details key={index}>
              <summary>
                {question}
                <ChevronDown size={18} />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
  const DoctorIntro = () =>
    config.verified && config.doctorName ? (
      <section className="clinic-section">
        <div className="clinic-container doctor-intro">
          {config.portrait && (
            <img
              src={config.portrait}
              alt={copy(config.doctorName)}
              loading="lazy"
            />
          )}
          <div>
            <span className="eyebrow">
              {translate(lang, "text_e7aab67bcb")}
            </span>
            <h2>{copy(config.doctorName)}</h2>
            {config.bio && <p>{copy(config.bio)}</p>}
            <ul className="check-list">
              {config.credentials.map((credential, i) => (
                <li key={i}>
                  <Check size={18} />
                  {credential[lang]}
                </li>
              ))}
            </ul>
            <button className="clinic-button primary" onClick={book}>
              {translate(lang, "text_d9c1b929f0")}
            </button>
          </div>
        </div>
      </section>
    ) : null;
  const Footer = () => (
    <footer className="clinic-footer">
      <div className="clinic-container">
        <div className="footer-top">
          <div>
            <a href="#/clinic/home" className="clinic-brand">
              <span className="brand-mark">
                <HeartPulse size={25} />
              </span>
              <strong>{name}</strong>
            </a>
            <p>{translate(lang, "text_2ed90de360")}</p>
          </div>
          <div className="footer-links">
            <h3>{translate(lang, "text_fcd0bc8b0f")}</h3>
            <button onClick={() => go("book")}>
              {translate(lang, "text_f21088857e")}
            </button>
            <button onClick={() => go("branches")}>
              {translate(lang, "text_08983958be")}
            </button>
            <button onClick={() => go("portal")}>
              {translate(lang, "text_6e62fc3569")}
            </button>
          </div>
          <div className="footer-links">
            <h3>{translate(lang, "text_641bb5a220")}</h3>
            <button onClick={() => go("privacy")}>
              {translate(lang, "text_53b4801841")}
            </button>
            <button onClick={onLogout}>
              {translate(lang, "text_6737d27bc1")}
            </button>
            <button onClick={() => go("design")}>
              {translate(lang, "text_a4fea0ead3")}
            </button>
            <button onClick={onDirectory}>
              {translate(lang, "text_c642bd60fc")}
            </button>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {name}
          </span>
          <span>{translate(lang, "text_66722dbdf3")}</span>
        </div>
      </div>
    </footer>
  );
  const subpageTitle =
    route === "book"
      ? translate(lang, "text_135658794c")
      : route === "about"
        ? translate(lang, "text_3882b420bb")
        : route === "services"
          ? translate(lang, "text_738292ce44")
          : route === "branches"
            ? translate(lang, "text_c17e1065bc")
            : route === "contact"
              ? translate(lang, "text_9c5f9888a2")
              : route === "portal"
                ? translate(lang, "text_6e62fc3569")
                : route === "privacy"
                  ? translate(lang, "text_8a3bf86b41")
                  : route === "design"
                    ? translate(lang, "text_a4fea0ead3")
                    : route === "articles"
                      ? translate(lang, "text_6e21592d71")
                      : translate(lang, "text_828d41397c");
  return (
    <div
      className={`clinic-site ${paused ? "motion-paused" : ""} ${largeText ? "large-text" : ""}`}
      dir={translate(lang, "text_513096137f")}
    >
      <a className="skip-link" href="#clinic-main">
        {translate(lang, "text_b93a1db64c")}
      </a>
      <div className="preview-banner">
        <div className="clinic-container">
          <Info size={15} />
          <span>{translate(lang, "text_73e9f953c2")}</span>
          <button onClick={() => go("portal")}>
            {translate(lang, "text_6e62fc3569")}
            <Arrow size={13} />
          </button>
        </div>
      </div>
      <header className="clinic-header">
        <div className="clinic-container header-inner">
          <a
            href="#/clinic/home"
            onClick={(e) => {
              e.preventDefault();
              go("home");
            }}
            className="clinic-brand"
            aria-label={name}
          >
            <span className="brand-mark">
              <HeartPulse size={26} />
            </span>
            <span>
              <strong>{name}</strong>
              <small>
                {config.verified
                  ? copy(config.specialty)
                  : translate(lang, "text_d1aca2618d")}
              </small>
            </span>
          </a>
          <nav
            className="desktop-nav"
            aria-label={translate(lang, "text_61ee1bbff0")}
          >
            {nav.map(([path, label]) => (
              <button
                key={path}
                aria-current={route === path ? "page" : undefined}
                onClick={() => go(path)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button
              className="icon-button language-button"
              aria-label={translate(lang, "text_8874cc3a77")}
              onClick={onToggleLanguage}
            >
              <Globe2 size={18} />
              <span>{translate(lang, "text_86a0dd787f")}</span>
            </button>
            <button
              className="clinic-button primary header-book"
              onClick={book}
            >
              {translate(lang, "text_27dd340fe5")}
              <Arrow size={16} />
            </button>
            <button
              className="icon-button mobile-menu"
              aria-label={translate(lang, "text_e26a7fc160")}
              aria-haspopup="dialog"
              onClick={() => setModal("menu")}
            >
              <Menu />
            </button>
          </div>
        </div>
      </header>
      <main id="clinic-main" tabIndex={-1}>
        {route === "home" ? (
          <>
            <section className="clinic-hero">
              <div className="hero-orbit" />
              <div className="clinic-container hero-grid">
                <div className="hero-copy">
                  <span className="hero-eyebrow">
                    <span />
                    {config.verified
                      ? copy(config.specialty)
                      : translate(lang, "text_e84b46b474")}
                  </span>
                  <h1>
                    {translate(lang, "text_0273f1d3be")}
                    <br />
                    <em>{translate(lang, "text_44f69bc32e")}</em>
                  </h1>
                  <p>{translate(lang, "text_40e03d6303")}</p>
                  <div className="hero-actions">
                    <button
                      className="clinic-button hero-primary"
                      onClick={book}
                    >
                      {translate(lang, "text_c2889f96be")}
                      <Arrow size={18} />
                    </button>
                    <button
                      className="clinic-button hero-secondary"
                      onClick={() => go("home", "journey")}
                    >
                      {translate(lang, "text_0ceb9a4d00")}
                    </button>
                  </div>
                  <p className="hero-micro">
                    <ShieldCheck size={16} />
                    {translate(lang, "text_61f5ef531d")}
                  </p>
                  <div className="hero-quick">
                    <span>{translate(lang, "text_231d2dd7ad")}</span>
                    {[
                      [translate(lang, "text_2b3e9273f2"), "booking"],
                      [translate(lang, "text_edc5598c8b"), "booking"],
                      [translate(lang, "text_13599c7289"), "branches"],
                    ].map(([label, section]) => (
                      <button
                        key={label}
                        onClick={() =>
                          section === "branches" ? go("branches") : book()
                        }
                      >
                        {label}
                        <Arrow size={13} />
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className="hero-visual"
                  aria-label={translate(lang, "text_19ca9af14d")}
                >
                  <div className="visual-caption">
                    <span className="status-dot" />
                    {translate(lang, "text_e73b6938a3")}
                  </div>
                  <div className="visit-illustration">
                    <div className="illustration-top">
                      <span className="illustration-icon">
                        <HeartPulse size={30} />
                      </span>
                      <span className="preview-tag">
                        {translate(lang, "text_5c315b59b0")}
                      </span>
                    </div>
                    <h2>{translate(lang, "text_266589dfb1")}</h2>
                    <p>{translate(lang, "text_4eede28280")}</p>
                    <div className="illustration-calendar">
                      <div>
                        <CalendarDays size={18} />
                        <strong>{translate(lang, "text_6bc30df0df")}</strong>
                        <span>01 / 03</span>
                      </div>
                      <div className="calendar-dots" aria-hidden="true">
                        {Array.from({ length: 14 }, (_, index) => (
                          <i
                            className={index === 9 ? "chosen" : ""}
                            key={index}
                          >
                            {index === 9 ? <Heart size={14} /> : index + 1}
                          </i>
                        ))}
                      </div>
                    </div>
                    <div className="illustration-step">
                      <span>
                        <Check size={16} />
                      </span>
                      <div>
                        <b>{translate(lang, "text_0716d59eae")}</b>
                        <small>{translate(lang, "text_1b49ed27c5")}</small>
                      </div>
                      <Arrow size={17} />
                    </div>
                    <div className="illustration-step">
                      <span>2</span>
                      <div>
                        <b>{translate(lang, "text_43abecafb9")}</b>
                        <small>{translate(lang, "text_ebdc5bc575")}</small>
                      </div>
                      <Arrow size={17} />
                    </div>
                  </div>
                  <div className="floating-note">
                    <ShieldCheck size={22} />
                    <span>
                      <b>{translate(lang, "text_804e0582d1")}</b>
                      <small>{translate(lang, "text_a0ca777e07")}</small>
                    </span>
                  </div>
                  <div className="visual-footnote">
                    {translate(lang, "text_1be279dd6e")}
                  </div>
                </div>
              </div>
            </section>
            <VerifiedTrustStrip config={config} lang={lang} />
            <div className="journey-strip">
              <div className="clinic-container">
                {[
                  [
                    CalendarDays,
                    translate(lang, "text_866fdf4cdf"),
                    translate(lang, "text_9fbdf321d0"),
                  ],
                  [
                    ShieldCheck,
                    translate(lang, "text_24a861d103"),
                    translate(lang, "text_ec0e82aa1b"),
                  ],
                  [
                    Users,
                    translate(lang, "text_f5f43bc9e5"),
                    translate(lang, "text_17019ca28f"),
                  ],
                ].map(([Icon, title, subtitle], index) => {
                  const StripIcon = Icon as typeof CalendarDays;
                  return (
                    <div key={index}>
                      <StripIcon size={22} />
                      <span>
                        <strong>{title as string}</strong>
                        <small>{subtitle as string}</small>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <section id="journey" className="clinic-section">
              <div className="clinic-container">
                {sectionHeader(
                  translate(lang, "text_f3c8b3b4ec"),
                  translate(lang, "text_a177de39b2"),
                  translate(lang, "text_b362a0d0bc"),
                )}
                <div className="journey-layout">
                  <div
                    className="journey-tabs"
                    role="tablist"
                    aria-label={translate(lang, "text_215ef2046b")}
                  >
                    {[
                      translate(lang, "text_7ca95de831"),
                      translate(lang, "text_107a66e456"),
                      translate(lang, "text_cc1a78c72c"),
                    ].map((label, index) => (
                      <button
                        key={index}
                        id={`journey-tab-${index}`}
                        role="tab"
                        aria-selected={journey === index}
                        aria-controls={`journey-panel-${index}`}
                        tabIndex={journey === index ? 0 : -1}
                        ref={(element) => {
                          tabRefs.current[index] = element;
                        }}
                        onClick={() => setJourney(index)}
                        onKeyDown={(event) => {
                          let next = index;
                          if (
                            event.key === "ArrowDown" ||
                            event.key === translate(lang, "text_78f7533fdd")
                          )
                            next = (index + 1) % 3;
                          else if (
                            event.key === "ArrowUp" ||
                            event.key === translate(lang, "text_cb06df8536")
                          )
                            next = (index + 2) % 3;
                          else if (event.key === "Home") next = 0;
                          else if (event.key === "End") next = 2;
                          else return;
                          event.preventDefault();
                          setJourney(next);
                          tabRefs.current[next]?.focus();
                        }}
                      >
                        <span>0{index + 1}</span>
                        <b>{label}</b>
                        <Arrow size={18} />
                      </button>
                    ))}
                  </div>
                  <div
                    id={`journey-panel-${journey}`}
                    className="journey-panel"
                    role="tabpanel"
                    aria-labelledby={`journey-tab-${journey}`}
                    tabIndex={0}
                  >
                    <span className="icon-tile">
                      <JourneyIcon size={26} />
                    </span>
                    <h3>{journeyCopy[journey].title}</h3>
                    <p>{journeyCopy[journey].body}</p>
                    <div className="journey-note">
                      <Check size={17} />
                      {journeyCopy[journey].note}
                    </div>
                    <div className="card-actions">
                      <button className="clinic-button primary" onClick={book}>
                        {translate(lang, "text_350b961631")}
                        <Arrow size={16} />
                      </button>
                      <button
                        className="text-link"
                        onClick={() => go("contact")}
                      >
                        {translate(lang, "text_0e1902a2ee")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <ConditionPicker config={config} lang={lang} onNavigate={go} />
            <section className="clinic-section section-tint">
              <div className="clinic-container">
                <div className="section-heading-row">
                  {sectionHeader(
                    translate(lang, "text_2f4abd4e30"),
                    translate(lang, "text_5a3cc9969b"),
                  )}
                  <button className="text-link" onClick={() => go("services")}>
                    {translate(lang, "text_6e74706194")}
                    <Arrow size={17} />
                  </button>
                </div>
                <ServiceCards />
              </div>
            </section>
            <section className="clinic-section">
              <div className="clinic-container">
                {sectionHeader(
                  translate(lang, "text_df5e330d34"),
                  translate(lang, "text_b8e7170c65"),
                )}
                <div className="clinic-grid value-grid">
                  {[
                    [
                      FileText,
                      translate(lang, "text_1d3a03ba7e"),
                      translate(lang, "text_c036f15891"),
                    ],
                    [
                      ShieldCheck,
                      translate(lang, "text_8becc5fa76"),
                      translate(lang, "text_c5ebdd6b3f"),
                    ],
                    [
                      Globe2,
                      translate(lang, "text_bedcd9137c"),
                      translate(lang, "text_ebc66cfa91"),
                    ],
                    [
                      SlidersHorizontal,
                      translate(lang, "text_7952fd43df"),
                      translate(lang, "text_1f4f2ce4b8"),
                    ],
                  ].map(([Icon, title, body], index) => {
                    const ValueIcon = Icon as typeof FileText;
                    return (
                      <article key={index} className="value-tile">
                        <ValueIcon size={24} />
                        <h3>{title as string}</h3>
                        <p>{body as string}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
            <SpecialtyRows config={config} lang={lang} onBook={book} />
            <ProcedureCards config={config} lang={lang} onBook={book} />
            <PromoBand config={config} lang={lang} onNavigate={go} />
            <DoctorIntro />
            <section className="clinic-section section-tint" id="branches">
              <div className="clinic-container">
                {sectionHeader(
                  translate(lang, "text_0e09c5484e"),
                  translate(lang, "text_c17e1065bc"),
                  translate(lang, "text_0157d4ffee"),
                )}
                <Branches />
              </div>
            </section>
            {reviews.length > 0 && (
              <section className="clinic-section">
                <div className="clinic-container">
                  {sectionHeader(
                    translate(lang, "text_7de46b31e4"),
                    translate(lang, "text_8167a87104"),
                  )}
                  <div className="clinic-grid services-grid">
                    {reviews.map((review, index) => (
                      <figure className="clinic-card" key={index}>
                        <blockquote>{review.quote[lang]}</blockquote>
                        <figcaption>
                          {review.firstName} ·{" "}
                          {translate(lang, "text_6ff71ef4c2")}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              </section>
            )}
            {articles.length > 0 && (
              <section className="clinic-section">
                <div className="clinic-container">
                  {sectionHeader(
                    translate(lang, "text_521326f636"),
                    translate(lang, "text_6e21592d71"),
                  )}
                  <div className="clinic-grid services-grid">
                    {articles.map((article) => (
                      <article className="clinic-card" key={article.id}>
                        <FileText />
                        <h3>{article.title[lang]}</h3>
                        <p>{article.body[lang].slice(0, 160)}</p>
                        <button
                          className="text-link"
                          onClick={() => go(`articles/${article.id}`)}
                        >
                          {translate(lang, "text_5ab427b46c")}
                          <Arrow size={17} />
                        </button>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            )}
            <FAQ />
            <BookingSection />
          </>
        ) : (
          <>
            <section className="subpage-hero">
              <div className="clinic-container">
                <button className="text-link" onClick={() => go("home")}>
                  {translate(lang, "text_17c4ca4554")} / {subpageTitle}
                </button>
                <h1 ref={pageTitle} tabIndex={-1}>
                  {subpageTitle}
                </h1>
                <p>{translate(lang, "text_5b4ac2a3f2")}</p>
              </div>
            </section>
            {route === "book" ? (
              <BookingSection />
            ) : route === "services" ? (
              <section className="clinic-section">
                <div className="clinic-container">
                  <ServiceCards />
                  {!services.length && (
                    <p className="section-disclaimer">
                      {translate(lang, "text_64ddb79eef")}
                    </p>
                  )}
                </div>
              </section>
            ) : route === "branches" ? (
              <section className="clinic-section">
                <div className="clinic-container">
                  <Branches />
                </div>
              </section>
            ) : route === "about" ? (
              <>
                <DoctorIntro />
                {!config.verified && (
                  <section className="clinic-section">
                    <div className="clinic-container prose-card">
                      <h2>{translate(lang, "text_5ff7b8b902")}</h2>
                      <p>{translate(lang, "text_a30f4b17e1")}</p>
                      <p className="preview-tag">
                        {translate(lang, "text_9bfb183310")}:{" "}
                        <bdi>{tenantLabel}</bdi>
                      </p>
                      <button
                        className="clinic-button secondary"
                        onClick={onDirectory}
                      >
                        {translate(lang, "text_2fdeb37fb5")}
                      </button>
                    </div>
                  </section>
                )}
              </>
            ) : route === "contact" ? (
              <section className="clinic-section">
                <div className="clinic-container prose-card">
                  <MessageCircle size={32} />
                  <h2>
                    {hasContact
                      ? translate(lang, "text_37cdd99867")
                      : translate(lang, "text_8774daa4ad")}
                  </h2>
                  <p>
                    {hasContact
                      ? translate(lang, "text_b07c621e5e")
                      : translate(lang, "text_c03f52bd56")}
                  </p>
                  <div className="card-actions">
                    <ContactButtons />
                    <button className="clinic-button primary" onClick={book}>
                      {translate(lang, "text_989f916151")}
                    </button>
                  </div>
                </div>
              </section>
            ) : route === "portal" ? (
              <section className="clinic-section">
                <div className="clinic-container">
                  <div className="clinic-grid services-grid">
                    {[
                      [
                        "doctor",
                        Stethoscope,
                        translate(lang, "text_9a2d64180c"),
                        translate(lang, "text_c9ff808464"),
                      ],
                      [
                        "reception",
                        Users,
                        translate(lang, "text_0132d20470"),
                        translate(lang, "text_c4abaecf5f"),
                      ],
                      [
                        "patient",
                        HeartPulse,
                        translate(lang, "text_13b8a29427"),
                        translate(lang, "text_76f2c24603"),
                      ],
                    ].map(([role, Icon, title, body]) => {
                      const PortalIcon = Icon as typeof Stethoscope;
                      return (
                        <article className="clinic-card" key={role as string}>
                          <span className="icon-tile">
                            <PortalIcon />
                          </span>
                          <h2>{title as string}</h2>
                          <p>{body as string}</p>
                          <button
                            className="clinic-button primary"
                            onClick={() => onSelectPortal(role as string)}
                          >
                            {translate(lang, "text_d91c3a9e0b")}
                            <Arrow size={17} />
                          </button>
                        </article>
                      );
                    })}
                  </div>
                  <div className="portal-note notice">
                    <Info size={20} />
                    <div>
                      <strong>{translate(lang, "text_fad9ebd0cf")}</strong>
                      <p>{translate(lang, "text_f008e7aca6")}</p>
                      <button
                        className="text-link"
                        onClick={() => onOpenSaasModal("doctor")}
                      >
                        {translate(lang, "text_cdf40ed1d5")}
                        <Arrow size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ) : route === "privacy" ? (
              <section className="clinic-section">
                <div className="clinic-container prose-card">
                  <h2>{translate(lang, "text_13a8bfe853")}</h2>
                  <p>{translate(lang, "text_1a812df93e")}</p>
                  <h3>{translate(lang, "text_6b216ffb78")}</h3>
                  <p>{translate(lang, "text_fbd5a492e1")}</p>
                  <h3>{translate(lang, "text_e2a93d4b6e")}</h3>
                  <p>{translate(lang, "text_ece2e08ada")}</p>
                </div>
              </section>
            ) : route === "design" ? (
              <section className="clinic-section">
                <div className="clinic-container">
                  <div className="design-swatches">
                    {[
                      ["Background", "#F7F9FC"],
                      ["Surface", "#FFFFFF"],
                      ["Ink", "#0B1220"],
                      ["Muted", "#51607A"],
                      ["Brand", "#0F4C81"],
                      ["Navy", "#070D18"],
                      ["Accent", "#12A594"],
                      ["Line", "#E3E8F0"],
                    ].map(([label, color]) => (
                      <div className="clinic-card" key={label}>
                        <span style={{ background: color }} />
                        <strong>{label}</strong>
                        <code>{color}</code>
                      </div>
                    ))}
                  </div>
                  <div className="prose-card">
                    <h2>{translate(lang, "text_9318dbb537")}</h2>
                    <p>{translate(lang, "text_4bbe2752fe")}</p>
                    <div className="card-actions">
                      <button className="clinic-button primary" onClick={book}>
                        Primary
                      </button>
                      <button
                        className="clinic-button secondary"
                        onClick={() => go("home")}
                      >
                        Secondary
                      </button>
                      <button
                        className="text-link"
                        onClick={() => go("services")}
                      >
                        Ghost <Arrow size={17} />
                      </button>
                    </div>
                  </div>
                  <ServiceCards />
                </div>
              </section>
            ) : (
              <section className="clinic-section">
                <div className="clinic-container prose-card">
                  {(() => {
                    const [kind, id] = route.split("/");
                    const service = services.find((item) => item.id === id);
                    const article = articles.find((item) => item.id === id);
                    const condition = config.verified
                      ? config.conditions?.find((item) => item.id === id)
                      : undefined;
                    if (kind === "conditions" && condition)
                      return (
                        <>
                          <h2>{condition.title[lang]}</h2>
                          <p>{condition.body[lang]}</p>
                          <small>
                            {translate(lang, "text_0191f5d612")}:{" "}
                            {condition.reviewer[lang]}
                          </small>
                        </>
                      );
                    if (kind === "services" && service)
                      return (
                        <>
                          <h2>{service.title[lang]}</h2>
                          <p>{service.description[lang]}</p>
                        </>
                      );
                    if (kind === "articles" && article)
                      return (
                        <>
                          <h2>{article.title[lang]}</h2>
                          <p>{article.body[lang]}</p>
                          <small>
                            {translate(lang, "text_0191f5d612")}:{" "}
                            {article.reviewer[lang]} · {article.date}
                          </small>
                        </>
                      );
                    return (
                      <>
                        <h2>{translate(lang, "text_fb2fbcb476")}</h2>
                        <p>{translate(lang, "text_b286a95a51")}</p>
                      </>
                    );
                  })()}
                  <p className="section-disclaimer">
                    {translate(lang, "text_2fa3f29853")}
                  </p>
                  <button className="clinic-button primary" onClick={book}>
                    {translate(lang, "text_a7d897a60a")}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
      <div className="a11y-controls">
        <button
          className="icon-button a11y-trigger"
          aria-label={translate(lang, "text_49465c909f")}
          aria-expanded={showA11y}
          onClick={() => setShowA11y((value) => !value)}
        >
          <SlidersHorizontal size={20} />
        </button>
        {showA11y && (
          <div className="a11y-panel">
            <button
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
            >
              {paused
                ? translate(lang, "text_96d741304e")
                : translate(lang, "text_b1981ea22f")}
            </button>
            <button
              aria-pressed={largeText}
              onClick={() => setLargeText((value) => !value)}
            >
              {largeText
                ? translate(lang, "text_01daadde4d")
                : translate(lang, "text_91491d6e94")}
            </button>
          </div>
        )}
      </div>
      {hasContact && route !== "book" && (
        <div className="clinic-floating-contact">
          <ContactButtons />
        </div>
      )}
      {route !== "book" && !modal && (
        <div className="mobile-book-bar">
          <button className="clinic-button primary" onClick={book}>
            {translate(lang, "text_27dd340fe5")}
            <Arrow size={18} />
          </button>
        </div>
      )}
      {modal === "booking" && (
        <AccessibleDialog
          title={translate(lang, "text_0316d47de8")}
          onClose={() => setModal(null)}
        >
          <BookingStepper lang={lang} config={config} />
        </AccessibleDialog>
      )}
      {modal === "menu" && (
        <AccessibleDialog
          title={translate(lang, "text_8bc82eea67")}
          onClose={() => setModal(null)}
          className="menu-dialog"
        >
          <nav className="drawer-nav">
            {nav.map(([path, label]) => (
              <button
                key={path}
                onClick={() => go(path)}
                aria-current={route === path ? "page" : undefined}
              >
                {label}
                <Arrow size={17} />
              </button>
            ))}
            <button
              className="clinic-button primary"
              onClick={() => setModal("booking")}
            >
              {translate(lang, "text_0316d47de8")}
            </button>
            <button className="clinic-button secondary" onClick={onDirectory}>
              {translate(lang, "text_02b7a84d1f")}
            </button>
          </nav>
        </AccessibleDialog>
      )}
    </div>
  );
}
