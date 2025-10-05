import { useEffect, useMemo, useState } from "react";
import { BELGRADE_AREAS } from "../data/belgradeAreas.js";
import { useI18n } from "../i18n.js";
import AddressAutocomplete, { AddressValue } from "../ui/AddressAutocomplete.js";
import "./areaChange.css";
import { API_BASE_URL } from "../lib/apiClient.js"


export default function AreasChangePage() {
  const { t } = useI18n();
  const [user, setUser] = useState<any>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [addresses, setAddresses] = useState<AddressValue[]>([]);

  useEffect(() => {
    const json = localStorage.getItem("user");
    if (json) {
      const u = JSON.parse(json);
      setUser(u);
      setSelected(u.areas || []);
      if (u.addressOfUser?.length) {
        setAddresses(
          u.addressOfUser.map((label: string) => ({
            label,
            lat: 0,
            lon: 0,
          }))
        );
      }
    }
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BELGRADE_AREAS;
    return BELGRADE_AREAS.filter((x) => x.toLowerCase().includes(q));
  }, [query]);

  function toggleArea(area: string) {
    setSelected((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  async function handleSubmit() {
    if (!user) return;

    const res = await fetch(`${API_BASE_URL}/update-user-preferences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        areas: selected,
        addressOfUser: addresses.map((a) => a.label),
      }),
    });

    const json = await res.json();
    if (res.ok) {
      const updated = {
        ...user,
        areas: selected,
        addressOfUser: addresses.map((a) => a.label),
      };
      localStorage.setItem("user", JSON.stringify(updated));
      alert(t("alerts_updated_success"));
    } else {
      alert(json.detail || "Error updating preferences");
    }
  }

  return (
    <div className="areas">
      <div className="container areas__container">
        <h1>{t("email_alerts_title")}</h1>
        <p>{t("email_alerts_text_reg")}</p>

        <input
          className="input input--sm"
          placeholder={t("auth_search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="locations__grid">
          {suggestions.map((area) => {
            const active = selected.includes(area);
            return (
              <button
                type="button"
                key={area}
                className={`pill ${active ? "is-active" : ""}`}
                onClick={() => toggleArea(area)}
              >
                {area}
              </button>
            );
          })}
        </div>

        <div className="field">
          <span className="field__label">{t("auth_locations_title")}</span>
          <AddressAutocomplete
            value={null}
            onSelect={(newAddress) => {
              if (
                newAddress &&
                !addresses.find((a) => a.label === newAddress.label)
              ) {
                setAddresses((prev) => [...prev, newAddress]);
              }
            }}
          />
          <div className="locations__hint">{t("auth_locations_hint")}</div>

          {addresses.length > 0 && (
            <div className="selected__chips">
              {addresses.map((a) => (
                <span key={a.label} className="chip">
                  {a.label}
                  <button
                    type="button"
                    className="chip__x"
                    onClick={() =>
                      setAddresses((prev) =>
                        prev.filter((x) => x.label !== a.label)
                      )
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="actions">
          <button className="btn btn--primary" onClick={handleSubmit}>
            {t("save_changes")}
          </button>
        </div>
      </div>
    </div>
  );
}
