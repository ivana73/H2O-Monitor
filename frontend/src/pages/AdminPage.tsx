import { useEffect, useState } from "react";
import "./AdminPage.css";
import { API_BASE_URL } from "../lib/apiClient.js"

type Report = {
  id: number;
  email: string;
  reporteddescription: string;
  reportedaddress: string;
};

export default function AdminPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`${API_BASE_URL}/reportsFetch`)
      .then((res) => res.json())
      .then((data) => setReports(data))
      .finally(() => setLoading(false));
  }, []);

  const takeAction = async (action: string, report: Report) => {
    const url =
      action === "accept"
        ? `${API_BASE_URL}/admin/approve_incident`
        : `${API_BASE_URL}/admin/reject_incident`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    });

    if (res.ok) window.location.reload();
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Pregled korisničkih prijava</h1>
      {loading ? (
        <p>Učitavanje...</p>
      ) : reports.length === 0 ? (
        <p>Nema nijedne aktivne prijave.</p>
      ) : (
        <ul style={{ padding: 0, listStyle: "none" }}>
          {reports.map((r, idx) => (
            <li
              key={idx}
              style={{
                border: "1px solid #ccc",
                borderRadius: "6px",
                marginBottom: "1rem",
                padding: "1rem",
              }}
            >
              <p><strong>Lokacija:</strong> {r.reportedaddress}</p>
              <p><strong>Opis:</strong> {r.reporteddescription}</p>
              <p><strong>✉️ Korisnik:</strong> {r.email}</p>
              <button className="accept" onClick={() => takeAction("accept", r)}>✅ Prihvati</button>{" "}
              <button className="reject" onClick={() => takeAction("reject", r)}>❌ Odbij</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}