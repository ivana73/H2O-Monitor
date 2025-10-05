import "./HomePage.css";
import { useI18n } from "../i18n.js";
import { Link } from "react-router-dom";
import { useState } from "react";

type Mode = "anonymous" | "registered";

export default function HomePage() {
  const { t } = useI18n();

  const [mode] = useState<Mode>(() =>
  localStorage.getItem("user") ? "registered" : "anonymous")

  return (
    <div className="home">
      {/* Hero */}
      <section className="home__hero">
        <div className="container">
          <div className="hero__text">
            <h1 className="hero__title">{t("hero_title")}</h1>
            <p className="hero__subtitle">{t("hero_sub")}</p>
          </div>
        </div>
      </section>

      {/* Link tiles (hover cards) */}
      <section className="home__features">
        <div className="container linktiles">
          <Link className="linktile" to="/map" aria-label={t("live_map_title")}>
            <div className="linktile__content">
              <h3 className="linktile__title">{t("live_map_title")}</h3>
              <p className="linktile__text">{t("live_map_text")}</p>
            </div>
          </Link>

          {mode === "anonymous" && (
          <Link className="linktile" to="/login" aria-label={t("email_alerts_title")}>
            <div className="linktile__content">
              <h3 className="linktile__title">{t("email_alerts_title")}</h3>
              <p className="linktile__text">{t("email_alerts_text")}</p>
            </div>
          </Link>)}

          {mode === "registered" && (
          <Link className="linktile" to="/areasChange" aria-label={t("email_alerts_title")}>
            <div className="linktile__content">
              <h3 className="linktile__title">{t("email_alerts_title")}</h3>
              <p className="linktile__text">{t("email_alerts_text_reg")}</p>
            </div>
          </Link>)}
        </div>
      </section>

      {/* CTA */}

      <section className="home__cta">
        <div className="container cta__box">
          <h2 className="cta__title">{t("cta_title")}</h2>
          {mode === "registered" && (
          <Link className="btn btn--primary" to="/report">{t("cta_button")}</Link>
          )}
          {mode === "anonymous" && (
          <Link className="btn btn--primary" to="/login">{t("cta_button")}</Link>
          )}
        </div>
      </section>
    </div>
  );
}
