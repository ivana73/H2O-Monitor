import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./styles/base.css";
import "./index.css";
import App from './App.js'

import { LanguageProvider } from "./i18n.js";
import AppLayout from "./ui/AppLayout.js";

import HomePage from "./pages/HomePage.js";
import ReportPage from "./pages/ReportPage.js";
import LoginPage from "./pages/LoginPage.js";
import MapPage from "./pages/MapPage.js";
import AdminPage from "./pages/AdminPage.js";
import AreasChangePage from './pages/areaChange.js';

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,  // Wrap all pages in the layout  
    children: [
      { index: true, element: <HomePage /> },
      { path: "map", element: <MapPage /> },
      { path: "report", element: <ReportPage /> },
      { path: "login", element: <LoginPage /> },
      { path: "areasChange", element: <AreasChangePage /> },
      { path: "admin", element: <AdminPage /> },
    ],
  },
]);
//StrictMode helps identify potential problems in an 
//application by activating additional checks and warnings for its descendants.
//Provide i18n context to the app
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode> 
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  </React.StrictMode>
);
