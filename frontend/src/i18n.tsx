// src/i18n.ts
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "en" | "sr" ;

// Plain dictionary
const dict = {
  en: {
    brand: "H2O Monitor",
    nav_map: "Map",
    nav_report: "Report",
    nav_login: "Login",
    nav_logout: "Logout",
    hero_title: "Ran out of water again?",
    hero_sub: "Stay informed about water supply outages. Receive email notifications and view real-time issues on the map.",  
    live_map_title: "Live Map",
    live_map_text: "See all current failures on an interactive map updated in real time.",
    email_alerts_title: "Email Alerts",
    email_alerts_text: "Subscribe to your street or area and receive status updates instantly.",  
    email_alerts_text_reg: "Select or update the areas for which you want to receive alerts.",
    feat_admin_title: "Admin Moderation",
    feat_admin_text: "Administrators approve reports and manage user submissions securely.",
    cta_title: "Ready to help your community?",
    cta_button: "Start Reporting",
    privacy: "Privacy",
    terms: "Terms",
    //Login
    auth_login: "Login",
    auth_register: "Create account",
    auth_email: "Email",
    auth_password: "Password",
    auth_suggest_strong: "Suggest strong password",
    auth_strength: "Strength",
    auth_locations_title: "Notification locations (Belgrade)",
    auth_locations_hint: "Pick areas to receive outage alerts",
    auth_terms: "By creating an account you accept the terms.",
    auth_submit_login: "Sign in",
    auth_submit_register: "Create account",
    auth_search: "Search…",
    auth_selected: "Selected",
    auth_remove: "Remove",
    auth_show_password: "Show password",
    auth_hide_password: "Hide password",
    address_placeholder: "Start typing your address...",
    searching: "Searching…",
    no_results: "No results",
    //map
    map_title: "Live Map",
    map_legend_active: "Active failures",
    map_legend_resolved: "Resolved",
     //areas
     alerts_updated_success: "Settings have been successfully saved.",
     save_changes: "Save changes",     
     //report
      report_title: "Report an Issue",
      report_description_label: "Problem Description",
      report_description_placeholder: "Start typing...",
      report_location_label: "Issue Location",
      report_submit: "Submit Report",
      report_loading: "Sending...",
      report_success: "Report sent successfully!",
      report_error: "Error submitting report.",
  },
  sr: {
    brand: "H2O Monitor",
    nav_map: "Mapa",
    nav_report: "Prijavi kvar",
    nav_login: "Prijava",
    nav_logout: "Odjavi se",
    hero_title: "Opet ti je nestalo vode?",
    hero_sub: "Budi obavešten o kvarovima na vodovodnoj mreži. Primaj imejl obaveštenja i gledaj kvarove na mapi u realnom vremenu.",
    live_map_title: "Mapa uživo",
    live_map_text: "Pogledaj sve trenutne kvarove na interaktivnoj mapi u realnom vremenu.",
    email_alerts_title: "Imejl obaveštenja",
    email_alerts_text: "Ostavi email i odmah primaš obaveštenja o kvarovima.",
    email_alerts_text_reg: "Izaberi ili izmeni oblasti za koje želiš da primaš obaveštenja.",
    feat_admin_title: "Administratorska moderacija",
    feat_admin_text: "Administratori odobravaju prijave i upravljaju korisničkim doprinosima.",
    cta_title: "Spremni da pomognete zajednici?",
    cta_button: "Započni prijavu kvara",
    privacy: "Privatnost",
    terms: "Uslovi",
    //Login
    auth_login: "Prijava",
    auth_register: "Kreiraj nalog",
    auth_email: "Imejl",
    auth_password: "Šifra",
    auth_suggest_strong: "Predloži jaku šifru",
    auth_strength: "Jačina",
    auth_locations_title: "Lokacije za obaveštenja (Beograd)",
    auth_locations_hint: "Izaberi oblasti za koje želiš obaveštenja o kvarovima",
    auth_terms: "Kreiranjem naloga prihvataš uslove korišćenja.",
    auth_submit_login: "Prijavi se",
    auth_submit_register: "Kreiraj nalog",
    auth_search: "Pretraga…",
    auth_selected: "Izabrano",
    auth_remove: "Ukloni",
    auth_show_password: "Prikaži šifru",
    auth_hide_password: "Sakrij šifru",
    address_placeholder: "Počni da kucaš adresu…",
    searching: "Pretraga…",
    no_results: "Nema rezultata",
    //map
    map_title: "Mapa uživo",
    map_legend_active: "Aktivni kvarovi",
    map_legend_resolved: "Rešeni",
    //areas
    alerts_updated_success: "Podešavanja su uspešno sačuvana.",
    save_changes: "Sačuvaj izmene",
    //report 
    report_title: "Prijava kvara",
    report_description_label: "Opis problema",
    report_description_placeholder: "Kreni da kucaš...",
    report_location_label: "Lokacija kvara",
    report_submit: "Pošalji prijavu",
    report_loading: "Slanje...",
    report_success: "Prijava uspešno poslata!",
    report_error: "Greška pri slanju prijave.",    
  },
} as const;

type Dict = typeof dict["en"];
type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof Dict) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

// Provider with localStorage persistence
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    return saved ?? "sr";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
    document.documentElement.lang = l; // accessibility + SEO
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useMemo(() => {
    const table = dict[lang];
    return (key: keyof Dict) => table[key] ?? String(key);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LanguageProvider");
  return ctx;
}
