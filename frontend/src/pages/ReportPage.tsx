import { useState } from "react";
import "./ReportPage.css";
import AddressAutocomplete, { AddressValue } from "../ui/AddressAutocomplete.js";
import { useI18n } from "../i18n.js";
import { API_BASE_URL } from "../lib/apiClient.js"


export default function ReportPage() {
  const { t } = useI18n();
  const [description, setDescription] = useState("");
  const [user, setUser] = useState<any>(null);
  const [address, setAddress] = useState<AddressValue | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const json = localStorage.getItem("user");
    if (json) {
      const u = JSON.parse(json);
      setUser(u);

      const payload = {
        email: u.email,
        reportedDescription: description,
        reportedAddress: address?.label || "",
      };

      const res = await fetch(`${API_BASE_URL}/report_incident`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitted(true);
        setDescription("");
        setAddress(null);
      } else {
        const json = await res.json();
        alert(json.detail || t("report_error"));
      }

      setLoading(false);
    }
  }

  if (submitted) {
    return <div className="report__success">{t("report_success")}</div>;
  }

  return (
    <div className="report">
      <h1>{t("report_title")}</h1>
      <form className="report__form" onSubmit={onSubmit}>
        <label className="field">
          <span className="field__label">{t("report_description_label")}</span>
          <textarea
            className="input"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("report_description_placeholder")}
          />
        </label>

        <label className="field">
          <span className="field__label">{t("report_location_label")}</span>
          <AddressAutocomplete value={address} onSelect={setAddress} />
        </label>

        <button className="btn btn--primary" disabled={loading}>
          {loading ? t("report_loading") : t("report_submit")}
        </button>
      </form>
    </div>
  );
}
