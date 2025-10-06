// src/ui/LanguageSwitcher.tsx
import { useI18n } from "../i18n.js";

export default function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div style={{ display: "inline-flex", gap: 8 }}>
      <button
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        style={{
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: lang === "en" ? "#111827" : "#fff",
          color: lang === "en" ? "#fff" : "#111827",
          cursor: "pointer",
        }}
      >
        EN
      </button>
      <button
        onClick={() => setLang("sr")}
        aria-pressed={lang === "sr"}
        style={{
          padding: "6px 10px",
          borderRadius: 10,
          border: "1px solid #e5e7eb",
          background: lang === "sr" ? "#111827" : "#fff",
          color: lang === "sr" ? "#fff" : "#111827",
          cursor: "pointer",
        }}
      >
        SR
      </button>
    </div>
  );
}
