// src/pages/LoginPage.tsx
import "./LoginPage.css";
import { useState, useMemo } from "react";
import { useI18n } from "../i18n.js"; // or "../i18n.js" with nodenext
import { BELGRADE_AREAS } from "../data/belgradeAreas.js"; // or "../data/belgradeAreas.js"
import { generateStrongPassword, scorePassword, strengthLabel } from "../lib/generateStrongPassword.js"; // or "../lib/generateStrongPassword.js"
import { Eye, EyeOff } from "lucide-react";
import AddressAutocomplete, { AddressValue } from "../ui/AddressAutocomplete.js";
import { API_BASE_URL } from "../lib/apiClient.js"

type Mode = "login" | "register";

export default function LoginPage() {
  const { t, lang } = useI18n();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [pwd, setPwd] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [showPwd, setShowPwd] = useState(false);
  const [address, setAddress] = useState<AddressValue | null>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BELGRADE_AREAS;
    return BELGRADE_AREAS.filter((x) => x.toLowerCase().includes(q));
  }, [query]);

  const strength = scorePassword(pwd);
  const strengthTxt = strengthLabel(strength);

  function toggleArea(area: string) {
    setSelected((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function removeArea(area: string) {
    setSelected((prev) => prev.filter((a) => a !== area));
  }

  function onSuggestPwd() {
    setPwd(generateStrongPassword(14));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
  
    if (mode === "login") {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pwd }),
      });
    
      const json = await res.json();

      if (!json.user) {
        alert(`${json.detail}`);
      } else {
        localStorage.setItem("user", JSON.stringify(json.user));
        window.location.href = "/"; // idi na home page
      }
    } else {
      const res = await fetch(`${API_BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: pwd,
          city: "Beograd", // Replace with real city input if needed
          areas: selected,
          addressOfUser: address ? [address.label] : [],
        }),
      });
  
      const json = await res.json();
      if (!res.ok) {
        alert(`${json.detail}`);
      } else {
        window.location.href = "/login"; // idi na login page
      }
    }
  }  

  return (
    <div className="auth">
      <div className="container auth__container">
        {/* Mode Switch */}
        <div className="auth__tabs" role="tablist" aria-label="Auth">
          <button
            role="tab"
            aria-selected={mode === "login"}
            className={`auth__tab ${mode === "login" ? "is-active" : ""}`}
            onClick={() => setMode("login")}
          >
            {t("auth_login")}
          </button>
          <button
            role="tab"
            aria-selected={mode === "register"}
            className={`auth__tab ${mode === "register" ? "is-active" : ""}`}
            onClick={() => setMode("register")}
          >
            {t("auth_register")}
          </button>
        </div>

        {/* Card */}
        <div className="auth__card" role="tabpanel">
          <form className="auth__form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field__label">{t("auth_email")}</span>
              <input
                className="input"
                type="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="field">
              <span className="field__label">{t("auth_password")}</span>
              <div className="inputgroup">
                <input
                  className="input"
                  type={showPwd ? "text" : "password"}
                  required
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="••••••••••"
                />
                
  {/* toggle visibility */}
  <button
    type="button"
    className="btn btn--ghost"
    onClick={() => setShowPwd((v) => !v)}
    aria-label={showPwd ? t("auth_hide_password") : t("auth_show_password")}
    title={showPwd ? t("auth_hide_password") : t("auth_show_password")}
  >
    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>

  {/* strong-password suggestion for register mode */}
  {mode === "register" && (
    <button type="button" className="btn btn--ghost" onClick={onSuggestPwd}>
      {t("auth_suggest_strong")}
    </button>
  )}
</div>

              {mode === "register" && (
                <div className="strength">
                  <div className={`bar s${strength}`} aria-hidden="true">
                    <span />
                  </div>
                  <span className="strength__label">
                    {t("auth_strength")}: {strengthTxt}
                  </span>
                </div>
              )}
            </label>

            {mode === "register" && (
              <div className="locations">
                <div className="locations__head">
                  <div>
                    <div className="locations__title">{t("auth_locations_title")}</div>
                    <div className="locations__hint">{t("auth_locations_hint")}</div>
                  </div>
                  <input
                    className="input input--sm"
                    placeholder={t("auth_search")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>

                <div className="locations__grid">
                  {suggestions.map((area) => {
                    const active = selected.includes(area);
                    return (
                      <button
                        type="button"
                        key={area}
                        className={`pill ${active ? "is-active" : ""}`}
                        onClick={() => toggleArea(area)}
                        aria-pressed={active}
                        aria-label={area}
                      >
                        {area}
                      </button>
                    );
                  })}
                </div>

                {selected.length > 0 && (
                  <div className="selected">
                    <div className="selected__label">{t("auth_selected")}:</div>
                    <div className="selected__chips">
                      {selected.map((area) => (
                        <span key={area} className="chip">
                          {area}
                          <button
                            type="button"
                            className="chip__x"
                            onClick={() => removeArea(area)}
                            aria-label={`${t("auth_remove")} ${area}`}
                            title={`${t("auth_remove")} ${area}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      
                    </div>
                  
                  </div>
                )}
                <label className="field">
                  <span className="field__label">
                    {t("auth_locations_title")}
                  </span>
                  <AddressAutocomplete value={address} onSelect={setAddress} />
                  <div className="locations__hint">{t("auth_locations_hint")}</div>
                </label>
              </div>
              
            )}

            {mode === "register" && (
              <p className="terms">{t("auth_terms")}</p>
            )}

            <div className="actions">
              <button type="submit" className="btn btn--primary">
                {mode === "login" ? t("auth_submit_login") : t("auth_submit_register")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
