export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:8000";


// export async function fetchIncidents() {
//   const res = await fetch(`${API_BASE_URL}/incidents`);
//   if (!res.ok) throw new Error("Failed to fetch incidents");
//   return res.json();
// }

// use fetchIncidents() everywhere instead of hardcoded URLs
