import { Outlet, NavLink, Link } from "react-router-dom";
import { useI18n } from "../i18n.js";
import LanguageSwitcher from "./LanguageSwitcher.js";
import "./AppLayout.css";

export default function AppLayout() {
  const { t } = useI18n();

  return (
    <div className="layout">
      <header className="layout__header">
        <nav className="container layout__nav">
          {/* Brand also links Home */}
          <Link to="/" className="brand">{t("brand")}</Link>

          <div className="navlinks">
            {/* 👇 Add an explicit Home item */}
            <NavLink to="/" end className="navlink">{t("brand") /* or a separate key like t("nav_home") */}</NavLink>
            <NavLink to="/login" className="navlink">{t("nav_login")}</NavLink>
            <LanguageSwitcher />
          </div>
        </nav>
      </header>

      <main className="container layout__main">
        <Outlet />
      </main>

      <footer className="layout__footer">
        <div className="container layout__footerinner">
          <span>© {new Date().getFullYear()} {t("brand")}</span>
          <div className="footer__links">
            <a href="#">{t("privacy")}</a>
            <a href="#">{t("terms")}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
